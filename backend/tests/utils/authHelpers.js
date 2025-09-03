const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const { userFactory } = require('./factories');

/**
 * Generates a JWT token for a test user
 * @param {Object} user - User object to generate token for
 * @returns {String} JWT token
 */
function generateTestToken(user = null) {
  const testUser = user || userFactory();
  
  return jwt.sign(
    { id: testUser.id, email: testUser.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

/**
 * Adds authentication headers to a supertest request
 * @param {Object} request - Supertest request object
 * @param {String} token - JWT token
 * @returns {Object} Request with auth headers
 */
function addAuthHeader(request, token) {
  return request.set('Authorization', `Bearer ${token}`);
}

module.exports = {
  generateTestToken,
  addAuthHeader
};
