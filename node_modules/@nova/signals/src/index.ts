import type { Signal, Effect, Subscriber } from './types.js';
export type { Signal, Effect, Subscriber };
export * from './pipes.js';


// Extended Effect interface with dep-tracking support (internal)
interface TrackedEffect extends Effect {
  /** Set of subscriber-sets this effect is currently registered in */
  _deps?: Set<Set<Subscriber>>;
}

/**
 * Global execution context for dependency tracking
 */
let currentEffect: Effect | null = null;
let batchDepth = 0;
let pendingEffects = new Set<Subscriber>();

/**
 * Create a reactive signal with initial value
 * Tracks all dependent effects and computed values
 */
export function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subs: Set<Subscriber> = new Set();

  const sig: Signal<T> = {
    /**
     * Get the current signal value
     * Subscribes current effect if running
     */
    get value(): T {
      if (currentEffect) {
        subs.add(currentEffect);
        // FIX 2: Register this sub-set in the effect's dep-list for cleanup
        const te = currentEffect as TrackedEffect;
        if (te._deps) te._deps.add(subs);
      }
      return value;
    },

    /**
     * Set signal value and notify subscribers
     */
    set value(newValue: T) {
      if (value === newValue) return;
      value = newValue;
      if (batchDepth > 0) {
        // Batching mode: add to global pending set
        subs.forEach(sub => pendingEffects.add(sub));
      } else {
        // Immediate mode: notify all subscribers
        // IMPORTANT: We MUST snapshot the subscribers set here. 
        // JS Set.forEach will re-visit entries that are deleted and re-added during iteration.
        // Since effects unsubscribe and re-subscribe during their run, 
        // a direct forEach on 'subs' causes an infinite loop.
        const snapshot = [...subs];
        snapshot.forEach((sub) => sub.run?.());
      }
    },


    /**
     * Peek at value without creating dependency
     */
    peek(): T {
      return value;
    },

    /**
     * Get signal subscribers for dependency tracking
     */
    getSubscribers(): Set<Subscriber> {
      return subs;
    },

    /**
     * Chain synchronous transformation pipes to return a new computed signal
     */
    pipe(...fns: Array<(v: any) => any>): Signal<any> {
      return computed(() => fns.reduce((val, fn) => fn(val), sig.value));
    },
  };

  return sig;
}

/**
 * Create a derived value from other signals
 * Automatically recomputes when dependencies change
 */
export function computed<T>(fn: () => T): Signal<T> {
  let value: T = undefined as unknown as T;
  let dirty = true;
  const internalSubs: Set<Subscriber> = new Set();

  const effectObj: Effect = {
    run() {
      dirty = true;
      // Snapshot before iteration to prevent infinite loops if a subscriber re-subscribes
      const snapshot = [...internalSubs];
      snapshot.forEach((sub) => sub.run?.());
    },

  };

  const sig: Signal<T> = {
    get value(): T {
      if (currentEffect) {
        internalSubs.add(currentEffect);
        // FIX 2: Track this sub-set in the outer effect for cleanup
        const te = currentEffect as TrackedEffect;
        if (te._deps) te._deps.add(internalSubs);
      }

      if (dirty) {
        const prevEffect = currentEffect;
        currentEffect = effectObj;
        try {
          value = fn();
        } finally {
          currentEffect = prevEffect;
        }
        dirty = false;
      }

      return value;
    },

    peek(): T {
      return value;
    },

    set value(_: T) {
      throw new Error('Cannot set value of computed signal');
    },

    getSubscribers(): Set<Subscriber> {
      return internalSubs;
    },

    /**
     * Chain synchronous transformation pipes to return a new computed signal
     */
    pipe(...fns: Array<(v: any) => any>): Signal<any> {
      return computed(() => fns.reduce((val, fn) => fn(val), sig.value));
    },
  };

  return sig;
}

/**
 * Side effect - runs whenever dependencies change
 * Returns cleanup function
 */
export function effect(fn: () => void | (() => void)): () => void {
  let cleanup: (() => void) | void;

  // FIX 2: Track every subscriber-set this effect is registered in
  // so we can unsubscribe before re-running (prevents stale deps & memory leaks)
  const ownDeps = new Set<Set<Subscriber>>();

  const effectObj: TrackedEffect = {
    _deps: ownDeps,

    run() {
      // Remove self from all previously-tracked signal subscriber-sets
      ownDeps.forEach(depSubs => depSubs.delete(effectObj));
      ownDeps.clear();

      if (typeof cleanup === 'function') {
        cleanup();
      }
      const prevEffect = currentEffect;
      currentEffect = effectObj;
      try {
        cleanup = fn();
      } finally {
        currentEffect = prevEffect;
      }
    },
  };

  // Initial run
  effectObj.run();

  // Return disposal function — removes from all subscriptions & runs cleanup
  return () => {
    ownDeps.forEach(depSubs => depSubs.delete(effectObj));
    ownDeps.clear();
    if (typeof cleanup === 'function') {
      cleanup();
    }
  };
}

/**
 * createResource - Handles asynchronous data fetching reactively
 */
export function createResource<T>(fetcher: () => Promise<T>) {
  const data = signal<T | null>(null);
  const loading = signal<boolean>(true);
  const error = signal<Error | null>(null);

  fetcher()
    .then((res) => {
      data.value = res;
    })
    .catch((err) => {
      error.value = err;
    })
    .finally(() => {
      loading.value = false;
    });

  return {
    data: () => data.value,
    loading: () => loading.value,
    error: () => error.value,
  };
}

