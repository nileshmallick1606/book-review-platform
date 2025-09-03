const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/**
 * User factory for creating test user objects
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} User object
 */
function userFactory(overrides = {}) {
  const id = overrides.id || uuidv4();
  return {
    id,
    email: overrides.email || `user-${id}@example.com`,
    password: overrides.password || bcrypt.hashSync('password123', 10),
    name: overrides.name || `Test User ${id}`,
    favorites: overrides.favorites || [],
    ...overrides
  };
}

/**
 * Book factory for creating test book objects
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Book object
 */
function bookFactory(overrides = {}) {
  const id = overrides.id || uuidv4();
  return {
    id,
    title: overrides.title || `Test Book ${id}`,
    author: overrides.author || `Author ${id}`,
    description: overrides.description || `Description for test book ${id}`,
    coverImage: overrides.coverImage || `https://example.com/cover-${id}.jpg`,
    genres: overrides.genres || ['Fiction', 'Test'],
    publishedYear: overrides.publishedYear || 2023,
    averageRating: overrides.averageRating || 0,
    reviewCount: overrides.reviewCount || 0,
    ...overrides
  };
}

/**
 * Review factory for creating test review objects
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} Review object
 */
function reviewFactory(overrides = {}) {
  const id = overrides.id || uuidv4();
  return {
    id,
    bookId: overrides.bookId || uuidv4(),
    userId: overrides.userId || uuidv4(),
    text: overrides.text || `This is test review ${id}`,
    rating: overrides.rating || Math.floor(Math.random() * 4) + 1, // Random rating 1-5
    timestamp: overrides.timestamp || new Date().toISOString(),
    ...overrides
  };
}

module.exports = {
  userFactory,
  bookFactory,
  reviewFactory
};
