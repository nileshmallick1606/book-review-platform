// __tests__/utils/test-utils.tsx
import React, { ReactElement } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Import the useAuth function and mock it
import { useAuth } from '../../store/auth-context';

// Make jest available globally for the tests
export { jest };

// Mock the auth context module
jest.mock('../../store/auth-context', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: null,
    loading: false,
    login: async () => {},
    register: async () => {},
    logout: jest.fn(),
    isAuthenticated: false
  })
}));

// Define a custom render function without additional providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  route?: string;
};

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { route, ...renderOptions } = options;

  // Set up window.location for route testing if needed
  if (route) {
    Object.defineProperty(window, 'location', {
      value: {
        href: route,
        pathname: new URL(route, 'http://localhost').pathname
      },
      writable: true
    });
  }

  // Set up user event
  const user = userEvent.setup();

  return {
    user,
    ...rtlRender(ui, { wrapper: AllTheProviders, ...renderOptions }),
  };
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { screen, fireEvent, waitFor };

// Override render method
export { customRender as render };

// Export expect and test utilities
export { expect, describe, test, it } from '@jest/globals';
