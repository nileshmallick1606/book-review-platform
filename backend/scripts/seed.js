const { initializeDatabase } = require('../src/config/db');
const { seedBooks } = require('../src/data/seedData');

async function seedDatabase() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    
    console.log('Seeding books data...');
    const books = await seedBooks();
    console.log(`${books.length} books seeded successfully!`);
    
    console.log('Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
