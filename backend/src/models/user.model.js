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
      password: hashedPassword
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
}

module.exports = new UserModel();
