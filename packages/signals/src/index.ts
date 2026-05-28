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

let nextSignalId = 0;
let nextComputedId = 0;
let nextEffectId = 0;

export function signal<T>(initialValue: T, label?: string): Signal<T> {
  let value = initialValue;
  const subs: Set<Subscriber> = new Set();
  const id = `sig_${nextSignalId++}`;

  const sig: Signal<T> = {
    id,
    label: label || 'Signal',

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
      const oldValue = value;
      value = newValue;

      // Notify devtools
      if (typeof window !== 'undefined' && (window as any).__NOVA_DEVTOOLS_HOOK__?.onSignalUpdated) {
        (window as any).__NOVA_DEVTOOLS_HOOK__.onSignalUpdated(sig, oldValue, newValue);
      }

      if (batchDepth > 0) {
        // Batching mode: add to global pending set
        subs.forEach(sub => pendingEffects.add(sub));
      } else {
        // Immediate mode: notify all subscribers
        // IMPORTANT: We MUST snapshot the subscribers set here. 
        // JS Set.forEach will re-visit entries that are deleted and re-added during iteration.
        // Since effects unsubscribe and re-subscribe during their run, 
        // a direct forEach on 'subs' causes an infinite loop.
        const snapshot = Array.from(subs);
        for (let i = 0; i < snapshot.length; i++) {
          snapshot[i].run?.();
        }
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

  if (typeof window !== 'undefined') {
    const registry = (window as any).__NOVA_SIGNALS__ || new Set();
    (window as any).__NOVA_SIGNALS__ = registry;
    registry.add(new WeakRef(sig));
    
    // Prune dead references occasionally to prevent memory growth
    if (registry.size > 1000) {
      for (const ref of registry) {
        if (!ref.deref()) {
          registry.delete(ref);
        }
      }
    }

    if ((window as any).__NOVA_DEVTOOLS_HOOK__?.onSignalCreated) {
      (window as any).__NOVA_DEVTOOLS_HOOK__.onSignalCreated(sig);
    }
  }

  return sig;
}

/**
 * Create a derived value from other signals
 * Automatically recomputes when dependencies change
 */
export function computed<T>(fn: () => T, label?: string): Signal<T> {
  let value: T = undefined as unknown as T;
  let dirty = true;
  const internalSubs: Set<Subscriber> = new Set();
  const id = `comp_${nextComputedId++}`;

  const ownDeps = new Set<Set<Subscriber>>();
  const effectObj: TrackedEffect & { id?: string; label?: string; isComputed?: boolean; signal?: any } = {
    _deps: ownDeps,
    id,
    label: label || 'Computed',
    isComputed: true,
    run() {
      dirty = true;
      // Snapshot before iteration to prevent infinite loops if a subscriber re-subscribes
      const snapshot = Array.from(internalSubs);
      for (let i = 0; i < snapshot.length; i++) {
        snapshot[i].run?.();
      }
    },
  };

  const sig: Signal<T> = {
    id,
    label: label || 'Computed',

    get value(): T {
      if (currentEffect) {
        internalSubs.add(currentEffect);
        // FIX 2: Track this sub-set in the outer effect for cleanup
        const te = currentEffect as TrackedEffect;
        if (te._deps) te._deps.add(internalSubs);
      }

      if (dirty) {
        // Remove self from all previously-tracked signal subscriber-sets to prevent leaks & stale deps
        ownDeps.forEach(depSubs => depSubs.delete(effectObj));
        ownDeps.clear();

        const prevEffect = currentEffect;
        currentEffect = effectObj;
        const oldValue = value;
        try {
          value = fn();
        } finally {
          currentEffect = prevEffect;
        }
        dirty = false;

        // Notify devtools
        if (typeof window !== 'undefined' && (window as any).__NOVA_DEVTOOLS_HOOK__?.onSignalUpdated) {
          (window as any).__NOVA_DEVTOOLS_HOOK__.onSignalUpdated(sig, oldValue, value);
        }
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
  effectObj.signal = sig;

  if (typeof window !== 'undefined') {
    const registry = (window as any).__NOVA_SIGNALS__ || new Set();
    (window as any).__NOVA_SIGNALS__ = registry;
    registry.add(new WeakRef(sig));

    // Prune dead references occasionally to prevent memory growth
    if (registry.size > 1000) {
      for (const ref of registry) {
        if (!ref.deref()) {
          registry.delete(ref);
        }
      }
    }

    if ((window as any).__NOVA_DEVTOOLS_HOOK__?.onSignalCreated) {
      (window as any).__NOVA_DEVTOOLS_HOOK__.onSignalCreated(sig);
    }
  }

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
  const effectId = `eff_${nextEffectId++}`;

  const effectObj: TrackedEffect & { id?: string; label?: string; isEffect?: boolean } = {
    _deps: ownDeps,
    id: effectId,
    label: 'Effect',
    isEffect: true,

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

// ─── Persisted Signal ──────────────────────────────────────────────────────────

export interface PersistedSignalOptions<T> {
  /** Which storage to use (default: 'localStorage') */
  storage?: 'localStorage' | 'sessionStorage';
  /** Custom serializer (default: JSON.stringify) */
  serialize?: (v: T) => string;
  /** Custom deserializer (default: JSON.parse) */
  deserialize?: (s: string) => T;
}

/**
 * `persistedSignal` — a signal that automatically reads its initial value from
 * Web Storage and writes back every time its value changes.
 *
 * @example
 * const theme = persistedSignal('app-theme', 'dark');
 * theme.value = 'light'; // localStorage['app-theme'] = '"light"'
 */
export function persistedSignal<T>(
  key: string,
  initialValue: T,
  options: PersistedSignalOptions<T> = {}
): Signal<T> {
  const getStorage = (): Storage | null => {
    if (typeof window === 'undefined') return null;
    return options.storage === 'sessionStorage'
      ? window.sessionStorage
      : window.localStorage;
  };

  // Hydrate from storage on creation
  let storedValue = initialValue;
  const storage = getStorage();
  if (storage) {
    try {
      const raw = storage.getItem(key);
      if (raw !== null) {
        storedValue = options.deserialize ? options.deserialize(raw) : JSON.parse(raw);
      }
    } catch {
      // Corrupted data — fall back to initialValue silently
    }
  }

  const sig = signal<T>(storedValue, `persisted:${key}`);

  // Persist on every change via reactive effect
  if (typeof window !== 'undefined') {
    effect(() => {
      const val = sig.value;
      const s = getStorage();
      if (!s) return;
      try {
        s.setItem(key, options.serialize ? options.serialize(val) : JSON.stringify(val));
      } catch {
        // Ignore quota / security errors
      }
    });
  }

  return sig;
}

// ─── watchEffect ───────────────────────────────────────────────────────────────

export interface WatchEffectOptions {
  /**
   * When to flush DOM-touching effects:
   * - 'microtask' (default): batched via queueMicrotask — prevents layout thrashing
   * - 'sync': runs immediately on each signal change
   */
  flush?: 'microtask' | 'sync';
}

/**
 * `watchEffect` — semantic alias for running reactive side effects.
 *
 * Prefer `flush: 'microtask'` (default) for DOM work; use `flush: 'sync'`
 * only for non-DOM logic where you need immediate execution.
 *
 * Returns a cleanup/dispose function.
 *
 * @example
 * const query = signal('');
 * watchEffect(() => {
 *   console.log('Searching for:', query.value);
 * });
 */
export function watchEffect(
  fn: () => void | (() => void),
  options: WatchEffectOptions = {}
): () => void {
  return options.flush === 'sync' ? effect(fn) : domEffect(fn);
}

// ─── asyncComputed ─────────────────────────────────────────────────────────────

export interface AsyncComputedResult<T> {
  /** Resolved value (null while loading or on error) */
  data: Signal<T | null>;
  /** True while the async function is running */
  loading: Signal<boolean>;
  /** Error thrown by the async function (null on success) */
  error: Signal<Error | null>;
}

/**
 * `asyncComputed` — a derived signal backed by an async function.
 *
 * Re-executes automatically whenever any signal accessed inside `fn` changes.
 * Handles in-flight request cancellation via an internal version counter so
 * that stale responses from previous runs are ignored.
 *
 * @example
 * const userId = signal(1);
 * const user = asyncComputed(async () => {
 *   const res = await fetch(`/api/users/${userId.value}`);
 *   return res.json();
 * });
 * // user.data.value, user.loading.value, user.error.value
 */
export function asyncComputed<T>(fn: () => Promise<T>): AsyncComputedResult<T> {
  const data    = signal<T | null>(null);
  const loading = signal<boolean>(true);
  const error   = signal<Error | null>(null);

  let version = 0;

  effect(() => {
    // Running fn() inside the effect registers all signal dependencies.
    // We capture the promise without awaiting here (effect must be synchronous).
    const currentVersion = ++version;
    loading.value = true;
    error.value   = null;

    // Kick off the async work outside the reactive tracking context
    const promise = untrack(fn);

    promise.then(
      (result) => {
        if (currentVersion !== version) return; // stale — discard
        data.value    = result;
        loading.value = false;
      },
      (err) => {
        if (currentVersion !== version) return;
        error.value   = err instanceof Error ? err : new Error(String(err));
        loading.value = false;
      }
    );
  });

  return { data, loading, error };
}

