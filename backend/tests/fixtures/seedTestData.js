const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const TEST_DATA_DIR = path.join(__dirname, '..', 'fixtures', 'data');

// Test user data
const users = [
  {
    id: 'user1',
    email: 'test@example.com',
    password: bcrypt.hashSync('password123', 10),
    name: 'Test User',
    favorites: []
  },
  {
    id: 'user2',
    email: 'admin@example.com',
    password: bcrypt.hashSync('admin123', 10),
    name: 'Admin User',
    favorites: []
  }
];

// Test book data
const books = [
  {
    id: 'book1',
    title: 'Test Book 1',
    author: 'Author One',
    description: 'Description of test book 1',
    coverImage: 'https://example.com/cover1.jpg',
    genres: ['Fiction', 'Mystery'],
    publishedYear: 2020,
    averageRating: 0,
    reviewCount: 0
  },
  {
    id: 'book2',
    title: 'Test Book 2',
    author: 'Author Two',
    description: 'Description of test book 2',
    coverImage: 'https://example.com/cover2.jpg',
    genres: ['Non-Fiction', 'Biography'],
    publishedYear: 2019,
    averageRating: 0,
    reviewCount: 0
  }
];

// Test review data
const reviews = [
  {
    id: 'review1',
    bookId: 'book1',
    userId: 'user1',
    text: 'This is a test review',
    rating: 4,
    timestamp: new Date().toISOString()
  }
];

// Function to seed test data
async function seedTestData() {
  try {
    // Ensure test data directory exists
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    
    // Write test data to files
    await fs.writeFile(
      path.join(TEST_DATA_DIR, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    
    await fs.writeFile(
      path.join(TEST_DATA_DIR, 'books.json'),
      JSON.stringify(books, null, 2)
    );
    
    await fs.writeFile(
      path.join(TEST_DATA_DIR, 'reviews.json'),
      JSON.stringify(reviews, null, 2)
    );
    
    console.log('Test data seeded successfully');
  } catch (error) {
    console.error('Error seeding test data:', error);
  }
}

// Export the data and seeding function
module.exports = {
  users,
  books,
  reviews,
  seedTestData
};

// If run directly, seed the data
if (require.main === module) {
  seedTestData();
}
