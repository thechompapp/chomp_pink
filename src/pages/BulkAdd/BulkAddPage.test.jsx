/**
 * Unit tests for BulkAddPage component
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import BulkAddPage from './BulkAddPage';
import useInputParser from '../../hooks/useInputParser';
import usePlaceResolver from '../../hooks/usePlaceResolver';
import useBulkSubmitter from '../../hooks/useBulkSubmitter';

// Mock the hooks
jest.mock('../../hooks/useInputParser', () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock('../../hooks/usePlaceResolver', () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock('../../hooks/useBulkSubmitter', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock the components
jest.mock('../../components/BulkAdd/BulkInputForm', () => ({
  __esModule: true,
  default: ({ onProcess, inputText, onInputChange }) => (
    <div data-testid="bulk-input-form">
      <textarea 
        data-testid="input-textarea" 
        value={inputText} 
        onChange={(e) => onInputChange(e.target.value)} 
      />
      <button data-testid="process-button" onClick={onProcess}>Process</button>
    </div>
  )
}));

jest.mock('../../components/BulkAdd/BulkReviewTable', () => ({
  __esModule: true,
  default: ({ items, onEditItem, onDeleteItem, onResolveItem }) => (
    <div data-testid="bulk-review-table">
      <ul>
        {items.map((item, index) => (
          <li key={index} data-testid={`item-${index}`}>
            {item.name}
            <button onClick={() => onEditItem(item)} data-testid={`edit-${index}`}>Edit</button>
            <button onClick={() => onDeleteItem(item)} data-testid={`delete-${index}`}>Delete</button>
            <button onClick={() => onResolveItem(item)} data-testid={`resolve-${index}`}>Resolve</button>
          </li>
        ))}
      </ul>
    </div>
  )
}));

jest.mock('../PlaceSelectionDialog', () => ({
  __esModule: true,
  default: ({ open, onClose, places, onSelectPlace, itemData }) => (
    <div data-testid="place-selection-dialog" style={{ display: open ? 'block' : 'none' }}>
      <ul>
        {places.map((place, index) => (
          <li key={index}>
            <button 
              onClick={() => onSelectPlace(place, itemData)} 
              data-testid={`select-place-${index}`}
            >
              {place.name}
            </button>
          </li>
        ))}
      </ul>
      <button onClick={onClose} data-testid="close-dialog">Close</button>
    </div>
  )
}));

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
  logInfo: jest.fn(),
  logWarn: jest.fn()
}));

describe('BulkAddPage', () => {
  // Setup mock hook implementations
  beforeEach(() => {
    // Mock useInputParser
    useInputParser.mockReturnValue({
      parsedItems: [],
      parseError: null,
      isParsing: false,
      parseInput: jest.fn().mockResolvedValue([]),
      resetParser: jest.fn()
    });
    
    // Mock usePlaceResolver
    usePlaceResolver.mockReturnValue({
      resolvedItems: [],
      isResolving: false,
      currentItem: null,
      multipleOptions: [],
      showPlaceSelection: false,
      resolvePlaces: jest.fn(),
      handlePlaceSelection: jest.fn(),
      setShowPlaceSelection: jest.fn(),
      resetResolver: jest.fn()
    });
    
    // Mock useBulkSubmitter
    useBulkSubmitter.mockReturnValue({
      submittedItems: [],
      isSubmitting: false,
      submitProgress: 0,
      submitError: null,
      submitItems: jest.fn(),
      resetSubmitter: jest.fn()
    });
  });
  
  it('renders the input mode initially', () => {
    render(
      <MemoryRouter>
        <BulkAddPage />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('bulk-input-form')).toBeInTheDocument();
    expect(screen.getByText('Bulk Add')).toBeInTheDocument();
  });
  
  it('processes input and transitions to review mode', async () => {
    // Mock successful parsing
    const mockParsedItems = [
      { name: 'Restaurant 1', address: '123 Main St', _lineNumber: 1 },
      { name: 'Restaurant 2', address: '456 Elm St', _lineNumber: 2 }
    ];
    
    useInputParser.mockReturnValue({
      parsedItems: mockParsedItems,
      parseError: null,
      isParsing: false,
      parseInput: jest.fn().mockResolvedValue(mockParsedItems),
      resetParser: jest.fn()
    });
    
    render(
      <MemoryRouter>
        <BulkAddPage />
      </MemoryRouter>
    );
    
    // Enter input text
    fireEvent.change(screen.getByTestId('input-textarea'), {
      target: { value: 'Restaurant 1, 123 Main St\nRestaurant 2, 456 Elm St' }
    });
    
    // Click process button
    fireEvent.click(screen.getByTestId('process-button'));
    
    // Verify parseInput was called
    await waitFor(() => {
      expect(useInputParser().parseInput).toHaveBeenCalled();
    });
    
    // Mock resolvedItems for review mode
    const mockResolvedItems = [
      { 
        name: 'Restaurant 1', 
        address: '123 Main St', 
        place_id: 'place1',
        _lineNumber: 1,
        status: 'valid'
      },
      { 
        name: 'Restaurant 2', 
        address: '456 Elm St', 
        place_id: 'place2',
        _lineNumber: 2,
        status: 'valid'
      }
    ];
    
    usePlaceResolver.mockReturnValue({
      resolvedItems: mockResolvedItems,
      isResolving: false,
      currentItem: null,
      multipleOptions: [],
      showPlaceSelection: false,
      resolvePlaces: jest.fn().mockResolvedValue(mockResolvedItems),
      handlePlaceSelection: jest.fn(),
      setShowPlaceSelection: jest.fn(),
      resetResolver: jest.fn()
    });
    
    // Re-render with updated state
    render(
      <MemoryRouter>
        <BulkAddPage />
      </MemoryRouter>
    );
    
    // Verify review table is shown
    await waitFor(() => {
      expect(screen.getByTestId('bulk-review-table')).toBeInTheDocument();
    });
  });
  
  it('handles place selection when multiple options are found', async () => {
    // Mock multiple place options
    const mockMultipleOptions = [
      { place_id: 'place1', name: 'Restaurant 1 Option A' },
      { place_id: 'place2', name: 'Restaurant 1 Option B' }
    ];
    
    const mockCurrentItem = { 
      name: 'Restaurant 1', 
      address: '123 Main St', 
      _lineNumber: 1 
    };
    
    usePlaceResolver.mockReturnValue({
      resolvedItems: [],
      isResolving: false,
      currentItem: mockCurrentItem,
      multipleOptions: mockMultipleOptions,
      showPlaceSelection: true,
      resolvePlaces: jest.fn(),
      handlePlaceSelection: jest.fn(),
      setShowPlaceSelection: jest.fn(),
      resetResolver: jest.fn()
    });
    
    render(
      <MemoryRouter>
        <BulkAddPage />
      </MemoryRouter>
    );
    
    // Verify place selection dialog is shown
    expect(screen.getByTestId('place-selection-dialog')).toHaveStyle('display: block');
    
    // Select a place
    fireEvent.click(screen.getByTestId('select-place-0'));
    
    // Verify handlePlaceSelection was called
    expect(usePlaceResolver().handlePlaceSelection).toHaveBeenCalled();
  });
  
  it('submits resolved items', async () => {
    // Mock resolved items
    const mockResolvedItems = [
      { 
        name: 'Restaurant 1', 
        address: '123 Main St', 
        place_id: 'place1',
        _lineNumber: 1,
        status: 'valid'
      },
      { 
        name: 'Restaurant 2', 
        address: '456 Elm St', 
        place_id: 'place2',
        _lineNumber: 2,
        status: 'valid'
      }
    ];
    
    usePlaceResolver.mockReturnValue({
      resolvedItems: mockResolvedItems,
      isResolving: false,
      currentItem: null,
      multipleOptions: [],
      showPlaceSelection: false,
      resolvePlaces: jest.fn(),
      handlePlaceSelection: jest.fn(),
      setShowPlaceSelection: jest.fn(),
      resetResolver: jest.fn()
    });
    
    // Mock successful submission
    const mockSubmittedItems = [
      { 
        name: 'Restaurant 1', 
        address: '123 Main St', 
        place_id: 'place1',
        _lineNumber: 1,
        status: 'success'
      },
      { 
        name: 'Restaurant 2', 
        address: '456 Elm St', 
        place_id: 'place2',
        _lineNumber: 2,
        status: 'success'
      }
    ];
    
    useBulkSubmitter.mockReturnValue({
      submittedItems: mockSubmittedItems,
      isSubmitting: false,
      submitProgress: 100,
      submitError: null,
      submitItems: jest.fn().mockResolvedValue(mockSubmittedItems),
      resetSubmitter: jest.fn()
    });
    
    render(
      <MemoryRouter>
        <BulkAddPage />
      </MemoryRouter>
    );
    
    // Find and click the submit button
    const submitButton = screen.getByText('Submit to List');
    fireEvent.click(submitButton);
    
    // Verify submitItems was called
    await waitFor(() => {
      expect(useBulkSubmitter().submitItems).toHaveBeenCalled();
    });
  });
});
