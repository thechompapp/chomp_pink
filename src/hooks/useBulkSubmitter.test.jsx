/**
 * Unit tests for useBulkSubmitter hook
 */
import { renderHook, act } from '@testing-library/react-hooks';
import useBulkSubmitter from './useBulkSubmitter';
import { restaurantService } from '../services/restaurantService';
import { listService } from '../services/listService';

// Mock the services
jest.mock('../services/restaurantService', () => ({
  restaurantService: {
    createRestaurant: jest.fn(),
    getRestaurantById: jest.fn()
  }
}));

jest.mock('../services/listService', () => ({
  listService: {
    addRestaurantToList: jest.fn(),
    bulkAddToList: jest.fn()
  }
}));

// Mock the logger
jest.mock('../utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn()
}));

describe('useBulkSubmitter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBulkSubmitter());
    
    expect(result.current.submittedItems).toEqual([]);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitProgress).toBe(0);
    expect(result.current.submitError).toBeNull();
  });

  it('should submit items successfully', async () => {
    // Mock successful restaurant creation
    restaurantService.createRestaurant.mockImplementation((data) => 
      Promise.resolve({
        success: true,
        data: { id: `rest-${data.name}`, ...data }
      })
    );
    
    // Mock successful list addition
    listService.addRestaurantToList.mockImplementation((listId, restaurantId) => 
      Promise.resolve({
        success: true,
        data: { listId, restaurantId }
      })
    );
    
    const items = [
      {
        name: 'Restaurant 1',
        place_id: 'place1',
        formatted_address: '123 Main St',
        neighborhood_id: 1,
        _lineNumber: 1
      },
      {
        name: 'Restaurant 2',
        place_id: 'place2',
        formatted_address: '456 Elm St',
        neighborhood_id: 2,
        _lineNumber: 2
      }
    ];
    
    const listId = 123;
    
    const { result, waitForNextUpdate } = renderHook(() => useBulkSubmitter());
    
    act(() => {
      result.current.submitItems(items, listId);
    });
    
    expect(result.current.isSubmitting).toBe(true);
    expect(result.current.submitProgress).toBe(0);
    
    await waitForNextUpdate();
    
    // Should have called createRestaurant twice
    expect(restaurantService.createRestaurant).toHaveBeenCalledTimes(2);
    
    // Should have called addRestaurantToList twice
    expect(listService.addRestaurantToList).toHaveBeenCalledTimes(2);
    
    expect(result.current.submittedItems.length).toBe(2);
    expect(result.current.submittedItems[0].status).toBe('success');
    expect(result.current.submittedItems[1].status).toBe('success');
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitProgress).toBe(100);
  });

  it('should handle errors during submission', async () => {
    // First item succeeds, second fails
    restaurantService.createRestaurant.mockImplementation((data) => {
      if (data.name === 'Restaurant 1') {
        return Promise.resolve({
          success: true,
          data: { id: 'rest1', ...data }
        });
      } else {
        return Promise.resolve({
          success: false,
          error: 'API error'
        });
      }
    });
    
    listService.addRestaurantToList.mockResolvedValue({
      success: true,
      data: { listId: 123, restaurantId: 'rest1' }
    });
    
    const items = [
      {
        name: 'Restaurant 1',
        place_id: 'place1',
        formatted_address: '123 Main St',
        neighborhood_id: 1,
        _lineNumber: 1
      },
      {
        name: 'Restaurant 2',
        place_id: 'place2',
        formatted_address: '456 Elm St',
        neighborhood_id: 2,
        _lineNumber: 2
      }
    ];
    
    const listId = 123;
    
    const { result, waitForNextUpdate } = renderHook(() => useBulkSubmitter());
    
    act(() => {
      result.current.submitItems(items, listId);
    });
    
    await waitForNextUpdate();
    
    expect(result.current.submittedItems.length).toBe(2);
    expect(result.current.submittedItems[0].status).toBe('success');
    expect(result.current.submittedItems[1].status).toBe('error');
    expect(result.current.submittedItems[1].error).toBe('API error');
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitProgress).toBe(100);
  });

  it('should use bulk add API when available', async () => {
    // Mock successful bulk add
    listService.bulkAddToList.mockResolvedValue({
      success: true,
      data: { added: 2, listId: 123 }
    });
    
    const items = [
      {
        name: 'Restaurant 1',
        place_id: 'place1',
        formatted_address: '123 Main St',
        neighborhood_id: 1,
        _lineNumber: 1
      },
      {
        name: 'Restaurant 2',
        place_id: 'place2',
        formatted_address: '456 Elm St',
        neighborhood_id: 2,
        _lineNumber: 2
      }
    ];
    
    const listId = 123;
    const useBulkApi = true;
    
    const { result, waitForNextUpdate } = renderHook(() => useBulkSubmitter());
    
    act(() => {
      result.current.submitItems(items, listId, useBulkApi);
    });
    
    await waitForNextUpdate();
    
    // Should have called bulkAddToList once
    expect(listService.bulkAddToList).toHaveBeenCalledTimes(1);
    expect(listService.bulkAddToList).toHaveBeenCalledWith(listId, expect.any(Array));
    
    // Should not have called individual APIs
    expect(restaurantService.createRestaurant).not.toHaveBeenCalled();
    expect(listService.addRestaurantToList).not.toHaveBeenCalled();
    
    expect(result.current.submittedItems.length).toBe(2);
    expect(result.current.submittedItems[0].status).toBe('success');
    expect(result.current.submittedItems[1].status).toBe('success');
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitProgress).toBe(100);
  });

  it('should handle bulk API errors', async () => {
    // Mock failed bulk add
    listService.bulkAddToList.mockResolvedValue({
      success: false,
      error: 'Bulk API error'
    });
    
    const items = [
      {
        name: 'Restaurant 1',
        place_id: 'place1',
        formatted_address: '123 Main St',
        neighborhood_id: 1,
        _lineNumber: 1
      },
      {
        name: 'Restaurant 2',
        place_id: 'place2',
        formatted_address: '456 Elm St',
        neighborhood_id: 2,
        _lineNumber: 2
      }
    ];
    
    const listId = 123;
    const useBulkApi = true;
    
    const { result, waitForNextUpdate } = renderHook(() => useBulkSubmitter());
    
    act(() => {
      result.current.submitItems(items, listId, useBulkApi);
    });
    
    await waitForNextUpdate();
    
    expect(listService.bulkAddToList).toHaveBeenCalledTimes(1);
    
    // Should fall back to individual submission
    expect(restaurantService.createRestaurant).toHaveBeenCalledTimes(2);
    expect(listService.addRestaurantToList).toHaveBeenCalledTimes(2);
    
    expect(result.current.submitError).toBe('Bulk submission failed, falling back to individual submission');
  });

  it('should reset state correctly', async () => {
    const { result } = renderHook(() => useBulkSubmitter());
    
    // Set some state
    act(() => {
      result.current.setSubmittedItems([{ name: 'Test' }]);
      result.current.setIsSubmitting(true);
      result.current.setSubmitProgress(50);
      result.current.setSubmitError('Test error');
    });
    
    // Reset
    act(() => {
      result.current.resetSubmitter();
    });
    
    // Verify reset state
    expect(result.current.submittedItems).toEqual([]);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitProgress).toBe(0);
    expect(result.current.submitError).toBeNull();
  });
});
