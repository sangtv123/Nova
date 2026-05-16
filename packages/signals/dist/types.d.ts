/**
 * Reactive signal type
 * Represents a mutable reactive value
 */
export interface Signal<T> {
    value: T;
    peek(): T;
    getSubscribers(): Set<Subscriber>;
}
/**
 * Computed signal (read-only derived value)
 */
export type Computed<T> = Readonly<Signal<T>>;
/**
 * Effect runner (side effect function)
 */
export interface Effect {
    run(): void;
}
/**
 * Generic subscriber (effect or computed)
 */
export interface Subscriber {
    run?(): void;
}
//# sourceMappingURL=types.d.ts.map