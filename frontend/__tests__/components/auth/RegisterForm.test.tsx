// __tests__/components/auth/RegisterForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import RegisterForm from '../../../components/auth/RegisterForm';
import { useAuth } from '../../../store';
import { useRouter } from 'next/router';

// Mock the auth context and Next.js router
jest.mock('../../../store', () => ({
  useAuth: jest.fn()
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

describe('RegisterForm Component', () => {
  // Setup properly typed mocks
  const mockRegister = jest.fn(() => Promise.resolve());
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (useAuth as jest.Mock).mockReturnValue({
      register: mockRegister
    });
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    });
  });

  test('renders the registration form correctly', () => {
    render(<RegisterForm />);
    
    // Check form elements
    expect(screen.getByRole('heading', { name: 'Create an Account' })).toBeTruthy();
    expect(screen.getByLabelText(/full name/i)).toBeTruthy();
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/^password$/i)).toBeTruthy();
    expect(screen.getByLabelText(/confirm password/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Register' })).toBeTruthy();
    
    // Password hint should be visible
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeTruthy();
    
    // Error message should not be visible initially
    expect(screen.queryByText(/failed to register/i)).toBeNull();
  });

  test('shows validation error when form is submitted without data', async () => {
    const { container } = render(<RegisterForm />);
    
    // Get the form directly since it might not have a role
    const form = container.querySelector('form');
    if (!form) throw new Error('Form not found');
    
    // Submit the empty form
    fireEvent.submit(form);
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByText(/please fill in all fields/i)).toBeTruthy();
    });
    
    // Register function should not have been called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('shows error when passwords do not match', async () => {
    const { container } = render(<RegisterForm />);
    
    // Fill in the form with non-matching passwords
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' }
    });
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password123' }
    });
    
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password456' }
    });
    
    // Submit the form
    const form = container.querySelector('form');
    if (!form) throw new Error('Form not found');
    fireEvent.submit(form);
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeTruthy();
    });
    
    // Register function should not have been called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('shows error when password does not meet requirements', async () => {
    const { container } = render(<RegisterForm />);
    
    // Fill in the form with a weak password
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' }
    });
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password' }
    });
    
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password' }
    });
    
    // Submit the form
    const form = container.querySelector('form');
    if (!form) throw new Error('Form not found');
    fireEvent.submit(form);
    
    // Check error message
    await waitFor(() => {
      expect(screen.getByText(/Password must be at least 8 characters long and include/i)).toBeTruthy();
    });
    
    // Register function should not have been called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('calls register function and redirects on successful registration', async () => {
    // Configure mock to resolve successfully
    mockRegister.mockResolvedValueOnce();
    
    const { container } = render(<RegisterForm />);
    
    // Fill in the form with valid data
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' }
    });
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password123' }
    });
    
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password123' }
    });
    
    // Submit the form
    const form = container.querySelector('form');
    if (!form) throw new Error('Form not found');
    fireEvent.submit(form);
    
    // Button should show loading state
    expect(screen.getByRole('button', { name: 'Creating Account...' })).toBeTruthy();
    
    // Register should be called with correct credentials
    expect(mockRegister).toHaveBeenCalledWith('John Doe', 'john@example.com', 'Password123');
    
    // Wait for the redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  test('shows error message when registration fails', async () => {
    // Configure mock to reject with an error
    mockRegister.mockImplementationOnce(() => Promise.reject(new Error('Email already in use')));
    
    const { container } = render(<RegisterForm />);
    
    // Fill in the form with valid data
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' }
    });
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'Password123' }
    });
    
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'Password123' }
    });
    
    // Submit the form
    const form = container.querySelector('form');
    if (!form) throw new Error('Form not found');
    fireEvent.submit(form);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeTruthy();
    });
    
    // Register button should be enabled again after error
    const registerButton = screen.getByRole('button', { name: 'Register' }) as HTMLButtonElement;
    expect(registerButton.disabled).toBe(false);
  });
});
