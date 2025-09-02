import type { AppProps } from 'next/app';
import '../styles/globals.css';
import '../styles/auth.css';
import '../styles/books.css';
import '../styles/layout.css';
import '../styles/profile.css';
import '../styles/favorites.css';
import { AuthProvider } from '../store';
import Layout from '../components/layout/Layout';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}

export default MyApp;
