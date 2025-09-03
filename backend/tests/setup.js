const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Configure longer timeout for tests
jest.setTimeout(10000);

// Mock data directory paths
const TEST_DATA_DIR = path.join(__dirname, 'fixtures', 'data');

// Ensure test data directory exists
async function ensureTestDataDir() {
  try {
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error('Error creating test data directory:', error);
    }
  }
}

// Mock the database file paths
jest.mock('../src/config/db', () => {
  const actualPath = require('path');
  const testDataDir = actualPath.join(__dirname, 'fixtures', 'data');
  
  return {
    getDataFilePath: (collection) => actualPath.join(testDataDir, `${collection}.json`),
    dataDir: testDataDir
  };
});

// Reset all test data files before each test
beforeEach(async () => {
  await ensureTestDataDir();
  
  // Create empty test data files
  const collections = ['users', 'books', 'reviews'];
  for (const collection of collections) {
    const filePath = path.join(TEST_DATA_DIR, `${collection}.json`);
    await fs.writeFile(filePath, '[]', 'utf8');
  }
});

// Clean up test data after all tests
afterAll(async () => {
  try {
    const files = await fs.readdir(TEST_DATA_DIR);
    for (const file of files) {
      await fs.unlink(path.join(TEST_DATA_DIR, file));
    }
    await fs.rmdir(TEST_DATA_DIR);
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
});
