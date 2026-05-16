import { Layout } from './components/Layout';
import { IndexPage } from './pages/index';
import { AboutPage } from './pages/about';
import { router } from '@nova/router';
import { signal, effect } from '@nova/signals';

export function App() {
  const currentPath = signal(window.location.pathname);

  // Sync with router changes
  effect(() => {
    router.subscribe((match) => {
      if (match?.route.path) {
        currentPath.value = match.route.path;
      }
    });
  });

  return (
    <Layout>
      {/* Mock routing rendering */}
      {() => {
        if (currentPath.value === '/') return <IndexPage />;
        if (currentPath.value === '/about') return <AboutPage />;
        return <div class="not-found"><h2>404 - Page Not Found</h2></div>;
      }}
    </Layout>
  );
}
