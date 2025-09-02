export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  genres: string[];
  publishedYear: number;
  averageRating: number;
  reviewCount: number;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  text: string;
  rating: number;
  timestamp: string;
}
