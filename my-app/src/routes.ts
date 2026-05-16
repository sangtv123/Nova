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
  // Register custom route for Admin
  router.registerRoute('pages/admin.tsx', () => import('./pages/admin'), [], {
    canActivate: [authGuard],
    resolve: { 
      config: configResolver 
    }
  });
  
  // You can add more manual route registrations here
}
