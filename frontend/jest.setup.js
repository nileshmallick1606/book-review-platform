// jest.setup.js
import '@testing-library/jest-dom';

try {
  // Dynamically import MSW server
  const { server } = require('./__tests__/mocks/msw-server');
  
  // Start MSW server before tests
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  
  // Reset handlers after each test
  afterEach(() => server.resetHandlers());
  
  // Close server after all tests
  afterAll(() => server.close());
  
  console.log('MSW server initialized successfully');
} catch (error) {
  console.warn('MSW server initialization skipped:', error.message);
}

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '',
    query: {},
    asPath: '',
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
  }),
}));

// Suppress console errors during tests
const originalError = console.error;
console.error = (...args) => {
  if (
    /Warning: ReactDOM.render is no longer supported in React 18/.test(args[0]) ||
    /Warning: useLayoutEffect does nothing on the server/.test(args[0])
  ) {
    return;
  }
  originalError.call(console, ...args);
};
