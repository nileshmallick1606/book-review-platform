import React from 'react';
import RegisterForm from '../../components/auth/RegisterForm';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../../store/auth-context';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const RegisterPage: NextPage = () => {
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
        <title>Register - BookReview</title>
        <meta name="description" content="Create a new account on BookReview platform" />
      </Head>
      
      <div className="auth-page">
        <div className="auth-container">
          <RegisterForm />
          <div className="auth-links">
            <p>
              Already have an account?{' '}
              <Link href="/auth/login">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