/**
 * Batch multiple updates together
 * Prevents multiple runs of effects
 */
export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0 && pendingEffects.size > 0) {
      // FIX 1: Snapshot before clear, then iterate without array spread allocation
      const snapshot = pendingEffects;
      pendingEffects = new Set<Subscriber>();
      snapshot.forEach(sub => sub.run?.());
    }
  }
}

/**
 * Untrack - read signal without creating dependency
 */
export function untrack<T>(fn: () => T): T {
  const prevEffect = currentEffect;
  currentEffect = null;
  try {
    return fn();
  } finally {
    currentEffect = prevEffect;
  }
}

// ─── DOM Effect Scheduler ──────────────────────────────────────────────────────
//
// Problem: when multiple signals change synchronously (e.g. in an event handler
// without batch()), each change triggers effect.run() immediately, potentially
// causing multiple DOM mutations in a single JS frame → layout thrashing.
//
// Solution: domEffect() queues the re-run in a queueMicrotask flush.
// All DOM effects that were invalidated in the same synchronous block are
// flushed together once, after the current call-stack is clear.
// This is the same approach used by Vue 3's scheduler and SolidJS.

/** Pending DOM effects waiting to be flushed this microtask tick */
const pendingDomEffects = new Set<TrackedEffect>();
let domFlushScheduled = false;

function scheduleDomFlush(): void {
  if (domFlushScheduled) return;
  domFlushScheduled = true;
  // queueMicrotask runs after the current call-stack but before the next paint.
  // This means all signal updates in a single event handler are batched for free.
  queueMicrotask(flushDomEffects);
}

function flushDomEffects(): void {
  domFlushScheduled = false;
  const toFlush = [...pendingDomEffects];
  pendingDomEffects.clear();
  for (const eff of toFlush) {
    if ((eff as any)._execute) {
      (eff as any)._execute();
    } else {
      eff.run();
    }
  }
}

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
export function domEffect(fn: () => void | (() => void)): () => void {
  let cleanup: (() => void) | void;
  const ownDeps = new Set<Set<Subscriber>>();

  const effectObj: TrackedEffect = {
    _deps: ownDeps,

    run() {
      // Instead of running immediately, queue for the next microtask flush
      pendingDomEffects.add(effectObj);
      scheduleDomFlush();
    },
  };

  // Separate method for actual execution (called by flushDomEffects)
  function execute(): void {
    ownDeps.forEach(depSubs => depSubs.delete(effectObj));
    ownDeps.clear();
    if (typeof cleanup === 'function') cleanup();

    const prevEffect = currentEffect;
    currentEffect = effectObj;
    try {
      cleanup = fn();
    } finally {
      currentEffect = prevEffect;
    }
  }

  (effectObj as any)._execute = execute;

  // Override run to handle first execution synchronously (for setup),
  // then switch to scheduled mode for subsequent runs.
  let firstRun = true;
  const originalRun = effectObj.run.bind(effectObj);
  effectObj.run = function () {
    if (firstRun) {
      firstRun = false;
      // First execution is synchronous so the DOM is updated before paint
      execute();
    } else {
      originalRun();
    }
  };

  // Initial synchronous run to set up subscriptions
  effectObj.run();

  return () => {
    pendingDomEffects.delete(effectObj);
    ownDeps.forEach(depSubs => depSubs.delete(effectObj));
    ownDeps.clear();
    if (typeof cleanup === 'function') cleanup();
  };
}

// ─── Memo Signal ───────────────────────────────────────────────────────────────

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
export function memoSignal<T>(initialValue: T): Signal<T> {
  const inner = signal<T>(initialValue);

  return {
    get value(): T {
      return inner.value;
    },
    set value(newValue: T) {
      // Skip update if structurally identical (prevents redundant DOM updates)
      try {
        if (JSON.stringify(inner.peek()) === JSON.stringify(newValue)) return;
      } catch {
        // If not serialisable (e.g. contains functions), fall through to normal set
      }
      inner.value = newValue;
    },
    peek(): T {
      return inner.peek();
    },
    getSubscribers(): Set<Subscriber> {
      return inner.getSubscribers();
    },
    pipe(...fns: Array<(v: any) => any>): Signal<any> {
      return computed(() => fns.reduce((val, fn) => fn(val), inner.value));
    },
  };
}
// ─── Global Store API ─────────────────────────────────────────────────────────

/**
 * `createStore` — creates a reactive proxy object.
 * Deeply wraps an object so that any property access is reactive.
 * 
 * @example
 * const state = createStore({ count: 0, user: { name: 'Nova' } });
 * effect(() => console.log(state.count));
 * state.count++; // Triggers effect
 */
export function createStore<T extends object>(initialState: T): T {
  const signalMap = new Map<PropertyKey, Signal<any>>();

  return new Proxy(initialState, {
    get(target, prop, receiver) {
      // Return the value if it's not an object (primitive)
      const value = Reflect.get(target, prop, receiver);
      
      // If it's an object, we should probably wrap it too (nested stores)
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        return createStore(value);
      }

      // Track dependency via signal
      let sig = signalMap.get(prop);
      if (!sig) {
        sig = signal(value);
        signalMap.set(prop, sig);
      }
      return sig.value;
    },
    
    set(target, prop, newValue, receiver) {
      const oldValue = Reflect.get(target, prop, receiver);
      if (oldValue === newValue) return true;
      
      const success = Reflect.set(target, prop, newValue, receiver);
      if (success) {
        let sig = signalMap.get(prop);
        if (sig) {
          sig.value = newValue;
        }
      }
      return success;
    }
  });
}
