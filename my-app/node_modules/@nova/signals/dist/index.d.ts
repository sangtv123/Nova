import type { Signal, Effect, Subscriber } from './types.js';
export type { Signal, Effect, Subscriber };
/**
 * Create a reactive signal with initial value
 * Tracks all dependent effects and computed values
 */
export declare function signal<T>(initialValue: T): Signal<T>;
/**
 * Create a derived value from other signals
 * Automatically recomputes when dependencies change
 */
export declare function computed<T>(fn: () => T): Signal<T>;
/**
 * Side effect - runs whenever dependencies change
 * Returns cleanup function
 */
export declare function effect(fn: () => void | (() => void)): () => void;
/**
 * createResource - Handles asynchronous data fetching reactively
 */
export declare function createResource<T>(fetcher: () => Promise<T>): {
    data: () => T | null;
    loading: () => boolean;
    error: () => Error | null;
};
/**
 * Batch multiple updates together
 * Prevents multiple runs of effects
 */
export declare function batch<T>(fn: () => T): T;
/**
 * Untrack - read signal without creating dependency
 */
export declare function untrack<T>(fn: () => T): T;
/**
 * `domEffect` — like `effect()` but DOM-safe:
 * re-runs are **batched per microtask** instead of synchronously.
 *
 * Use this for any effect that touches the DOM. Effects that only compute
 * derived data (no DOM writes) should use the regular `effect()`.
 *
 * @example
 * const count = signal(0);
 * domEffect(() => {
 *   el.textContent = String(count.value);  // runs once per microtask, not per signal write
 * });
 *
 * // Even this only causes one DOM update:
 * count.value = 1;
 * count.value = 2;
 * count.value = 3;  // → flush: el.textContent = '3'
 */
export declare function domEffect(fn: () => void | (() => void)): () => void;
/**
 * `memoSignal` — a signal that only notifies subscribers when the value
 * **structurally changes** (deep JSON equality).
 *
 * Use when the signal holds objects or arrays that are recreated on every
 * computation but may be semantically identical — prevents spurious re-renders.
 *
 * @example
 * const list = memoSignal<number[]>([]);
 * list.value = [1, 2, 3];
 * list.value = [1, 2, 3];  // ← no effect re-run (same structure)
 */
export declare function memoSignal<T>(initialValue: T): Signal<T>;
//# sourceMappingURL=index.d.ts.map