const fs = require('fs').promises;
const path = require('path');
const { getDataFilePath } = require('../../src/config/db');

/**
 * Reads test data from a collection
 * @param {String} collection - Collection name (users, books, reviews)
 * @returns {Array} Collection data
 */
async function readTestData(collection) {
  try {
    const filePath = getDataFilePath(collection);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Writes test data to a collection
 * @param {String} collection - Collection name (users, books, reviews)
 * @param {Array} data - Data to write
 */
async function writeTestData(collection, data) {
  const filePath = getDataFilePath(collection);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Adds a test entity to a collection
 * @param {String} collection - Collection name
 * @param {Object} entity - Entity to add
 * @returns {Object} Added entity
 */
async function addTestEntity(collection, entity) {
  const data = await readTestData(collection);
  data.push(entity);
  await writeTestData(collection, data);
  return entity;
}

/**
 * Clears all test data
 */
async function clearAllTestData() {
  const collections = ['users', 'books', 'reviews'];
  for (const collection of collections) {
    await writeTestData(collection, []);
  }
}

/**
 * Loads a set of seed data into the test database
 * @param {Object} seedData - Object with users, books, and reviews arrays
 */
async function loadSeedData(seedData) {
  if (seedData.users) {
    await writeTestData('users', seedData.users);
  }
  
  if (seedData.books) {
    await writeTestData('books', seedData.books);
  }
  
  if (seedData.reviews) {
    await writeTestData('reviews', seedData.reviews);
  }
}

module.exports = {
  readTestData,
  writeTestData,
  addTestEntity,
  clearAllTestData,
  loadSeedData
};
