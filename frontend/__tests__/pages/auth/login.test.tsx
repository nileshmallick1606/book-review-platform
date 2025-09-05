import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../../../pages/auth/login';
import { useAuth } from '../../../store/auth-context';
import { useRouter } from 'next/router';

// Mock the auth context
jest.mock('../../../store/auth-context', () => ({
  useAuth: jest.fn(),
}));

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock next/head
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid="head">{children}</div>;
    },
  };
});

// Mock next/link
jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => {
      return <a href={href} data-testid={`link-${href.replace(/\//g, '-')}`}>{children}</a>;
    },
  };
});

// Mock LoginForm component
jest.mock('../../../components/auth/LoginForm', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="login-form">Login Form</div>,
  };
});

describe('LoginPage', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should redirect to home if user is authenticated', () => {
    // Mock authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });

    // Mock router
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    render(<LoginPage />);

    // Verify redirect was triggered
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  test('should render login form if user is not authenticated', () => {
    // Mock unauthenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
    });

    // Mock router
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    render(<LoginPage />);

    // Check that login form is rendered
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    
    // Check that the register link is present
    expect(screen.getByTestId('link-/auth/register')).toBeInTheDocument();
    expect(screen.getByTestId('link-/auth/register')).toHaveTextContent('Register');
    
    // Check that head contains correct title
    expect(screen.getByTestId('head')).toHaveTextContent('Login - BookReview');
    
    // Check no redirect was attempted
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('should handle authentication state change', () => {
    // Start with unauthenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
    });

    // Mock router
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    const { rerender } = render(<LoginPage />);
    
    // Initially no redirect should happen
    expect(mockPush).not.toHaveBeenCalled();
    
    // Change to authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    
    // Re-render with new auth state
    rerender(<LoginPage />);
    
    // Verify redirect was triggered after auth state change
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  test('should render proper page structure and metadata', () => {
    // Mock unauthenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
    });

    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });

    render(<LoginPage />);
    
    // Check page structure
    expect(screen.getByTestId('head')).toBeInTheDocument();
    expect(screen.getByText('Login - BookReview')).toBeInTheDocument();
    expect(screen.getByText(/Login to BookReview platform/)).toBeInTheDocument();
    
    // Check auth container and links
    const authContainer = document.querySelector('.auth-container');
    expect(authContainer).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
  });
});
