// __tests__/utils/auth-test-utils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import AuthProvider, { useAuth } from '../../store/auth-context';
import { User } from '../../types';

// Mock authentication context values
export interface MockAuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Helper for creating mock auth context value
export const createMockAuthValue = (isAuthenticated = true): MockAuthContextValue => {
  const user = isAuthenticated ? {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    favorites: []
  } : null;
  
  return {
    user,
    loading: false,
    isAuthenticated: !!user,
    login: async () => Promise.resolve(),
    register: async () => Promise.resolve(),
    logout: () => {},
  };
};

// Mock localStorage for auth tests
export const setupAuthLocalStorageMock = (isAuthenticated = true) => {
  const localStorageMock = {
    getItem: (key: string) => {
      if (key === 'token' && isAuthenticated) {
        return 'mock-jwt-token';
      }
      return null;
    },
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: isAuthenticated ? 1 : 0,
    key: () => null
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });

  return localStorageMock;
};

// Create a custom render function for authenticated components
export const renderWithAuth = (
  ui: ReactElement,
  { 
    isAuthenticated = true, 
    authValue,
    ...options 
  }: { 
    isAuthenticated?: boolean;
    authValue?: Partial<MockAuthContextValue>;
  } & Omit<RenderOptions, 'wrapper'> = {}
) => {
  // Setup localStorage mock
  const localStorageMock = setupAuthLocalStorageMock(isAuthenticated);
  
  // Create auth value - either use provided one or create a default
  const mockAuthValue = {
    ...createMockAuthValue(isAuthenticated),
    ...authValue
  };
  
  // Create wrapper with mocked auth context
  const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => {
    // Use the actual AuthProvider which will read our mocked localStorage
    return (
      <AuthProvider>
        {children}
      </AuthProvider>
    );
  };
  
  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    // Return mock objects for assertions
    mocks: {
      localStorage: localStorageMock,
      authContext: mockAuthValue
    }
  };
};

// Helper to test protected routes
export const mockRouter = {
  push: async () => true,
  replace: async () => true,
  prefetch: async () => undefined,
  back: () => {},
  pathname: '/protected',
  asPath: '/protected',
  query: {},
  events: {
    on: () => {},
    off: () => {},
    emit: () => {}
  },
  isFallback: false,
};

// Remember to add this in your test file:
// jest.mock('next/router', () => ({
//   useRouter: () => mockRouter
// }));
