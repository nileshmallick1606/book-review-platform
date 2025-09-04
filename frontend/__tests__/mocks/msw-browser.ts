// __tests__/mocks/msw-browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './msw-server';

// Set up the service worker for the browser environment
export const worker = setupWorker(...handlers);

// Export the handlers for use in stories or other browser contexts
export { handlers };
