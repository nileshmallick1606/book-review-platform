import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import bookService, { Book } from '../../services/bookService';

// Default placeholder book cover
const PLACEHOLDER_COVER = 'https://via.placeholder.com/300x450?text=No+Cover';

/**
 * Book Details Page - Displays detailed information about a specific book
 */
const BookDetailsPage: React.FC = () => {
  // State for book data
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get book ID from router
  const router = useRouter();
  const { id } = router.query;
  
  // Fetch book details when ID is available
  useEffect(() => {
    // Only fetch if we have an ID and it's a string
    if (id && typeof id === 'string') {
      const fetchBookDetails = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const response = await bookService.getBookById(id, true);
          setBook(response.book);
        } catch (err: any) {
          console.error('Error fetching book details:', err);
          
          // Handle 404 specifically
          if (err.response && err.response.status === 404) {
            setError('Book not found. It may have been removed or the URL is incorrect.');
          } else {
            setError('Failed to load book details. Please try again.');
          }
        } finally {
          setLoading(false);
        }
      };
      
      fetchBookDetails();
    }
  }, [id]);
  
  // Render loading state
  if (loading) {
    return (
      <div className="book-details-loading">
        <div className="spinner"></div>
        <p>Loading book details...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <>
        <div className="book-details-error">
          <h2>Error</h2>
          <p>{error}</p>
          <Link href="/books" legacyBehavior>
            <a>Back to Books</a>
          </Link>
        </div>
      </>
    );
  }
  
  // Render not found state
  if (!book) {
    return (
      <>
        <div className="book-details-not-found">
          <h2>Book Not Found</h2>
          <p>We couldn't find the book you're looking for.</p>
          <Link href="/books" legacyBehavior>
            <a>Back to Books</a>
          </Link>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Head>
        <title>{book.title} by {book.author} - BookReview</title>
        <meta name="description" content={`Read about ${book.title} by ${book.author} and see reviews on BookReview Platform`} />
      </Head>
      
      <div className="book-details-page">
      
      <div className="book-details-header">
        <Link href="/books" legacyBehavior>
          <a className="back-button">&larr; Back to Books</a>
        </Link>
      </div>
      
      <div className="book-details-container">
        <div className="book-details-cover">
          <Image
            src={book.coverImage || PLACEHOLDER_COVER}
            alt={`Cover for ${book.title}`}
            width={300}
            height={450}
            style={{ objectFit: 'cover' }}
            unoptimized={book.coverImage?.startsWith('http')}
          />
        </div>
        
        <div className="book-details-info">
          <h1 className="book-title">{book.title}</h1>
          <h2 className="book-author">by {book.author}</h2>
          
          <div className="book-rating">
            <span className="rating-stars">
              {'★'.repeat(Math.round(book.averageRating))}
              {'☆'.repeat(5 - Math.round(book.averageRating))}
            </span>
            <span className="rating-value">{book.averageRating.toFixed(1)}</span>
            <span className="review-count">({book.reviewCount} reviews)</span>
          </div>
          
          <div className="book-metadata">
            <div className="metadata-item">
              <span className="metadata-label">Published:</span>
              <span className="metadata-value">{book.publishedYear}</span>
            </div>
            
            <div className="metadata-item">
              <span className="metadata-label">Genres:</span>
              <div className="book-genres">
                {book.genres.map(genre => (
                  <span key={genre} className="genre-tag">{genre}</span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="book-description">
            <h3>Description</h3>
            <p>{book.description}</p>
          </div>
          
          <div className="book-details-actions">
            <button className="action-button primary-button">
              Write a Review
            </button>
            <button className="action-button secondary-button">
              Add to Favorites
            </button>
          </div>
        </div>
      </div>
      
      <div className="book-reviews">
        <h3 className="reviews-header">Reviews</h3>
        <div className="reviews-placeholder">
          <p>Reviews will be implemented in User Story 2.2</p>
        </div>
      </div>
    </div>
    </>
  );
};

export default BookDetailsPage;
