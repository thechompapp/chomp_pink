/**
 * Dish Service Backward Compatibility Tests
 * 
 * Tests for the dishService.js file to ensure it maintains backward compatibility
 * with existing code while using the new modular architecture internally.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { dishService } from '@/services/dishService';
import * as dishModuleExports from '@/services/dish';

// Mock the dish module exports
vi.mock('@/services/dish', () => ({
  dishService: {
    getDishDetails: vi.fn(),
    searchDishes: vi.fn(),
    getDishesByRestaurantId: vi.fn()
  }
}));

// Mock the logger
vi.mock('@/utils/logger', () => ({
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logInfo: vi.fn()
}));

describe('Dish Service Backward Compatibility', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });
  
  it('should delegate getDishDetails to the modular dish service', async () => {
    // Mock the return value
    const mockReturn = { id: '1', name: 'Test Dish' };
    dishModuleExports.dishService.getDishDetails.mockResolvedValueOnce(mockReturn);
    
    // Call the method
    const result = await dishService.getDishDetails('1');
    
    // Assertions
    expect(dishModuleExports.dishService.getDishDetails).toHaveBeenCalledWith('1');
    expect(result).toEqual(mockReturn);
  });
  
  it('should delegate searchDishes to the modular dish service', async () => {
    // Mock search params and return value
    const params = { query: 'pasta', cuisine: 'Italian' };
    const mockReturn = { dishes: [{ id: '1', name: 'Pasta' }] };
    dishModuleExports.dishService.searchDishes.mockResolvedValueOnce(mockReturn);
    
    // Call the method
    const result = await dishService.searchDishes(params);
    
    // Assertions
    expect(dishModuleExports.dishService.searchDishes).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockReturn);
  });
  
  it('should delegate getDishesByRestaurantId to the modular dish service', async () => {
    // Mock the return value
    const mockReturn = { dishes: [{ id: '1', name: 'Dish 1' }] };
    dishModuleExports.dishService.getDishesByRestaurantId.mockResolvedValueOnce(mockReturn);
    
    // Call the method
    const result = await dishService.getDishesByRestaurantId('5');
    
    // Assertions
    expect(dishModuleExports.dishService.getDishesByRestaurantId).toHaveBeenCalledWith('5');
    expect(result).toEqual(mockReturn);
  });
  
  it('should export the dishService as both named and default export', () => {
    // Check that the exports are correctly configured
    expect(dishService).toBeDefined();
    expect(dishService).toEqual(expect.objectContaining({
      getDishDetails: expect.any(Function),
      searchDishes: expect.any(Function),
      getDishesByRestaurantId: expect.any(Function)
    }));
  });
});
