import { render } from '@nova/runtime';
import { router } from '@nova/router';
import { mountIslands } from '@nova/islands';
// In a real Nova app, these would be automatically resolved
// For this scaffolding, we explicitly import the layout and start routing.
import { App } from './App';

const root = document.getElementById('app');

if (root) {
  render(<App />, root);

  // Initialize router and islands
  router.init();
  mountIslands();
}
