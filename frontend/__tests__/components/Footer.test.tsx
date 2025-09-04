// __tests__/components/Footer.test.tsx
import React from 'react';
import { render, screen } from '../utils/test-utils';
import { describe, test, expect, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import Footer from '../../components/layout/Footer';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href, legacyBehavior }: { children: React.ReactNode; href: string; legacyBehavior?: boolean }) => {
      if (legacyBehavior) {
        return children;
      }
      return <a href={href}>{children}</a>;
    },
  };
});

describe('Footer Component', () => {
  test('renders footer with site name and description', () => {
    render(<Footer />);
    
    // Check for the site name
    expect(screen.getByText('BookReview')).toBeTruthy();
    
    // Check for description text
    expect(screen.getByText(/A modern web application for discovering books/)).toBeTruthy();
  });

  test('renders navigation links', () => {
    render(<Footer />);
    
    // Check for navigation links in the footer
    const homeLink = screen.getByText('Home');
    expect(homeLink).toBeTruthy();
    
    const booksLink = screen.getByText('Books');
    expect(booksLink).toBeTruthy();
    
    const loginLink = screen.getByText('Login');
    expect(loginLink).toBeTruthy();
    
    const registerLink = screen.getByText('Register');
    expect(registerLink).toBeTruthy();
  });

  test('renders legal links', () => {
    render(<Footer />);
    
    // Check for legal links
    const privacyLink = screen.getByText('Privacy Policy');
    expect(privacyLink).toBeTruthy();
    
    const termsLink = screen.getByText('Terms of Service');
    expect(termsLink).toBeTruthy();
  });

  test('renders copyright notice with current year', () => {
    // Mock the Date object to return a specific year
    const currentYear = new Date().getFullYear();
    
    render(<Footer />);
    
    // Check for copyright text with the current year
    expect(screen.getByText(new RegExp(`© ${currentYear} BookReview Platform`))).toBeTruthy();
  });
});
