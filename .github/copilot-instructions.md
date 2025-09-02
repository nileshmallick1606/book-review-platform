# BookReview Platform: AI Assistant Guide

This guide provides essential information for AI assistants working on the BookReview Platform project. It outlines architecture, patterns, and workflows to help you understand and contribute to the codebase effectively.

## Mandatory Instructions

1. **Progress Tracking**: Update the Implementation Tracking Sheet (`docs/Implementation_Plan/Implementation_Tracking_Sheet.md`) after the completion of each user story or technical task. Update status, actual hours spent, and completion percentage.

2. **Task Implementation Planning**: Before beginning implementation of any technical task:
   - Create a detailed implementation plan
   - Present the plan for review
   - Proceed with coding only after receiving explicit approval

## Project Overview

BookReview is a web application with:
- Next.js frontend for browsing books, writing reviews, and getting recommendations
- Express.js backend providing RESTful APIs
- File-based JSON storage for data
- OpenAI API integration for personalized book recommendations

## Architecture

### Frontend (Next.js)
```
frontend/
├── public/           # Static assets
├── components/       # Reusable UI components
├── pages/            # Route-based views 
│   └── api/          # Next.js API routes (optional)
├── services/         # API integration services
├── store/            # State management (Context API or Redux)
├── utils/            # Utility functions
└── package.json
```

### Backend (Express.js)
```
backend/
├── src/
│   ├── config/       # Configuration files and environment variables
│   ├── controllers/  # Business logic for endpoints
│   ├── middleware/   # Auth, validation, error handling
│   ├── models/       # Data models
│   ├── routes/       # API route definitions
│   ├── services/     # Data access, recommendation logic
│   └── app.js        # Main application file
├── data/             # JSON data storage
│   ├── users.json
│   ├── books.json
│   └── reviews.json
├── tests/            # Jest test files
└── package.json
```

## Key Development Patterns

1. **API Service Layer**: All frontend-to-backend communication goes through dedicated service modules in `frontend/services/`.

2. **JWT Authentication**: Use JWT tokens for authentication. Backend validates tokens with middleware, frontend stores in HttpOnly cookies.

3. **File-based Data Storage**:
   - Data stored in structured JSON files
   - CRUD operations through model interfaces
   - Maintain relationships between entities (e.g., reviews connect to books and users)

4. **AI Integration Pattern**:
   ```js
   // Example OpenAI integration for recommendations
   const openaiPayload = {
     model: "gpt-3.5-turbo",
     messages: [
       { role: "system", content: "You are a book recommendation assistant." },
       { role: "user", content: `Recommend books for a user who likes ${userPreferences.genres.join(', ')} and has rated '${userFavoriteBook}' ${userRating} stars.` }
     ]
   };
   ```

## Development Workflow

1. **Setup**:
   - Frontend: `cd frontend && npm install`
   - Backend: `cd backend && npm install`

2. **Running the application**:
   - Frontend: `npm run dev` (Next.js dev server)
   - Backend: `npm start` (Express server)

3. **Testing**:
   - Run tests: `npm test`
   - Coverage report: `npm run test:coverage`

4. **Code Quality**:
   - Lint: `npm run lint`
   - Format: `npm run format`

## Key API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and receive JWT
- `GET /api/auth/me` — Get current user profile

### Books
- `GET /api/books` — List books (paginated)
- `GET /api/books/search` — Search books by title/author
- `GET /api/books/:id` — Get book details

### Reviews
- `GET /api/books/:bookId/reviews` — Get reviews for a book
- `POST /api/books/:bookId/reviews` — Create a review
- `PUT /api/reviews/:id` — Update a review
- `DELETE /api/reviews/:id` — Delete a review

### Recommendations
- `GET /api/recommendations` — Get personalized recommendations

## Data Models

Follow these models when working with project data:

### User
```json
{
  "id": "string (UUID)",
  "email": "string",
  "password": "string (hashed)",
  "name": "string"
}
```

### Book
```json
{
  "id": "string (UUID)",
  "title": "string",
  "author": "string",
  "description": "string",
  "coverImage": "string (URL)",
  "genres": ["string"],
  "publishedYear": "number",
  "averageRating": "number",
  "reviewCount": "number"
}
```

### Review
```json
{
  "id": "string (UUID)",
  "bookId": "string (Book ID)",
  "userId": "string (User ID)",
  "text": "string",
  "rating": "number (1-5)",
  "timestamp": "ISO date string"
}
```
