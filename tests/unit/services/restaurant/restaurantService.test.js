import { describe, it, expect, beforeEach, vi } from 'vitest';
import { restaurantService } from '@/services/restaurantService';

// Mock dependencies
vi.mock('@/services/http', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock('@/utils/logger', () => ({
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn()
}));

import { apiClient } from '@/services/http';

describe('RestaurantService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Restaurant CRUD Operations', () => {
    const mockRestaurant = {
      id: 1,
      name: 'Test Restaurant',
      address: '123 Test St, New York, NY 10001',
      cuisine: 'Italian',
      price_range: '$$',
      neighborhood_id: 1,
      city_id: 1,
      latitude: 40.7128,
      longitude: -74.0060
    };

    describe('Create Restaurant', () => {
      it('should create restaurant successfully', async () => {
        const newRestaurant = {
          name: 'New Restaurant',
          address: '456 New St, New York, NY 10002',
          cuisine: 'Mexican',
          price_range: '$'
        };

        apiClient.post.mockResolvedValue({
          data: {
            success: true,
            data: { ...newRestaurant, id: 2 }
          }
        });

        const result = await restaurantService.createRestaurant(newRestaurant);

        expect(apiClient.post).toHaveBeenCalledWith('/restaurants', newRestaurant);
        expect(result.success).toBe(true);
        expect(result.data.id).toBe(2);
        expect(result.data.name).toBe(newRestaurant.name);
      });

      it('should handle creation errors', async () => {
        const invalidRestaurant = { name: '' }; // Invalid data
        
        apiClient.post.mockRejectedValue(new Error('Validation failed'));

        const result = await restaurantService.createRestaurant(invalidRestaurant);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should validate required fields', () => {
        const invalidData = [
          {}, // Empty
          { address: '123 Main St' }, // Missing name
          { name: 'Test' }, // Missing address
          { name: '', address: '123 Main St' } // Empty name
        ];

        invalidData.forEach(data => {
          expect(() => restaurantService.validateRestaurantData(data)).toThrow();
        });
      });
    });

    describe('Read Restaurant', () => {
      it('should get restaurant by ID', async () => {
        apiClient.get.mockResolvedValue({
          data: {
            success: true,
            data: mockRestaurant
          }
        });

        const result = await restaurantService.getRestaurant(1);

        expect(apiClient.get).toHaveBeenCalledWith('/restaurants/1');
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockRestaurant);
      });

      it('should handle restaurant not found', async () => {
        apiClient.get.mockResolvedValue({
          data: {
            success: false,
            error: 'Restaurant not found'
          }
        });

        const result = await restaurantService.getRestaurant(999);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Restaurant not found');
      });

      it('should get all restaurants with pagination', async () => {
        const mockRestaurants = [mockRestaurant, { ...mockRestaurant, id: 2, name: 'Another Restaurant' }];
        
        apiClient.get.mockResolvedValue({
          data: {
            success: true,
            data: mockRestaurants,
            pagination: {
              page: 1,
              limit: 20,
              total: 2,
              totalPages: 1
            }
          }
        });

        const result = await restaurantService.getRestaurants({ page: 1, limit: 20 });

        expect(apiClient.get).toHaveBeenCalledWith('/restaurants', {
          params: { page: 1, limit: 20 }
        });
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
        expect(result.pagination).toBeDefined();
      });
    });

    describe('Update Restaurant', () => {
      it('should update restaurant successfully', async () => {
        const updates = {
          name: 'Updated Restaurant Name',
          cuisine: 'Updated Cuisine'
        };

        const updatedRestaurant = { ...mockRestaurant, ...updates };

        apiClient.put.mockResolvedValue({
          data: {
            success: true,
            data: updatedRestaurant
          }
        });

        const result = await restaurantService.updateRestaurant(1, updates);

        expect(apiClient.put).toHaveBeenCalledWith('/restaurants/1', updates);
        expect(result.success).toBe(true);
        expect(result.data.name).toBe(updates.name);
        expect(result.data.cuisine).toBe(updates.cuisine);
      });

      it('should handle partial updates', async () => {
        const partialUpdate = { price_range: '$$$' };

        apiClient.put.mockResolvedValue({
          data: {
            success: true,
            data: { ...mockRestaurant, ...partialUpdate }
          }
        });

        const result = await restaurantService.updateRestaurant(1, partialUpdate);

        expect(result.success).toBe(true);
        expect(result.data.price_range).toBe('$$$');
      });
    });

    describe('Delete Restaurant', () => {
      it('should delete restaurant successfully', async () => {
        apiClient.delete.mockResolvedValue({
          data: {
            success: true,
            message: 'Restaurant deleted successfully'
          }
        });

        const result = await restaurantService.deleteRestaurant(1);

        expect(apiClient.delete).toHaveBeenCalledWith('/restaurants/1');
        expect(result.success).toBe(true);
      });

      it('should handle delete errors', async () => {
        apiClient.delete.mockRejectedValue(new Error('Failed to delete'));

        const result = await restaurantService.deleteRestaurant(999);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('Restaurant Search', () => {
    it('should search restaurants by name', async () => {
      const searchQuery = 'pizza';
      const searchResults = [
        { id: 1, name: 'Joe\'s Pizza', cuisine: 'Italian' },
        { id: 2, name: 'Tony\'s Pizza', cuisine: 'Italian' }
      ];

      apiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: searchResults
        }
      });

      const result = await restaurantService.searchRestaurants({ name: searchQuery });

      expect(apiClient.get).toHaveBeenCalledWith('/restaurants/search', {
        params: { name: searchQuery }
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should search restaurants by location', async () => {
      const locationQuery = {
        city_id: 1,
        neighborhood_id: 2,
        zipcode: '10001'
      };

      apiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: [mockRestaurant]
        }
      });

      const result = await restaurantService.searchRestaurants(locationQuery);

      expect(apiClient.get).toHaveBeenCalledWith('/restaurants/search', {
        params: locationQuery
      });
      expect(result.success).toBe(true);
    });

    it('should search restaurants by cuisine', async () => {
      const cuisineQuery = { cuisine: 'Italian' };

      apiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: [mockRestaurant]
        }
      });

      const result = await restaurantService.searchRestaurants(cuisineQuery);

      expect(result.success).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith('/restaurants/search', {
        params: cuisineQuery
      });
    });

    it('should handle complex search queries', async () => {
      const complexQuery = {
        name: 'sushi',
        cuisine: 'Japanese',
        price_range: '$$',
        city_id: 1,
        limit: 10
      };

      apiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: []
        }
      });

      const result = await restaurantService.searchRestaurants(complexQuery);

      expect(apiClient.get).toHaveBeenCalledWith('/restaurants/search', {
        params: complexQuery
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Restaurant Validation', () => {
    it('should validate restaurant data structure', () => {
      const validRestaurant = {
        name: 'Valid Restaurant',
        address: '123 Valid St, New York, NY 10001',
        cuisine: 'Italian'
      };

      expect(() => restaurantService.validateRestaurantData(validRestaurant)).not.toThrow();
    });

    it('should validate name requirements', () => {
      const invalidNames = ['', '   ', null, undefined];
      
      invalidNames.forEach(name => {
        expect(() => restaurantService.validateRestaurantData({
          name,
          address: '123 Test St'
        })).toThrow('Name is required');
      });
    });

    it('should validate address requirements', () => {
      const invalidAddresses = ['', '   ', null, undefined];
      
      invalidAddresses.forEach(address => {
        expect(() => restaurantService.validateRestaurantData({
          name: 'Test Restaurant',
          address
        })).toThrow('Address is required');
      });
    });

    it('should validate optional fields', () => {
      const validData = {
        name: 'Test Restaurant',
        address: '123 Test St',
        cuisine: 'Italian',
        price_range: '$$',
        phone: '(555) 123-4567',
        website: 'https://example.com'
      };

      expect(() => restaurantService.validateRestaurantData(validData)).not.toThrow();
    });

    it('should validate price range format', () => {
      const validPriceRanges = ['$', '$$', '$$$', '$$$$'];
      const invalidPriceRanges = ['', 'cheap', 'expensive', '5', '$$$$$'];

      validPriceRanges.forEach(priceRange => {
        expect(() => restaurantService.validateRestaurantData({
          name: 'Test',
          address: '123 Test St',
          price_range: priceRange
        })).not.toThrow();
      });

      invalidPriceRanges.forEach(priceRange => {
        expect(() => restaurantService.validateRestaurantData({
          name: 'Test',
          address: '123 Test St',
          price_range: priceRange
        })).toThrow();
      });
    });
  });

  describe('Restaurant Filtering', () => {
    it('should filter restaurants by multiple criteria', async () => {
      const filters = {
        cuisine: ['Italian', 'Mexican'],
        price_range: ['$', '$$'],
        neighborhood_id: [1, 2, 3]
      };

      apiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: [mockRestaurant]
        }
      });

      const result = await restaurantService.getRestaurants({ filters });

      expect(apiClient.get).toHaveBeenCalledWith('/restaurants', {
        params: { filters }
      });
      expect(result.success).toBe(true);
    });

    it('should sort restaurants by different criteria', async () => {
      const sortOptions = [
        { field: 'name', direction: 'asc' },
        { field: 'created_at', direction: 'desc' },
        { field: 'rating', direction: 'desc' }
      ];

      for (const sort of sortOptions) {
        apiClient.get.mockResolvedValue({
          data: {
            success: true,
            data: [mockRestaurant]
          }
        });

        const result = await restaurantService.getRestaurants({ sort });

        expect(apiClient.get).toHaveBeenCalledWith('/restaurants', {
          params: { sort }
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Restaurant Nearby Search', () => {
    it('should find nearby restaurants by coordinates', async () => {
      const coordinates = {
        latitude: 40.7128,
        longitude: -74.0060,
        radius: 1000 // meters
      };

      apiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: [mockRestaurant]
        }
      });

      const result = await restaurantService.getNearbyRestaurants(coordinates);

      expect(apiClient.get).toHaveBeenCalledWith('/restaurants/nearby', {
        params: coordinates
      });
      expect(result.success).toBe(true);
    });

    it('should validate coordinates for nearby search', () => {
      const invalidCoordinates = [
        { latitude: 91, longitude: 0 }, // Invalid latitude
        { latitude: 0, longitude: 181 }, // Invalid longitude
        { latitude: 'invalid', longitude: 0 }, // Non-numeric
        {} // Missing coordinates
      ];

      invalidCoordinates.forEach(coords => {
        expect(() => restaurantService.validateCoordinates(coords)).toThrow();
      });
    });
  });

  describe('Restaurant Statistics', () => {
    it('should get restaurant statistics', async () => {
      const mockStats = {
        total_restaurants: 150,
        cuisines: {
          'Italian': 25,
          'Mexican': 20,
          'Chinese': 18
        },
        price_ranges: {
          '$': 40,
          '$$': 60,
          '$$$': 35,
          '$$$$': 15
        },
        neighborhoods: {
          'Manhattan': 80,
          'Brooklyn': 45,
          'Queens': 25
        }
      };

      apiClient.get.mockResolvedValue({
        data: {
          success: true,
          data: mockStats
        }
      });

      const result = await restaurantService.getStatistics();

      expect(apiClient.get).toHaveBeenCalledWith('/restaurants/statistics');
      expect(result.success).toBe(true);
      expect(result.data.total_restaurants).toBe(150);
      expect(result.data.cuisines).toBeDefined();
      expect(result.data.price_ranges).toBeDefined();
    });
  });

  describe('Bulk Operations', () => {
    it('should handle bulk restaurant creation', async () => {
      const bulkData = [
        { name: 'Restaurant 1', address: '123 Test St', cuisine: 'Italian' },
        { name: 'Restaurant 2', address: '456 Test Ave', cuisine: 'Mexican' },
        { name: 'Restaurant 3', address: '789 Test Blvd', cuisine: 'Chinese' }
      ];

      const mockResponse = {
        success: true,
        results: [
          { success: true, data: { id: 1, ...bulkData[0] } },
          { success: true, data: { id: 2, ...bulkData[1] } },
          { success: false, error: 'Duplicate name', data: bulkData[2] }
        ],
        summary: {
          total: 3,
          successful: 2,
          failed: 1
        }
      };

      apiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await restaurantService.bulkCreateRestaurants(bulkData);

      expect(apiClient.post).toHaveBeenCalledWith('/restaurants/bulk', {
        restaurants: bulkData
      });
      expect(result.success).toBe(true);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(1);
    });

    it('should validate bulk data before submission', () => {
      const invalidBulkData = [
        { name: 'Valid Restaurant', address: '123 Test St' },
        { name: '', address: '456 Test Ave' }, // Invalid: empty name
        { name: 'Another Valid', address: '' } // Invalid: empty address
      ];

      expect(() => restaurantService.validateBulkData(invalidBulkData)).toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      apiClient.get.mockRejectedValue(new Error('Network error'));

      const result = await restaurantService.getRestaurant(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle server errors gracefully', async () => {
      apiClient.get.mockRejectedValue({
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      });

      const result = await restaurantService.getRestaurant(1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('server error');
    });

    it('should handle timeout errors', async () => {
      apiClient.get.mockRejectedValue({ code: 'ECONNABORTED' });

      const result = await restaurantService.getRestaurant(1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });
}); 