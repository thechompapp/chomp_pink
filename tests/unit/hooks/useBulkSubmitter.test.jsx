/**
 * Unit tests for useBulkSubmitter hook
 */
import { renderHook, act } from '@testing-library/react-hooks';
import useBulkSubmitter from '../../../src/hooks/useBulkSubmitter';
import { restaurantService } from '../../../src/services/restaurantService';
import { listService } from '../../../src/services/listService';

// Mock the services
jest.mock('../../../src/services/restaurantService', () => ({
  restaurantService: {
    createRestaurant: jest.fn(),
    getRestaurantById: jest.fn()
  }
}));

jest.mock('../../../src/services/listService', () => ({
  listService: {
    addRestaurantToList: jest.fn(),
    bulkAddToList: jest.fn()
  }
}));

// Mock the logger
jest.mock('../../../src/utils/logger', () => ({
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

  it('should submit items from semicolon-delimited format successfully', async () => {
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
    
    // Items in the semicolon-delimited format after place resolution
    const items = [
      {
        name: 'Maison Passerelle',
        type: 'restaurant',
        city: 'New York',
        tags: ['French-Diaspora Fusion'],
        place_id: 'place1',
        formatted_address: '123 Main St, New York, NY 10001',
        neighborhood_id: 1,
        _lineNumber: 1
      },
      {
        name: 'Bar Bianchi',
        type: 'restaurant',
        city: 'New York',
        tags: ['Milanese'],
        place_id: 'place2',
        formatted_address: '456 Elm St, New York, NY 10002',
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
    
    // Should have called createRestaurant with the correct data
    expect(restaurantService.createRestaurant).toHaveBeenCalledTimes(2);
    expect(restaurantService.createRestaurant).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Maison Passerelle',
      place_id: 'place1',
      formatted_address: '123 Main St, New York, NY 10001',
      neighborhood_id: 1
    }));
    
    // Should have called addRestaurantToList with the correct data
    expect(listService.addRestaurantToList).toHaveBeenCalledTimes(2);
    
    expect(result.current.submittedItems.length).toBe(2);
    expect(result.current.submittedItems[0].status).toBe('success');
    expect(result.current.submittedItems[1].status).toBe('success');
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitProgress).toBe(100);
  });

  it('should use bulk add API for semicolon-delimited format items when available', async () => {
    // Mock successful bulk add
    listService.bulkAddToList.mockResolvedValue({
      success: true,
      data: { added: 2, listId: 123 }
    });
    
    // Items in the semicolon-delimited format after place resolution
    const items = [
      {
        name: 'JR & Son',
        type: 'restaurant',
        city: 'New York',
        tags: ['Italian-American'],
        place_id: 'place3',
        formatted_address: '789 Oak St, New York, NY 10003',
        neighborhood_id: 3,
        _lineNumber: 3
      },
      {
        name: 'Papa d\'Amour',
        type: 'restaurant',
        city: 'New York',
        tags: ['French-Asian Bakery'],
        place_id: 'place4',
        formatted_address: '101 Pine St, New York, NY 10004',
        neighborhood_id: 4,
        _lineNumber: 4
      }
    ];
    
    const listId = 123;
    const useBulkApi = true;
    
    const { result, waitForNextUpdate } = renderHook(() => useBulkSubmitter());
    
    act(() => {
      result.current.submitItems(items, listId, useBulkApi);
    });
    
    await waitForNextUpdate();
    
    // Should have called bulkAddToList once with the correct data
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
});
