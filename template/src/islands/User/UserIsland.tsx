import { signal } from '@nova/signals';
import { registerIsland } from '@nova/islands';
import './UserIsland.scss?inline';

export function UserIsland() {
  const count = signal(0, 'user-count');

  return (
    <div class="user-island" data-island="userisland">
      <h3>User Island</h3>
      <p>This is an auto-generated high-performance hydrated island.</p>
      <div style="margin: 15px 0;">
        <button class="n-btn n-btn--primary" onClick={() => count.value++}>
          Count: {() => count.value}
        </button>
      </div>
    </div>
  );
}

// Register island for dynamic client-side hydration
registerIsland('userisland', () => Promise.resolve({ default: UserIsland }));
