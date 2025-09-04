// __tests__/components/auth/LoginForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import LoginForm from '../../../components/auth/LoginForm';
import { useAuth } from '../../../store';
import { useRouter } from 'next/router';

// Mock the auth context and Next.js router
jest.mock('../../../store', () => ({
  useAuth: jest.fn()
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

describe('LoginForm Component', () => {
  // Setup properly typed mocks
  const mockLogin = jest.fn(() => Promise.resolve());
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin
    });
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    });
  });

  test('renders the login form correctly', () => {
    render(<LoginForm />);
    
    // Check form elements
    expect(screen.getByRole('heading', { name: 'Login' })).toBeTruthy();
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/password/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Login' })).toBeTruthy();
    
    // Error message should not be visible initially
    expect(screen.queryByText(/failed to login/i)).toBeNull();
  });

  test('shows validation error when form is submitted without data', async () => {
    const { container } = render(<LoginForm />);
    
    // Get the form directly since it might not have a role
    const form = container.querySelector('form');
    if (!form) throw new Error('Form not found');
    
    // Prevent default form behavior to allow our validation logic to run
    fireEvent.submit(form);
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByText(/please enter both email and password/i, { exact: false })).toBeTruthy();
    });
    
    // Login function should not have been called
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('calls login function and redirects on successful login', async () => {
    // Configure mock to resolve successfully
    mockLogin.mockResolvedValueOnce();
    
    render(<LoginForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    
    // Button should show loading state
    expect(screen.getByRole('button', { name: 'Logging in...' })).toBeTruthy();
    
    // Login should be called with correct credentials
    expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123');
    
    // Wait for the redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  test('shows error message when login fails', async () => {
    // Configure mock to reject with an error
    mockLogin.mockImplementationOnce(() => Promise.reject(new Error('Invalid credentials')));
    
    render(<LoginForm />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong-password' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeTruthy();
    });
    
    // Login button should be enabled again after error
    const loginButton = screen.getByRole('button', { name: 'Login' }) as HTMLButtonElement;
    expect(loginButton.disabled).toBe(false);
  });

  test('handles error without message property', async () => {
    // Configure mock to reject with an error that doesn't have a message property
    mockLogin.mockImplementationOnce(() => Promise.reject({}));
    
    render(<LoginForm />);
    
    // Fill in the form and submit
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    
    // Check for default error message
    await waitFor(() => {
      expect(screen.getByText('Failed to login. Please try again.')).toBeTruthy();
    });
  });
});
