import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfilePage from '../../../pages/profile/index';
import { useAuth } from '../../../store';

// Mock useAuth
jest.mock('../../../store', () => ({
  useAuth: jest.fn(),
}));

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock Layout component
jest.mock('../../../components/layout/Layout', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
  };
});

// Mock UserProfile component
jest.mock('../../../components/auth/UserProfile', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="user-profile">User Profile Content</div>,
  };
});

describe('ProfilePage', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should show loading state when authentication is in progress', () => {
    // Mock auth context in loading state
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    render(<ProfilePage />);
    
    // Check loading state is displayed
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByTestId('user-profile')).not.toBeInTheDocument();
  });

  test('should redirect to login when user is not authenticated', () => {
    // Mock unauthenticated state
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });

    // Mock router
    const mockPush = jest.fn();
    const useRouterMock = jest.requireMock('next/router').useRouter;
    useRouterMock.mockReturnValue({
      push: mockPush,
    });

    render(<ProfilePage />);
    
    // Should not render profile or loading state
    expect(screen.queryByTestId('user-profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    
    // Should attempt to redirect
    expect(mockPush).toHaveBeenCalledWith('/auth/login?returnUrl=/profile');
  });

  test('should render UserProfile when user is authenticated', () => {
    // Mock authenticated state with a user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '123', name: 'Test User', email: 'test@example.com' },
      loading: false,
    });

    render(<ProfilePage />);
    
    // Should render the user profile
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('user-profile')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  test('should update UI when authentication state changes from loading to unauthenticated', async () => {
    // Set up mock router
    const mockPush = jest.fn();
    const useRouterMock = jest.requireMock('next/router').useRouter;
    useRouterMock.mockReturnValue({
      push: mockPush,
    });

    // Initially mock loading state
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });
    
    // Start with loading state
    const { rerender } = render(<ProfilePage />);
    
    // Should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Now change to unauthenticated state
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });
    
    // Re-render with new state
    rerender(<ProfilePage />);
    
    // Should trigger redirect
    expect(mockPush).toHaveBeenCalledWith('/auth/login?returnUrl=/profile');
  });

  test('should update UI when authentication state changes from loading to authenticated', () => {
    // Initially mock loading state
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });
    
    // Start with loading state
    const { rerender } = render(<ProfilePage />);
    
    // Should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Now change to authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '123', name: 'Test User', email: 'test@example.com' },
      loading: false,
    });
    
    // Re-render with new state
    rerender(<ProfilePage />);
    
    // Should show user profile
    expect(screen.getByTestId('user-profile')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
  
  test('should handle unmounting and cleanup', () => {
    // Setup spy on React.useEffect
    const useEffectSpy = jest.spyOn(React, 'useEffect');
    
    // Initially mock loading state
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });
    
    // Mock router
    const mockPush = jest.fn();
    const useRouterMock = jest.requireMock('next/router').useRouter;
    useRouterMock.mockReturnValue({
      push: mockPush,
    });

    const { unmount } = render(<ProfilePage />);
    
    // Unmount the component
    unmount();
    
    // Verify useEffect was called
    expect(useEffectSpy).toHaveBeenCalled();
    
    // Clean up spy
    useEffectSpy.mockRestore();
  });
});
