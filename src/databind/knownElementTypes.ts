import React, { ReactElement, ReactHTMLElement, SetStateAction } from "react";
import { Predicate, resolveCamelCase, fmtDP, TypeOf } from "./utils";
import { NamedElementAttributes, reportPotentialTypeMismatch } from "./databind";

/** Gets the types that are accepted for an <input> type. */
export function getAcceptedTypesForInput(type: string): string {
    switch (type) {
        case "checkbox":
        case "radio":
            return "boolean";
        case "date":
        case "datetime":
        case "datetime-local":
            return "string or Date";
        case "file":
            return "Array or FileList";
        case "number":
        case "range":
            return "number or bigint or string";
        case "url":
        case "email":
        case "password":
        case "search":
        case "tel":
        case "text":
        case "color":
        case "time":
        case "week":
        case "month":
            return "string";
    }

    throw new Error(`Unknown <input> type: ${type}`);
}

/** Gets a function that verifies the data type of the given object, given
 *  the specified <input> type. */
export function getDataTypeVerifierForInput(type: string): Predicate<any> {
    switch (type) {
        case "checkbox":
        case "radio":
            return (v) => typeof v === "boolean";
        case "date":
        case "datetime-local":
            return (v) => typeof v === "string" || v instanceof Date;
        case "file":
            return (v) => Array.isArray(v) || v instanceof FileList;
        case "number":
        case "range":
            return (v) => typeof v === "number" || typeof v === "bigint" || typeof v === "string";
        case "datetime": // /!\ Deprecated
        case "email":
        case "password":
        case "search":
        case "tel":
        case "text":
        case "color":
        case "time":
        case "week":
        case "month":
        case "url":
            return (v) => typeof v === "string";
    }

    throw new Error(`Cannot data bind element; unknown <input> type: ${type}`);
}

/** Stringifies a Date object to a HTML date string. Such a string can
 *  then be used in e.g. type=date input elements. */
export function stringifyDateToHTML(d: Date | any){
    if(d instanceof Date)
        return `${fmtDP(d.getUTCFullYear(), 4)}-${fmtDP(d.getUTCMonth() + 1)}-${fmtDP(d.getUTCDate())}`;

    if(typeof d == "string")
        return d;

    console.warn("Non-date or non-string value", d, "provided to stringifyDateToHTML.");
    return d.toString();
}

/** Stringifies a Date object to a HTML local datetime string. Such a
 *  string can then be used in e.g. type=datetime-local input elements. */
export function stringifyDatetimeToHTML(d: Date | any)  {
    if(d instanceof Date)
        return `${fmtDP(d.getFullYear(), 4)}-${fmtDP(d.getMonth() + 1)}-${fmtDP(d.getDate())}T${fmtDP(d.getHours())}:${fmtDP(d.getMinutes())}:${fmtDP(d.getSeconds())}.${d.getMilliseconds()}`;

    if(typeof d == "string")
        return d;

    console.warn("Non-date or non-string value", d, "provided to stringifyDatetimeToHTML.");
    return d.toString();
}

/** Represents common functions, shared by the main hook and the known element binder. */
interface CommonBindFunctions {
    verifyBindStateTarget: (name: string, element?: ReactElement<NamedElementAttributes>) => void
}

