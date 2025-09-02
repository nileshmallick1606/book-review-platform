import React from 'react';
import Link from 'next/link';

/**
 * Footer component for the main application layout
 * Contains site map, copyright information, and other links
 */
const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3 className="footer-title">BookReview</h3>
          <p className="footer-description">
            A modern web application for discovering books, sharing reviews, and receiving personalized recommendations.
          </p>
        </div>
        
        <div className="footer-section">
          <h3 className="footer-title">Navigation</h3>
          <ul className="footer-links">
            <li>
              <Link href="/" legacyBehavior><a className="footer-link">Home</a></Link>
            </li>
            <li>
              <Link href="/books" legacyBehavior><a className="footer-link">Books</a></Link>
            </li>
            <li>
              <Link href="/auth/login" legacyBehavior><a className="footer-link">Login</a></Link>
            </li>
            <li>
              <Link href="/auth/register" legacyBehavior><a className="footer-link">Register</a></Link>
            </li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3 className="footer-title">Legal</h3>
          <ul className="footer-links">
            <li>
              <Link href="/privacy" legacyBehavior><a className="footer-link">Privacy Policy</a></Link>
            </li>
            <li>
              <Link href="/terms" legacyBehavior><a className="footer-link">Terms of Service</a></Link>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p className="copyright">
          &copy; {currentYear} BookReview Platform. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
