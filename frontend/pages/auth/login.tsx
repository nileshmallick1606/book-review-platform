import React from 'react';
import LoginForm from '../../components/auth/LoginForm';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../../store/auth-context';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const LoginPage: NextPage = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect to home if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  return (
    <>
      <Head>
        <title>Login - BookReview</title>
        <meta name="description" content="Login to BookReview platform" />
      </Head>
      
      <div className="auth-page">
        <div className="auth-container">
          <LoginForm />
          <div className="auth-links">
            <p>
              Don't have an account?{' '}
              <Link href="/auth/register">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
