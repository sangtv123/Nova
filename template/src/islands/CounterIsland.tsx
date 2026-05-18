import { signal } from '@nova/signals';
import { registerIsland } from '@nova/islands';
import { useCounterStore } from '../store.js';

export function CounterIsland({ initialCount = 0 }: { initialCount?: number }) {
  const localCount = signal(initialCount, 'local-counter');
  const store = useCounterStore();

  return (
    <div class="interactive-island" data-island="counter">
      <h3>Interactive Signals & Store Demo</h3>
      <p class="island-desc">This island demonstrates both fine-grained Local Signals and a Centralized Store with persistence and Time Travel.</p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0;">
        {/* Local Signals Side */}
        <div style="padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px;">
          <h4 style="margin: 0 0 8px 0; color: #10b981; font-size: 0.9rem;">🟢 Local Signal State</h4>
          <div style="font-size: 28px; font-weight: bold; font-family: monospace; color: #10b981; margin: 10px 0;">
            {() => localCount.value}
          </div>
          <div class="btn-group" style="display: flex; gap: 6px;">
            <button class="btn primary" style="padding: 6px 12px; cursor: pointer;" onClick={() => localCount.value++}>+</button>
            <button class="btn secondary" style="padding: 6px 12px; cursor: pointer;" onClick={() => localCount.value--}>-</button>
            <button class="btn reset" style="padding: 6px 10px; cursor: pointer; font-size: 11px;" onClick={() => localCount.value = 0}>Reset</button>
          </div>
        </div>

        {/* Global Store Side */}
        <div style="padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px;">
          <h4 style="margin: 0 0 8px 0; color: #06b6d4; font-size: 0.9rem;">🔵 Centralized Store</h4>
          <div style="font-size: 20px; font-weight: bold; font-family: monospace; color: #06b6d4; margin: 8px 0;">
            Count: {() => store.count}
          </div>
          <div style="font-size: 12px; color: #94a3b8; margin: 4px 0;">
            Double: {() => store.doubleCount}
          </div>
          <div style="font-size: 12px; color: #f8fafc; margin: 4px 0; font-weight: 500;">
            User: {() => store.userName}
          </div>
          <div class="btn-group" style="display: flex; gap: 6px; margin-top: 10px;">
            <button class="btn primary" style="padding: 4px 10px; cursor: pointer;" onClick={() => store.increment()}>+</button>
            <button class="btn secondary" style="padding: 4px 10px; cursor: pointer;" onClick={() => store.decrement()}>-</button>
            <button class="btn" style="padding: 4px 8px; font-size: 10px; cursor: pointer;" onClick={() => {
              const name = prompt('Change User Name:', store.userName);
              if (name !== null) store.updateUserName(name);
            }}>Edit</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Register for client-side hydration
registerIsland('counter', () => Promise.resolve({ default: CounterIsland }));
