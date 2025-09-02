import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../store/auth-context';

/**
 * Navigation bar component for the main application layout
 * Handles responsive menu and active link highlighting
 */
const Navbar: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuth();

  // Determine if a link is active
  const isActive = (path: string) => {
    if (path === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link href="/" legacyBehavior>
            <a className="logo-link">
              <span className="logo-text">BookReview</span>
            </a>
          </Link>
        </div>

        <div className="navbar-links">
          <ul className="nav-menu">
            <li className="nav-item">
              <Link href="/" legacyBehavior>
                <a className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</a>
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/books" legacyBehavior>
                <a className={`nav-link ${isActive('/books') ? 'active' : ''}`}>Books</a>
              </Link>
            </li>
            {/* Add more navigation items as needed */}
          </ul>
        </div>

        <div className="navbar-auth">
          {isAuthenticated ? (
            <>
              <Link href="/auth/profile" legacyBehavior>
                <a className={`auth-link ${isActive('/auth/profile') ? 'active' : ''}`}>Profile</a>
              </Link>
              <button className="auth-button logout-button" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" legacyBehavior>
                <a className={`auth-link ${isActive('/auth/login') ? 'active' : ''}`}>Login</a>
              </Link>
              <Link href="/auth/register" legacyBehavior>
                <a className="auth-button register-button">Register</a>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
