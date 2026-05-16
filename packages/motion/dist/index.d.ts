import { Signal } from '@nova/signals';
export interface AnimateOptions {
    duration?: number;
    easing?: (t: number) => number;
}
/**
 * Standard easing functions
 */
export declare const easing: {
    linear: (t: number) => number;
    easeInOut: (t: number) => number;
    easeOut: (t: number) => number;
    elastic: (t: number) => number;
};
/**
 * Animate a value from one point to another and return a reactive signal.
 */
export declare function animate(from: number, to: number, options?: AnimateOptions): Signal<number>;
/**
 * Create a reactive motion signal that "follows" a target signal with animation.
 * Whenever the target signal changes, this will animate towards the new value.
 */
export declare function useMotion(target: Signal<number>, options?: AnimateOptions): Signal<number>;
//# sourceMappingURL=index.d.ts.map