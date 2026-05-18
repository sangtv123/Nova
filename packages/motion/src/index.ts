import { signal, effect, Signal } from '@nova/signals';

/**
 * Standard Easing functions
 */
export const easings = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
};

type EaseType = keyof typeof easings | ((t: number) => number);

function getEaseFn(ease: EaseType): (t: number) => number {
  if (typeof ease === 'function') return ease;
  return easings[ease] || easings.easeOut;
}

/**
 * Interpolation helper for numbers and objects
 */
function interpolate(start: any, end: any, progress: number): any {
  if (typeof start === 'number' && typeof end === 'number') {
    return start + (end - start) * progress;
  }
  
  if (typeof start === 'object' && start !== null && typeof end === 'object' && end !== null) {
    const res: Record<string, any> = {};
    for (const key of Object.keys(end)) {
      if (key in start) {
        res[key] = interpolate(start[key], end[key], progress);
      } else {
        res[key] = end[key];
      }
    }
    return res;
  }

  return progress < 1 ? start : end;
}

/**
 * Default style mapper for standard properties
 */
function defaultStyleMap(val: any, label?: string): Record<string, string | number> {
  const labelLower = (label || '').toLowerCase();

  // If the value is an object representing keyframe attributes
  if (typeof val === 'object' && val !== null) {
    const styles: Record<string, any> = {};
    let transformParts: string[] = [];

    if ('opacity' in val) styles.opacity = val.opacity;
    if ('x' in val || 'y' in val) {
      const x = val.x ?? 0;
      const y = val.y ?? 0;
      transformParts.push(`translate3d(${x}px, ${y}px, 0)`);
    }
    if ('scale' in val) {
      transformParts.push(`scale(${val.scale})`);
    }
    if ('rotate' in val) {
      transformParts.push(`rotate(${val.rotate}deg)`);
    }

    if (transformParts.length > 0) {
      styles.transform = transformParts.join(' ');
      styles.willChange = 'transform, opacity';
    } else if ('opacity' in styles) {
      styles.willChange = 'opacity';
    }

    return styles;
  }

  // Primitive number mapper mapping based on signal label
  if (typeof val === 'number') {
    if (labelLower.includes('scale')) {
      return { transform: `scale(${val})`, willChange: 'transform' };
    }
    if (labelLower.includes('opacity')) {
      return { opacity: val, willChange: 'opacity' };
    }
    if (labelLower.includes('rotate')) {
      return { transform: `rotate(${val}deg)`, willChange: 'transform' };
    }
    if (labelLower === 'x' || labelLower.includes('translatex')) {
      return { transform: `translate3d(${val}px, 0, 0)`, willChange: 'transform' };
    }
    if (labelLower === 'y' || labelLower.includes('translatey')) {
      return { transform: `translate3d(0, ${val}px, 0)`, willChange: 'transform' };
    }
  }

  // Fallback
  return {};
}

/**
 * Signal-driven Animations (useMotion)
 * Interpolates signal value updates smoothly at 60FPS using requestAnimationFrame.
 */
export function useMotion(
  sourceSignal: Signal<any>,
  options: {
    duration?: number; // duration in seconds, default 0.3
    ease?: EaseType;
    map?: (v: any) => Record<string, string | number>;
  } = {}
) {
  const interpolatedSignal = signal<any>(sourceSignal.peek(), 'interpolated-motion');
  
  let animFrameId: number | null = null;
  let startTime: number | null = null;
  let startValue = sourceSignal.peek();
  let targetValue = sourceSignal.peek();

  // Create active effect listening to target signal mutations
  effect(() => {
    const newVal = sourceSignal.value;
    if (newVal === targetValue) return;

    startValue = targetValue;
    targetValue = newVal;
    startTime = performance.now();

    if (animFrameId) cancelAnimationFrame(animFrameId);

    const durationMs = (options.duration ?? 0.3) * 1000;
    const easeFn = getEaseFn(options.ease ?? 'easeOut');

    function tick(now: number) {
      if (!startTime) return;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeFn(progress);

      interpolatedSignal.value = interpolate(startValue, targetValue, eased);

      if (progress < 1) {
        animFrameId = requestAnimationFrame(tick);
      } else {
        animFrameId = null;
      }
    }

    animFrameId = requestAnimationFrame(tick);
  });

  // Returns styling getter evaluated directly within the runtime style effect
  return () => {
    const val = interpolatedSignal.value;
    if (options.map) {
      return options.map(val);
    }
    return defaultStyleMap(val, sourceSignal.label);
  };
}

/**
 * Interface for DOM ref transition configuration
 */
export interface MotionOptions {
  initial?: Record<string, string | number>;
  animate?: Record<string, string | number>;
  exit?: Record<string, string | number>;
  transition?: {
    duration?: number; // in seconds, default 0.3
    ease?: string;     // default 'ease-out'
    delay?: number;    // in seconds, default 0
  };
}

/**
 * Apply styling keyframes to element styles
 */
function applyStyles(el: HTMLElement, styles: Record<string, string | number>) {
  for (const [prop, val] of Object.entries(styles)) {
    if (prop === 'x' || prop === 'y' || prop === 'scale' || prop === 'rotate') continue;
    (el.style as any)[prop] = String(val);
  }

  // Handle GPU transforms (x, y, scale, rotate)
  let transformParts: string[] = [];
  if ('x' in styles || 'y' in styles) {
    const x = styles.x ?? 0;
    const y = styles.y ?? 0;
    transformParts.push(`translate3d(${x}px, ${y}px, 0)`);
  }
  if ('scale' in styles) {
    transformParts.push(`scale(${styles.scale})`);
  }
  if ('rotate' in styles) {
    transformParts.push(`rotate(${styles.rotate}deg)`);
  }

  if (transformParts.length > 0) {
    el.style.transform = transformParts.join(' ');
    el.style.willChange = 'transform, opacity';
  } else if ('opacity' in styles) {
    el.style.willChange = 'opacity';
  }
}

/**
 * High-Performance Hardware-Accelerated Mount/Exit Transitions (motion ref callback)
 * Uses native CSS Transition engine to run 100% composite animation on GPU.
 */
export function motion(options: MotionOptions) {
  return (el: HTMLElement) => {
    const duration = options.transition?.duration ?? 0.3;
    const ease = options.transition?.ease ?? 'ease-out';
    const delay = options.transition?.delay ?? 0;

    // 1. Set Initial Styling Instantly
    if (options.initial) {
      applyStyles(el, options.initial);
    }

    // 2. Animate into view
    if (options.animate) {
      // Force layout reflow to ensure initial styles are painted before transition starts
      void el.offsetHeight;

      setTimeout(() => {
        // Apply smooth transition transition rules
        el.style.transition = `transform ${duration}s ${ease}, opacity ${duration}s ${ease}`;
        
        applyStyles(el, options.animate!);
      }, delay * 1000 + 10);
    }

    // 3. Register standard unmount exit animation
    if (options.exit) {
      (el as any).__nova_exit = (removeCallback: () => void) => {
        // Set exit transition
        el.style.transition = `transform ${duration}s ${ease}, opacity ${duration}s ${ease}`;
        
        applyStyles(el, options.exit!);

        // Call DOM removal exactly after animation finishes
        setTimeout(() => {
          removeCallback();
        }, duration * 1000 + 20);
      };
    }
  };
}

/**
 * Wrapper helper for JSX element mounting context
 */
export function AnimatePresence(props: { children: any }) {
  // Directly returns the children list
  // The reconcile engine will handle unmounting transitions automatically via __nova_exit hooks!
  return props.children;
}
