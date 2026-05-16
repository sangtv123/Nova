import { router } from '@nova/router';

/**
 * Guards
 */
export const authGuard = () => {
  const isLogged = localStorage.getItem('isLogged');
  if (!isLogged) {
    alert('Access Denied! Please "log in" via console by typing: localStorage.setItem("isLogged", "true")');
    return '/'; // Redirect to home
  }
  return true;
};

/**
 * Resolvers
 */
export const configResolver = async () => {
  // Simulate API fetch
  return { 
    siteName: 'Nova Admin', 
    version: '1.0.0', 
    theme: 'dark',
    timestamp: new Date().toISOString()
  };
};

/**
 * Route Configuration
 */
export function setupRoutes() {
  // Register routes metadata
  router.registerRoute('/', null as any, []);
  router.registerRoute('/about', null as any, []);
  router.registerRoute('/posts', null as any, []);
  
  router.registerRoute('/admin', null as any, [], {
    canActivate: [authGuard],
    resolve: { 
      config: configResolver 
    }
  });
}
