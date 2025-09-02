import api from './api';
import { User, Book, Review } from '../types';

interface ProfileUpdateData {
  name?: string;
  bio?: string;
  location?: string;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ReviewsResponse {
  reviews: Review[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FavoritesResponse {
  favorites: Book[];
}

const userService = {
  // Get user profile with stats
  getUserProfile: async (userId: string) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
    }
  },
  
  // Update user profile
  updateProfile: async (userId: string, data: ProfileUpdateData) => {
    try {
      const response = await api.put(`/users/${userId}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },
  
  // Get user reviews
  getUserReviews: async (userId: string, options: PaginationOptions = {}) => {
    try {
      const response = await api.get(`/users/${userId}/reviews`, { params: options });
      return response.data as ReviewsResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user reviews');
    }
  },
  
  // Get user favorites
  getFavorites: async (userId: string) => {
    try {
      const response = await api.get(`/users/${userId}/favorites`);
      return response.data as FavoritesResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch favorites');
    }
  },
  
  // Add a book to favorites
  addFavorite: async (bookId: string) => {
    try {
      const response = await api.post(`/users/favorites/${bookId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add to favorites');
    }
  },
  
  // Remove a book from favorites
  removeFavorite: async (bookId: string) => {
    try {
      const response = await api.delete(`/users/favorites/${bookId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to remove from favorites');
    }
  }
};

export default userService;
