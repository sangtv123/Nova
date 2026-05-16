import { signal } from '@nova/signals';
import { registerIsland } from '@nova/islands';
import { useMotion, easing } from '@nova/motion';

export function CounterIsland({ initialCount = 0 }: { initialCount?: number }) {
  const count = signal(initialCount);
  
  // Create a motion signal that follows 'count' with an elastic effect
  const animatedCount = useMotion(count, { 
    duration: 600, 
    easing: easing.elastic 
  });

  return (
    <div class="interactive-island" data-island="counter">
      <h3>Interactive Signals Demo</h3>
      <p class="island-desc">Now enhanced with 60fps Motion Signals!</p>
      
      <div class="counter-display">{() => Math.round(animatedCount.value)}</div>
      
      <div class="btn-group">
        <button class="btn primary" onClick={() => count.value++}>Increment</button>
        <button class="btn secondary" onClick={() => count.value--}>Decrement</button>
        <button class="btn reset" onClick={() => count.value = 0}>Reset</button>
      </div>
    </div>
  );
}

// Register for client-side hydration
registerIsland('counter', CounterIsland);
