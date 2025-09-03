const userModel = require('../../src/models/user.model');
const { clearAllTestData, userFactory } = require('../utils');
const bcrypt = require('bcryptjs');

// Mock bcrypt
jest.mock('bcryptjs');

describe('User Model', () => {
  beforeEach(async () => {
    await clearAllTestData();
    
    // Reset bcrypt mock
    bcrypt.hashSync.mockReset();
    bcrypt.hashSync.mockReturnValue('hashed_password');
    
    bcrypt.compareSync.mockReset();
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'plaintext_password',
        name: 'Test User'
      };

      const user = await userModel.create(userData);

      // Check that password was hashed
      expect(bcrypt.hashSync).toHaveBeenCalledWith(userData.password, expect.any(Number));
      expect(user.password).toBe('hashed_password');
      
      // Check that user has expected properties
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email', userData.email);
      expect(user).toHaveProperty('name', userData.name);
      expect(user).toHaveProperty('password');
    });
  });

  describe('findByEmail', () => {
    it('should return user with matching email', async () => {
      // Create a test user
      const testUser = userFactory({
        email: 'find@example.com',
        name: 'Find Me'
      });
      
      // Add to database
      await userModel.create(testUser);
      
      // Find the user by email
      const foundUser = await userModel.findByEmail('find@example.com');
      
      // Check that user was found
      expect(foundUser).toBeTruthy();
      expect(foundUser.email).toBe(testUser.email);
      expect(foundUser.name).toBe(testUser.name);
    });
    
    it('should return null when no user has the email', async () => {
      const foundUser = await userModel.findByEmail('nonexistent@example.com');
      expect(foundUser).toBeUndefined();
    });
  });

  describe('verifyPassword', () => {
    it('should return true when password is valid', async () => {
      // Setup bcrypt to return true for this test
      bcrypt.compareSync.mockReturnValue(true);
      
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashed_password',
        name: 'Test User'
      };
      
      const isValid = await userModel.verifyPassword(user, 'correct_password');
      
      // Check that bcrypt.compare was called with the right arguments
      expect(bcrypt.compareSync).toHaveBeenCalledWith('correct_password', 'hashed_password');
      expect(isValid).toBe(true);
    });
    
    it('should return false when password is invalid', async () => {
      // Setup bcrypt to return false for this test
      bcrypt.compareSync.mockReturnValue(false);
      
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashed_password',
        name: 'Test User'
      };
      
      const isValid = await userModel.verifyPassword(user, 'wrong_password');
      
      // Check that bcrypt.compare was called with the right arguments
      expect(bcrypt.compareSync).toHaveBeenCalledWith('wrong_password', 'hashed_password');
      expect(isValid).toBe(false);
    });
  });
});
