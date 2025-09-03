/**
 * Helper to test pagination response structure
 * @param {Object} response - API response object
 * @param {Number} expectedItems - Expected number of items
 */
function expectPaginatedResponse(response, expectedItems = null) {
  expect(response.body).toHaveProperty('data');
  expect(response.body).toHaveProperty('pagination');
  expect(response.body.pagination).toHaveProperty('total');
  expect(response.body.pagination).toHaveProperty('page');
  expect(response.body.pagination).toHaveProperty('pageSize');
  expect(response.body.pagination).toHaveProperty('totalPages');
  
  if (expectedItems !== null) {
    expect(response.body.data).toHaveLength(expectedItems);
  }
}

/**
 * Helper to test error response structure
 * @param {Object} response - API response object
 * @param {Number} expectedStatus - Expected HTTP status code
 * @param {String} expectedMessage - Expected error message
 */
function expectErrorResponse(response, expectedStatus, expectedMessage = null) {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('message');
  
  if (expectedMessage) {
    expect(response.body.message).toBe(expectedMessage);
  }
}

/**
 * Helper to test book object structure
 * @param {Object} book - Book object
 */
function expectValidBookObject(book) {
  expect(book).toHaveProperty('id');
  expect(book).toHaveProperty('title');
  expect(book).toHaveProperty('author');
  expect(book).toHaveProperty('description');
  expect(book).toHaveProperty('coverImage');
  expect(book).toHaveProperty('genres');
  expect(book).toHaveProperty('publishedYear');
  expect(book).toHaveProperty('averageRating');
  expect(book).toHaveProperty('reviewCount');
  expect(Array.isArray(book.genres)).toBe(true);
}

/**
 * Helper to test review object structure
 * @param {Object} review - Review object
 */
function expectValidReviewObject(review) {
  expect(review).toHaveProperty('id');
  expect(review).toHaveProperty('bookId');
  expect(review).toHaveProperty('userId');
  expect(review).toHaveProperty('text');
  expect(review).toHaveProperty('rating');
  expect(review).toHaveProperty('timestamp');
  expect(typeof review.rating).toBe('number');
  expect(review.rating).toBeGreaterThanOrEqual(1);
  expect(review.rating).toBeLessThanOrEqual(5);
}

/**
 * Helper to test user object structure (without password)
 * @param {Object} user - User object
 */
function expectValidUserObject(user) {
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('email');
  expect(user).toHaveProperty('name');
  expect(user).not.toHaveProperty('password');
}

module.exports = {
  expectPaginatedResponse,
  expectErrorResponse,
  expectValidBookObject,
  expectValidReviewObject,
  expectValidUserObject
};
