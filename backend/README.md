# Backend: BookReview Platform

This is the backend API for the BookReview Platform - a modern web application for discovering books, sharing reviews, and receiving personalized recommendations.

## Tech Stack

- **Framework**: Express.js (Node.js)
- **Authentication**: JWT
- **Data Storage**: File-based JSON
- **Testing**: Jest

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration values.

3. **Run the server**
   ```bash
   npm start
   # or
   npm run dev (for development with nodemon)
   ```

4. **The server will run at**
   [http://localhost:5000](http://localhost:5000)

## Available Scripts

- `npm start` - Start the server
- `npm run dev` - Start the server with nodemon (auto-reload on changes)
- `npm run lint` - Check for linting errors
- `npm run format` - Format the code with prettier
- `npm test` - Run tests
- `npm run test:coverage` - Generate test coverage report

## Folder Structure

```
backend/
├── data/             # JSON data storage
│   ├── books.json
│   ├── reviews.json
│   └── users.json
├── src/
│   ├── config/       # Configuration files and environment variables
│   ├── controllers/  # Business logic for endpoints
│   ├── middleware/   # Auth, validation, error handling
│   ├── models/       # Data models
│   ├── routes/       # API route definitions
│   ├── services/     # Data access, recommendation logic
│   ├── utils/        # Utility functions
│   └── app.js        # Main application file
├── tests/            # Jest test files
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT
- `GET /api/auth/me` - Get current user profile

### Books
- `GET /api/books` - List books (paginated)
- `GET /api/books/search` - Search books by title/author
- `GET /api/books/:id` - Get book details

### Reviews
- `GET /api/books/:bookId/reviews` - Get reviews for a book
- `POST /api/books/:bookId/reviews` - Create a review
- `PUT /api/reviews/:id` - Update a review
- `DELETE /api/reviews/:id` - Delete a review

### User Profiles
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:id/reviews` - Get reviews by user
- `POST /api/users/favorites/:bookId` - Add favorite book
- `DELETE /api/users/favorites/:bookId` - Remove favorite book

### Recommendations
- `GET /api/recommendations` - Get personalized recommendations

## Development Guidelines

- Follow the ESLint and Prettier configurations
- Write tests for all new functionality
- Use semantic commit messages
