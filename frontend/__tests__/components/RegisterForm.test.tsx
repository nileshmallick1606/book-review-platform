// __tests__/components/RegisterForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import RegisterForm from '../../components/auth/RegisterForm';
import { useRouter } from 'next/router';
import * as authContext from '../../store';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

// Mock auth context
jest.mock('../../store', () => ({
  useAuth: jest.fn()
}));

describe('RegisterForm Component', () => {
  // Mock implementations
  const mockRegister = jest.fn();
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    });
    
    // Setup auth context mock
    (authContext.useAuth as jest.Mock).mockReturnValue({
      register: mockRegister
    });
  });

  test('renders registration form correctly', () => {
    render(<RegisterForm />);
    
    // Check that form elements are rendered
    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Register' });
    const helpText = screen.getByText(/Password must be at least 8 characters/);
    
    expect(nameInput).toBeTruthy();
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(confirmPasswordInput).toBeTruthy();
    expect(submitButton).toBeTruthy();
    expect(helpText).toBeTruthy();
  });

  test('handles input changes', () => {
    render(<RegisterForm />);
    
    // Get form fields
    const nameInput = screen.getByLabelText('Full Name') as HTMLInputElement;
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText('Confirm Password') as HTMLInputElement;
    
    // Change values
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });
    
    // Check if values were updated
    expect(nameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('john@example.com');
    expect(passwordInput.value).toBe('Password123');
    expect(confirmPasswordInput.value).toBe('Password123');
  });

  test('shows error when form is submitted with empty fields', async () => {
    const { container } = render(<RegisterForm />);
    
    // Submit form without entering any data
    const form = container.querySelector('form');
    expect(form).toBeTruthy();
    fireEvent.submit(form!);
    
    // Check if error message is displayed
    await waitFor(() => {
      const errorElement = screen.getByText('Please fill in all fields');
      expect(errorElement).toBeTruthy();
    });
    
    // Register function should not be called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('shows error when passwords do not match', async () => {
    render(<RegisterForm />);
    
    // Get form fields
    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Register' });
    
    // Fill the form with non-matching passwords
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password456' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Check if error message is displayed
    await waitFor(() => {
      const errorElement = screen.getByText('Passwords do not match');
      expect(errorElement).toBeTruthy();
    });
    
    // Register function should not be called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('shows error when password does not meet complexity requirements', async () => {
    render(<RegisterForm />);
    
    // Get form fields
    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Register' });
    
    // Fill the form with weak password
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Check if error message is displayed
    await waitFor(() => {
      const errorElement = screen.getByText(/Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number/);
      expect(errorElement).toBeTruthy();
    });
    
    // Register function should not be called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test('calls register function and redirects on successful registration', async () => {
    render(<RegisterForm />);
    
    // Get form fields
    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Register' });
    
    // Fill the form with valid data
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Verify loading state
    const loadingElement = screen.getByText('Creating Account...');
    expect(loadingElement).toBeTruthy();
    
    // Verify register called with correct parameters
    expect(mockRegister).toHaveBeenCalledWith('John Doe', 'john@example.com', 'Password123');
    
    // Wait for registration to complete
    await waitFor(() => {
      // Should redirect to home page
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  test('shows error message when registration fails', async () => {
    // Make register throw an error
    mockRegister.mockRejectedValueOnce({ message: 'Email already in use' } as never);
    
    render(<RegisterForm />);
    
    // Get form fields
    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Register' });
    
    // Fill the form with valid data
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Wait for error message
    await waitFor(() => {
      const errorElement = screen.getByText('Email already in use');
      expect(errorElement).toBeTruthy();
    });
    
    // Button should no longer be in loading state
    const buttonElement = screen.getByRole('button', { name: 'Register' });
    expect(buttonElement).toBeTruthy();
  });

  test('handles registration error with no message', async () => {
    // Make register throw an error with no message
    mockRegister.mockRejectedValueOnce({} as never);
    
    render(<RegisterForm />);
    
    // Fill form with valid data and submit
    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    
    // Should show default error message
    await waitFor(() => {
      const errorElement = screen.getByText('Failed to register. Please try again.');
      expect(errorElement).toBeTruthy();
    });
  });
});
