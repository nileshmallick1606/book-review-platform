const fs = require('fs').promises;
const path = require('path');

// Path to the data directory
const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
};

// Create or get data file
const getDataFilePath = (fileName) => {
  return path.join(DATA_DIR, `${fileName}.json`);
};

// Initialize a data file with empty array if it doesn't exist
const initializeDataFile = async (fileName) => {
  const filePath = getDataFilePath(fileName);
  try {
    await fs.access(filePath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(filePath, JSON.stringify([]));
    } else {
      throw err;
    }
  }
};

// Initialize all data files
const initializeDatabase = async () => {
  await ensureDataDir();
  await Promise.all([
    initializeDataFile('users'),
    initializeDataFile('books'),
    initializeDataFile('reviews')
  ]);
};

module.exports = {
  initializeDatabase,
  getDataFilePath
};
