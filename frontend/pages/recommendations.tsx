import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import RecommendationList from '../components/recommendation/RecommendationList';
import recommendationService from '../services/recommendationService';
import { requireAuth } from '../utils/auth';

interface Recommendation {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  reason: string;
  genres?: string[];
}

/**
 * Page for displaying personalized book recommendations
 */
const RecommendationsPage: React.FC = () => {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get query parameters
  const { genre } = router.query;
  
  useEffect(() => {
    // Always fetch recommendations from API on page load
    fetchRecommendations(true);
    // No interval needed; always show all recommendations on load
  }, []);
  
  // Function to fetch recommendations
  const fetchRecommendations = async (refresh = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      
      
      // Fetch from API
      const response = await recommendationService.getRecommendations({
        limit: 10,
        genre: genre as string || null,
        refresh
      });
      
      // Extract recommendations data correctly based on API response structure
      let recommendationsData = [];
      
      if (response) {
        // Handle possible response structures
        if (Array.isArray(response)) {
          // Response is already an array
          recommendationsData = response;
        } else if (Array.isArray(response.data)) {
          // Response.data is an array
          recommendationsData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          // Response.data.data is an array (most likely structure)
          recommendationsData = response.data.data;
        } else if (response.data) {
          // If response.data exists but isn't an array or doesn't have .data property
          recommendationsData = [response.data];
        }
      }
      
      // If we still have no recommendations, use samples
      if (recommendationsData.length === 0) {
        recommendationsData = recommendationService.getSampleRecommendations();
      }
      
      // Set recommendations state with processed data
      setRecommendations(recommendationsData);
      
      // Cache the results
      recommendationService.cacheRecommendations({
        data: recommendationsData
      });
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      
      // Always use sample recommendations if API fails or returns empty
      const sampleRecommendations = recommendationService.getSampleRecommendations();
      setRecommendations(sampleRecommendations);
      setError(null); // Clear error since we're showing samples
    } finally {
      setIsLoading(false);
      
      
    }
  };
  
  // Handler for refresh button
  const handleRefresh = () => {
    fetchRecommendations(true);
  };
  
  return (
    <>
      <Head>
        <title>Your Book Recommendations | BookReview Platform</title>
        <meta name="description" content="Personalized book recommendations based on your preferences and reading history" />
      </Head>
      
      <div className="recommendations-page">
        <header className="page-header">
          <h1>Your Personalized Book Recommendations</h1>
          <p className="subtitle">
            Discover new books tailored to your reading preferences and history
          </p>
        </header>
        
        <section className="recommendations-section">
          <RecommendationList 
            recommendations={recommendations}
            isLoading={isLoading}
            error={error}
            onRefresh={handleRefresh}
            showFilters={true}
          />
        </section>
        
        <section className="how-it-works">
          <h2>How We Generate Your Recommendations</h2>
          <div className="cards-container">
            <div className="info-card">
              <div className="icon">📚</div>
              <h3>Reading History</h3>
              <p>We analyze the books you've rated and reviewed to understand your preferences.</p>
            </div>
            
            <div className="info-card">
              <div className="icon">❤️</div>
              <h3>Your Favorites</h3>
              <p>Books you've marked as favorites help us identify what you truly love.</p>
            </div>
            
            <div className="info-card">
              <div className="icon">�📚</div>
              <h3>AI-Powered</h3>
              <p>Our recommendation engine uses advanced AI to match you with books you're likely to enjoy.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

// Wrap with requireAuth to protect this page
export default requireAuth(RecommendationsPage);
