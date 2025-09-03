const jwt = require('jsonwebtoken');
const { authenticate } = require('../../src/middleware/auth.middleware');
const config = require('../../src/config');

// Mock Express request, response, and next function
const mockRequest = (token = null) => {
  const req = {};
  req.headers = token ? { authorization: `Bearer ${token}` } : {};
  return req;
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

// Mock JWT functions
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should call next() if a valid token is provided', () => {
    // Mock JWT verify to return a valid user
    const user = { id: 'user-id', email: 'test@example.com' };
    jwt.verify.mockReturnValue(user);

    const req = mockRequest('valid-token');
    const res = mockResponse();

    authenticate(req, res, mockNext);

    // Check that jwt.verify was called with the token and secret
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', config.jwtSecret);
    
    // Check that the user was added to the request
    expect(req.user).toEqual(user);
    
    // Check that next() was called
    expect(mockNext).toHaveBeenCalled();
    
    // Check that res.status and res.json were not called
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should return 401 if no authorization header is provided', () => {
    const req = mockRequest();
    const res = mockResponse();

    authenticate(req, res, mockNext);

    // Check that next() was not called
    expect(mockNext).not.toHaveBeenCalled();
    
    // Check that res.status was called with 401
    expect(res.status).toHaveBeenCalledWith(401);
    
    // Check that res.json was called with an error message
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
  });

  it('should return 401 if the authorization header is not a Bearer token', () => {
    const req = mockRequest();
    req.headers.authorization = 'Basic dXNlcjpwYXNzd29yZA==';
    const res = mockResponse();

    authenticate(req, res, mockNext);

    // Check that next() was not called
    expect(mockNext).not.toHaveBeenCalled();
    
    // Check that res.status was called with 401
    expect(res.status).toHaveBeenCalledWith(401);
    
    // Check that res.json was called with an error message
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
  });

  it('should return 401 if the token is invalid', () => {
    // Mock JWT verify to throw an error
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const req = mockRequest('invalid-token');
    const res = mockResponse();

    authenticate(req, res, mockNext);

    // Check that next() was not called
    expect(mockNext).not.toHaveBeenCalled();
    
    // Check that res.status was called with 401
    expect(res.status).toHaveBeenCalledWith(401);
    
    // Check that res.json was called with an error message
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
  });
});
