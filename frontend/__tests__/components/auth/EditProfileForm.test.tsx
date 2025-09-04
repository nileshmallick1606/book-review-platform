// __tests__/components/auth/EditProfileForm.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import EditProfileForm from '../../../components/auth/EditProfileForm';
import userService from '../../../services/userService';
import { useAuth } from '../../../store';
import { User } from '../../../types';

// Mock dependencies
jest.mock('../../../services/userService', () => ({
  updateProfile: jest.fn(),
  getUserProfile: jest.fn()
}));

jest.mock('../../../store', () => ({
  useAuth: jest.fn()
}));

describe('EditProfileForm Component', () => {
  // Mock props
  const mockUser: User = {
    id: 'user1',
    name: 'Test User',
    email: 'test@example.com',
    bio: 'This is a test bio',
    location: 'Test Location',
    favorites: []
  };

  const mockOnCancel = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default useAuth mock
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser
    });

    // Default getUserProfile mock
    (userService.getUserProfile as jest.Mock).mockResolvedValue({
      user: mockUser
    });
  });

  test('renders form with user data', () => {
    render(
      <EditProfileForm 
        user={mockUser}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />
    );
    
    expect(screen.getByLabelText('Name')).toHaveValue('Test User');
    expect(screen.getByLabelText('Bio')).toHaveValue('This is a test bio');
    expect(screen.getByLabelText('Location')).toHaveValue('Test Location');
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(
      <EditProfileForm 
        user={mockUser}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  test('updates form fields when changed', () => {
    render(
      <EditProfileForm 
        user={mockUser}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />
    );
    
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Updated Name' } });
    fireEvent.change(screen.getByLabelText('Bio'), { target: { value: 'Updated Bio' } });
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Updated Location' } });
    
    expect(screen.getByLabelText('Name')).toHaveValue('Updated Name');
    expect(screen.getByLabelText('Bio')).toHaveValue('Updated Bio');
    expect(screen.getByLabelText('Location')).toHaveValue('Updated Location');
  });

  test('submits form data and calls onSuccess when save button is clicked', async () => {
    (userService.updateProfile as jest.Mock).mockResolvedValue({ success: true });
    
    render(
      <EditProfileForm 
        user={mockUser}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />
    );
    
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Updated Name' } });
    fireEvent.change(screen.getByLabelText('Bio'), { target: { value: 'Updated Bio' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    
    // Should call updateProfile with the right data
    expect(userService.updateProfile).toHaveBeenCalledWith('user1', {
      name: 'Updated Name',
      bio: 'Updated Bio',
      location: 'Test Location'
    });
    
    // Wait for the promise to resolve
    await waitFor(() => {
      expect(userService.getUserProfile).toHaveBeenCalledWith('user1');
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test('shows error message when update fails', async () => {
    const errorMessage = 'Failed to update profile';
    (userService.updateProfile as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    render(
      <EditProfileForm 
        user={mockUser}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  test('disables buttons during submission', async () => {
    (userService.updateProfile as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );
    
    render(
      <EditProfileForm 
        user={mockUser}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    
    // Buttons should be disabled and button text should change
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    
    // Wait for the promise to resolve
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
