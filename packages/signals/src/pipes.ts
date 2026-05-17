import { signal } from './index.js';

/**
 * Pipe transformation helpers for Nova signals
 */

/**
 * Convert a string to uppercase
 */
export function uppercase(val: any): string {
  if (val == null) return '';
  return String(val).toUpperCase();
}

/**
 * Convert a string to lowercase
 */
export function lowercase(val: any): string {
  if (val == null) return '';
  return String(val).toLowerCase();
}

/**
 * Format a number as currency (e.g. $1,234.56)
 */
export function currency(symbol: string = '$', decimals: number = 2) {
  return (val: any): string => {
    const num = Number(val);
    if (isNaN(num)) return `${symbol}0.00`;
    
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
export function date(format: string = 'YYYY-MM-DD HH:mm:ss') {
  return (val: any): string => {
    if (!val) return '';
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return '';

    const pad = (n: number) => String(n).padStart(2, '0');
    
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
export function json(space: number = 2) {
  return (val: any): string => {
    try {
      return JSON.stringify(val, null, space);
    } catch {
      return '';
    }
  };
}

/**
 * Provide a fallback value if the input is null, undefined, or empty string
 */
export function defaultVal<T>(fallback: T) {
  return (val: any): T => {
    return (val === null || val === undefined || val === '') ? fallback : val;
  };
}

/**
 * Helper to parse digit info string for Decimal and Percent pipes
 * Format: {minIntegerDigits}.{minFractionDigits}-{maxFractionDigits}
 */
function parseDigitInfo(digitsInfo?: string, isPercent: boolean = false) {
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
      } else {
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
export function decimal(digitsInfo?: string, locale: string = 'en-US') {
  const { minIntegerDigits, minFractionDigits, maxFractionDigits } = parseDigitInfo(digitsInfo, false);
  const formatter = new Intl.NumberFormat(locale, {
    minimumIntegerDigits: minIntegerDigits,
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  });

  return (val: any): string => {
    if (val === null || val === undefined || val === '') return '';
    const num = Number(val);
    if (isNaN(num)) return '';
    return formatter.format(num);
  };
}

/**
 * Format a number as a percentage string using Intl.NumberFormat
 * Format: {minIntegerDigits}.{minFractionDigits}-{maxFractionDigits} (e.g. '1.0-0')
 */
export function percent(digitsInfo?: string, locale: string = 'en-US') {
  const { minIntegerDigits, minFractionDigits, maxFractionDigits } = parseDigitInfo(digitsInfo, true);
  const formatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumIntegerDigits: minIntegerDigits,
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  });

  return (val: any): string => {
    if (val === null || val === undefined || val === '') return '';
    const num = Number(val);
    if (isNaN(num)) return '';
    return formatter.format(num);
  };
}

// Global WeakMap cache for the direct/no-parenthesis asyncPipe call
const asyncCache = new WeakMap<any, { latestValue: any; activeSubscription?: any }>();

function handleAsyncVal(val: any): any {
  if (!val) return val;

  const isPromise = typeof val.then === 'function';
  const isObservable = typeof val.subscribe === 'function';

  if (!isPromise && !isObservable) {
    return val;
  }

  let cache = asyncCache.get(val);
  if (!cache) {
    const latest = signal<any>(undefined);
    cache = { latestValue: latest };
    asyncCache.set(val, cache);

    if (isPromise) {
      val.then(
        (resolved: any) => {
          latest.value = resolved;
        },
        () => {
          latest.value = undefined;
        }
      );
    } else if (isObservable) {
      cache.activeSubscription = val.subscribe({
        next: (v: any) => {
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
export function asyncPipe(val?: any): any {
  // If called without arguments, return a stateful instance
  if (arguments.length === 0) {
    const latestValue = signal<any>(undefined);
    let activePromise: any = null;
    let activeSubscription: any = null;

    return (value: any) => {
      if (value !== activePromise) {
        if (activeSubscription && typeof activeSubscription.unsubscribe === 'function') {
          activeSubscription.unsubscribe();
        }
        activeSubscription = null;
        activePromise = value;

        if (value && typeof value.then === 'function') {
          value.then(
            (resolved: any) => {
              if (value === activePromise) latestValue.value = resolved;
            },
            () => {
              if (value === activePromise) latestValue.value = undefined;
            }
          );
        } else if (value && typeof value.subscribe === 'function') {
          activeSubscription = value.subscribe({
            next: (v: any) => {
              if (value === activePromise) latestValue.value = v;
            },
            error: () => {
              if (value === activePromise) latestValue.value = undefined;
            }
          });
        } else {
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
export function titlecase(val: any): string {
  if (val == null) return '';
  return String(val)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Slice a subset of an array or a string from start to end index
 */
export function slice(start: number, end?: number) {
  return (val: any): any => {
    if (val == null) return val;
    if (typeof val.slice === 'function') {
      return val.slice(start, end);
    }
    return val;
  };
}

/**
 * Transform an Object, Map, or Set into an array of key-value pairs
 */
export function keyvalue(val: any): Array<{ key: any; value: any }> {
  if (val == null) return [];
  
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
export function reverse(val: any): any {
  if (val == null) return val;
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
export function truncate(limit: number = 20, trail: string = '...') {
  return (val: any): string => {
    if (val == null) return '';
    const str = String(val);
    return str.length > limit ? str.substring(0, limit) + trail : str;
  };
}

/**
 * Helper to define custom pipes with full type safety
 */
export function createPipe<T, R, Args extends any[]>(
  fn: (val: T, ...args: Args) => R
): (...args: Args) => (val: T) => R {
  return (...args: Args) => (val: T) => fn(val, ...args);
}

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
export function definePipe<T, R, Args extends any[]>(
  pipe: PipePlugin<T, R, Args>
): PipePlugin<T, R, Args> {
  return pipe;
}

/**
 * Global pipes registry
 */
export const globalPipes = new Map<string, Function>();

/**
 * Register a pipe plugin globally
 */
export function registerPipe(pipe: PipePlugin) {
  const pipeFn = (...args: any[]) => (val: any) => pipe.transform(val, ...args);
  globalPipes.set(pipe.name, pipeFn);
}

/**
 * Resolve a globally registered pipe by name
 */
export function resolvePipe(name: string): Function {
  const pipe = globalPipes.get(name);
  if (!pipe) {
    throw new Error(`Pipe "${name}" is not registered globally! Make sure to import and call registerPipe(pipe) in your main.tsx entry point.`);
  }
  return pipe;
}
