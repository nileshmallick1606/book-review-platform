import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import bookService, { Book } from '../../services/bookService';
import reviewService, { Review, PaginatedReviews } from '../../services/reviewService';
import userService from '../../services/userService';
import { useAuth } from '../../store/auth-context';

// Components
import ReviewList from '../../components/review/ReviewList';
import ReviewForm from '../../components/review/ReviewForm';
import DeleteReviewModal from '../../components/review/DeleteReviewModal';
import StarRating from '../../components/ui/StarRating';
import RatingSummary from '../../components/ui/RatingSummary';

// Default placeholder book cover
const PLACEHOLDER_COVER = 'https://via.placeholder.com/300x450?text=No+Cover';

/**
 * Book Details Page - Displays detailed information about a specific book
 */
const BookDetailsPage: React.FC = () => {
  // State for book data
  const [book, setBook] = useState<Book | null>(null);
  const [ratingDetails, setRatingDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [ratingLoading, setRatingLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [favoritesLoading, setFavoritesLoading] = useState<boolean>(false);
  const [favoriteProcessing, setFavoriteProcessing] = useState<boolean>(false);
  
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
    // If router is ready but no ID is available, show error
    if (router.isReady && !id) {
      setLoading(false);
      setError('Book ID is missing. Please check the URL.');
      return;
    }
    
    // Only fetch if we have an ID and it's a string
    if (id && typeof id === 'string') {
      const fetchBookDetails = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const response = await bookService.getBookById(id, true);
          setBook(response.book);
          
          // Fetch rating details
          try {
            setRatingLoading(true);
            const ratingResponse = await bookService.getBookRatingDetails(id);
            setRatingDetails(ratingResponse);
          } catch (ratingErr) {
            console.error('Error fetching rating details:', ratingErr);
            // Non-critical error, so we don't set the main error state
          } finally {
            setRatingLoading(false);
          }
          
          // Check if book is favorite for authenticated user
          if (isAuthenticated && user) {
            try {
              setFavoritesLoading(true);
              const favoritesResponse = await userService.getFavorites(user.id);
              const favoriteIds = favoritesResponse.favorites.map((book: Book) => book.id);
              setIsFavorite(favoriteIds.includes(id));
            } catch (favErr) {
              console.error('Error checking favorite status:', favErr);
            } finally {
              setFavoritesLoading(false);
            }
          }
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
  }, [id, isAuthenticated, user]);
  
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
  
  // Handle toggling favorite status
  const handleToggleFavorite = async () => {
    if (!isAuthenticated || favoriteProcessing || !id || typeof id !== 'string') return;
    
    try {
      setFavoriteProcessing(true);
      
      if (isFavorite) {
        await userService.removeFavorite(id);
      } else {
        await userService.addFavorite(id);
      }
      
      // Update local state
      setIsFavorite(!isFavorite);
      
    } catch (error) {
      console.error('Failed to toggle favorite status:', error);
    } finally {
      setFavoriteProcessing(false);
    }
  };

  // Handle review submission (create or update)
  const handleReviewSubmit = async (reviewData: { bookId: string; text: string; rating: number }) => {
    if (!id || typeof id !== 'string') return;
    
    try {
      setSubmittingReview(true);
      
      if (reviewToEdit) {
        // Update existing review
        const updateResponse = await reviewService.updateReview(reviewToEdit.id, {
          text: reviewData.text,
          rating: reviewData.rating
        });
        
        setReviewToEdit(null);
        
        // Immediately update book rating if available in the response
        if (updateResponse.bookRating && book) {
          setBook({
            ...book,
            averageRating: updateResponse.bookRating.averageRating,
            reviewCount: updateResponse.bookRating.reviewCount
          });
          
          // Also update rating details if they exist
          if (ratingDetails) {
            setRatingDetails({
              ...ratingDetails,
              averageRating: updateResponse.bookRating.averageRating,
              reviewCount: updateResponse.bookRating.reviewCount
            });
          }
        }
      } else {
        // Create new review
        const createResponse = await reviewService.createReview(id, {
          text: reviewData.text,
          rating: reviewData.rating
        });
        
        // Immediately update book rating if available in the response
        if (createResponse.bookRating && book) {
          setBook({
            ...book,
            averageRating: createResponse.bookRating.averageRating,
            reviewCount: createResponse.bookRating.reviewCount
          });
          
          // Also update rating details if they exist
          if (ratingDetails) {
            setRatingDetails({
              ...ratingDetails,
              averageRating: createResponse.bookRating.averageRating,
              reviewCount: createResponse.bookRating.reviewCount
            });
          }
        }
      }
      
      // Refresh reviews
      const reviewsResult = await reviewService.getBookReviews(id, currentPage, 10, sortBy, sortOrder);
      setReviewsData(reviewsResult);
      
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
      const deleteResponse = await reviewService.deleteReview(reviewToDelete);
      
      // Immediately update book rating if available in the response
      if (deleteResponse.bookRating && book) {
        setBook({
          ...book,
          averageRating: deleteResponse.bookRating.averageRating,
          reviewCount: deleteResponse.bookRating.reviewCount
        });
        
        // Also update rating details if they exist
        if (ratingDetails) {
          setRatingDetails({
            ...ratingDetails,
            averageRating: deleteResponse.bookRating.averageRating,
            reviewCount: deleteResponse.bookRating.reviewCount
          });
        }
      }
      
      // Refresh reviews
      const reviewsResult = await reviewService.getBookReviews(id, currentPage, 10, sortBy, sortOrder);
      setReviewsData(reviewsResult);
      
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
          
          <div className="book-rating-section">
            {ratingLoading ? (
              <div className="rating-loading">Loading ratings...</div>
            ) : ratingDetails ? (
              <RatingSummary 
                averageRating={ratingDetails.averageRating} 
                reviewCount={ratingDetails.reviewCount}
                size="large"
                distribution={ratingDetails.distribution}
              />
            ) : (
              <div className="book-rating">
                <StarRating rating={book.averageRating} readOnly size="medium" precision="half" />
                <span className="rating-value">{book.averageRating.toFixed(1)}</span>
                <span className="review-count">({book.reviewCount} {book.reviewCount === 1 ? 'review' : 'reviews'})</span>
              </div>
            )}
            
            {ratingDetails && ratingDetails.positivePercentage !== undefined && (
              <div className="positive-rating">
                <span className="positive-percentage">{ratingDetails.positivePercentage}%</span> of readers liked this book
              </div>
            )}
          </div>
          
          <div className="book-metadata">
            {book.publishedYear && (
              <div className="metadata-item">
                <span className="metadata-label">Published:</span>
                <span className="metadata-value">{book.publishedYear}</span>
              </div>
            )}
            
            <div className="metadata-item">
              <span className="metadata-label">Genres:</span>
              <div className="book-genres">
                {book.genres?.map(genre => (
                  <span key={genre} className="genre-tag">{genre}</span>
                )) || <span className="no-genres">Not specified</span>}
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
            {isAuthenticated && (
              <button 
                className={`action-button favorite-action-button ${isFavorite ? 'is-favorite' : 'secondary-button'}`}
                onClick={handleToggleFavorite}
                disabled={favoriteProcessing}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} 
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="favorite-icon">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>
            )}
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
