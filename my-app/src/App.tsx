import { Layout } from './components/Layout';
import { router } from '@nova/router';
import { signal, effect } from '@nova/signals';

export function App() {
  const currentMatch = signal(router.getCurrentMatch());
  const isReady = signal(!!router.getCurrentMatch());

  // Sync with router changes
  effect(() => {
    return router.subscribe((match) => {
      currentMatch.value = match;
      isReady.value = true;
    });
  });

  return (
    <Layout>
      {() => {
        if (!isReady.value) {
          return <div class="loading-route"></div>; // Prevents 404 flash during initial load
        }

        const match = currentMatch.value;
        if (!match || !match.component) {
          return <div class="not-found"><h2>404 - Page Not Found</h2></div>;
        }
        
        const Page = match.component;
        return <Page data={match.data} />;
      }}
    </Layout>
  );
}
