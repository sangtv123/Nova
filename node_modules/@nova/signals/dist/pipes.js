import { signal } from './index.js';
/**
 * Pipe transformation helpers for Nova signals
 */
/**
 * Convert a string to uppercase
 */
export function uppercase(val) {
    if (val == null)
        return '';
    return String(val).toUpperCase();
}
/**
 * Convert a string to lowercase
 */
export function lowercase(val) {
    if (val == null)
        return '';
    return String(val).toLowerCase();
}
/**
 * Format a number as currency (e.g. $1,234.56)
 */
export function currency(symbol = '$', decimals = 2) {
    return (val) => {
        const num = Number(val);
        if (isNaN(num))
            return `${symbol}0.00`;
        const formatted = num.toFixed(decimals);
        // Add comma thousands separators
        const parts = formatted.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return `${symbol}${parts.join('.')}`;
    };
}
/**
 * Format a date object, string, or timestamp into a readable format
 */
export function date(format = 'YYYY-MM-DD HH:mm:ss') {
    return (val) => {
        if (!val)
            return '';
        const d = val instanceof Date ? val : new Date(val);
        if (isNaN(d.getTime()))
            return '';
        const pad = (n) => String(n).padStart(2, '0');
        return format
            .replace('YYYY', String(d.getFullYear()))
            .replace('MM', pad(d.getMonth() + 1))
            .replace('DD', pad(d.getDate()))
            .replace('HH', pad(d.getHours()))
            .replace('mm', pad(d.getMinutes()))
            .replace('ss', pad(d.getSeconds()));
    };
}
/**
 * Format a value as a JSON string
 */
export function json(space = 2) {
    return (val) => {
        try {
            return JSON.stringify(val, null, space);
        }
        catch {
            return '';
        }
    };
}
/**
 * Provide a fallback value if the input is null, undefined, or empty string
 */
export function defaultVal(fallback) {
    return (val) => {
        return (val === null || val === undefined || val === '') ? fallback : val;
    };
}
/**
 * Helper to parse digit info string for Decimal and Percent pipes
 * Format: {minIntegerDigits}.{minFractionDigits}-{maxFractionDigits}
 */
function parseDigitInfo(digitsInfo, isPercent = false) {
    let minIntegerDigits = 1;
    let minFractionDigits = 0;
    let maxFractionDigits = isPercent ? 0 : 3;
    if (digitsInfo) {
        const parts = digitsInfo.split('.');
        if (parts[0]) {
            minIntegerDigits = parseInt(parts[0], 10) || 1;
        }
        if (parts[1]) {
            const fracParts = parts[1].split('-');
            if (fracParts[0]) {
                minFractionDigits = parseInt(fracParts[0], 10) || 0;
            }
            if (fracParts[1]) {
                maxFractionDigits = parseInt(fracParts[1], 10) || 0;
            }
            else {
                maxFractionDigits = Math.max(minFractionDigits, isPercent ? 0 : 3);
            }
        }
    }
    return { minIntegerDigits, minFractionDigits, maxFractionDigits };
}
/**
 * Format a number as a decimal string using Intl.NumberFormat
 * Format: {minIntegerDigits}.{minFractionDigits}-{maxFractionDigits} (e.g. '1.2-2')
 */
export function decimal(digitsInfo, locale = 'en-US') {
    const { minIntegerDigits, minFractionDigits, maxFractionDigits } = parseDigitInfo(digitsInfo, false);
    const formatter = new Intl.NumberFormat(locale, {
        minimumIntegerDigits: minIntegerDigits,
        minimumFractionDigits: minFractionDigits,
        maximumFractionDigits: maxFractionDigits,
    });
    return (val) => {
        if (val === null || val === undefined || val === '')
            return '';
        const num = Number(val);
        if (isNaN(num))
            return '';
        return formatter.format(num);
    };
}
/**
 * Format a number as a percentage string using Intl.NumberFormat
 * Format: {minIntegerDigits}.{minFractionDigits}-{maxFractionDigits} (e.g. '1.0-0')
 */
