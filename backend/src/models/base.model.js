const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { getDataFilePath } = require('../config/db');

class BaseModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.filePath = getDataFilePath(collectionName);
  }

  // Get all items
  async findAll() {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.writeFile(this.filePath, JSON.stringify([]));
        return [];
      }
      throw error;
    }
  }

  // Get item by ID
  async findById(id) {
    const items = await this.findAll();
    return items.find(item => item.id === id);
  }

  // Create new item
  async create(data) {
    const items = await this.findAll();
    const newItem = {
      id: uuidv4(),
      ...data
    };
    
    items.push(newItem);
    await fs.writeFile(this.filePath, JSON.stringify(items, null, 2));
    return newItem;
  }

  // Update existing item
  async update(id, data) {
    const items = await this.findAll();
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const updatedItem = { ...items[index], ...data };
    items[index] = updatedItem;
    
    await fs.writeFile(this.filePath, JSON.stringify(items, null, 2));
    return updatedItem;
  }

  // Delete item
  async delete(id) {
    const items = await this.findAll();
    const filteredItems = items.filter(item => item.id !== id);
    
    if (filteredItems.length === items.length) {
      return false; // Nothing was deleted
    }
    
    await fs.writeFile(this.filePath, JSON.stringify(filteredItems, null, 2));
    return true;
  }

  // Find items by custom query
  async findBy(queryFn) {
    const items = await this.findAll();
    return items.filter(queryFn);
  }
}

module.exports = BaseModel;
