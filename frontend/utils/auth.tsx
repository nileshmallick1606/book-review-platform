import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../store/auth-context';

/**
 * Higher-order component that requires authentication
 * Redirects to login page if user is not authenticated
 * 
 * @param Component - Component to wrap
 * @returns Protected component
 */
export function requireAuth<T extends Record<string, unknown>>(Component: React.ComponentType<T>): React.FC<T> {
  return function ProtectedRoute(props: T) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      // Redirect to login if not authenticated and not loading
      if (!isAuthenticated && !loading) {
        router.replace({
          pathname: '/auth/login',
          query: { returnUrl: router.asPath }
        });
      }
    }, [isAuthenticated, loading, router]);
    
    // Show nothing while checking authentication
    if (loading || !isAuthenticated) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      );
    }
    
    // Render the protected component if authenticated
    return <Component {...props} />;
  };
}
