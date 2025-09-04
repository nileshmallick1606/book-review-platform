// __tests__/mocks/handlers/review-handlers.ts
import { http, HttpResponse } from 'msw';

// Sample review data
const mockReviews = [
  {
    id: 'review-1',
    bookId: 'book-1',
    userId: 'user-1',
    text: 'A classic that still resonates today. Fitzgerald\'s masterful storytelling brings the Jazz Age to life.',
    rating: 5,
    timestamp: '2025-08-15T14:22:00Z'
  },
  {
    id: 'review-2',
    bookId: 'book-1',
    userId: 'user-2',
    text: 'Beautifully written but I found the characters hard to sympathize with.',
    rating: 4,
    timestamp: '2025-08-10T09:45:00Z'
  },
  {
    id: 'review-3',
    bookId: 'book-2',
    userId: 'user-1',
    text: 'Orwell\'s vision of a dystopian future feels more relevant than ever. A must-read.',
    rating: 5,
    timestamp: '2025-08-12T16:30:00Z'
  }
];

// Create review handlers for MSW
export const reviewHandlers = [
  // Get reviews for a book
  http.get('/api/books/:bookId/reviews', ({ params }) => {
    const bookId = params.bookId as string;
    
    const bookReviews = mockReviews.filter(review => review.bookId === bookId);
    
    return HttpResponse.json({ reviews: bookReviews });
  }),
  
  // Create a review
  http.post('/api/books/:bookId/reviews', async ({ request, params }) => {
    const bookId = params.bookId as string;
    const { text, rating } = await request.json() as { text: string; rating: number };
    
    // Check for auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer mock-jwt-token')) {
      return new HttpResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    // Create new review
    const newReview = {
      id: `review-${mockReviews.length + 1}`,
      bookId: bookId,
      userId: 'user-1', // Assuming the logged-in test user
      text,
      rating,
      timestamp: new Date().toISOString()
    };
    
    mockReviews.push(newReview);
    
    return HttpResponse.json({ review: newReview });
  }),
  
  // Update a review
  http.put('/api/reviews/:id', async ({ request, params }) => {
    const id = params.id as string;
    const { text, rating } = await request.json() as { text: string; rating: number };
    
    // Check for auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer mock-jwt-token')) {
      return new HttpResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    // Find review
    const reviewIndex = mockReviews.findIndex(review => review.id === id);
    
    if (reviewIndex === -1) {
      return new HttpResponse(
        JSON.stringify({ message: 'Review not found' }),
        { status: 404 }
      );
    }
    
    // Ensure user owns the review
    if (mockReviews[reviewIndex].userId !== 'user-1') {
      return new HttpResponse(
        JSON.stringify({ message: 'Forbidden: You can only update your own reviews' }),
        { status: 403 }
      );
    }
    
    // Update review
    mockReviews[reviewIndex] = {
      ...mockReviews[reviewIndex],
      text,
      rating,
      timestamp: new Date().toISOString()
    };
    
    return HttpResponse.json({ review: mockReviews[reviewIndex] });
  }),
  
  // Delete a review
  http.delete('/api/reviews/:id', ({ request, params }) => {
    const id = params.id as string;
    
    // Check for auth header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer mock-jwt-token')) {
      return new HttpResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    // Find review
    const reviewIndex = mockReviews.findIndex(review => review.id === id);
    
    if (reviewIndex === -1) {
      return new HttpResponse(
        JSON.stringify({ message: 'Review not found' }),
        { status: 404 }
      );
    }
    
    // Ensure user owns the review
    if (mockReviews[reviewIndex].userId !== 'user-1') {
      return new HttpResponse(
        JSON.stringify({ message: 'Forbidden: You can only delete your own reviews' }),
        { status: 403 }
      );
    }
    
    // Remove review
    mockReviews.splice(reviewIndex, 1);
    
    return HttpResponse.json({ success: true });
  })
];
