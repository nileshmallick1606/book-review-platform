import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../store';

const Home: NextPage = () => {
  const { isAuthenticated, user, logout } = useAuth();

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
