const fs = require('fs').promises;
const path = require('path');
const UserModel = require('../../src/models/user.model');
const BookModel = require('../../src/models/book.model');
const { seedTestData } = require('../fixtures/seedTestData');

describe('Profile Service', () => {
  beforeEach(async () => {
    // Seed test data before each test
    await seedTestData();
  });
  
  describe('Profile Management', () => {
    test('Should retrieve user profile by ID', async () => {
      const userId = 'user1';
      const user = await UserModel.findById(userId);
      
      expect(user).toBeDefined();
      expect(user.id).toBe(userId);
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      // Password should not be returned in profile data
      expect(user.password).toBeUndefined();
    });
    
    test('Should update profile information', async () => {
      const userId = 'user1';
      const updatedInfo = {
        name: 'Updated User Name',
        bio: 'New user biography',
        location: 'New York'
      };
      
      const updatedUser = await UserModel.update(userId, updatedInfo);
      
      expect(updatedUser).toBeDefined();
      expect(updatedUser.name).toBe('Updated User Name');
      expect(updatedUser.bio).toBe('New user biography');
      expect(updatedUser.location).toBe('New York');
      
      // Verify persistence by retrieving again
      const retrievedUser = await UserModel.findById(userId);
      expect(retrievedUser.name).toBe('Updated User Name');
    });
    
    test('Should validate required profile fields', async () => {
      const userId = 'user1';
      
      // Empty name should be rejected
      await expect(
        UserModel.update(userId, { name: '' })
      ).rejects.toThrow('Name cannot be empty');
      
      // Invalid email format should be rejected
      await expect(
        UserModel.update(userId, { email: 'invalid-email' })
      ).rejects.toThrow('Invalid email format');
    });
    
    test('Should return 404 for non-existent user', async () => {
      await expect(
        UserModel.findById('nonexistent-user')
      ).rejects.toThrow('User not found');
    });
  });
  
  describe('Favorites Management', () => {
    test('Should add a book to user favorites', async () => {
      const userId = 'user1';
      const bookId = 'book1';
      
      const user = await UserModel.addFavorite(userId, bookId);
      
      expect(user).toBeDefined();
      expect(user.favorites).toContain(bookId);
      
      // Verify persistence
      const retrievedUser = await UserModel.findById(userId);
      expect(retrievedUser.favorites).toContain(bookId);
    });
    
    test('Should remove a book from user favorites', async () => {
      const userId = 'user1';
      const bookId = 'book1';
      
      // First add to favorites
      await UserModel.addFavorite(userId, bookId);
      
      // Then remove
      const user = await UserModel.removeFavorite(userId, bookId);
      
      expect(user).toBeDefined();
      expect(user.favorites).not.toContain(bookId);
      
      // Verify persistence
      const retrievedUser = await UserModel.findById(userId);
      expect(retrievedUser.favorites).not.toContain(bookId);
    });
    
    test('Should retrieve user favorite books with details', async () => {
      const userId = 'user1';
      const bookId = 'book1';
      
      // Add to favorites
      await UserModel.addFavorite(userId, bookId);
      
      // Get detailed favorites
      const favorites = await UserModel.getFavoriteBooks(userId);
      
      expect(favorites).toBeDefined();
      expect(favorites.length).toBe(1);
      expect(favorites[0].id).toBe(bookId);
      expect(favorites[0].title).toBe('Test Book 1');
      expect(favorites[0].author).toBe('Author One');
    });
    
    test('Should prevent adding duplicate favorites', async () => {
      const userId = 'user1';
      const bookId = 'book1';
      
      // Add to favorites first time
      await UserModel.addFavorite(userId, bookId);
      
      // Try adding again
      const user = await UserModel.addFavorite(userId, bookId);
      
      // Should still have only one instance
      expect(user.favorites.filter(id => id === bookId).length).toBe(1);
    });
    
    test('Should handle non-existent book ID gracefully', async () => {
      const userId = 'user1';
      const nonExistentBookId = 'non-existent-book';
      
      await expect(
        UserModel.addFavorite(userId, nonExistentBookId)
      ).rejects.toThrow('Book not found');
    });
  });
});
