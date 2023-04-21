
/**
 * A helper for TSX files to provide "name" and a "data-bind" attributes
 * to components that may not define such attributes. Please note that this
 * disables the ability of TypeScript to catch a property that is not provided.
 * @param name The name of the data binding, also used to determine the state object member.
 */
export function bindedWithName<T>(name: string): T {
    return {
        "data-bind": true,
        name: name,
    } as any;
}