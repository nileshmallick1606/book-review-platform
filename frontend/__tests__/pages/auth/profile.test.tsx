import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfilePage from '../../../pages/auth/profile';

// Mock next/head
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid="head">{children}</div>;
    },
  };
});

// Mock UserProfile component
jest.mock('../../../components/auth/UserProfile', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="user-profile">User Profile Content</div>,
  };
});

// Mock ProtectedRoute component
jest.mock('../../../components/auth/ProtectedRoute', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="protected-route">{children}</div>
    ),
  };
});

describe('ProfilePage (auth)', () => {
  test('should render the profile page wrapped in ProtectedRoute', () => {
    render(<ProfilePage />);
    
    // Verify that the ProtectedRoute wrapper is present
    const protectedRoute = screen.getByTestId('protected-route');
    expect(protectedRoute).toBeInTheDocument();
    
    // Verify that the UserProfile component is rendered inside it
    expect(screen.getByTestId('user-profile')).toBeInTheDocument();
  });

  test('should render proper page structure and metadata', () => {
    render(<ProfilePage />);
    
    // Check page metadata
    expect(screen.getByTestId('head')).toBeInTheDocument();
    expect(screen.getByText('My Profile - BookReview')).toBeInTheDocument();
    expect(screen.getByText(/Your profile on BookReview platform/)).toBeInTheDocument();
    
    // Check profile page container
    const profilePage = document.querySelector('.profile-page');
    expect(profilePage).toBeInTheDocument();
  });

  test('should contain UserProfile component', () => {
    render(<ProfilePage />);
    
    // Verify UserProfile is rendered
    const userProfile = screen.getByTestId('user-profile');
    expect(userProfile).toBeInTheDocument();
    expect(userProfile).toHaveTextContent('User Profile Content');
  });
});
