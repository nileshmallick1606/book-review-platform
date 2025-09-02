import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store';
import userService from '../../services/userService';
import EditProfileForm from './EditProfileForm';
import UserReviews from '../review/UserReviews';
import UserFavorites from '../book/UserFavorites';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [userStats, setUserStats] = useState({ reviewCount: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Get user stats if logged in
    if (user) {
      setIsLoading(true);
      userService.getUserProfile(user.id)
        .then(data => {
          setUserStats({ reviewCount: data.user.reviewCount || 0 });
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching profile stats:', error);
          setIsLoading(false);
        });
    }
  }, [user]);

  if (!user) {
    return <div className="not-logged-in">Please log in to view your profile</div>;
  }

  if (isLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="user-profile-container">
      <div className="profile-header">
        <h1>{user.name}'s Profile</h1>
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{userStats.reviewCount}</span>
            <span className="stat-label">Reviews</span>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`} 
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`} 
          onClick={() => setActiveTab('reviews')}
        >
          My Reviews
        </button>
        <button 
          className={`tab-button ${activeTab === 'favorites' ? 'active' : ''}`} 
          onClick={() => setActiveTab('favorites')}
        >
          Favorites
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'profile' && (
          <div className="profile-info">
            {!isEditing ? (
              <>
                <div className="info-group">
                  <label>Name:</label>
                  <span>{user.name}</span>
                </div>
                <div className="info-group">
                  <label>Email:</label>
                  <span>{user.email}</span>
                </div>
                {user.bio && (
                  <div className="info-group">
                    <label>Bio:</label>
                    <span>{user.bio}</span>
                  </div>
                )}
                {user.location && (
                  <div className="info-group">
                    <label>Location:</label>
                    <span>{user.location}</span>
                  </div>
                )}
                <div className="profile-actions">
                  <button 
                    className="edit-button" 
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                  <button 
                    className="logout-button" 
                    onClick={logout}
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <EditProfileForm 
                user={user} 
                onCancel={() => setIsEditing(false)}
                onSuccess={() => {
                  setIsEditing(false);
                  // Refresh user data
                  userService.getUserProfile(user.id)
                    .then(data => {
                      setUserStats({ reviewCount: data.user.reviewCount || 0 });
                    })
                    .catch(error => {
                      console.error('Error refreshing profile:', error);
                    });
                }}
              />
            )}
          </div>
        )}
        
        {activeTab === 'reviews' && (
          <div className="reviews-tab">
            {user && <UserReviews userId={user.id} />}
          </div>
        )}
        
        {activeTab === 'favorites' && (
          <div className="favorites-tab">
            {user && <UserFavorites userId={user.id} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
