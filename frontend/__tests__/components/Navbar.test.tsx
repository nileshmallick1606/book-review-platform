// __tests__/components/Navbar.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '../utils/test-utils';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import Navbar from '../../components/layout/Navbar';

// Mock Next.js router
const mockUseRouter = jest.fn().mockReturnValue({ pathname: '/' });
jest.mock('next/router', () => ({
  useRouter: () => mockUseRouter(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Import the useAuth hook directly 
import { useAuth } from '../../store/auth-context';

// Mock the auth context
jest.mock('../../store/auth-context', () => ({
  useAuth: jest.fn()
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation for unauthenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      logout: jest.fn(),
      user: null,
    });
  });
  
  test('renders logo and main navigation links', () => {
    render(<Navbar />);
    
    // Check for logo
    expect(screen.getByText('BookReview')).toBeTruthy();
    
    // Check for main nav links
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Books')).toBeTruthy();
  });
  
  test('renders login and register buttons when not authenticated', () => {
    render(<Navbar />);
    
    // Check for login and register buttons
    expect(screen.getByText('Login')).toBeTruthy();
    expect(screen.getByText('Register')).toBeTruthy();
    
    // Check that authenticated links are not present
    expect(screen.queryByText('Profile')).toBeNull();
    expect(screen.queryByText('Logout')).toBeNull();
  });
  
  test('renders profile and logout buttons when authenticated', () => {
    // Override the mock to return authenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      logout: jest.fn(),
      user: { id: 'user123', name: 'Test User' },
    });
    
    render(<Navbar />);
    
    // Check for profile and logout buttons
    expect(screen.getByText('Profile')).toBeTruthy();
    expect(screen.getByText('Logout')).toBeTruthy();
    
    // Check that unauthenticated links are not present
    expect(screen.queryByText('Login')).toBeNull();
    expect(screen.queryByText('Register')).toBeNull();
  });
  
  test('calls logout function when logout button is clicked', () => {
    const mockLogout = jest.fn();
    
    // Override the mock to return authenticated state with logout function
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      logout: mockLogout,
      user: { id: 'user123', name: 'Test User' },
    });
    
    render(<Navbar />);
    
    // Click the logout button
    fireEvent.click(screen.getByText('Logout'));
    
    // Check if logout function was called
    expect(mockLogout).toHaveBeenCalled();
  });
  
  test('highlights active link based on current route', () => {
    // Override the router mock to return a specific path
    mockUseRouter.mockReturnValue({
      pathname: '/books',
    });
    
    render(<Navbar />);
    
    // Get the Books link and check if it has the active class
    const booksLink = screen.getByText('Books').closest('a');
    expect(booksLink?.className).toContain('active');
    
    // Get the Home link and check that it doesn't have the active class
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink?.className).not.toContain('active');
  });
});
