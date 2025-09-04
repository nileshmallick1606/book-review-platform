// __tests__/components/LoginForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import LoginForm from '../../components/auth/LoginForm';
import * as authContext from '../../store';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Mock auth context
jest.mock('../../store', () => ({
  useAuth: jest.fn()
}));

describe('LoginForm Component', () => {
  // Mock implementations
  const mockLogin = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup auth context mock
    (authContext.useAuth as jest.Mock).mockReturnValue({
      login: mockLogin
    });
  });

  test('renders login form correctly', () => {
    render(<LoginForm />);
    
    // Check that form elements are rendered
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const loginButton = screen.getByRole('button', { name: 'Login' });
    const errorMessage = screen.queryByText(/error/i);
    
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(loginButton).toBeTruthy();
    expect(errorMessage).toBeNull();
  });

  test('handles input changes', () => {
    render(<LoginForm />);
    
    // Get form fields
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    
    // Change values
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Check if values were updated
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('shows error when form is submitted with empty fields', async () => {
    const { container } = render(<LoginForm />);
    
    // Submit the form using the form element directly to ensure preventDefault() works correctly
    const form = container.querySelector('form');
    expect(form).toBeTruthy();
    fireEvent.submit(form!);
    
    // Check if error message is displayed
    await waitFor(() => {
      const errorDiv = container.querySelector('.error-message');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.textContent).toContain('Please enter both email and password');
    });
    
    // Login function should not be called
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('calls login function and redirects on successful login', async () => {
    render(<LoginForm />);
    
    // Get form fields
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });
    
    // Fill the form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Verify loading state
    const loadingElement = screen.getByText('Logging in...');
    expect(loadingElement).toBeTruthy();
    
    // Verify login called with correct parameters
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    
    // Wait for login to complete
    await waitFor(() => {
      // Should redirect to home page
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  test('shows error message when login fails', async () => {
    // Make login throw an error
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials') as never);
    
    render(<LoginForm />);
    
    // Get form fields
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });
    
    // Fill the form
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Wait for error message
    await waitFor(() => {
      const errorElement = screen.getByText('Invalid credentials');
      expect(errorElement).toBeTruthy();
    });
    
    // Button should no longer be in loading state
    const loginButton = screen.getByRole('button', { name: 'Login' });
    expect(loginButton).toBeTruthy();
  });

  test('handles login error with no message', async () => {
    // Make login throw an error with no message
    mockLogin.mockRejectedValueOnce(new Error() as never);
    
    render(<LoginForm />);
    
    // Get form fields and submit
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    
    // Should show default error message
    await waitFor(() => {
      const errorElement = screen.getByText('Failed to login. Please try again.');
      expect(errorElement).toBeTruthy();
    });
  });
});
