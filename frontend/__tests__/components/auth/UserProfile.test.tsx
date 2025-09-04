import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import UserProfile from '../../../components/auth/UserProfile';
import userService from '../../../services/userService';
import { useAuth } from '../../../store';
import { User } from '../../../types';

// Mock dependencies
jest.mock('../../../services/userService', () => ({
  getUserProfile: jest.fn(),
  updateProfile: jest.fn()
}));

// Mock child components
jest.mock('../../../components/review/UserReviews', () => {
  return function MockUserReviews({ userId }: { userId: string }) {
    return <div data-testid="user-reviews" data-userid={userId}>User Reviews Mock</div>;
  };
});

jest.mock('../../../components/book/UserFavorites', () => {
  return function MockUserFavorites({ userId }: { userId: string }) {
    return <div data-testid="user-favorites" data-userid={userId}>User Favorites Mock</div>;
  };
});

jest.mock('../../../components/auth/EditProfileForm', () => {
  return function MockEditProfileForm({ 
    user, 
    onCancel, 
    onSuccess 
  }: { 
    user: User; 
    onCancel: () => void; 
    onSuccess: () => void;
  }) {
    return (
      <div data-testid="edit-profile-form">
        <button onClick={onCancel} data-testid="cancel-edit">Cancel</button>
        <button onClick={onSuccess} data-testid="save-edit">Save</button>
      </div>
    );
  };
});

// Mock the auth context
jest.mock('../../../store', () => ({
  useAuth: jest.fn()
}));

describe('UserProfile Component', () => {
  // Mock user data
  const mockUser = {
    id: 'user1',
    name: 'Test User',
    email: 'test@example.com',
    bio: 'This is a test bio',
    location: 'Test Location'
  };

  // Mock logout function
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth context mock
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      logout: mockLogout
    });

    // Default getUserProfile mock
    (userService.getUserProfile as jest.Mock).mockResolvedValue({
      user: { ...mockUser, reviewCount: 5 }
    });
  });

  test('renders loading state correctly', () => {
    (userService.getUserProfile as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<UserProfile />);
    
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  test('renders not logged in message when no user', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      logout: mockLogout
    });
    
    render(<UserProfile />);
    
    expect(screen.getByText('Please log in to view your profile')).toBeInTheDocument();
  });

  test('renders user profile information correctly', async () => {
    render(<UserProfile />);
    
    await waitFor(() => {
      expect(screen.getByText("Test User's Profile")).toBeInTheDocument();
    });
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Reviews')).toBeInTheDocument();
    
    expect(screen.getByText('Name:')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    
    expect(screen.getByText('Email:')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    
    expect(screen.getByText('Bio:')).toBeInTheDocument();
    expect(screen.getByText('This is a test bio')).toBeInTheDocument();
    
    expect(screen.getByText('Location:')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });

  test('switches between tabs correctly', async () => {
    render(<UserProfile />);
    
    await waitFor(() => {
      expect(screen.getByText("Test User's Profile")).toBeInTheDocument();
    });
    
    // Initially on profile tab
    expect(screen.getByText('Name:')).toBeInTheDocument();
    
    // Switch to reviews tab
    fireEvent.click(screen.getByText('My Reviews'));
    expect(screen.getByTestId('user-reviews')).toBeInTheDocument();
    expect(screen.queryByText('Name:')).not.toBeInTheDocument();
    
    // Switch to favorites tab
    fireEvent.click(screen.getByText('Favorites'));
    expect(screen.getByTestId('user-favorites')).toBeInTheDocument();
    expect(screen.queryByTestId('user-reviews')).not.toBeInTheDocument();
    
    // Back to profile tab
    fireEvent.click(screen.getByText('Profile'));
    expect(screen.getByText('Name:')).toBeInTheDocument();
    expect(screen.queryByTestId('user-favorites')).not.toBeInTheDocument();
  });

  test('shows edit form when edit button is clicked', async () => {
    render(<UserProfile />);
    
    await waitFor(() => {
      expect(screen.getByText("Test User's Profile")).toBeInTheDocument();
    });
    
    // Click edit button
    fireEvent.click(screen.getByText('Edit Profile'));
    
    expect(screen.getByTestId('edit-profile-form')).toBeInTheDocument();
    expect(screen.queryByText('Name:')).not.toBeInTheDocument();
  });

  test('hides edit form when cancel is clicked', async () => {
    render(<UserProfile />);
    
    await waitFor(() => {
      expect(screen.getByText("Test User's Profile")).toBeInTheDocument();
    });
    
    // Click edit button
    fireEvent.click(screen.getByText('Edit Profile'));
    expect(screen.getByTestId('edit-profile-form')).toBeInTheDocument();
    
    // Click cancel
    fireEvent.click(screen.getByTestId('cancel-edit'));
    
    expect(screen.queryByTestId('edit-profile-form')).not.toBeInTheDocument();
    expect(screen.getByText('Name:')).toBeInTheDocument();
  });

  test('refreshes profile when edit is successful', async () => {
    render(<UserProfile />);
    
    await waitFor(() => {
      expect(screen.getByText("Test User's Profile")).toBeInTheDocument();
    });
    
    // Click edit button
    fireEvent.click(screen.getByText('Edit Profile'));
    expect(screen.getByTestId('edit-profile-form')).toBeInTheDocument();
    
    // Reset mock to verify it gets called again
    jest.clearAllMocks();
    (userService.getUserProfile as jest.Mock).mockResolvedValue({
      user: { ...mockUser, reviewCount: 7 }
    });
    
    // Click save
    fireEvent.click(screen.getByTestId('save-edit'));
    
    // Should refresh user profile
    expect(userService.getUserProfile).toHaveBeenCalledWith('user1');
    
    // Wait for the refresh
    await waitFor(() => {
      expect(screen.queryByTestId('edit-profile-form')).not.toBeInTheDocument();
    });
  });

  test('logs out when logout button is clicked', async () => {
    render(<UserProfile />);
    
    await waitFor(() => {
      expect(screen.getByText("Test User's Profile")).toBeInTheDocument();
    });
    
    // Click logout button
    fireEvent.click(screen.getByText('Logout'));
    
    expect(mockLogout).toHaveBeenCalled();
  });

  test('handles profile fetching error', async () => {
    (userService.getUserProfile as jest.Mock).mockRejectedValue(new Error('Failed to fetch profile'));
    
    // Mock console.error to prevent error output in test
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<UserProfile />);
    
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
    
    // Even with an error, the component should render the profile tabs
    expect(screen.getByText("Test User's Profile")).toBeInTheDocument();
  });
});