/** Gets a function that binds known elements, if such an element is provided. */
export function getKnownElementBinder<T>(
    state: T, 
    setState: React.Dispatch<SetStateAction<T>>,
    functions: CommonBindFunctions
) {
    const { verifyBindStateTarget } = functions;

    /** Ran by event handlers to update the state. */
    function handleChanges(ev: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = ev.currentTarget;

        if(!name) {
            throw new Error("No name attached to the currentTarget event member.");
        }

        setState((previous) => {
            return { ...previous, [resolveCamelCase(name)]: value };
        });
    }

    /** Ran by event handlers to update the state of numeric input elements. */
    function handleNumberChanges(ev: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = ev.currentTarget;
        setState((previous) => {
            return { ...previous, [resolveCamelCase(name)]: parseFloat(value) };
        });
    }

    /** Ran by event handlers to update the state of numeric input elements,
     *  with the state object member being a BigInt instance. */
    function handleBigIntChanges(ev: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = ev.currentTarget;
        setState((previous) => {
            return { ...previous, [resolveCamelCase(name)]: BigInt(value) };
        });
    }

    /** Ran by event handlers of fields that handle date input to update the state. */
    function handleDateChanges(ev: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = ev.currentTarget;
        setState((previous) => {
            return { ...previous, [resolveCamelCase(name)]: new Date(value) };
        });
    }

    /** Ran by event handlers of fields that handle file input to update the state. */
    function handleFileChanges(ev: React.ChangeEvent<HTMLInputElement>) {
        const { name, files } = ev.currentTarget;
        const resolvedName = resolveCamelCase(name);

        setState((previous) => {
            // Accept an array, as the initial state can't contain a FileList,
            // since it cannot be constructed.
            if (Array.isArray(previous[resolvedName])) {
                return { ...previous, [resolvedName]: Array.from(files) };
            }

            return { ...previous, [resolvedName]: files };
        });
    }

    function handleCheckedChanges(ev: React.ChangeEvent<HTMLInputElement>) {
        const { name, checked } = ev.currentTarget;
        setState((previous) => {
            return {
                ...previous,
                [resolveCamelCase(name)]: checked
            };
        });
    }

    /** A helper function to transform a value holder element to a data-binded one. */
    function transformStringValueBind(htmlElement: ReactHTMLElement<HTMLInputElement>) {
        return React.cloneElement(htmlElement, {
            value: state[htmlElement.props.name],
            onChange: handleChanges,
            "data-bind": undefined // prevent data-bind from showing up in the DOM
        });
    }

    /** Binds an <input> element to a state object member. */
    function bindInputElement(element: ReactElement<HTMLInputElement>) {
        const resolvedName = resolveCamelCase(element.props.name);
        verifyBindStateTarget(resolvedName, element);

        if (!getDataTypeVerifierForInput(element.props.type)(state[resolvedName])) {
            reportPotentialTypeMismatch(element, getAcceptedTypesForInput(element.props.type), typeof state[resolvedName]);
        }

        const htmlElement = element as any as ReactHTMLElement<HTMLInputElement>;

        switch (element.props.type) {
            case "checkbox":
            case "radio":
                return React.cloneElement(htmlElement, {
                    checked: state[resolvedName],
                    onChange: typeof state[resolvedName] === "boolean" ? handleCheckedChanges : handleChanges,
                    "data-bind": undefined // prevent data-bind from showing up in the DOM
                });
            case "file":
                return React.cloneElement(htmlElement, {
                    onChange: handleFileChanges,
                    "data-bind": undefined // ^
                });
            case "datetime-local": {
                if (state[resolvedName] instanceof Date) {
                    return React.cloneElement(htmlElement, {
                        value: stringifyDatetimeToHTML(state[resolvedName]),
                        onChange: handleDateChanges,
                        "data-bind": undefined // ^
                    });
                }

                return transformStringValueBind(htmlElement);
            }
            case "date": {
                // See https://developer.mozilla.org/en-US/docs/Web/HTML/Date_and_time_formats#date_strings for more info.
                if (state[resolvedName] instanceof Date) {
                    return React.cloneElement(htmlElement, {
                        value: stringifyDateToHTML(state[resolvedName]),
                        onChange: handleDateChanges,
                        "data-bind": undefined // ^
                    });
                }

                return transformStringValueBind(htmlElement);
            }
            case "number":
            case "range": {
                let value;
                let handler: React.FormEventHandler<HTMLInputElement>;

                switch (typeof state[resolvedName]) {
                    case "number":
                        value = state[resolvedName];
                        if (isNaN(value)) {
                            // NaN cannot be a <input type="number"> value
                            value = "";
                        }

                        handler = handleNumberChanges;
                        break;
                    case "bigint":
                        handler = handleBigIntChanges;
                        value = state[resolvedName].toString();
                        break;
                    default:
                        handler = handleChanges;
                        value = state[resolvedName];
                        break;
                }

                return React.cloneElement(htmlElement, {
                    value: value,
                    onChange: handler,
                    "data-bind": undefined
                });
            }
            case "url":
            case "month":
            case "week":
            case "time":
            case "color":
            case "email":
            case "password":
            case "search":
            case "tel":
            case "text":
                return transformStringValueBind(htmlElement);
            case "datetime":
                // /!\ Deprecated. Renders as a normal text box in most browsers.
                console.warn(
                    '<input type="datetime"> is deprecated. Please use the "date" or "datetime-local" types instead.'
                );
                return transformStringValueBind(htmlElement);
            default:
                console.error(
                    "The given element", element,
                    "cannot hold a data binding, as it does not hold dynamic input."
                );
                throw new Error("The given element does not hold dynamic input.");
        }
    }

    /** Binds an element with a "value" and an "onChange" attribute to a state object member. */
    function bindValueElement(element: ReactElement<any>, validType: TypeOf) {
        const resolvedName = resolveCamelCase(element.props.name);
        verifyBindStateTarget(resolvedName, element);

        if (typeof state[resolvedName] != validType) {
            reportPotentialTypeMismatch(element, validType, typeof state[resolvedName]);
        }

        return React.cloneElement(element, {
            value: state[resolvedName],
            onChange: handleChanges,
            "data-bind": undefined // prevent data-bind from showing up in the DOM
        });
    }

    function tryBindKnownElement(target: ReactElement<any>): ReactElement<any> | null {
        switch (target.type) {
            case "input":
                return bindInputElement(target as ReactElement<HTMLInputElement>);
            case "textarea":
                return bindValueElement(target as ReactElement<HTMLTextAreaElement>, "string");
            case "select":
                return bindValueElement(target as ReactElement<HTMLSelectElement>, "string");
        }

        return null;
    }

    return tryBindKnownElement;
}