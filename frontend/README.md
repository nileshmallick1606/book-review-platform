# Frontend: BookReview Platform

This is the frontend application for the BookReview Platform - a modern web application for discovering books, sharing reviews, and receiving personalized recommendations.

## Tech Stack

- **Framework**: Next.js (React)
- **State Management**: Context API
- **Styling**: CSS Modules
- **HTTP Client**: Axios

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
   cp .env.example .env.local
   ```
   Edit the `.env.local` file with your configuration values.

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Run the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Check for linting errors
- `npm run format` - Format the code with prettier
- `npm test` - Run tests
- `npm run test:coverage` - Generate test coverage report

## Folder Structure

```
frontend/
├── components/      # Reusable UI components
│   ├── book/        # Book-related components
│   ├── layout/      # Layout components (header, footer)
│   ├── review/      # Review-related components
│   └── ui/          # Basic UI elements
├── pages/           # Route-based views
│   └── api/         # Next.js API routes (if needed)
├── public/          # Static assets
├── services/        # API integration services
├── store/           # State management
├── styles/          # Global styles
├── types/           # TypeScript interfaces
└── utils/           # Utility functions
```

## Development Guidelines

- Use TypeScript for all new files
- Follow ESLint and Prettier configurations
- Write tests for critical functionality
- Use semantic commit messages

## Connecting to the Backend

By default, the frontend connects to `http://localhost:5000/api` for the backend API. You can modify this in the `.env.local` file by setting `NEXT_PUBLIC_API_URL`.

## Learn More

To learn more about the technologies used, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
