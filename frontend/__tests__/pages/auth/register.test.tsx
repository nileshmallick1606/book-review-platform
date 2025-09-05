import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegisterPage from '../../../pages/auth/register';
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

// Mock RegisterForm component
jest.mock('../../../components/auth/RegisterForm', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="register-form">Register Form</div>,
  };
});

describe('RegisterPage', () => {
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

    render(<RegisterPage />);

    // Verify redirect was triggered
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  test('should render registration form if user is not authenticated', () => {
    // Mock unauthenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
    });

    // Mock router
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    render(<RegisterPage />);

    // Check that register form is rendered
    expect(screen.getByTestId('register-form')).toBeInTheDocument();
    
    // Check that the login link is present
    expect(screen.getByTestId('link-/auth/login')).toBeInTheDocument();
    expect(screen.getByTestId('link-/auth/login')).toHaveTextContent('Login');
    
    // Check that head contains correct title
    expect(screen.getByTestId('head')).toHaveTextContent('Register - BookReview');
    
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

    const { rerender } = render(<RegisterPage />);
    
    // Initially no redirect should happen
    expect(mockPush).not.toHaveBeenCalled();
    
    // Change to authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
    });
    
    // Re-render with new auth state
    rerender(<RegisterPage />);
    
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

    render(<RegisterPage />);
    
    // Check page structure
    expect(screen.getByTestId('head')).toBeInTheDocument();
    expect(screen.getByText('Register - BookReview')).toBeInTheDocument();
    expect(screen.getByText(/Create a new account on BookReview platform/)).toBeInTheDocument();
    
    // Check auth container and links
    const authContainer = document.querySelector('.auth-container');
    expect(authContainer).toBeInTheDocument();
    expect(screen.getByText("Already have an account?")).toBeInTheDocument();
  });
});
