// __tests__/mocks/handlers/book-handlers.ts
import { http, HttpResponse } from 'msw';

// Sample book data
const mockBooks = [
  {
    id: 'book-1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    description: 'A novel about the mysterious millionaire Jay Gatsby and his obsession with Daisy Buchanan.',
    coverImage: 'https://example.com/gatsby.jpg',
    genres: ['Fiction', 'Classic'],
    publishedYear: 1925,
    averageRating: 4.5,
    reviewCount: 120
  },
  {
    id: 'book-2',
    title: '1984',
    author: 'George Orwell',
    description: 'A dystopian novel set in a totalitarian society.',
    coverImage: 'https://example.com/1984.jpg',
    genres: ['Fiction', 'Science Fiction', 'Dystopian'],
    publishedYear: 1949,
    averageRating: 4.7,
    reviewCount: 180
  },
  {
    id: 'book-3',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    description: 'A novel about racial injustice in the American South during the 1930s.',
    coverImage: 'https://example.com/mockingbird.jpg',
    genres: ['Fiction', 'Classic'],
    publishedYear: 1960,
    averageRating: 4.8,
    reviewCount: 200
  }
];

export const bookHandlers = [
  // Get all books
  http.get('/api/books', ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page') || '1') : 1;
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit') || '10') : 10;
    const search = url.searchParams.get('search') || '';
    
    // Filter books if search param is provided
    let filteredBooks = mockBooks;
    if (search) {
      filteredBooks = mockBooks.filter(book => 
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        book.author.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Calculate pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedBooks = filteredBooks.slice(start, end);
    
    return HttpResponse.json({
      books: paginatedBooks,
      totalBooks: filteredBooks.length,
      totalPages: Math.ceil(filteredBooks.length / limit)
    });
  }),
  
  // Get book by ID
  http.get('/api/books/:id', ({ params }) => {
    const id = params.id as string;
    const book = mockBooks.find(book => book.id === id);
    
    if (!book) {
      return new HttpResponse(
        JSON.stringify({ message: 'Book not found' }),
        { status: 404 }
      );
    }
    
    return HttpResponse.json({ book });
  }),
  
  // Search books
  http.get('/api/books/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    
    if (!query) {
      return HttpResponse.json({ books: [], totalBooks: 0 });
    }
    
    const matchedBooks = mockBooks.filter(book => 
      book.title.toLowerCase().includes(query.toLowerCase()) ||
      book.author.toLowerCase().includes(query.toLowerCase())
    );
    
    return HttpResponse.json({
      books: matchedBooks,
      totalBooks: matchedBooks.length
    });
  })
];
