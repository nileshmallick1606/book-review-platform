# BookReview Platform

A modern web application for discovering books, sharing reviews, and receiving personalized recommendations powered by AI.

## 📚 Overview

BookReview Platform is a full-stack web application that allows users to:
- Browse and search for books
- Read and write book reviews
- Rate books on a 5-star scale
- Manage favorite books
- Receive AI-powered book recommendations based on preferences and activity

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js (React)
- **State Management**: Context API/Redux
- **Styling**: CSS Modules/Styled Components
- **HTTP Client**: Axios

### Backend
- **Framework**: Express.js (Node.js)
- **Authentication**: JWT
- **Data Storage**: File-based JSON
- **Testing**: Jest

### External Services
- OpenAI API for personalized book recommendations

## 🏗️ Architecture

The application follows a client-server architecture:

```
+-------------------+         +-------------------+         +-------------------+
|                   |         |                   |         |                   |
|  Next.js Frontend |-------->| Express.js Backend|-------->|   OpenAI API      |
|                   |         |                   |         |                   |
+-------------------+         +-------------------+         +-------------------+
                                      |
                                      v
                              +-------------------+
                              |                   |
                              |  JSON Data Store  |
                              |                   |
                              +-------------------+
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/bookreview-platform.git
   cd bookreview-platform
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure your environment variables
   npm start
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env  # Configure your environment variables
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🧪 Testing

### Backend
```bash
cd backend
npm test                  # Run all tests
npm run test:coverage     # Generate test coverage report
```

### Frontend
```bash
cd frontend
npm test                  # Run all tests
npm run test:coverage     # Generate test coverage report
```

## 📝 API Endpoints

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

## 📊 Data Models

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

## 📦 Project Structure

### Frontend Structure
```
frontend/
├── public/           # Static assets
├── components/       # Reusable UI components
├── pages/            # Route-based views 
│   └── api/          # Next.js API routes (optional)
├── services/         # API integration services
├── store/            # State management
├── utils/            # Utility functions
└── package.json
```

### Backend Structure
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

## 🔍 Features

- **User Authentication**: Secure registration and login
- **Book Discovery**: Browse and search through a catalog of books
- **Review Management**: Create, read, update, and delete reviews
- **Rating System**: Rate books on a 5-star scale
- **User Profiles**: Manage personal information and favorite books
- **Personalized Recommendations**: Receive book suggestions based on preferences and activity

## 🧑‍💻 Development

### Code Quality
```bash
# Backend
cd backend
npm run lint        # Check for linting issues
npm run format      # Format code with prettier

# Frontend
cd frontend
npm run lint        # Check for linting issues
npm run format      # Format code with prettier
```

### Implementation Plan
The project follows a phased implementation approach:
1. Project Setup and Foundation
2. Core Features
3. Advanced Features
4. Testing and Quality Assurance
5. Deployment and Infrastructure
6. Launch Preparation and Final Review

For detailed implementation tracking, see `docs/Implementation_Plan/Implementation_Tracking_Sheet.md`.

## 📄 License

[MIT License](LICENSE)

## 👥 Contributors

- Internal Assignment Team
