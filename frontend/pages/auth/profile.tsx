import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import UserProfile from '../../components/auth/UserProfile';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

const ProfilePage: NextPage = () => {
  return (
    <ProtectedRoute>
      <Head>
        <title>My Profile - BookReview</title>
        <meta name="description" content="Your profile on BookReview platform" />
      </Head>
      
      <div className="profile-page">
        <UserProfile />
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;
