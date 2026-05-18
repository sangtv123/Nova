import { signal, computed, Signal } from '@nova/signals';

// Global registry of active stores
const activeStores = new Map<string, any>();
const globalMutationsHistory: Array<{
  storeId: string;
  actionName: string;
  args: any[];
  timestamp: number;
  snapshot: Record<string, any>;
}> = [];

/**
 * Define a centralized state management store (Pinia-inspired)
 * Every state property is backed by an optimized reactive Signal.
 */
export function defineStore<
  Id extends string,
  S extends Record<string, any>,
  G extends Record<string, (state: any) => any>,
  A extends Record<string, (...args: any[]) => any>
>(
  id: Id,
  options: {
    state: () => S;
    getters?: G;
    actions?: A;
    persist?: boolean;
  }
) {
  return function useStore() {
    if (activeStores.has(id)) {
      return activeStores.get(id);
    }

    const rawState = options.state();
    const storeState: Record<string, Signal<any>> = {};

    // Restore from localStorage if persist is enabled
    let persistedData: Record<string, any> = {};
    if (options.persist && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`nova_store_${id}`);
        if (saved) {
          persistedData = JSON.parse(saved);
        }
      } catch (e) {
        console.error(`[nova/store] Failed to restore persisted store "${id}":`, e);
      }
    }

    // Convert every state property into a signal
    for (const [key, initialVal] of Object.entries(rawState)) {
      const val = key in persistedData ? persistedData[key] : initialVal;
      // We label the signal so DevTools knows it's a store state property!
      storeState[key] = signal(val, `store.${id}.${key}`);
    }

    // Define getters as computed properties
    const storeGetters: Record<string, Signal<any>> = {};
    if (options.getters) {
      for (const [key, getterFn] of Object.entries(options.getters)) {
        // Create computed signal with store state object proxy passed in
        const proxyState = new Proxy({}, {
          get(_, prop: string) {
            return storeState[prop]?.value;
          }
        });
        storeGetters[key] = computed(() => getterFn(proxyState), `store.${id}.getter.${key}`);
      }
    }

    // Function to record mutation snapshot
    const recordMutation = (actionName: string, args: any[]) => {
      const snapshot: Record<string, any> = {};
      for (const [key, sig] of Object.entries(storeState)) {
        snapshot[key] = sig.peek();
      }
      
      const mutation = {
        storeId: id,
        actionName,
        args,
        timestamp: Date.now(),
        snapshot
      };

      globalMutationsHistory.push(mutation);

      if (typeof window !== 'undefined') {
        const history = (window as any).__NOVA_MUTATIONS_HISTORY__ || [];
        history.push(mutation);
        (window as any).__NOVA_MUTATIONS_HISTORY__ = history;

        if ((window as any).__NOVA_DEVTOOLS_HOOK__?.onMutationRecorded) {
          (window as any).__NOVA_DEVTOOLS_HOOK__.onMutationRecorded(mutation);
        }
      }

      // Persist if needed
      if (options.persist) {
        try {
          localStorage.setItem(`nova_store_${id}`, JSON.stringify(snapshot));
        } catch (e) {
          console.error(`[nova/store] Failed to persist store "${id}":`, e);
        }
      }
    };

    // Define actions with interception
    const storeActions: Record<string, (...args: any[]) => any> = {};
    if (options.actions) {
      for (const [key, actionFn] of Object.entries(options.actions)) {
        storeActions[key] = function (...args: any[]) {
          // Bind `this` to the store proxy so action can access this.myState or this.anotherAction
          const result = actionFn.apply(storeInstance, args);
          
          // Record mutation after synchronous execution
          recordMutation(key, args);
          
          return result;
        };
      }
    }

    // Create the store instance proxy
    const storeInstance: any = new Proxy({}, {
      get(_, prop: string) {
        // 1. Check if state property
        if (prop in storeState) {
          return storeState[prop].value;
        }
        // 2. Check if getter
        if (prop in storeGetters) {
          return storeGetters[prop].value;
        }
        // 3. Check if action
        if (prop in storeActions) {
          return storeActions[prop];
        }
        // 4. Special properties
        if (prop === '$id') return id;
        if (prop === '$rawState') return storeState;
        if (prop === '$reset') {
          return () => {
            for (const [key, initialVal] of Object.entries(rawState)) {
              storeState[key].value = initialVal;
            }
            recordMutation('$reset', []);
          };
        }
        if (prop === '$patch') {
          return (patch: any) => {
            if (typeof patch === 'function') {
              patch(storeInstance);
            } else {
              for (const [key, val] of Object.entries(patch)) {
                if (key in storeState) {
                  storeState[key].value = val;
                }
              }
            }
            recordMutation('$patch', [patch]);
          };
        }
        return undefined;
      },
      set(_, prop: string, val: any) {
        // Direct mutation: count.value = newValue
        if (prop in storeState) {
          storeState[prop].value = val;
          recordMutation('$direct_mutation', [prop, val]);
          return true;
        }
        return false;
      }
    });

    activeStores.set(id, storeInstance);

    // Register store globally for DevTools
    if (typeof window !== 'undefined') {
      const stores = (window as any).__NOVA_STORES__ || new Map();
      (window as any).__NOVA_STORES__ = stores;
      stores.set(id, storeInstance);
      
      const history = (window as any).__NOVA_MUTATIONS_HISTORY__ || [];
      (window as any).__NOVA_MUTATIONS_HISTORY__ = history;

      if ((window as any).__NOVA_DEVTOOLS_HOOK__?.onStoreCreated) {
        (window as any).__NOVA_DEVTOOLS_HOOK__.onStoreCreated(storeInstance);
      }
    }

    return storeInstance;
  };
}

// Clean up stores helper
export function getActiveStores() {
  return activeStores;
}

export function getMutationsHistory() {
  return globalMutationsHistory;
}
