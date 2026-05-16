import { signal } from '@nova/signals';
import { registerIsland } from '@nova/islands';

export function CounterIsland({ initialCount = 0 }: { initialCount?: number }) {
  const count = signal(initialCount);

  return (
    <div class="interactive-island" data-island="counter">
      <h3>Interactive Signals Demo</h3>
      <p class="island-desc">This component is isolated and hydrated independently.</p>
      
      <div class="counter-display">{() => count.value}</div>
      
      <div class="btn-group">
        <button class="btn primary" onClick={() => count.value++}>Increment</button>
        <button class="btn secondary" onClick={() => count.value--}>Decrement</button>
        <button class="btn reset" onClick={() => count.value = 0}>Reset</button>
      </div>
    </div>
  );
}

// Register for client-side hydration
registerIsland('counter', () => Promise.resolve({ default: CounterIsland }));
