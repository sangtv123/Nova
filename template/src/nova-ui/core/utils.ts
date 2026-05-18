/**
 * Nova UI - Core Utilities
 * Fast, tree-shakeable utilities for class merging and resolving signals.
 */

import { SignalOrValue } from './types';

/**
 * Resolves a SignalOrValue to its underlying value dynamically.
 */
export function resolveSignal<T>(val: SignalOrValue<T>): T {
  if (typeof val === 'function') return (val as () => T)();
  if (val && typeof val === 'object' && 'value' in val) return (val as any).value;
  return val as T;
}

/**
 * High-performance class name merger.
 * Combines static strings, undefined, and reactive signals into a single string or signal function.
 */
export function classNames(...classes: (string | undefined | null | false | (() => string | false | undefined | null))[]) {
  const hasDynamic = classes.some(c => typeof c === 'function');
  
  if (hasDynamic) {
    return () => {
      let res = '';
      for (let i = 0; i < classes.length; i++) {
        const c = classes[i];
        if (!c) continue;
        const val = typeof c === 'function' ? c() : c;
        if (val) res += (res ? ' ' : '') + val;
      }
      return res;
    };
  }

  return classes.filter(Boolean).join(' ');
}

/**
 * Merges inline styles, supporting both strings and objects.
 */
export function mergeStyles(...styles: any[]) {
  // Simple implementation for Nova's style parsing.
  // In a full implementation, this handles merging object styles into a CSS text string or single object.
  return styles.find(Boolean); 
}
