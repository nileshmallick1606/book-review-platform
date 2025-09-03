import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

interface RecommendationCardProps {
  recommendation: {
    id: string;
    title: string;
    author: string;
    coverImage?: string;
    reason: string;
    genres?: string[];
  };
}

/**
 * Card component to display a single book recommendation
 */
const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const { id, title, author, coverImage, reason, genres = [] } = recommendation;
  
  const [imageError, setImageError] = useState(false);
  
  // Create a placeholder image with the book title
  const placeholderImage = `https://via.placeholder.com/120x180/e9e9e9/333333?text=${encodeURIComponent(title.substring(0, 10))}`;
  
  // Use cover image if available and not in error state, otherwise use placeholder
  const imageSrc = !imageError && coverImage ? coverImage : placeholderImage;
  
  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };
  
  return (
    <div className="recommendation-card">
      <div className="recommendation-card__image">
        <Image 
          src={imageSrc} 
          alt={`Cover for ${title}`} 
          width={120} 
          height={180} 
          className="book-cover"
          onError={handleImageError}
          priority={false}
          unoptimized={!coverImage || imageError}
        />
      </div>
      
      <div className="recommendation-card__content">
        <h3 className="recommendation-card__title">
          <Link href={`/books/${id}`}>{title}</Link>
        </h3>
        
        <p className="recommendation-card__author">by {author}</p>
        
        {genres.length > 0 && (
          <div className="recommendation-card__genres">
            {genres.map((genre, index) => (
              <span key={index} className="recommendation-card__genre-tag">
                {genre}
              </span>
            ))}
          </div>
        )}
        
        <div className="recommendation-card__reason">
          <h4>
            Why this book? 
            <span className="ai-badge" title="AI-powered recommendation">
              🤖✨
            </span>
          </h4>
          <p>{reason}</p>
        </div>
      </div>
      
      <div className="recommendation-card__actions">
        <Link href={`/books/${id}`} className="btn btn-primary">
          View Details
        </Link>
      </div>
    </div>
  );
};

export default RecommendationCard;
