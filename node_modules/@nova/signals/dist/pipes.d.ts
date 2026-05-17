/**
 * Pipe transformation helpers for Nova signals
 */
/**
 * Convert a string to uppercase
 */
export declare function uppercase(val: any): string;
/**
 * Convert a string to lowercase
 */
export declare function lowercase(val: any): string;
/**
 * Format a number as currency (e.g. $1,234.56)
 */
export declare function currency(symbol?: string, decimals?: number): (val: any) => string;
/**
 * Format a date object, string, or timestamp into a readable format
 */
export declare function date(format?: string): (val: any) => string;
/**
 * Format a value as a JSON string
 */
export declare function json(space?: number): (val: any) => string;
/**
 * Provide a fallback value if the input is null, undefined, or empty string
 */
export declare function defaultVal<T>(fallback: T): (val: any) => T;
/**
 * Format a number as a decimal string using Intl.NumberFormat
 * Format: {minIntegerDigits}.{minFractionDigits}-{maxFractionDigits} (e.g. '1.2-2')
 */
export declare function decimal(digitsInfo?: string, locale?: string): (val: any) => string;
/**
 * Format a number as a percentage string using Intl.NumberFormat
 * Format: {minIntegerDigits}.{minFractionDigits}-{maxFractionDigits} (e.g. '1.0-0')
 */
export declare function percent(digitsInfo?: string, locale?: string): (val: any) => string;
/**
 * Resolves Promise or Observable values reactively.
 * Supports both direct reference: `.pipe(asyncPipe)` and factory call: `.pipe(asyncPipe())`.
 */
export declare function asyncPipe(val?: any): any;
export { asyncPipe as async };
/**
 * Convert a string to Title Case (first letter of each word capitalized)
 */
export declare function titlecase(val: any): string;
/**
 * Slice a subset of an array or a string from start to end index
 */
export declare function slice(start: number, end?: number): (val: any) => any;
/**
 * Transform an Object, Map, or Set into an array of key-value pairs
 */
export declare function keyvalue(val: any): Array<{
    key: any;
    value: any;
}>;
/**
 * Reverse a string or array
 */
export declare function reverse(val: any): any;
/**
 * Truncate a string to a specified length with an ellipsis fallback
 */
export declare function truncate(limit?: number, trail?: string): (val: any) => string;
/**
 * Helper to define custom pipes with full type safety
 */
export declare function createPipe<T, R, Args extends any[]>(fn: (val: T, ...args: Args) => R): (...args: Args) => (val: T) => R;
/**
 * Pipe plugin interface for globally reusable pipes
 */
export interface PipePlugin<T = any, R = any, Args extends any[] = any[]> {
    name: string;
    transform: (val: T, ...args: Args) => R;
}
/**
 * Define a custom pipe plugin with type safety
 */
export declare function definePipe<T, R, Args extends any[]>(pipe: PipePlugin<T, R, Args>): PipePlugin<T, R, Args>;
/**
 * Global pipes registry
 */
export declare const globalPipes: Map<string, Function>;
/**
 * Register a pipe plugin globally
 */
export declare function registerPipe(pipe: PipePlugin): void;
/**
 * Resolve a globally registered pipe by name
 */
export declare function resolvePipe(name: string): Function;
//# sourceMappingURL=pipes.d.ts.map