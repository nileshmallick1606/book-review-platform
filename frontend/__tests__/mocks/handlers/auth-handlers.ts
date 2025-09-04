// __tests__/mocks/handlers/auth-handlers.ts
import { http, HttpResponse } from 'msw';

// Mock user data
const mockUsers = [
  {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    favorites: []
  }
];

// Create auth handlers for MSW
export const authHandlers = [
  // Login handler
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string };
    
    // Simulate successful login with test@example.com/password
    if (email === 'test@example.com' && password === 'password') {
      return HttpResponse.json({
        user: mockUsers[0],
        token: 'mock-jwt-token'
      });
    }
    
    // Return error for invalid credentials
    return new HttpResponse(
      JSON.stringify({ message: 'Invalid credentials' }),
      { status: 401 }
    );
  }),
  
  // Register handler
  http.post('/api/auth/register', async ({ request }) => {
    const { name, email, password } = await request.json() as { name: string; email: string; password: string };
    
    // Check if user already exists
    const userExists = mockUsers.some(user => user.email === email);
    
    if (userExists) {
      return new HttpResponse(
        JSON.stringify({ message: 'User with this email already exists' }),
        { status: 409 }
      );
    }
    
    // Create new user
    const newUser = {
      id: `user-${mockUsers.length + 1}`,
      name,
      email,
      favorites: []
    };
    
    mockUsers.push(newUser);
    
    return HttpResponse.json({
      user: newUser,
      token: 'mock-jwt-token'
    });
  }),
  
  // Get current user handler
  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    // Check for valid token
    if (authHeader && authHeader.startsWith('Bearer mock-jwt-token')) {
      return HttpResponse.json({ user: mockUsers[0] });
    }
    
    // Return unauthorized if token is invalid
    return new HttpResponse(
      JSON.stringify({ message: 'Unauthorized' }),
      { status: 401 }
    );
  })
];
