import { stringifyDatetimeToHTML, stringifyDateToHTML } from "./knownElementTypes";

/**
 * Represents a valid "type" attribute value for an "input" element.
 */
type InputElementType = "button" | "checkbox" | "color" | "date" | "datetime-local" | "email" | "file" | "hidden" | "image" | "month" | "number" | "password" | "radio" | "range" | "reset" | "search" | "submit" | "tel" | "text" | "time" | "url" | "week";


/** Provides the required arguments to bind an input element with a
 *  DataBindPropertyProvider. */
export function bindingInput(name: string, type: InputElementType):
    [string, string, string, (x: any) => any, (x: any) => any]
{
    let propertyName: string;
    switch (type) {
        case "checkbox":
        case "radio":
            propertyName = "checked";
            break;
        case "file":
            propertyName = "files";
            break;
        default:
            propertyName = "value";
            break;
    }

    let stateToElement: (x: any) => any | undefined,
        elementToState: (x: any) => any | undefined;

    switch (type) {
        case "date":
            stateToElement = (x: any) => stringifyDateToHTML(x);
            elementToState = (x: any) => new Date(x.currentTarget.value);
            break;
        case "datetime-local":
            stateToElement = (x: any) => stringifyDatetimeToHTML(x);
            elementToState = (x: any) => new Date(x.currentTarget.value);
            break;
        case "range":
        case "number":
            stateToElement = (x: any) => isNaN(x) ? "" : x.toString();
            elementToState = (x: any) => parseFloat(x.currentTarget.value);
            break;
        case "checkbox":
        case "radio":
            stateToElement = (x: any) => x.toString();
            elementToState = (x: any) => x.currentTarget.value;
            break;
        default:
            stateToElement = undefined;
            elementToState = undefined;
            break;
    }

    return [
        name, "onChange", propertyName, elementToState, stateToElement
    ];
}