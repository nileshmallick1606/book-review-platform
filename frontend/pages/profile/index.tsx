import React from 'react';
import UserProfile from '../../components/auth/UserProfile';
import { useAuth } from '../../store';
import Layout from '../../components/layout/Layout';
import { useRouter } from 'next/router';

const ProfilePage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Redirect if not authenticated
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?returnUrl=/profile');
    }
  }, [user, loading, router]);
  
  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }
  
  if (!user) {
    return null; // Will redirect
  }

  return (
    <Layout>
      <div className="profile-page">
        <UserProfile />
      </div>
    </Layout>
  );
};

export default ProfilePage;
