/**
 * Unit tests for useInputParser hook
 */
import { renderHook, act } from '@testing-library/react-hooks';
import useInputParser from '../../../src/hooks/useInputParser';
import * as bulkAddUtils from '../../../src/utils/bulkAddUtils';

// Mock the bulkAddUtils module
jest.mock('../../../src/utils/bulkAddUtils', () => ({
  parseInputText: jest.fn(),
}));

// Mock the logger
jest.mock('../../../src/utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn(),
}));

describe('useInputParser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useInputParser());
    
    expect(result.current.parsedItems).toEqual([]);
    expect(result.current.parseError).toBeNull();
    expect(result.current.isParsing).toBe(false);
  });

  it('should handle empty input', async () => {
    const { result } = renderHook(() => useInputParser());
    
    await act(async () => {
      const items = await result.current.parseInput('');
      expect(items).toEqual([]);
    });
    
    expect(result.current.parseError).toBe('Please enter some data to process');
    expect(result.current.parsedItems).toEqual([]);
    expect(result.current.isParsing).toBe(false);
  });

  it('should parse valid input', async () => {
    const mockItems = [
      { name: 'Restaurant 1', address: '123 Main St', _lineNumber: 1 },
      { name: 'Restaurant 2', address: '456 Elm St', _lineNumber: 2 },
    ];
    
    bulkAddUtils.parseInputText.mockReturnValue(mockItems);
    
    const { result } = renderHook(() => useInputParser());
    
    await act(async () => {
      const items = await result.current.parseInput('Restaurant 1, 123 Main St\nRestaurant 2, 456 Elm St');
      expect(items).toEqual(mockItems);
    });
    
    expect(bulkAddUtils.parseInputText).toHaveBeenCalledWith('Restaurant 1, 123 Main St\nRestaurant 2, 456 Elm St');
    expect(result.current.parsedItems).toEqual(mockItems);
    expect(result.current.parseError).toBeNull();
    expect(result.current.isParsing).toBe(false);
  });
  
  it('should parse semicolon-delimited input with hashtags', async () => {
    const sampleInput = 
      'Maison Passerelle; restaurant; New York; French-Diaspora Fusion\n' +
      'Bar Bianchi; restaurant; New York; Milanese\n' +
      'JR & Son; restaurant; New York; Italian-American\n' +
      'Papa d\'Amour; restaurant; New York; French-Asian Bakery\n' +
      'Figure Eight; restaurant; New York; Chinese-American';
    
    const expectedParsedItems = [
      { 
        name: 'Maison Passerelle', 
        type: 'restaurant',
        city: 'New York',
        tags: ['French-Diaspora Fusion'],
        _lineNumber: 1,
        status: 'pending'
      },
      { 
        name: 'Bar Bianchi', 
        type: 'restaurant',
        city: 'New York',
        tags: ['Milanese'],
        _lineNumber: 2,
        status: 'pending'
      },
      { 
        name: 'JR & Son', 
        type: 'restaurant',
        city: 'New York',
        tags: ['Italian-American'],
        _lineNumber: 3,
        status: 'pending'
      },
      { 
        name: 'Papa d\'Amour', 
        type: 'restaurant',
        city: 'New York',
        tags: ['French-Asian Bakery'],
        _lineNumber: 4,
        status: 'pending'
      },
      { 
        name: 'Figure Eight', 
        type: 'restaurant',
        city: 'New York',
        tags: ['Chinese-American'],
        _lineNumber: 5,
        status: 'pending'
      }
    ];
    
    bulkAddUtils.parseInputText.mockReturnValue(expectedParsedItems);
    
    const { result } = renderHook(() => useInputParser());
    
    await act(async () => {
      const items = await result.current.parseInput(sampleInput);
      expect(items).toEqual(expectedParsedItems);
    });
    
    expect(bulkAddUtils.parseInputText).toHaveBeenCalledWith(sampleInput);
    expect(result.current.parsedItems).toEqual(expectedParsedItems);
    expect(result.current.parseError).toBeNull();
    expect(result.current.isParsing).toBe(false);
  });

  it('should handle parsing errors', async () => {
    const error = new Error('Parsing error');
    bulkAddUtils.parseInputText.mockImplementation(() => {
      throw error;
    });
    
    const { result } = renderHook(() => useInputParser());
    
    await act(async () => {
      const items = await result.current.parseInput('Invalid input');
      expect(items).toEqual([]);
    });
    
    expect(result.current.parseError).toBe('Error parsing input: Parsing error');
    expect(result.current.parsedItems).toEqual([]);
    expect(result.current.isParsing).toBe(false);
  });

  it('should handle empty result from parser', async () => {
    bulkAddUtils.parseInputText.mockReturnValue([]);
    
    const { result } = renderHook(() => useInputParser());
    
    await act(async () => {
      const items = await result.current.parseInput('Some input');
      expect(items).toEqual([]);
    });
    
    expect(result.current.parseError).toBe('No valid items found in input');
    expect(result.current.parsedItems).toEqual([]);
    expect(result.current.isParsing).toBe(false);
  });

  it('should reset state correctly', async () => {
    const mockItems = [
      { name: 'Restaurant 1', address: '123 Main St', _lineNumber: 1 },
    ];
    
    bulkAddUtils.parseInputText.mockReturnValue(mockItems);
    
    const { result } = renderHook(() => useInputParser());
    
    // First parse some data
    await act(async () => {
      await result.current.parseInput('Restaurant 1, 123 Main St');
    });
    
    expect(result.current.parsedItems).toEqual(mockItems);
    
    // Then reset
    act(() => {
      result.current.resetParser();
    });
    
    expect(result.current.parsedItems).toEqual([]);
    expect(result.current.parseError).toBeNull();
    expect(result.current.isParsing).toBe(false);
  });
});
