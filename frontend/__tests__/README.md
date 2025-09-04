# Frontend Testing Setup

This document provides an overview of the frontend testing setup for the BookReview Platform project.

## Testing Environment

The project uses the following testing libraries:

- **Jest**: JavaScript testing framework for running tests
- **React Testing Library**: For testing React components
- **Mock Service Worker (MSW)**: For mocking API requests
- **jest-dom**: For additional DOM matchers

## Directory Structure

```
frontend/
├── __tests__/                   # Test files
│   ├── components/              # Component tests
│   ├── mocks/                   # Mock data and API handlers
│   │   ├── data-factories.ts    # Mock data generators
│   │   ├── handlers/            # MSW API handlers
│   │   ├── msw-server.ts        # MSW setup for Node.js
│   │   └── msw-browser.ts       # MSW setup for browsers
│   ├── services/                # Service tests
│   └── utils/                   # Testing utilities
│       ├── auth-test-utils.tsx  # Authentication testing utilities
│       └── test-utils.tsx       # General testing utilities
├── jest.config.js               # Jest configuration
├── jest.setup.js                # Jest setup file
```

## Running Tests

To run the frontend tests:

```bash
cd frontend
npm test
```

To run with coverage report:

```bash
npm test -- --coverage
```

To run a specific test file:

```bash
npm test -- components/StarRating.test.tsx
```

## Testing Utilities

### Test Utils (`test-utils.tsx`)

Provides a custom render function that includes common providers (AuthProvider). Use this to render components with the required context providers:

```tsx
import { render } from '../utils/test-utils';

test('my test', () => {
  render(<MyComponent />);
  // assertions...
});
```

### Auth Test Utils (`auth-test-utils.tsx`)

Utilities for testing authenticated components:

```tsx
import { renderWithAuth } from '../utils/auth-test-utils';

test('authenticated component', () => {
  // Render with authenticated user
  renderWithAuth(<MyProtectedComponent />, { isAuthenticated: true });
  
  // Or render as unauthenticated
  renderWithAuth(<MyProtectedComponent />, { isAuthenticated: false });
});
```

## Mock Data and API

Use the data factories to create mock data for your tests:

```tsx
import { mockBooks, mockReviews } from '../mocks/data-factories';

// Create 3 mock books
const books = mockBooks(3);

// Create a specific mock book
const book = mockBook({
  id: '123',
  title: 'Custom Title'
});
```

MSW handlers intercept API requests during tests, allowing you to test components that make API calls without hitting a real backend.

## Testing Components

The project supports testing various aspects of components:

1. **Rendering tests**: Verify components render correctly with different props
2. **Interaction tests**: Verify components respond correctly to user interactions
3. **Integration tests**: Verify components work together correctly
4. **Accessibility tests**: Ensure components are accessible

## Example Tests

See the following files for example tests:

- `__tests__/components/StarRating.test.tsx`: Basic component rendering test
- `__tests__/services/bookService.test.ts`: API service test with MSW

## Further Improvements

1. Add more component tests
2. Add integration tests for complex user flows
3. Add end-to-end tests with Cypress (planned for future)
4. Improve accessibility testing
