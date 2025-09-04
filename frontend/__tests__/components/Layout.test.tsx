// __tests__/components/Layout.test.tsx
import React from 'react';
import { render, screen } from '../utils/test-utils';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';
import Layout from '../../components/layout/Layout';

// Mock the Next.js Head component
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid="mock-head">{children}</div>;
    },
  };
});

// Mock the Navbar component
jest.mock('../../components/layout/Navbar', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="mock-navbar">Mock Navbar</div>,
  };
});

// Mock the Footer component
jest.mock('../../components/layout/Footer', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="mock-footer">Mock Footer</div>,
  };
});

describe('Layout Component', () => {
  const defaultProps = {
    children: <div data-testid="test-content">Test Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders children content', () => {
    render(<Layout {...defaultProps} />);
    
    // Check that children are rendered
    expect(screen.getByTestId('test-content')).toBeTruthy();
    expect(screen.getByText('Test Content')).toBeTruthy();
  });

  test('renders navbar and footer components', () => {
    render(<Layout {...defaultProps} />);
    
    // Check that navbar and footer are rendered
    expect(screen.getByTestId('mock-navbar')).toBeTruthy();
    expect(screen.getByTestId('mock-footer')).toBeTruthy();
  });

  test('renders with default title and description', () => {
    render(<Layout {...defaultProps} />);
    
    // Since we're mocking Head component, we can only check that it's rendered
    const headElement = screen.getByTestId('mock-head');
    expect(headElement).toBeTruthy();
    
    // Title and meta tags are part of the head component's children
    expect(headElement.innerHTML).toContain('BookReview Platform');
    expect(headElement.innerHTML).toContain('Discover books, share reviews, and get personalized recommendations');
  });

  test('renders with custom title and description', () => {
    const customProps = {
      ...defaultProps,
      title: 'Custom Page Title',
      description: 'Custom page description',
    };
    
    render(<Layout {...customProps} />);
    
    const headElement = screen.getByTestId('mock-head');
    expect(headElement).toBeTruthy();
    
    // Check custom title and description
    expect(headElement.innerHTML).toContain('Custom Page Title');
    expect(headElement.innerHTML).toContain('Custom page description');
  });
});
