import React, { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import BookCard from '../components/book/BookCard';
import RecommendationCard from '../components/recommendation/RecommendationCard';

// Sample book data
const sampleBook = {
  id: 'sample-1',
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  description: 'A classic novel about the American Dream and the Roaring Twenties.',
  coverImage: 'https://via.placeholder.com/150x225/e9e9e9/333333?text=Great+Gatsby',
  genres: ['Fiction', 'Classics', 'Literature'],
  publishedYear: 1925,
  averageRating: 4.2,
  reviewCount: 1258
};

// Sample recommendation data
const sampleRecommendation = {
  id: 'rec-1',
  title: 'To Kill a Mockingbird',
  author: 'Harper Lee',
  description: 'A powerful story of racial injustice in the American South.',
  coverImage: 'https://via.placeholder.com/150x225/e9e9e9/333333?text=To+Kill+a+Mockingbird',
  genres: ['Fiction', 'Classics', 'Literature'],
  publishedYear: 1960,
  averageRating: 4.5,
  reviewCount: 2359,
  reason: "This classic explores themes similar to books you've enjoyed, with powerful character development and social commentary."
};

/**
 * Test page to verify book cards are consistent
 */
const BookCardTestPage = () => {
  const [isFavorite, setIsFavorite] = useState(false);
  
  const handleFavoriteToggle = (bookId: string, newFavoriteState: boolean) => {
    console.log(`Book ${bookId} favorite status changed to: ${newFavoriteState}`);
    setIsFavorite(newFavoriteState);
  };
  
  return (
    <Layout title="Book Cards Test">
      <Head>
        <title>Book Cards Consistency Test</title>
      </Head>
      
      <div className="container" style={{ padding: '2rem' }}>
        <h1>Book Cards Consistency Test</h1>
        
        <div className="section">
          <h2>Standard Book Card</h2>
          <div style={{ width: '300px', margin: '0 auto' }}>
            <BookCard 
              book={sampleBook}
              isFavorite={isFavorite}
              onFavoriteToggle={handleFavoriteToggle}
            />
          </div>
        </div>
        
        <div className="section" style={{ marginTop: '3rem' }}>
          <h2>Recommendation Card (using BookCard)</h2>
          <div style={{ width: '300px', margin: '0 auto' }}>
            <RecommendationCard 
              recommendation={sampleRecommendation}
              isFavorite={isFavorite}
              onFavoriteToggle={handleFavoriteToggle}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookCardTestPage;
