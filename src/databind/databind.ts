import React, { Dispatch, ReactElement, SetStateAction, useState } from "react";

import { getKnownElementBinder } from "./knownElementTypes";
import { Lazy, isEvent, resolveCamelCase } from "./utils";

/**
 * Transforms the given element to a data binded element, using a previously
 * acquired data binding state variable, if a "data-bind" attribute exists on
 * said element. Otherwise, the children of the element are computed instead.
 */
type DataBindTransformer = (target: ReactElement<any>) => ReactElement<any>;

/**
 * Provides properties, that when merged with the "props" property of an element,
 * binds the value of the element to a state object member.
 */
type DataBindPropertyProvider = <T>(
    name: string,
    bindCallback: string,
    bindProperty?: string,
    dataSelector?: (x: any) => any,
    stateTransformer?: (x: any) => any,
) => DataBindElementProperties<T>;

/**
 * Represents mergeable properties for a element that is subject to a data binding.
 */
type DataBindElementProperties<T> = T & {
    name: string
}

/**
 * Represents a named element that can participate in a state-element data binding.
 */
export interface NamedElementAttributes {
    /**
     * The "name" attribute of the element, that also refers to a member
     * in the state object.
     */
    name: string;
}

/** Prints a warning message, informing the developer of a potential element-to
 *  state member mismatch. */
export function reportPotentialTypeMismatch(element: ReactElement<NamedElementAttributes> | undefined, acceptedTypes: string, gotInstead: string) {
    console.warn(
        "The type of the underlying data-binding state variable for element", element ?? "",
        "might be incorrect for its input type. The accepted types are", `"${acceptedTypes}", ` +
        `but got ${gotInstead} instead.`
    );
}

/**
 * Returns a stateful value, the data binding element transformer functions
 * associated with said value, and a function to update it.
 * @param initialState The initial layout of the state object.
 * @template T The type of the state object.
 */
export function useDataBindings<T>(initialState: T): [T, Dispatch<SetStateAction<T>>, DataBindTransformer, DataBindPropertyProvider] {
    if(typeof initialState != "object") {
        throw new Error(`The given initial state must be an object. (received a ${typeof initialState} instead)`);
    }
    
    const [state, setState] = useState(initialState);

    /** Verifies that the state member target of a data binded element,
     *  referenced by its "name" attribute, is correct. */
    function verifyBindStateTarget(name: string, element?: ReactElement<NamedElementAttributes>) {
        if (!(name in (state as any))) {
            if(element) {
                console.warn(
                    `The given initial state for the data binding hook does not contain a '${name}' member, which is defined as the name of the target element`,
                    element, ". The data binding might behave unexpectedly. Please ensure such a member exists in your initial state."
                );
            } else {
                console.warn(
                    `The given initial state for the data binding hook does not contain a '${name}' member, which is defined as the name of a binded element.` +
                    "The data binding might behave unexpectedly. Please ensure such a member exists in your initial state."
                );
            }
        }
    }

    /** Merges props received from DataBindPropertyProvider to a clone of the given element. */
    function bindCallbackElement(element: ReactElement<any>) {
        const props = {
            ...getDataBindProps(
                element.props.name,
                element.props["data-bind-callback"],
                element.props["data-bind-property"],
                element.props["data-bind-selector"],
                element.props["data-bind-state-fn"]
            ),
            "data-bind": undefined,
            "data-bind-callback": undefined,
            "data-bind-property": undefined,
            "data-bind-selector": undefined,
            "data-bind-state-fn": undefined
        }

        return React.cloneElement(element, props);
    }

    const knownElementBinder = new Lazy(() => getKnownElementBinder(state, setState, {
        verifyBindStateTarget: verifyBindStateTarget
    }));

    /** Attempts to bind a single element to the state member represented by its
     *  "name" attribute. Returns the transformed element, or null if the binding
     *  could not be created. */
    function bindOne(target: ReactElement<any>): ReactElement<any> | null {
        const props = target.props as any;

        if ("name" in props && props.name.trim() !== "") {
            if (!("data-bind" in props)) {
                // Ignore element if it's not specified to have a data binding
                return target;
            }

            // If a callback is specified, it has priority
            if ("data-bind-callback" in props && props["data-bind-callback"]) {
                return bindCallbackElement(target as ReactElement<HTMLElement>);
            }

            // No defined callback, if the element is of a known type, we can automatically
            // bind it using a dedicated bind function
            const ret = knownElementBinder.get()(target);
            if(ret != null) {
                return ret;
            }
        }

        return null;
    }

    /** @see DataBindTransformer */
    function dataBind(target: ReactElement<NamedElementAttributes>): ReactElement<NamedElementAttributes> {
        if(!("data-bind" in target.props)) {
            if("data-bind-children" in target.props) {
                return dataBindChildren(target as any);
            } else {
                console.error("Failed to bind element", target, "as it does not feature a 'data-bind' or a 'data-bind-children' attribute.");
                throw new Error(`Could not bind the element '${target.props.name ?? "(no name)"}' - missing data bind attribute.`);
            }
        }
        
        const result = bindOne(target);

        if (result == null) {
            console.error("Failed to bind element", target, ". Ensure the element is bindable.");
            throw new Error(`Could not bind the element '${target.props.name ?? "(no name)"}'.`);
        }

        return result;
    }

    function dataBindChildren(parent: ReactElement<HTMLElement>): ReactElement<any> {
        return React.createElement(parent.type, parent.props,
            ...React.Children.toArray(parent.props.children as any).map((x) => {
                if (!React.isValidElement(x)) {
                    return x as any;
                }

                let element = x as ReactElement<any>;
                const binded = bindOne(element);

                if (binded != null) {
                    element = binded;
                }

                if ("children" in element.props && element.props.children.length !== 0) {
                    return dataBindChildren(element);
                }

                // No child elements; end of recursion
                return element;
            })
        );
    }

    /** @see DataBindPropertyProvider */
    function getDataBindProps<T>(name: string, bindCallback: string, bindProperty?: string, dataSelector?: (x: any) => any, stateTransformer?: (x: any) => any): DataBindElementProperties<T> {
        const resolvedName = resolveCamelCase(name);
        verifyBindStateTarget(resolvedName);

        const callbackProps = {
            [bindCallback]: (data: any) => {
                let value: any;

                if(dataSelector) {
                    // If a data selector is specified, it overrides default Event/SyntheticEvent object handling.
                    value = dataSelector(data);
                } else {
                    if(isEvent(data)) {
                        // If the provided data is a HTML event, we can handle it automatically.
                        value = data.currentTarget[bindProperty];
                    } else {
                        value = data;
                    }
                }

                setState((previous) => {
                    return {
                        ...previous,
                        [resolvedName]: value
                    };
                });
            }
        }
        
        if(bindProperty != null) {
            return {
                ...callbackProps,
                [bindProperty]: stateTransformer ? stateTransformer(state[resolvedName]) : state[resolvedName]
            } as any;
        }

        return callbackProps as any;
    }

    return [state, setState, dataBind, getDataBindProps];
}
