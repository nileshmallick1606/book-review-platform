import type { NextPage } from 'next';
import Head from 'next/head';

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>BookReview Platform</title>
        <meta name="description" content="A platform for book reviews and recommendations" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Welcome to BookReview Platform</h1>
        <p>Discover books, share reviews, and get personalized recommendations.</p>
      </main>
    </div>
  );
};

export default Home;
