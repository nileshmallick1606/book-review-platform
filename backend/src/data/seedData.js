const fs = require('fs').promises;
const path = require('path');
const { getDataFilePath } = require('../config/db');

// Sample book data for seeding
const books = [
  {
    id: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    description: 'The story of young Scout Finch, her brother Jem, and their father Atticus, a lawyer defending a Black man accused of rape in a racist Southern town.',
    coverImage: 'https://example.com/covers/to-kill-a-mockingbird.jpg',
    genres: ['Fiction', 'Classic', 'Coming-of-Age'],
    publishedYear: 1960,
    averageRating: 4.8,
    reviewCount: 42
  },
  {
    id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    title: '1984',
    author: 'George Orwell',
    description: 'A dystopian novel about a totalitarian regime that controls information and surveils its citizens, following Winston Smith as he rebels against the system.',
    coverImage: 'https://example.com/covers/1984.jpg',
    genres: ['Fiction', 'Dystopian', 'Classic', 'Science Fiction'],
    publishedYear: 1949,
    averageRating: 4.6,
    reviewCount: 38
  },
  {
    id: '6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    description: 'The story follows the main character Elizabeth Bennet as she deals with issues of manners, upbringing, morality, education, and marriage.',
    coverImage: 'https://example.com/covers/pride-and-prejudice.jpg',
    genres: ['Fiction', 'Romance', 'Classic'],
    publishedYear: 1813,
    averageRating: 4.5,
    reviewCount: 35
  },
  {
    id: '4a3d9aaa-608c-49a7-ae4c-9a7b4b1c3d4f',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    description: 'Set in the Jazz Age, it tells the story of the mysterious millionaire Jay Gatsby and his obsession with the beautiful Daisy Buchanan.',
    coverImage: 'https://example.com/covers/the-great-gatsby.jpg',
    genres: ['Fiction', 'Classic', 'Literary Fiction'],
    publishedYear: 1925,
    averageRating: 4.3,
    reviewCount: 29
  },
  {
    id: '5f5d9a9e-3c8c-4f5f-9e6c-1d8c6b7a8c9b',
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    description: 'The story of teenage Holden Caulfield, expelled from his prep school, as he wanders through New York City processing his disillusionment with the adult world.',
    coverImage: 'https://example.com/covers/catcher-in-the-rye.jpg',
    genres: ['Fiction', 'Coming-of-Age', 'Classic'],
    publishedYear: 1951,
    averageRating: 4.2,
    reviewCount: 27
  },
  {
    id: '8c7a5f4d-9c8d-4f6e-9e7b-7c8a9b0a1c2d',
    title: 'Harry Potter and the Philosopher\'s Stone',
    author: 'J.K. Rowling',
    description: 'The story of a young wizard, Harry Potter, who discovers his magical heritage and attends Hogwarts School of Witchcraft and Wizardry.',
    coverImage: 'https://example.com/covers/harry-potter-1.jpg',
    genres: ['Fantasy', 'Young Adult', 'Magic'],
    publishedYear: 1997,
    averageRating: 4.7,
    reviewCount: 56
  },
  {
    id: '3e4f5c6d-7b8a-9c0d-1e2f-3a4b5c6d7e8f',
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    description: 'The journey of home-loving Bilbo Baggins, who is convinced by the wizard Gandalf to join a group of dwarves on a quest to reclaim their mountain home.',
    coverImage: 'https://example.com/covers/the-hobbit.jpg',
    genres: ['Fantasy', 'Adventure', 'Classic'],
    publishedYear: 1937,
    averageRating: 4.7,
    reviewCount: 48
  },
  {
    id: '2f3e4d5c-6b7a-8c9d-0e1f-2a3b4c5d6e7f',
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    description: 'A fable about following your dreams and listening to your heart, following a young Andalusian shepherd on his journey to find treasure.',
    coverImage: 'https://example.com/covers/the-alchemist.jpg',
    genres: ['Fiction', 'Fantasy', 'Philosophy', 'Adventure'],
    publishedYear: 1988,
    averageRating: 4.4,
    reviewCount: 37
  },
  {
    id: '1d2e3f4a-5b6c-7d8e-9f0a-1b2c3d4e5f6a',
    title: 'Dune',
    author: 'Frank Herbert',
    description: 'Set on the desert planet Arrakis, it tells the story of Paul Atreides as his family accepts the stewardship of the planet and its valuable spice melange.',
    coverImage: 'https://example.com/covers/dune.jpg',
    genres: ['Science Fiction', 'Space Opera', 'Adventure'],
    publishedYear: 1965,
    averageRating: 4.6,
    reviewCount: 41
  },
  {
    id: '0c1d2e3f-4a5b-6c7d-8e9f-0a1b2c3d4e5f',
    title: 'The Lord of the Rings',
    author: 'J.R.R. Tolkien',
    description: 'The saga of a group of heroes who set out to save their world from the dark lord Sauron by destroying a powerful and evil ring.',
    coverImage: 'https://example.com/covers/lotr.jpg',
    genres: ['Fantasy', 'Epic', 'Adventure', 'Classic'],
    publishedYear: 1954,
    averageRating: 4.9,
    reviewCount: 63
  },
  {
    id: '9b8c7d6e-5f4a-3b2c-1d0e-9f8a7b6c5d4e',
    title: 'Brave New World',
    author: 'Aldous Huxley',
    description: 'A dystopian novel set in a futuristic World State where citizens are environmentally engineered into a rigid social hierarchy.',
    coverImage: 'https://example.com/covers/brave-new-world.jpg',
    genres: ['Science Fiction', 'Dystopian', 'Classic'],
    publishedYear: 1932,
    averageRating: 4.3,
    reviewCount: 31
  },
  {
    id: '8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d',
    title: 'The Hunger Games',
    author: 'Suzanne Collins',
    description: 'In a dystopian future, the nation of Panem forces children to fight to the death in an annual televised event called the Hunger Games.',
    coverImage: 'https://example.com/covers/hunger-games.jpg',
    genres: ['Young Adult', 'Dystopian', 'Science Fiction', 'Adventure'],
    publishedYear: 2008,
    averageRating: 4.5,
    reviewCount: 45
  },
  {
    id: '7f6e5d4c-3b2a-1f0e-9d8c-7b6a5f4e3d2c',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    description: 'A survey of the history of humankind from the evolution of archaic human species in the Stone Age up to the present day.',
    coverImage: 'https://example.com/covers/sapiens.jpg',
    genres: ['Non-Fiction', 'History', 'Science', 'Anthropology'],
    publishedYear: 2011,
    averageRating: 4.7,
    reviewCount: 39
  },
  {
    id: '6d5e4f3a-2b1c-0d9e-8f7a-6b5c4d3e2f1a',
    title: 'The Kite Runner',
    author: 'Khaled Hosseini',
    description: 'The story of Amir, a young boy from Kabul, and his journey of redemption following a childhood incident that destroyed his friendship with Hassan.',
    coverImage: 'https://example.com/covers/kite-runner.jpg',
    genres: ['Fiction', 'Historical Fiction', 'Drama'],
    publishedYear: 2003,
    averageRating: 4.6,
    reviewCount: 36
  },
  {
    id: '5c4d3e2f-1a0b-9d8e-7f6a-5b4c3d2e1f0a',
    title: 'Crime and Punishment',
    author: 'Fyodor Dostoevsky',
    description: 'A novel that explores the mental anguish and moral dilemmas of Rodion Raskolnikov, an impoverished ex-student in Saint Petersburg who murders a pawnbroker for her money.',
    coverImage: 'https://example.com/covers/crime-and-punishment.jpg',
    genres: ['Fiction', 'Classic', 'Psychological', 'Philosophy'],
    publishedYear: 1866,
    averageRating: 4.4,
    reviewCount: 32
  }
];

// Function to seed the books data
async function seedBooks() {
  try {
    const booksFilePath = getDataFilePath('books');
    await fs.writeFile(booksFilePath, JSON.stringify(books, null, 2));
    console.log('Books data seeded successfully!');
    return books;
  } catch (error) {
    console.error('Error seeding books data:', error);
    throw error;
  }
}

// Export seed functions
module.exports = {
  seedBooks
};
