const BaseModel = require('./base.model');
const bcrypt = require('bcryptjs');

class UserModel extends BaseModel {
  constructor() {
    super('users');
  }

  // Create a new user with password hashing
  async create(data) {
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Create user with hashed password
    return super.create({
      ...data,
      password: hashedPassword,
      favorites: [] // Initialize empty favorites array
    });
  }

  // Find user by email
  async findByEmail(email) {
    const users = await this.findAll();
    return users.find(user => user.email === email);
  }

  // Verify password
  async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password);
  }

  // Update user without changing password
  async updateProfile(id, data) {
    // Don't allow password update through this method
    const { password, ...updateData } = data;
    return super.update(id, updateData);
  }

  // Update password
  async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return super.update(id, { password: hashedPassword });
  }
  
  // Add a book to user's favorites
  async addFavoriteBook(userId, bookId) {
    const user = await this.findById(userId);
    if (!user) return null;

    // Initialize favorites if it doesn't exist
    if (!user.favorites) user.favorites = [];

    // Check if book is already in favorites
    if (!user.favorites.includes(bookId)) {
      user.favorites.push(bookId);
      return await this.update(userId, { favorites: user.favorites });
    }
    return user;
  }

  // Remove a book from user's favorites
  async removeFavoriteBook(userId, bookId) {
    const user = await this.findById(userId);
    if (!user || !user.favorites) return null;

    // Remove bookId from favorites
    user.favorites = user.favorites.filter(id => id !== bookId);
    return await this.update(userId, { favorites: user.favorites });
  }

  // Get user's favorite books
  async getFavoriteBooks(userId) {
    const user = await this.findById(userId);
    return user?.favorites || [];
  }
}

module.exports = new UserModel();
