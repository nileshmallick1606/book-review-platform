import React from 'react';
import { useAuth } from '../../store';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return <div>Not logged in</div>;
  }

  return (
    <div className="user-profile">
      <h1>User Profile</h1>
      <div className="profile-info">
        <div className="info-group">
          <label>Name:</label>
          <span>{user.name}</span>
        </div>
        <div className="info-group">
          <label>Email:</label>
          <span>{user.email}</span>
        </div>
      </div>
      
      <button 
        className="logout-button" 
        onClick={logout}
      >
        Logout
      </button>
    </div>
  );
};

export default UserProfile;
