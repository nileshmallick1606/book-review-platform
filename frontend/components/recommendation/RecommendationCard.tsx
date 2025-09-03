import React from 'react';
import BookCard from '../book/BookCard';
import { Book } from '../../services/bookService';

interface RecommendationCardProps {
  recommendation: {
    id: string;
    title: string;
    author: string;
    coverImage?: string;
    reason: string;
    genres?: string[];
    // Other book properties that might be present
    description?: string;
    averageRating?: number;
    reviewCount?: number;
    publishedYear?: number;
  };
  isFavorite?: boolean;
  onFavoriteToggle?: (bookId: string, isFavorite: boolean) => void;
}

/**
 * Card component to display a single book recommendation
 * Extends the standard BookCard with recommendation-specific information
 */
const RecommendationCard: React.FC<RecommendationCardProps> = ({ 
  recommendation,
  isFavorite = false,
  onFavoriteToggle
}) => {
  const { reason } = recommendation;
  
  // Convert recommendation to Book format for BookCard
  const bookData: Book = {
    id: recommendation.id,
    title: recommendation.title,
    author: recommendation.author,
    coverImage: recommendation.coverImage || '', // Provide empty string as fallback for coverImage
    genres: recommendation.genres || [],
    description: recommendation.description || '',
    // Provide defaults for required Book properties if they're not in the recommendation
    averageRating: recommendation.averageRating || 0,
    reviewCount: recommendation.reviewCount || 0,
    publishedYear: recommendation.publishedYear || 0
  };
  
  return (
    <div className="recommendation-card">
      <BookCard 
        book={bookData}
        isFavorite={isFavorite}
        onFavoriteToggle={onFavoriteToggle}
        className="recommendation-book-card"
      />
      
      {/* Recommendation-specific content */}
      <div className="recommendation-reason">
        <h4>
          Why this book? 
          <span className="ai-badge" title="AI-powered recommendation">
            🤖✨
          </span>
        </h4>
        <p>{reason}</p>
      </div>
    </div>
  );
};

export default RecommendationCard;
