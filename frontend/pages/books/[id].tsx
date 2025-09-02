import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import bookService, { Book } from '../../services/bookService';
import reviewService, { Review, PaginatedReviews } from '../../services/reviewService';
import { useAuth } from '../../store/auth-context';

// Components
import ReviewList from '../../components/review/ReviewList';
import ReviewForm from '../../components/review/ReviewForm';
import DeleteReviewModal from '../../components/review/DeleteReviewModal';
import StarRating from '../../components/ui/StarRating';

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
  const { user, isAuthenticated } = useAuth();
  
  // State for reviews
  const [reviewsData, setReviewsData] = useState<PaginatedReviews>({
    reviews: [],
    totalReviews: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  
  // State for review actions
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState<Review | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);
  
  // Pagination and sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  
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
  
  // Fetch reviews when ID is available or pagination/sorting changes
  useEffect(() => {
    if (id && typeof id === 'string') {
      const fetchReviews = async () => {
        try {
          setReviewsLoading(true);
          const reviewsResult = await reviewService.getBookReviews(
            id,
            currentPage,
            10,
            sortBy,
            sortOrder
          );
          setReviewsData(reviewsResult);
        } catch (err) {
          console.error('Failed to load reviews:', err);
        } finally {
          setReviewsLoading(false);
        }
      };

      fetchReviews();
    }
  }, [id, currentPage, sortBy, sortOrder]);
  
  // Handle page change for reviews
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle sort change for reviews
  const handleSortChange = (newSortBy: string, newSortOrder: string) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  // Handle review submission (create or update)
  const handleReviewSubmit = async (reviewData: { bookId: string; text: string; rating: number }) => {
    if (!id || typeof id !== 'string') return;
    
    try {
      setSubmittingReview(true);
      
      if (reviewToEdit) {
        // Update existing review
        await reviewService.updateReview(reviewToEdit.id, {
          text: reviewData.text,
          rating: reviewData.rating
        });
        setReviewToEdit(null);
      } else {
        // Create new review
        await reviewService.createReview(id, {
          text: reviewData.text,
          rating: reviewData.rating
        });
      }
      
      // Refresh reviews and book data
      const reviewsResult = await reviewService.getBookReviews(id, currentPage, 10, sortBy, sortOrder);
      setReviewsData(reviewsResult);
      
      const bookResponse = await bookService.getBookById(id, true);
      setBook(bookResponse.book);
      
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle review edit
  const handleEditReview = (review: Review) => {
    setReviewToEdit(review);
  };

  // Handle review delete
  const handleDeleteClick = (reviewId: string) => {
    setReviewToDelete(reviewId);
    setIsDeleteModalOpen(true);
  };

  // Handle review deletion confirmation
  const handleDeleteReview = async () => {
    if (!reviewToDelete || !id || typeof id !== 'string') return;
    
    try {
      setDeletingReview(true);
      await reviewService.deleteReview(reviewToDelete);
      
      // Refresh reviews and book data
      const reviewsResult = await reviewService.getBookReviews(id, currentPage, 10, sortBy, sortOrder);
      setReviewsData(reviewsResult);
      
      const bookResponse = await bookService.getBookById(id, true);
      setBook(bookResponse.book);
      
      setIsDeleteModalOpen(false);
      setReviewToDelete(null);
    } catch (err) {
      console.error('Failed to delete review:', err);
    } finally {
      setDeletingReview(false);
    }
  };
  
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
            <StarRating rating={book.averageRating} readOnly />
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
            {isAuthenticated && !reviewsData.reviews.some(review => review.userId === user?.id) ? (
              <button 
                className="action-button primary-button" 
                onClick={() => document.querySelector('.write-review')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Write a Review
              </button>
            ) : null}
            <button className="action-button secondary-button">
              Add to Favorites
            </button>
          </div>
        </div>
      </div>
      
      <div className="book-reviews">
        <h3 className="reviews-header">Reviews ({reviewsData.totalReviews})</h3>
        
        {isAuthenticated ? (
          !reviewToEdit && !reviewsData.reviews.some(review => review.userId === user?.id) ? (
            <div className="write-review">
              <ReviewForm
                bookId={book.id}
                onSubmit={handleReviewSubmit}
                isSubmitting={submittingReview}
              />
            </div>
          ) : null
        ) : (
          <div className="login-prompt">
            <p>Please <Link href="/auth/login">log in</Link> to leave a review.</p>
          </div>
        )}
        
        {reviewToEdit && (
          <div className="edit-review">
            <ReviewForm
              bookId={book.id}
              review={reviewToEdit}
              onSubmit={handleReviewSubmit}
              onCancel={() => setReviewToEdit(null)}
              isSubmitting={submittingReview}
            />
          </div>
        )}
        
        <ReviewList
          bookId={book.id}
          reviews={reviewsData.reviews}
          totalReviews={reviewsData.totalReviews}
          currentPage={reviewsData.page}
          totalPages={reviewsData.totalPages}
          userId={user?.id}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
          onEditReview={handleEditReview}
          onDeleteReview={handleDeleteClick}
          loading={reviewsLoading}
        />
        
        <DeleteReviewModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteReview}
          isDeleting={deletingReview}
        />
      </div>
    </div>
    </>
  );
};

export default BookDetailsPage;
