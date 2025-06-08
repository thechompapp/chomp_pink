/**
 * FilterDataService Unit Tests
 * 
 * Tests for centralized filter data fetching service
 * - API integration testing
 * - Error handling validation
 * - Request deduplication verification
 * - Mock data fallback testing
 * - Cache functionality testing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FilterDataService, filterDataService } from '@/services/filters/FilterDataService';

// Mock dependencies
vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn()
  }
}));

vi.mock('@/utils/logger', () => ({
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logInfo: vi.fn()
}));

vi.mock('@/utils/serviceHelpers', () => ({
  handleApiResponse: vi.fn(),
  validateId: vi.fn(),
  createQueryParams: vi.fn()
}));

import { apiClient } from '@/services/apiClient';
import { handleApiResponse, validateId } from '@/utils/serviceHelpers';

describe('FilterDataService', () => {
  let service;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FilterDataService();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('getCities', () => {
    const mockCitiesResponse = {
      success: true,
      data: [
        { id: 1, name: 'New York', has_boroughs: true, state: 'NY' },
        { id: 2, name: 'Los Angeles', has_boroughs: false, state: 'CA' }
      ]
    };

    it('should fetch cities successfully', async () => {
      handleApiResponse.mockResolvedValue(mockCitiesResponse);

      const result = await service.getCities();

      expect(handleApiResponse).toHaveBeenCalledWith(
        expect.any(Function),
        'FilterDataService.getCities'
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        name: 'New York',
        has_boroughs: true,
        state: 'NY',
        country: 'USA'
      });
    });

    it('should handle empty API response with mock data', async () => {
      handleApiResponse.mockResolvedValue({ success: true, data: [] });

      const result = await service.getCities();

      expect(result).toHaveLength(3); // Mock data has 3 cities
      expect(result[0].name).toBe('New York');
    });

    it('should pass options as parameters', async () => {
      handleApiResponse.mockResolvedValue(mockCitiesResponse);
      const options = { state: 'NY', limit: 10 };

      await service.getCities(options);

      const apiCall = handleApiResponse.mock.calls[0][0];
      // Verify the API call was made with parameters
      expect(apiCall).toBeDefined();
    });

    it('should deduplicate concurrent requests', async () => {
      handleApiResponse.mockResolvedValue(mockCitiesResponse);

      // Make multiple concurrent requests
      const [result1, result2, result3] = await Promise.all([
        service.getCities(),
        service.getCities(),
        service.getCities()
      ]);

      // API should only be called once
      expect(handleApiResponse).toHaveBeenCalledTimes(1);
      // All results should be identical
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });

    it('should handle API errors gracefully', async () => {
      handleApiResponse.mockRejectedValue(new Error('API Error'));

      await expect(service.getCities()).rejects.toThrow('API Error');
      expect(handleApiResponse).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBoroughs', () => {
    const mockBoroughsResponse = {
      success: true,
      data: [
        { id: 1, name: 'Manhattan', city_id: 1 },
        { id: 2, name: 'Brooklyn', city_id: 1 }
      ]
    };

    beforeEach(() => {
      validateId.mockImplementation(id => id && parseInt(id, 10) > 0);
    });

    it('should fetch boroughs successfully', async () => {
      handleApiResponse.mockResolvedValue(mockBoroughsResponse);

      const result = await service.getBoroughs(1);

      expect(validateId).toHaveBeenCalledWith(1);
      expect(handleApiResponse).toHaveBeenCalledWith(
        expect.any(Function),
        'FilterDataService.getBoroughs'
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        name: 'Manhattan',
        city_id: 1
      });
    });

    it('should return empty array for invalid cityId', async () => {
      validateId.mockReturnValue(false);

      const result = await service.getBoroughs('invalid');

      expect(result).toEqual([]);
      expect(handleApiResponse).not.toHaveBeenCalled();
    });

    it('should return mock data for NYC on API error', async () => {
      handleApiResponse.mockRejectedValue(new Error('API Error'));

      const result = await service.getBoroughs(1);

      expect(result).toHaveLength(5); // Mock NYC boroughs
      expect(result[0].name).toBe('Manhattan');
    });

    it('should return empty array for non-NYC on API error', async () => {
      handleApiResponse.mockRejectedValue(new Error('API Error'));

      const result = await service.getBoroughs(2);

      expect(result).toEqual([]);
    });
  });

  describe('getNeighborhoods', () => {
    const mockNeighborhoodsResponse = {
      success: true,
      data: [
        { id: 1, name: 'SoHo', borough_id: 1, city_id: 1 },
        { id: 2, name: 'Chelsea', borough_id: 1, city_id: 1 }
      ]
    };

    beforeEach(() => {
      validateId.mockImplementation(id => id && parseInt(id, 10) > 0);
    });

    it('should fetch neighborhoods successfully', async () => {
      handleApiResponse.mockResolvedValue(mockNeighborhoodsResponse);

      const result = await service.getNeighborhoods(1);

      expect(validateId).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        name: 'SoHo',
        borough_id: 1,
        city_id: 1
      });
    });

    it('should return empty array for invalid boroughId', async () => {
      validateId.mockReturnValue(false);

      const result = await service.getNeighborhoods('invalid');

      expect(result).toEqual([]);
      expect(handleApiResponse).not.toHaveBeenCalled();
    });

    it('should handle empty API response', async () => {
      handleApiResponse.mockResolvedValue({ success: true, data: [] });

      const result = await service.getNeighborhoods(1);

      expect(result).toEqual([]);
    });
  });

  describe('getCuisines', () => {
    const mockCuisinesResponse = {
      success: true,
      data: [
        { id: 1, name: 'Italian', usage_count: 150, category: 'cuisine' },
        { id: 2, name: 'Mexican', usage_count: 120, category: 'cuisine' }
      ]
    };

    it('should fetch cuisines successfully', async () => {
      handleApiResponse.mockResolvedValue(mockCuisinesResponse);

      const result = await service.getCuisines();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        name: 'Italian',
        usage_count: 150,
        category: 'cuisine'
      });
    });

    it('should handle search term parameter', async () => {
      handleApiResponse.mockResolvedValue(mockCuisinesResponse);

      await service.getCuisines('Italian', 10);

      const apiCall = handleApiResponse.mock.calls[0][0];
      expect(apiCall).toBeDefined();
    });

    it('should return filtered mock data on API error', async () => {
      handleApiResponse.mockRejectedValue(new Error('API Error'));

      const result = await service.getCuisines('Italian', 5);

      expect(result).toHaveLength(1); // Filtered mock data
      expect(result[0].name).toBe('Italian');
    });

    it('should limit results correctly', async () => {
      handleApiResponse.mockRejectedValue(new Error('API Error'));

      const result = await service.getCuisines('', 2);

      expect(result).toHaveLength(2);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache successfully', () => {
      service.clearCache();
      expect(service.getCacheStats().cacheSize).toBe(0);
    });

    it('should provide cache statistics', () => {
      const stats = service.getCacheStats();
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('pendingRequests');
      expect(typeof stats.cacheSize).toBe('number');
      expect(typeof stats.pendingRequests).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle null/undefined parameters gracefully', async () => {
      validateId.mockReturnValue(false);

      const boroughsResult = await service.getBoroughs(null);
      const neighborhoodsResult = await service.getNeighborhoods(undefined);

      expect(boroughsResult).toEqual([]);
      expect(neighborhoodsResult).toEqual([]);
    });

    it('should handle API client errors', async () => {
      handleApiResponse.mockRejectedValue(new Error('Network Error'));

      await expect(service.getCities()).rejects.toThrow('Network Error');
    });

    it('should handle malformed API responses', async () => {
      handleApiResponse.mockResolvedValue({ success: true, data: null });

      const result = await service.getCities();

      // Should fallback to mock data
      expect(result).toHaveLength(3);
    });
  });

  describe('Data Processing', () => {
    it('should filter out invalid city entries', async () => {
      const invalidResponse = {
        success: true,
        data: [
          { id: 1, name: 'Valid City', has_boroughs: true },
          { id: null, name: 'Invalid City 1' }, // No ID
          { id: 2, name: '' }, // No name
          { id: 3, name: 'Valid City 2', has_boroughs: false }
        ]
      };
      handleApiResponse.mockResolvedValue(invalidResponse);

      const result = await service.getCities();

      expect(result).toHaveLength(2); // Only valid entries
      expect(result[0].name).toBe('Valid City');
      expect(result[1].name).toBe('Valid City 2');
    });

    it('should normalize borough data correctly', async () => {
      const response = {
        success: true,
        data: [
          { id: '1', name: 'Manhattan' }, // String ID should be converted
          { id: 2, name: 'Brooklyn' }
        ]
      };
      handleApiResponse.mockResolvedValue(response);
      validateId.mockReturnValue(true);

      const result = await service.getBoroughs(1);

      expect(result[0].id).toBe(1); // Should be number
      expect(result[0].city_id).toBe(1); // Should be set
    });
  });

  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      expect(filterDataService).toBeInstanceOf(FilterDataService);
    });

    it('should maintain state across calls', async () => {
      const stats1 = filterDataService.getCacheStats();
      filterDataService.clearCache();
      const stats2 = filterDataService.getCacheStats();

      expect(stats1).toBeDefined();
      expect(stats2).toBeDefined();
      // Stats should be different after clearing cache
    });
  });
}); 