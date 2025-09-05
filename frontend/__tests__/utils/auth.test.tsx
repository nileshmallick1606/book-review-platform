// __tests__/utils/auth.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAuth } from '../../store/auth-context';
import { useRouter } from 'next/router';
import { requireAuth } from '../../utils/auth';

// Mock the next/router module
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

// Mock the auth-context module
jest.mock('../../store/auth-context', () => ({
  useAuth: jest.fn()
}));

describe('requireAuth HOC', () => {
  // Setup mock component
  const mockRouterReplace = jest.fn();
  const MockComponent = () => <div data-testid="protected-content">Protected Content</div>;
  const ProtectedComponent = requireAuth(MockComponent);

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default router mock
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockRouterReplace,
      asPath: '/protected-route'
    });
  });

  test('should show loading state when authentication is loading', () => {
    // Mock auth context in loading state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loading: true
    });

    render(<ProtectedComponent />);
    
    // Check that loading state is rendered
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
    
    // Check that protected content is not rendered
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    
    // Check that no redirect happened
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  test('should redirect to login page when user is not authenticated', () => {
    // Mock auth context for unauthenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loading: false
    });

    render(<ProtectedComponent />);
    
    // Check that loading state is rendered (because we're not authenticated)
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Check that protected content is not rendered
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    
    // Check that redirect happened with correct parameters
    expect(mockRouterReplace).toHaveBeenCalledWith({
      pathname: '/auth/login',
      query: { returnUrl: '/protected-route' }
    });
  });

  test('should render protected component when user is authenticated', () => {
    // Mock auth context for authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false
    });

    render(<ProtectedComponent />);
    
    // Check that protected content is rendered
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    
    // Check that loading state is not rendered
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(document.querySelector('.loading-spinner')).not.toBeInTheDocument();
    
    // Check that no redirect happened
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  test('should pass props correctly to the wrapped component', () => {
    // Setup test props
    const testProps = { testProp: 'test-value' };
    
    // Create a component that will display the props
    const PropDisplayComponent = (props: any) => (
      <div data-testid="prop-display">{props.testProp}</div>
    );
    
    const ProtectedPropComponent = requireAuth(PropDisplayComponent);
    
    // Mock auth context for authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false
    });

    render(<ProtectedPropComponent testProp="test-value" />);
    
    // Check that props are passed correctly
    expect(screen.getByTestId('prop-display')).toHaveTextContent('test-value');
  });

  test('should redirect when auth state changes to unauthenticated', () => {
    // Mock auth context for unauthenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loading: false
    });

    render(<ProtectedComponent />);
    
    // Instead of testing the useEffect call directly (which is an implementation detail),
    // we'll test the outcome of the effect - that the router.replace was called
    expect(mockRouterReplace).toHaveBeenCalledWith({
      pathname: '/auth/login',
      query: { returnUrl: '/protected-route' }
    });
  });
});
