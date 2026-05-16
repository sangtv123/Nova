import { router } from '@nova/router';

/**
 * Guards
 */
export const authGuard = () => {
  const token = localStorage.getItem('nova_token');
  if (!token) {
    window.dispatchEvent(new CustomEvent('nova:unauthorized'));
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
