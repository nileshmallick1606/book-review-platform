import React, { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../store';
import RecommendationList from '../components/recommendation/RecommendationList';
import recommendationService from '../services/recommendationService';

interface Recommendation {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  reason: string;
  genres?: string[];
}

const Home: NextPage = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  // Fetch recommendations when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchRecommendations();
    }
  }, [isAuthenticated]);
  
  // Force recommendation refresh when user returns to home page
  useEffect(() => {
    // This will run when the component mounts
    
    // Create a function to handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        fetchRecommendations();
      }
    };
    
    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  // Function to fetch recommendations
  const fetchRecommendations = async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingRecommendations(true);
    setRecommendationError(null);
    
    try {
      // Try to get from cache first
      const cachedData = recommendationService.getCachedRecommendations();
      if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        setRecommendations(cachedData);
        setIsLoadingRecommendations(false);
        return;
      }
      
      // Fetch from API
      const response = await recommendationService.getRecommendations({ limit: 3 });
      console.log('Home page: API response', response);
      
      // Extract recommendations data correctly based on API response structure
      let recommendationsData = [];
      
      if (response && response.data) {
        // Handle possible response structures
        if (Array.isArray(response.data)) {
          recommendationsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          recommendationsData = response.data.data;
        }
      }
      
      // If no recommendations, use sample recommendations
      if (!recommendationsData.length) {
        recommendationsData = recommendationService.getSampleRecommendations();
      }
      
      setRecommendations(recommendationsData);
      
      // Cache the results
      recommendationService.cacheRecommendations({
        data: recommendationsData
      });
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setRecommendationError('Failed to load recommendations.');
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  return (
    <>
      <Head>
        <title>BookReview Platform</title>
        <meta name="description" content="A platform for book reviews and recommendations" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container">
        <h1>Welcome to BookReview Platform</h1>
        <p>Discover books, share reviews, and get personalized recommendations.</p>
        
        <div style={{ marginTop: '2rem' }}>
          {isAuthenticated ? (
            <div>
              <p>Welcome back, {user?.name}!</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <Link href="/auth/profile">
                  <span style={{ padding: '0.5rem 1rem', backgroundColor: '#0070f3', color: 'white', borderRadius: '4px', cursor: 'pointer', display: 'inline-block' }}>
                    View Profile
                  </span>
                </Link>
                <button
                  onClick={logout}
                  style={{ padding: '0.5rem 1rem', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Logout
                </button>
              </div>
              
              {/* Recommendations Section */}
              <section className="recommendations-section" style={{ marginTop: '3rem' }}>
                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2>Recommended for You</h2>
                  <Link href="/recommendations">
                    <span style={{ color: '#0070f3', cursor: 'pointer' }}>
                      View All Recommendations
                    </span>
                  </Link>
                </div>
                
                <RecommendationList 
                  recommendations={recommendations}
                  isLoading={isLoadingRecommendations}
                  error={recommendationError}
                  onRefresh={fetchRecommendations}
                />
              </section>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Link href="/auth/login">
                <span style={{ padding: '0.5rem 1rem', backgroundColor: '#0070f3', color: 'white', borderRadius: '4px', cursor: 'pointer', display: 'inline-block' }}>
                  Login
                </span>
              </Link>
              <Link href="/auth/register">
                <span style={{ padding: '0.5rem 1rem', backgroundColor: '#009688', color: 'white', borderRadius: '4px', cursor: 'pointer', display: 'inline-block' }}>
                  Register
                </span>
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Home;
