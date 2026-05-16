import { IndexPage } from './pages/index';
import { AboutPage } from './pages/about';
import { AdminPage } from './pages/admin';
import { PostsPage } from './pages/posts';
import { Layout } from './components/Layout';
import { router } from '@nova/router';
import { signal, effect } from '@nova/signals';

type PageComponent = () => JSX.Element;

const PAGES: Record<string, PageComponent> = {
  '/': IndexPage as PageComponent,
  '/about': AboutPage as PageComponent,
  '/admin': AdminPage as PageComponent,
  '/posts': PostsPage as PageComponent,
};

export function App() {
  const currentPath = signal(window.location.pathname);

  // Sync with router changes
  effect(() => {
    return router.subscribe((match) => {
      if (match?.route.path) {
        currentPath.value = match.route.path;
      }
    });
  });


  return (
    <Layout>
      {() => {
        const Page = PAGES[currentPath.value];
        if (!Page) return <div class="not-found"><h2>404 - Page Not Found</h2></div>;
        
        return <Page />;
      }}
    </Layout>
  );
}
