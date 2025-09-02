const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth.routes');
const bookRoutes = require('./routes/book.routes');
const reviewRoutes = require('./routes/review.routes');
const userRoutes = require('./routes/user.routes');
const recommendationRoutes = require('./routes/recommendation.routes');

const errorMiddleware = require('./middleware/error.middleware');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Logging
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json()); // Parse JSON bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use(errorMiddleware);

// Start server
if (process.env.NODE_ENV !== 'test') {
  // Initialize book ratings from reviews
  const bookModel = require('./models/book.model');
  
  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    
    // Update all book ratings on server start
    try {
      await bookModel.updateAllBookRatings();
      console.log('All book ratings updated from reviews data');
    } catch (error) {
      console.error('Failed to update book ratings:', error);
    }
  });
}

module.exports = app; // For testing