export function percent(digitsInfo, locale = 'en-US') {
    const { minIntegerDigits, minFractionDigits, maxFractionDigits } = parseDigitInfo(digitsInfo, true);
    const formatter = new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumIntegerDigits: minIntegerDigits,
        minimumFractionDigits: minFractionDigits,
        maximumFractionDigits: maxFractionDigits,
    });
    return (val) => {
        if (val === null || val === undefined || val === '')
            return '';
        const num = Number(val);
        if (isNaN(num))
            return '';
        return formatter.format(num);
    };
}
// Global WeakMap cache for the direct/no-parenthesis asyncPipe call
const asyncCache = new WeakMap();
function handleAsyncVal(val) {
    if (!val)
        return val;
    const isPromise = typeof val.then === 'function';
    const isObservable = typeof val.subscribe === 'function';
    if (!isPromise && !isObservable) {
        return val;
    }
    let cache = asyncCache.get(val);
    if (!cache) {
        const latest = signal(undefined);
        cache = { latestValue: latest };
        asyncCache.set(val, cache);
        if (isPromise) {
            val.then((resolved) => {
                latest.value = resolved;
            }, () => {
                latest.value = undefined;
            });
        }
        else if (isObservable) {
            cache.activeSubscription = val.subscribe({
                next: (v) => {
                    latest.value = v;
                },
                error: () => {
                    latest.value = undefined;
                }
            });
        }
    }
    return cache.latestValue.value;
}
/**
 * Resolves Promise or Observable values reactively.
 * Supports both direct reference: `.pipe(asyncPipe)` and factory call: `.pipe(asyncPipe())`.
 */
export function asyncPipe(val) {
    // If called without arguments, return a stateful instance
    if (arguments.length === 0) {
        const latestValue = signal(undefined);
        let activePromise = null;
        let activeSubscription = null;
        return (value) => {
            if (value !== activePromise) {
                if (activeSubscription && typeof activeSubscription.unsubscribe === 'function') {
                    activeSubscription.unsubscribe();
                }
                activeSubscription = null;
                activePromise = value;
                if (value && typeof value.then === 'function') {
                    value.then((resolved) => {
                        if (value === activePromise)
                            latestValue.value = resolved;
                    }, () => {
                        if (value === activePromise)
                            latestValue.value = undefined;
                    });
                }
                else if (value && typeof value.subscribe === 'function') {
                    activeSubscription = value.subscribe({
                        next: (v) => {
                            if (value === activePromise)
                                latestValue.value = v;
                        },
                        error: () => {
                            if (value === activePromise)
                                latestValue.value = undefined;
                        }
                    });
                }
                else {
                    latestValue.value = value;
                }
            }
            return latestValue.value;
        };
    }
    return handleAsyncVal(val);
}
// Export as both asyncPipe and async alias
export { asyncPipe as async };
/**
 * Convert a string to Title Case (first letter of each word capitalized)
 */
export function titlecase(val) {
    if (val == null)
        return '';
    return String(val)
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}
/**
 * Slice a subset of an array or a string from start to end index
 */
export function slice(start, end) {
    return (val) => {
        if (val == null)
            return val;
        if (typeof val.slice === 'function') {
            return val.slice(start, end);
        }
        return val;
    };
}
/**
 * Transform an Object, Map, or Set into an array of key-value pairs
 */
export function keyvalue(val) {
    if (val == null)
        return [];
    if (val instanceof Map) {
        return Array.from(val.entries()).map(([key, value]) => ({ key, value }));
    }
    if (val instanceof Set) {
        return Array.from(val).map((value) => ({ key: value, value }));
    }
    if (typeof val === 'object') {
        return Object.entries(val).map(([key, value]) => ({ key, value }));
    }
    return [];
}
/**
 * Reverse a string or array
 */
export function reverse(val) {
    if (val == null)
        return val;
    if (typeof val === 'string') {
        return val.split('').reverse().join('');
    }
    if (Array.isArray(val)) {
        return [...val].reverse();
    }
    return val;
}
/**
 * Truncate a string to a specified length with an ellipsis fallback
 */
export function truncate(limit = 20, trail = '...') {
    return (val) => {
        if (val == null)
            return '';
        const str = String(val);
        return str.length > limit ? str.substring(0, limit) + trail : str;
    };
}
/**
 * Helper to define custom pipes with full type safety
 */
export function createPipe(fn) {
    return (...args) => (val) => fn(val, ...args);
}
/**
 * Define a custom pipe plugin with type safety
 */
export function definePipe(pipe) {
    return pipe;
}
/**
 * Global pipes registry
 */
export const globalPipes = new Map();
/**
 * Register a pipe plugin globally
 */
export function registerPipe(pipe) {
    const pipeFn = (...args) => (val) => pipe.transform(val, ...args);
    globalPipes.set(pipe.name, pipeFn);
}
/**
 * Resolve a globally registered pipe by name
 */
export function resolvePipe(name) {
    const pipe = globalPipes.get(name);
    if (!pipe) {
        throw new Error(`Pipe "${name}" is not registered globally! Make sure to import and call registerPipe(pipe) in your main.tsx entry point.`);
    }
    return pipe;
}
//# sourceMappingURL=pipes.js.map