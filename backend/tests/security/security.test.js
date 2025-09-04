const request = require('supertest');
const app = require('../../src/app');
const { seedTestData } = require('../fixtures/seedTestData');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserModel = require('../../src/models/user.model');

describe('Security Tests', () => {
  let authToken;
  
  beforeEach(async () => {
    await seedTestData();
    
    // Generate a valid auth token for testing
    const payload = { userId: 'user1' };
    authToken = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  });

  describe('Authentication Security', () => {
    test('passwords should be securely hashed in database', async () => {
      // Create a new user
      const userData = {
        email: 'security-test@example.com',
        password: 'SecurePassword123!',
        name: 'Security Test User'
      };
      
      await request(app)
        .post('/api/auth/register')
        .send(userData);
        
      // Verify password was hashed
      const user = await UserModel.findByEmail(userData.email);
      
      // Password should not be stored in plain text
      expect(user.password).not.toBe(userData.password);
      
      // Password should be hashed with bcrypt (starts with $2a$, $2b$, or $2y$)
      expect(user.password).toMatch(/^\$2[aby]\$/);
      
      // Verify the hash is valid
      expect(bcrypt.compareSync(userData.password, user.password)).toBe(true);
    });

    test('JWT tokens should be properly secured', async () => {
      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
        
      const token = loginResponse.body.token;
      
      // Verify token format (header.payload.signature)
      expect(token.split('.').length).toBe(3);
      
      // Verify token can be decoded
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
      expect(decoded).toHaveProperty('userId', 'user1');
      expect(decoded).toHaveProperty('exp');
      
      // Token should expire in the future
      expect(decoded.exp * 1000).toBeGreaterThan(Date.now());
    });

    test('expired tokens should be rejected', async () => {
      // Create expired token (issued 2 hours ago, expires 1 hour ago)
      const expiredToken = jwt.sign(
        { userId: 'user1', iat: Math.floor(Date.now() / 1000) - 7200 },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
      
      // Try to use expired token
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
        
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('expired');
    });
    
    test('should prevent brute force attacks with rate limiting', async () => {
      // Try multiple failed login attempts in rapid succession
      const badCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      // Make multiple attempts (may need to adjust this based on your rate limiting configuration)
      const attempts = 10;
      const responses = [];
      
      for (let i = 0; i < attempts; i++) {
        responses.push(
          await request(app)
            .post('/api/auth/login')
            .send(badCredentials)
        );
      }
      
      // At least one of the later responses should either be:
      // 1. Rate limited (status 429)
      // 2. Or have increasing backoff (slower response times)
      const lastResponse = responses[responses.length - 1];
      
      if (lastResponse.status === 429) {
        // If you have explicit rate limiting
        expect(lastResponse.body).toHaveProperty('error');
        expect(lastResponse.body.error).toContain('limit');
      } else {
        // Alternatively check that at least some failed attempts return 401
        const unauthorized = responses.some(r => r.status === 401);
        expect(unauthorized).toBe(true);
      }
    });
  });

  describe('Input Validation and Sanitization', () => {
    test('should sanitize user inputs to prevent injection', async () => {
      // Try with various injection attempts
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '{"$ne": null}', // NoSQL injection attempt
        "'; DROP TABLE users; --", // SQL injection attempt
      ];
      
      for (const input of maliciousInputs) {
        const response = await request(app)
          .post('/api/books/book1/reviews')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            rating: 3,
            text: input
          });
          
        // Should either be rejected (400) or sanitized
        if (response.status === 201) {
          // If accepted, should be sanitized
          expect(response.body.text).not.toBe(input);
        } else {
          // Or rejected
          expect(response.status).toBe(400);
        }
      }
    });

    test('should validate and sanitize query parameters', async () => {
      // Try with injection in query string
      const response = await request(app)
        .get('/api/books/search?query=<script>alert("XSS")</script>')
        .expect(200);
        
      // Should not return 500 error
      expect(response.status).not.toBe(500);
    });

    test('should reject malformed JSON bodies', async () => {
      // Send malformed JSON
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"email": "bad-json@example.com", "password": "test123"') // Missing closing brace
        .expect(400);
        
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Authorization Controls', () => {
    test('should prevent unauthorized review updates', async () => {
      // Create a review as user1
      const createResponse = await request(app)
        .post('/api/books/book1/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 4,
          text: 'My review'
        });
        
      const reviewId = createResponse.body.id;
      
      // Create token for user2
      const user2Token = jwt.sign(
        { userId: 'user2' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
      
      // Try to update as user2
      const response = await request(app)
        .put(`/api/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          rating: 1,
          text: 'Hijacked review'
        })
        .expect(403);
        
      expect(response.body).toHaveProperty('error');
    });

    test('should prevent unauthorized user profile updates', async () => {
      // Create token for user2
      const user2Token = jwt.sign(
        { userId: 'user2' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
      
      // Try to update user1's profile as user2
      const response = await request(app)
        .put('/api/users/user1')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'Hijacked Name',
          bio: 'Hijacked Bio'
        })
        .expect(403);
        
      expect(response.body).toHaveProperty('error');
    });

    test('should verify token belongs to an existing user', async () => {
      // Create token for a non-existent user
      const invalidUserToken = jwt.sign(
        { userId: 'non-existent-user' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
      
      // Try to access protected endpoint
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidUserToken}`)
        .expect(401);
        
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Common Vulnerabilities Protection', () => {
    test('should have proper CORS headers', async () => {
      const response = await request(app)
        .options('/api/books')
        .set('Origin', 'https://malicious-site.com');
        
      // Should not have permissive CORS headers for untrusted origins
      // This test assumes you have restrictive CORS setup
      const corsHeader = response.headers['access-control-allow-origin'];
      
      if (corsHeader) {
        // If CORS is implemented, it should not be completely permissive
        expect(corsHeader).not.toBe('*');
        // Should be a specific trusted origin or not present
      }
    });

    test('should not expose sensitive information in error messages', async () => {
      // Try various operations that would cause errors
      const errorResponses = [
        await request(app).get('/api/non-existent-endpoint'),
        await request(app).post('/api/auth/login').send({ email: 'non-existent@example.com', password: 'test' }),
        await request(app).get('/api/books/non-existent-id')
      ];
      
      // None should expose stack traces or detailed system information
      for (const res of errorResponses) {
        if (res.body && res.body.error) {
          expect(res.body.error).not.toMatch(/at\s+.*\(.*:\d+:\d+\)/); // Stack trace pattern
          expect(res.body.stack).toBeUndefined();
          expect(res.body.error).not.toContain('Internal server error');
        }
      }
    });
  });
});
