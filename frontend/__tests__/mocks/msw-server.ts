// __tests__/mocks/msw-server.ts
import { http } from 'msw';
import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth-handlers';
import { bookHandlers } from './handlers/book-handlers';
import { reviewHandlers } from './handlers/review-handlers';

// Combine all handlers
export const handlers = [
  ...authHandlers,
  ...bookHandlers,
  ...reviewHandlers,
];

// Set up the mock server
export const server = setupServer(...handlers);
