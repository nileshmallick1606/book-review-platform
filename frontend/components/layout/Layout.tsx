import React from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

/**
 * Main layout component that wraps all pages
 * Includes common elements like navbar, footer, and head metadata
 */
const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'BookReview Platform',
  description = 'Discover books, share reviews, and get personalized recommendations'
}) => {
  return (
    <div className="layout">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />
      
      <main className="main-content">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;
