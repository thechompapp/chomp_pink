/**
 * Unit tests for usePlaceResolver hook
 */
import { renderHook, act } from '@testing-library/react-hooks';
import usePlaceResolver from '../../../src/hooks/usePlaceResolver';
import { placeService } from '../../../src/services/placeService';
import { filterService } from '../../../src/services/filterService';

// Mock the services
jest.mock('../../../src/services/placeService', () => ({
  placeService: {
    searchPlaces: jest.fn(),
    getPlaceDetails: jest.fn()
  }
}));

jest.mock('../../../src/services/filterService', () => ({
  filterService: {
    getNeighborhoodByZip: jest.fn()
  }
}));

// Mock the logger
jest.mock('../../../src/utils/logger', () => ({
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

  it('should resolve places for semicolon-delimited format items', async () => {
    // Mock successful place search
    const mockPlace = {
      place_id: 'place123',
      name: 'Maison Passerelle',
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
    
    // Items in the semicolon-delimited format
    const items = [
      { 
        name: 'Maison Passerelle', 
        type: 'restaurant',
        city: 'New York',
        tags: ['French-Diaspora Fusion'],
        _lineNumber: 1,
        status: 'pending'
      }
    ];
    
    const { result, waitForNextUpdate } = renderHook(() => usePlaceResolver());
    
    act(() => {
      result.current.resolvePlaces(items);
    });
    
    expect(result.current.isResolving).toBe(true);
    
    await waitForNextUpdate();
    
    // Should construct a search query with the name, city, and tags
    expect(placeService.searchPlaces).toHaveBeenCalledWith({
      query: 'Maison Passerelle restaurant New York French-Diaspora Fusion'
    });
    
    expect(result.current.resolvedItems.length).toBe(1);
    expect(result.current.resolvedItems[0].place_id).toBe('place123');
    expect(result.current.isResolving).toBe(false);
  });

  it('should handle multiple place options for semicolon-delimited format', async () => {
    // Mock multiple place options
    const mockPlaces = [
      {
        place_id: 'place123',
        name: 'Bar Bianchi',
        formatted_address: '123 Test St, New York, NY 10001'
      },
      {
        place_id: 'place456',
        name: 'Bar Bianchi 2',
        formatted_address: '456 Test St, New York, NY 10001'
      }
    ];
    
    placeService.searchPlaces.mockResolvedValue({
      success: true,
      data: mockPlaces
    });
    
    // Items in the semicolon-delimited format
    const items = [
      { 
        name: 'Bar Bianchi', 
        type: 'restaurant',
        city: 'New York',
        tags: ['Milanese'],
        _lineNumber: 1,
        status: 'pending'
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

  it('should handle place selection from multiple options for semicolon-delimited format', async () => {
    const mockPlace = {
      place_id: 'place123',
      name: 'JR & Son',
      formatted_address: '123 Test St, New York, NY 10001',
      geometry: {
        location: {
          lat: 40.7128,
          lng: -74.0060
        }
      }
    };
    
    const currentItem = { 
      name: 'JR & Son', 
      type: 'restaurant',
      city: 'New York',
      tags: ['Italian-American'],
      _lineNumber: 1,
      status: 'pending'
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
});
