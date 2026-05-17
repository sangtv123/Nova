/**
 * Reactive signal type
 * Represents a mutable reactive value
 */
export interface Signal<T> {
  value: T;
  peek(): T;
  getSubscribers(): Set<Subscriber>;
  /**
   * Chain synchronous transformation pipes to return a new computed signal
   */
  pipe<R>(fn: (val: T) => R): Signal<R>;
  pipe<A, R>(f1: (val: T) => A, f2: (val: A) => R): Signal<R>;
  pipe<A, B, R>(f1: (val: T) => A, f2: (val: A) => B, f3: (val: B) => R): Signal<R>;
  pipe<A, B, C, R>(f1: (val: T) => A, f2: (val: A) => B, f3: (val: B) => C, f4: (val: C) => R): Signal<R>;
  pipe(...fns: Array<(v: any) => any>): Signal<any>;
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
