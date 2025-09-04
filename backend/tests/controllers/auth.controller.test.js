const request = require('supertest');
const app = require('../../src/app');
const userModel = require('../../src/models/user.model');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const { 
  userFactory, 
  clearAllTestData, 
  addTestEntity, 
  generateTestToken,
  expectErrorResponse
} = require('../utils');

// Mock JWT functions
jest.mock('jsonwebtoken');

describe('Authentication Controller', () => {
  beforeEach(async () => {
    await clearAllTestData();
    
    // Reset JWT mock
    jwt.sign.mockReset();
    jwt.sign.mockReturnValue('test-token');
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).toHaveProperty('name', userData.name);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('token', 'test-token');
      
      // Verify JWT was created with correct data
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign.mock.calls[0][0]).toHaveProperty('email', userData.email);
      expect(jwt.sign.mock.calls[0][1]).toBe(config.jwtSecret);
      
      // Verify user was stored in database
      const users = await userModel.findAll();
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe(userData.email);
    });

    it('should return 409 if user already exists', async () => {
      // Create a user first
      const existingUser = userFactory({
        email: 'existing@example.com',
        password: 'hashedPassword',
        name: 'Existing User'
      });
      
      await addTestEntity('users', existingUser);
      
      // Try to register with the same email
      const userData = {
        email: 'existing@example.com',
        password: 'newpassword',
        name: 'New User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expectErrorResponse(response, 409, 'User with this email already exists');
      
      // Verify no new user was created
      const users = await userModel.findAll();
      expect(users).toHaveLength(1);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Incomplete User' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields');
      expect(response.body).toHaveProperty('message', 'Email, password, and name are required');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully with correct credentials', async () => {
      // Create a user with known password
      const password = 'password123';
      const user = await userModel.create({
        email: 'login@example.com',
        password,
        name: 'Login Test User'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', user.id);
      expect(response.body.user).toHaveProperty('email', user.email);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('token', 'test-token');
    });

    it('should return 401 with invalid email', async () => {
      // Create a user
      await userModel.create({
        email: 'real@example.com',
        password: 'password123',
        name: 'Real User'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expectErrorResponse(response, 401, 'Invalid credentials');
    });

    it('should return 401 with invalid password', async () => {
      // Create a user with known password
      await userModel.create({
        email: 'test@example.com',
        password: 'correctpassword',
        name: 'Test User'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expectErrorResponse(response, 401, 'Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile when authenticated', async () => {
      // Create a test user
      const user = await userModel.create({
        email: 'profile@example.com',
        password: 'password123',
        name: 'Profile User'
      });

      // Mock JWT verification
      jwt.verify = jest.fn().mockReturnValue({ id: user.id, email: user.email });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', user.id);
      expect(response.body.user).toHaveProperty('email', user.email);
      expect(response.body.user).toHaveProperty('name', user.name);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expectErrorResponse(response, 401, 'Authentication required');
    });

    it('should return 401 when an invalid token is provided', async () => {
      // Mock JWT verification to throw an error
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expectErrorResponse(response, 401, 'Invalid or expired token');
    });

    it('should return 404 when user no longer exists', async () => {
      // Mock JWT verification but don't create the user
      jwt.verify = jest.fn().mockReturnValue({ id: 'nonexistent-id', email: 'ghost@example.com' });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer test-token');

      expectErrorResponse(response, 404, 'User not found');
    });
  });
});
