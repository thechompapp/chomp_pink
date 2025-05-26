/**
 * Unit tests for usePlaceResolver hook
 */
import { renderHook, act } from '@testing-library/react-hooks';
import usePlaceResolver from './usePlaceResolver';
import { placeService } from '../services/placeService';
import { filterService } from '../services/filterService';

// Mock the services
jest.mock('../services/placeService', () => ({
  placeService: {
    searchPlaces: jest.fn(),
    getPlaceDetails: jest.fn()
  }
}));

jest.mock('../services/filterService', () => ({
  filterService: {
    getNeighborhoodByZip: jest.fn()
  }
}));

// Mock the logger
jest.mock('../utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn()
}));

describe('usePlaceResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePlaceResolver());
    
    expect(result.current.resolvedItems).toEqual([]);
    expect(result.current.isResolving).toBe(false);
    expect(result.current.currentItem).toBeNull();
    expect(result.current.multipleOptions).toEqual([]);
    expect(result.current.showPlaceSelection).toBe(false);
  });

  it('should resolve places for valid items', async () => {
    // Mock successful place search
    const mockPlace = {
      place_id: 'place123',
      name: 'Test Restaurant',
      formatted_address: '123 Test St, New York, NY 10001',
      geometry: {
        location: {
          lat: 40.7128,
          lng: -74.0060
        }
      }
    };
    
    placeService.searchPlaces.mockResolvedValue({
      success: true,
      data: [mockPlace]
    });
    
    filterService.getNeighborhoodByZip.mockResolvedValue({
      success: true,
      data: { id: 1, name: 'Test Neighborhood' }
    });
    
    const items = [
      { 
        name: 'Test Restaurant', 
        address: '123 Test St', 
        city: 'New York', 
        state: 'NY', 
        zip: '10001',
        _lineNumber: 1
      }
    ];
    
    const { result, waitForNextUpdate } = renderHook(() => usePlaceResolver());
    
    act(() => {
      result.current.resolvePlaces(items);
    });
    
    expect(result.current.isResolving).toBe(true);
    
    await waitForNextUpdate();
    
    expect(placeService.searchPlaces).toHaveBeenCalledWith({
      query: 'Test Restaurant 123 Test St New York NY 10001'
    });
    
    expect(filterService.getNeighborhoodByZip).toHaveBeenCalledWith('10001');
    
    expect(result.current.resolvedItems.length).toBe(1);
    expect(result.current.resolvedItems[0].place_id).toBe('place123');
    expect(result.current.resolvedItems[0].neighborhood_id).toBe(1);
    expect(result.current.isResolving).toBe(false);
  });

  it('should handle multiple place options', async () => {
    // Mock multiple place options
    const mockPlaces = [
      {
        place_id: 'place123',
        name: 'Test Restaurant',
        formatted_address: '123 Test St, New York, NY 10001'
      },
      {
        place_id: 'place456',
        name: 'Test Restaurant 2',
        formatted_address: '456 Test St, New York, NY 10001'
      }
    ];
    
    placeService.searchPlaces.mockResolvedValue({
      success: true,
      data: mockPlaces
    });
    
    const items = [
      { 
        name: 'Test Restaurant', 
        address: '123 Test St', 
        city: 'New York', 
        state: 'NY', 
        zip: '10001',
        _lineNumber: 1
      }
    ];
    
    const { result, waitForNextUpdate } = renderHook(() => usePlaceResolver());
    
    act(() => {
      result.current.resolvePlaces(items);
    });
    
    await waitForNextUpdate();
    
    expect(result.current.multipleOptions).toEqual(mockPlaces);
    expect(result.current.showPlaceSelection).toBe(true);
    expect(result.current.currentItem).toEqual(items[0]);
  });

  it('should handle place selection from multiple options', async () => {
    const mockPlace = {
      place_id: 'place123',
      name: 'Test Restaurant',
      formatted_address: '123 Test St, New York, NY 10001',
      geometry: {
        location: {
          lat: 40.7128,
          lng: -74.0060
        }
      }
    };
    
    const currentItem = { 
      name: 'Test Restaurant', 
      address: '123 Test St', 
      city: 'New York', 
      state: 'NY', 
      zip: '10001',
      _lineNumber: 1
    };
    
    filterService.getNeighborhoodByZip.mockResolvedValue({
      success: true,
      data: { id: 1, name: 'Test Neighborhood' }
    });
    
    const { result } = renderHook(() => usePlaceResolver());
    
    // Set up the state for place selection
    act(() => {
      result.current.setMultipleOptions([mockPlace]);
      result.current.setCurrentItem(currentItem);
      result.current.setShowPlaceSelection(true);
    });
    
    // Select a place
    await act(async () => {
      await result.current.handlePlaceSelection(mockPlace, currentItem);
    });
    
    expect(result.current.resolvedItems.length).toBe(1);
    expect(result.current.resolvedItems[0].place_id).toBe('place123');
    expect(result.current.showPlaceSelection).toBe(false);
  });

  it('should handle errors during place resolution', async () => {
    // Mock error in place search
    placeService.searchPlaces.mockResolvedValue({
      success: false,
      error: 'API error'
    });
    
    const items = [
      { 
        name: 'Test Restaurant', 
        address: '123 Test St', 
        city: 'New York', 
        state: 'NY', 
        zip: '10001',
        _lineNumber: 1
      }
    ];
    
    const { result, waitForNextUpdate } = renderHook(() => usePlaceResolver());
    
    act(() => {
      result.current.resolvePlaces(items);
    });
    
    await waitForNextUpdate();
    
    expect(result.current.resolvedItems.length).toBe(1);
    expect(result.current.resolvedItems[0].status).toBe('error');
    expect(result.current.resolvedItems[0].error).toBe('API error');
    expect(result.current.isResolving).toBe(false);
  });

  it('should reset state correctly', () => {
    const { result } = renderHook(() => usePlaceResolver());
    
    // Set some state
    act(() => {
      result.current.setResolvedItems([{ name: 'Test' }]);
      result.current.setIsResolving(true);
      result.current.setCurrentItem({ name: 'Current' });
      result.current.setMultipleOptions([{ name: 'Option' }]);
      result.current.setShowPlaceSelection(true);
    });
    
    // Reset
    act(() => {
      result.current.resetResolver();
    });
    
    // Verify reset state
    expect(result.current.resolvedItems).toEqual([]);
    expect(result.current.isResolving).toBe(false);
    expect(result.current.currentItem).toBeNull();
    expect(result.current.multipleOptions).toEqual([]);
    expect(result.current.showPlaceSelection).toBe(false);
  });
});
