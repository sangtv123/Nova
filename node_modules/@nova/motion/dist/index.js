import { signal, effect } from '@nova/signals';
/**
 * Standard easing functions
 */
export const easing = {
    linear: (t) => t,
    easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeOut: (t) => t * (2 - t),
    elastic: (t) => t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
};
/**
 * Animate a value from one point to another and return a reactive signal.
 */
export function animate(from, to, options = {}) {
    const { duration = 300, easing: easeFn = easing.easeInOut } = options;
    const s = signal(from);
    const startTime = performance.now();
    const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        s.value = from + (to - from) * easeFn(progress);
        if (progress < 1) {
            requestAnimationFrame(tick);
        }
    };
    requestAnimationFrame(tick);
    return s;
}
/**
 * Create a reactive motion signal that "follows" a target signal with animation.
 * Whenever the target signal changes, this will animate towards the new value.
 */
export function useMotion(target, options = {}) {
    const current = signal(target.value);
    let animationFrame;
    let startValue = target.value;
    let startTime = performance.now();
    effect(() => {
        const nextValue = target.value;
        startValue = current.value;
        startTime = performance.now();
        const duration = options.duration || 300;
        const easeFn = options.easing || easing.easeInOut;
        const tick = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            current.value = startValue + (nextValue - startValue) * easeFn(progress);
            if (progress < 1) {
                animationFrame = requestAnimationFrame(tick);
            }
        };
        if (animationFrame)
            cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(tick);
    });
    return current;
}
/**
 * Animate component for declarative property animations.
 */
export function Animate(props) {
    const el = typeof props.children === 'function' ? props.children() : props.children;
    if (el instanceof HTMLElement) {
        for (const [key, targetValue] of Object.entries(props.to)) {
            const startValue = parseFloat(getComputedStyle(el).getPropertyValue(key)) || 0;
            const s = animate(startValue, targetValue, props.options);
            effect(() => {
                el.style[key] = s.value + (key === 'opacity' ? '' : 'px');
            });
        }
    }
    return el;
}
/**
 * Transition component for entry/exit animations.
 */
export function Transition(props) {
    const marker = document.createTextNode('');
    let currentEl = null;
    const duration = props.duration || 300;
    effect(() => {
        if (props.show.value) {
            if (!currentEl) {
                const child = typeof props.children === 'function' ? props.children() : props.children;
                currentEl = child instanceof HTMLElement ? child : null;
                if (currentEl) {
                    if (props.enter)
                        currentEl.classList.add(props.enter);
                    marker.parentNode?.insertBefore(currentEl, marker);
                    // Trigger reflow
                    currentEl.offsetHeight;
                    if (props.enter) {
                        setTimeout(() => {
                            currentEl?.classList.remove(props.enter);
                        }, duration);
                    }
                }
            }
        }
        else {
            if (currentEl) {
                if (props.leave)
                    currentEl.classList.add(props.leave);
                setTimeout(() => {
                    if (!props.show.value && currentEl) {
                        currentEl.remove();
                        currentEl = null;
                    }
                }, duration);
            }
        }
    });
    return marker;
}
//# sourceMappingURL=index.js.map