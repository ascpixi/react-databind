/** Represents a function that defines a set of criteria and determines whether the specified object meets those criteria. */
export type Predicate<T> = (v: T) => boolean;

/** Represents the output of a "typeof" expression. */
export type TypeOf = "string" | "number" | "bigint" | "symbol" | "object" | "boolean" | "function" | "undefined";

/** Formats a number returned by the Date object to its text representation. */
export function fmtDP(datePart: number, padAmt = 2): string {
    return datePart.toString().padStart(padAmt, "0");
}

/** Ensures the given string is in the camelCase naming convention. */
export function resolveCamelCase(s: string): string {
    return s.replace(/-./g, (x) => x[1].toUpperCase());
}

/** Determines whether the specified object is either a synthetic or a native event. */
export function isEvent(obj: any): boolean {
    return typeof obj == "object" &&
    (
        ("nativeEvent" in obj && obj["nativeEvent"] instanceof Event) || // Synthetic check
        (obj instanceof Event) // Native check
    );
}

/**
 * Represents a lazily-initialized value.
 */
export class Lazy<T> {
    value?: T;
    factory: () => T;

    /**
     * Creates a lazily-initialized value. This constructor does not call the factory.
     * @param factory The function to use to create the lazily-initialized value.
     */
    constructor(factory: () => T) {
        this.factory = factory;
    }

    /**
     * Gets or initializes the value.
     */
    get() {
        if(this.value == undefined) {
            this.value = this.factory();
        }

        return this.value;
    }
}