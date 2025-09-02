// Error handling middleware
const errorMiddleware = (err, req, res, next) => {
  // Log error for debugging
  console.error(err.stack);

  // Default error status and message
  const status = err.status || 500;
  const message = err.message || 'Something went wrong on the server';

  // Return error response
  res.status(status).json({
    error: {
      message,
      status
    }
  });
};

module.exports = errorMiddleware;
