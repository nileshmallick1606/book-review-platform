// __tests__/store/auth-context.test.tsx
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../store/auth-context';
import { server } from '../mocks/msw-server';
import api from '../../services/api';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock axios interceptors
jest.mock('../../services/api', () => {
  return {
    defaults: {
      headers: {
        common: {}
      }
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  };
});

// Test component that uses auth context
const TestComponent = () => {
  const { user, loading, isAuthenticated, login, register, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="loading-state">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="auth-state">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button onClick={() => login('test@example.com', 'password')} data-testid="login-button">
        Login
      </button>
      <button 
        onClick={() => register('Test User', 'new@example.com', 'password')} 
        data-testid="register-button"
      >
        Register
      </button>
      <button onClick={() => logout()} data-testid="logout-button">
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage between tests
    localStorage.clear();
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset API headers
    api.defaults.headers.common = {};
  });
  
  test('provides initial loading state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
  });
  
  test('initializes in unauthenticated state with no token', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for the initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
    expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
  });
  
  test('automatically authenticates with valid token in localStorage', async () => {
    // Setup localStorage with token
    localStorage.setItem('token', 'mock-jwt-token');
    
    // Mock API response
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com'
        }
      }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for the authentication check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    expect(api.defaults.headers.common['Authorization']).toBe('Bearer mock-jwt-token');
  });
  
  test('clears token when authentication check fails', async () => {
    // Setup localStorage with token
    localStorage.setItem('token', 'invalid-token');
    
    // Mock API error response
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('Invalid token'));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for the authentication check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(localStorage.getItem('token')).toBeNull();
    expect(api.defaults.headers.common['Authorization']).toBe('');
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
  });
  
  test('login function authenticates the user successfully', async () => {
    // Mock API response
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: {
        token: 'mock-jwt-token',
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com'
        }
      }
    });
    
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    // Trigger login
    await user.click(screen.getByTestId('login-button'));
    
    // Verify API was called correctly
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password'
      });
    });
    
    // Verify authentication state updates
    expect(localStorage.getItem('token')).toBe('mock-jwt-token');
    expect(api.defaults.headers.common['Authorization']).toBe('Bearer mock-jwt-token');
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
  });
  
  test('login function handles errors correctly', async () => {
    // Mock API error response
    const errorResponse = {
      response: {
        data: { message: 'Invalid credentials' }
      }
    };
    (api.post as jest.Mock).mockRejectedValueOnce(errorResponse);
    
    // Create a test wrapper component to catch error
    const TestLoginErrorComponent = () => {
      const { login } = useAuth();
      const [error, setError] = React.useState<string | null>(null);
      
      const handleLogin = async () => {
        try {
          await login('wrong@example.com', 'wrongpassword');
        } catch (err: any) {
          setError(err.message);
        }
      };
      
      return (
        <div>
          <button onClick={handleLogin} data-testid="login-button">Login</button>
          {error && <div data-testid="error-message">{error}</div>}
        </div>
      );
    };
    
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestLoginErrorComponent />
      </AuthProvider>
    );
    
    // Trigger login
    await user.click(screen.getByTestId('login-button'));
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    
    // Verify error handling
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'wrong@example.com',
      password: 'wrongpassword'
    });
    expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials');
    expect(localStorage.getItem('token')).toBeNull();
  });
  
  test('register function creates a new user account', async () => {
    // Mock API response
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: {
        token: 'mock-jwt-token',
        user: {
          id: 'user-2',
          name: 'New User',
          email: 'new@example.com'
        }
      }
    });
    
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    // Trigger register
    await user.click(screen.getByTestId('register-button'));
    
    // Verify API was called correctly
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Test User',
        email: 'new@example.com',
        password: 'password'
      });
    });
    
    // Verify authentication state updates
    expect(localStorage.getItem('token')).toBe('mock-jwt-token');
    expect(api.defaults.headers.common['Authorization']).toBe('Bearer mock-jwt-token');
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-email')).toHaveTextContent('new@example.com');
  });
  
  test('register function handles errors correctly', async () => {
    // Mock API error response
    const errorResponse = {
      response: {
        data: { message: 'User with this email already exists' }
      }
    };
    (api.post as jest.Mock).mockRejectedValueOnce(errorResponse);
    
    // Create a test wrapper component to catch error
    const TestRegisterErrorComponent = () => {
      const { register } = useAuth();
      const [error, setError] = React.useState<string | null>(null);
      
      const handleRegister = async () => {
        try {
          await register('Test User', 'existing@example.com', 'password');
        } catch (err: any) {
          setError(err.message);
        }
      };
      
      return (
        <div>
          <button onClick={handleRegister} data-testid="register-button">Register</button>
          {error && <div data-testid="error-message">{error}</div>}
        </div>
      );
    };
    
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestRegisterErrorComponent />
      </AuthProvider>
    );
    
    // Trigger register
    await user.click(screen.getByTestId('register-button'));
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    
    // Verify error handling
    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Test User',
      email: 'existing@example.com',
      password: 'password'
    });
    expect(screen.getByTestId('error-message')).toHaveTextContent('User with this email already exists');
    expect(localStorage.getItem('token')).toBeNull();
  });
  
  test('logout function clears authentication state', async () => {
    // Set up an authenticated state first
    localStorage.setItem('token', 'mock-jwt-token');
    api.defaults.headers.common['Authorization'] = 'Bearer mock-jwt-token';
    
    // Mock API response for initial auth check
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com'
        }
      }
    });
    
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for authentication to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
    });
    
    // Save a copy of the localStorage.removeItem function
    const originalRemoveItem = localStorage.removeItem;
    
    // Spy on localStorage.removeItem to verify it's called
    localStorage.removeItem = jest.fn();
    
    // Trigger logout
    await user.click(screen.getByTestId('logout-button'));
    
    // Verify authentication state is cleared
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(api.defaults.headers.common['Authorization']).toBe('');
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
    expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    
    // Restore original removeItem function
    localStorage.removeItem = originalRemoveItem;
  });
  
  test('handles network errors during initial authentication check', async () => {
    // Setup localStorage with token
    localStorage.setItem('token', 'mock-jwt-token');
    
    // Mock network error
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for the authentication check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    // Verify token is cleared and user is not authenticated
    expect(localStorage.getItem('token')).toBeNull();
    expect(api.defaults.headers.common['Authorization']).toBe('');
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
  });
  
  test('handles generic error in login without response data', async () => {
    // Mock API error with no response data
    (api.post as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));
    
    // Create a test wrapper component to catch error
    const TestLoginErrorComponent = () => {
      const { login } = useAuth();
      const [error, setError] = React.useState<string | null>(null);
      
      const handleLogin = async () => {
        try {
          await login('test@example.com', 'password');
        } catch (err: any) {
          setError(err.message);
        }
      };
      
      return (
        <div>
          <button onClick={handleLogin} data-testid="login-button">Login</button>
          {error && <div data-testid="error-message">{error}</div>}
        </div>
      );
    };
    
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestLoginErrorComponent />
      </AuthProvider>
    );
    
    // Trigger login
    await user.click(screen.getByTestId('login-button'));
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    
    // Verify generic error message
    expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to login. Please try again.');
  });
  
  test('handles generic error in register without response data', async () => {
    // Mock API error with no response data
    (api.post as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));
    
    // Create a test wrapper component to catch error
    const TestRegisterErrorComponent = () => {
      const { register } = useAuth();
      const [error, setError] = React.useState<string | null>(null);
      
      const handleRegister = async () => {
        try {
          await register('Test User', 'new@example.com', 'password');
        } catch (err: any) {
          setError(err.message);
        }
      };
      
      return (
        <div>
          <button onClick={handleRegister} data-testid="register-button">Register</button>
          {error && <div data-testid="error-message">{error}</div>}
        </div>
      );
    };
    
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestRegisterErrorComponent />
      </AuthProvider>
    );
    
    // Trigger register
    await user.click(screen.getByTestId('register-button'));
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    
    // Verify generic error message
    expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to register. Please try again.');
  });
  
  test('useAuth hook returns context values when used outside AuthProvider', () => {
    // Silence React errors in console
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Create a test component that uses useAuth outside of AuthProvider
    const TestComponent = () => {
      const auth = useAuth();
      // Default values from context creation
      expect(auth).toEqual({
        user: null,
        loading: true,
        login: expect.any(Function),
        register: expect.any(Function),
        logout: expect.any(Function),
        isAuthenticated: false
      });
      return <div>Default context values</div>;
    };
    
    // Render without provider should use default context
    render(<TestComponent />);
    
    // Restore console.error
    consoleError.mockRestore();
  });
});
