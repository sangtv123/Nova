import { render } from '@nova/runtime';
import { router } from '@nova/router';
import { mountIslands } from '@nova/islands';
import { initDevTools } from '@nova/devtools';

// In a real Nova app, these would be automatically resolved
// For this scaffolding, we explicitly import the layout and start routing.
import { App } from './App';

// Initialize DevTools to monitor reactivity, islands and performance
initDevTools();

const root = document.getElementById('app');

if (root) {
  render(<App />, root);

  // Initialize router and islands
  router.init();
  mountIslands();
}
