import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../store';

const Home: NextPage = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div>
      <Head>
        <title>BookReview Platform</title>
        <meta name="description" content="A platform for book reviews and recommendations" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <h1>Welcome to BookReview Platform</h1>
        <p>Discover books, share reviews, and get personalized recommendations.</p>
        
        <div style={{ marginTop: '2rem' }}>
          {isAuthenticated ? (
            <div>
              <p>Welcome back, {user?.name}!</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <Link href="/auth/profile" style={{ padding: '0.5rem 1rem', backgroundColor: '#0070f3', color: 'white', borderRadius: '4px' }}>
                  View Profile
                </Link>
                <button
                  onClick={logout}
                  style={{ padding: '0.5rem 1rem', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Link href="/auth/login" style={{ padding: '0.5rem 1rem', backgroundColor: '#0070f3', color: 'white', borderRadius: '4px' }}>
                Login
              </Link>
              <Link href="/auth/register" style={{ padding: '0.5rem 1rem', backgroundColor: '#009688', color: 'white', borderRadius: '4px' }}>
                Register
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
