import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkInputForm } from '@/components/BulkAdd/BulkInputForm';
import { BulkReviewTable } from '@/components/BulkAdd/BulkReviewTable';
import { PlaceSelectionDialog } from '@/components/BulkAdd/PlaceSelectionDialog';

// Mock services
vi.mock('@/services/bulkAddService', () => ({
  parseInputText: vi.fn(),
  validateBulkData: vi.fn(),
  findNeighborhoodByZipcode: vi.fn(),
  submitBulkData: vi.fn()
}));

vi.mock('@/services/placeService', () => ({
  searchPlaces: vi.fn(),
  getPlaceDetails: vi.fn()
}));

vi.mock('@/utils/bulkAddUtils', () => ({
  detectInputFormat: vi.fn(),
  formatDataForDisplay: vi.fn(),
  retryWithBackoff: vi.fn()
}));

import { parseInputText, validateBulkData, findNeighborhoodByZipcode, submitBulkData } from '@/services/bulkAddService';
import { searchPlaces, getPlaceDetails } from '@/services/placeService';
import { detectInputFormat, formatDataForDisplay, retryWithBackoff } from '@/utils/bulkAddUtils';

describe('BulkAdd Component Workflow Integration', () => {
  const testRestaurants = [
    'Dirt Candy; restaurant; New York; Vegetarian',
    'Katz\'s Delicatessen; restaurant; New York; Deli',
    'Joe\'s Pizza; restaurant; New York; Pizza'
  ];

  const mockParsedData = [
    {
      id: 1,
      name: 'Dirt Candy',
      type: 'restaurant',
      location: 'New York',
      cuisine: 'Vegetarian',
      status: 'new',
      lineNumber: 1
    },
    {
      id: 2,
      name: 'Katz\'s Delicatessen',
      type: 'restaurant',
      location: 'New York',
      cuisine: 'Deli',
      status: 'new',
      lineNumber: 2
    },
    {
      id: 3,
      name: 'Joe\'s Pizza',
      type: 'restaurant',
      location: 'New York',
      cuisine: 'Pizza',
      status: 'new',
      lineNumber: 3
    }
  ];

  const mockPlaceSearchResults = [
    {
      place_id: 'place-1',
      name: 'Dirt Candy',
      formatted_address: '86 Allen St, New York, NY 10002',
      rating: 4.5,
      types: ['restaurant']
    },
    {
      place_id: 'place-2',
      name: 'Katz\'s Delicatessen',
      formatted_address: '205 E Houston St, New York, NY 10002',
      rating: 4.3,
      types: ['restaurant']
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    detectInputFormat.mockReturnValue('semicolon');
    parseInputText.mockResolvedValue(mockParsedData);
    validateBulkData.mockReturnValue({ valid: true, errors: [] });
    searchPlaces.mockResolvedValue({ success: true, data: mockPlaceSearchResults });
    retryWithBackoff.mockImplementation(fn => fn());
    findNeighborhoodByZipcode.mockResolvedValue({
      id: 1,
      name: 'Lower East Side'
    });
  });

  describe('Complete Input to Review Workflow', () => {
    it('should handle complete input processing workflow', async () => {
      const user = userEvent.setup();
      const onDataSubmit = vi.fn();
      
      // Render input form
      render(<BulkInputForm onDataSubmit={onDataSubmit} onClear={vi.fn()} />);
      
      // Enter bulk data
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      await user.type(textarea, testRestaurants.join('\n'));
      
      // Verify format detection
      expect(detectInputFormat).toHaveBeenCalledWith(testRestaurants.join('\n'));
      expect(screen.getByText(/detected format.*semicolon/i)).toBeInTheDocument();
      
      // Submit data
      const processButton = screen.getByRole('button', { name: /process data/i });
      await user.click(processButton);
      
      // Verify parsing and validation
      expect(parseInputText).toHaveBeenCalledWith(testRestaurants.join('\n'));
      expect(validateBulkData).toHaveBeenCalledWith(mockParsedData);
      expect(onDataSubmit).toHaveBeenCalledWith(mockParsedData);
    });

    it('should handle validation errors in workflow', async () => {
      const user = userEvent.setup();
      const validationErrors = {
        valid: false,
        errors: ['Name is required on line 2', 'Location is required on line 3']
      };
      
      validateBulkData.mockReturnValue(validationErrors);
      
      render(<BulkInputForm onDataSubmit={vi.fn()} onClear={vi.fn()} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      await user.type(textarea, 'Dirt Candy; restaurant; New York\n; restaurant; \nJoe\'s; restaurant; ');
      
      const processButton = screen.getByRole('button', { name: /process data/i });
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByText(/validation errors/i)).toBeInTheDocument();
        expect(screen.getByText(/name is required on line 2/i)).toBeInTheDocument();
        expect(screen.getByText(/location is required on line 3/i)).toBeInTheDocument();
      });
    });
  });

  describe('Review Table to Place Lookup Integration', () => {
    it('should handle complete place lookup workflow', async () => {
      const user = userEvent.setup();
      const onDataUpdate = vi.fn();
      
      render(
        <BulkReviewTable 
          data={mockParsedData} 
          onDataUpdate={onDataUpdate}
          onSubmit={vi.fn()}
        />
      );
      
      // Click lookup button for first restaurant
      const lookupButton = screen.getByTestId('lookup-button-1');
      await user.click(lookupButton);
      
      // Verify search was called
      expect(searchPlaces).toHaveBeenCalledWith('Dirt Candy New York');
      
      // Wait for place selection dialog
      await waitFor(() => {
        expect(screen.getByTestId('place-selection-dialog')).toBeInTheDocument();
      });
      
      // Select a place
      const selectButton = screen.getByRole('button', { name: /select.*dirt candy/i });
      await user.click(selectButton);
      
      // Verify data update
      expect(onDataUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          place_id: 'place-1',
          status: 'found'
        })
      );
    });

    it('should handle batch place lookup', async () => {
      const user = userEvent.setup();
      const onDataUpdate = vi.fn();
      
      render(
        <BulkReviewTable 
          data={mockParsedData} 
          onDataUpdate={onDataUpdate}
          onSubmit={vi.fn()}
        />
      );
      
      // Select multiple items
      const checkbox1 = screen.getByTestId('checkbox-1');
      const checkbox2 = screen.getByTestId('checkbox-2');
      
      await user.click(checkbox1);
      await user.click(checkbox2);
      
      // Click batch lookup
      const batchLookupButton = screen.getByRole('button', { name: /lookup selected/i });
      await user.click(batchLookupButton);
      
      // Verify multiple searches
      expect(searchPlaces).toHaveBeenCalledWith('Dirt Candy New York');
      expect(searchPlaces).toHaveBeenCalledWith('Katz\'s Delicatessen New York');
    });
  });

  describe('Place Selection Dialog Integration', () => {
    it('should handle place selection with address extraction', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const onClose = vi.fn();
      
      getPlaceDetails.mockResolvedValue({
        success: true,
        data: {
          place_id: 'place-1',
          formatted_address: '86 Allen St, New York, NY 10002',
          geometry: {
            location: { lat: 40.7181, lng: -73.9900 }
          }
        }
      });
      
      render(
        <PlaceSelectionDialog
          isOpen={true}
          places={mockPlaceSearchResults}
          onSelect={onSelect}
          onClose={onClose}
          searchQuery="Dirt Candy New York"
        />
      );
      
      // Select a place
      const selectButton = screen.getByRole('button', { name: /select.*dirt candy/i });
      await user.click(selectButton);
      
      // Verify place details call
      expect(getPlaceDetails).toHaveBeenCalledWith('place-1');
      
      // Verify ZIP code extraction and neighborhood lookup
      await waitFor(() => {
        expect(findNeighborhoodByZipcode).toHaveBeenCalledWith('10002');
      });
      
      // Verify selection with complete data
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          place_id: 'place-1',
          formatted_address: '86 Allen St, New York, NY 10002',
          zipcode: '10002',
          neighborhood: 'Lower East Side',
          latitude: 40.7181,
          longitude: -73.9900
        })
      );
    });

    it('should handle place selection without neighborhood found', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      
      findNeighborhoodByZipcode.mockResolvedValue(null);
      getPlaceDetails.mockResolvedValue({
        success: true,
        data: {
          place_id: 'place-1',
          formatted_address: '123 Unknown St, New York, NY 10999'
        }
      });
      
      render(
        <PlaceSelectionDialog
          isOpen={true}
          places={mockPlaceSearchResults}
          onSelect={onSelect}
          onClose={vi.fn()}
        />
      );
      
      const selectButton = screen.getByRole('button', { name: /select.*dirt candy/i });
      await user.click(selectButton);
      
      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledWith(
          expect.objectContaining({
            place_id: 'place-1',
            zipcode: '10999',
            neighborhood: null
          })
        );
      });
    });

    it('should handle place search with no results', () => {
      searchPlaces.mockResolvedValue({ success: true, data: [] });
      
      render(
        <PlaceSelectionDialog
          isOpen={true}
          places={[]}
          onSelect={vi.fn()}
          onClose={vi.fn()}
          searchQuery="Nonexistent Restaurant"
        />
      );
      
      expect(screen.getByText(/no places found/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      const onDataUpdate = vi.fn();
      
      searchPlaces.mockRejectedValue(new Error('API Error'));
      
      render(
        <BulkReviewTable 
          data={mockParsedData} 
          onDataUpdate={onDataUpdate}
          onSubmit={vi.fn()}
        />
      );
      
      const lookupButton = screen.getByTestId('lookup-button-1');
      await user.click(lookupButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error searching for places/i)).toBeInTheDocument();
      });
    });

    it('should handle parsing errors in input form', async () => {
      const user = userEvent.setup();
      parseInputText.mockRejectedValue(new Error('Invalid format'));
      
      render(<BulkInputForm onDataSubmit={vi.fn()} onClear={vi.fn()} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      await user.type(textarea, 'Invalid format data');
      
      const processButton = screen.getByRole('button', { name: /process data/i });
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error processing data/i)).toBeInTheDocument();
        expect(screen.getByText(/invalid format/i)).toBeInTheDocument();
      });
    });

    it('should handle neighborhood lookup failures', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      
      findNeighborhoodByZipcode.mockRejectedValue(new Error('Neighborhood service unavailable'));
      getPlaceDetails.mockResolvedValue({
        success: true,
        data: {
          place_id: 'place-1',
          formatted_address: '86 Allen St, New York, NY 10002'
        }
      });
      
      render(
        <PlaceSelectionDialog
          isOpen={true}
          places={mockPlaceSearchResults}
          onSelect={onSelect}
          onClose={vi.fn()}
        />
      );
      
      const selectButton = screen.getByRole('button', { name: /select.*dirt candy/i });
      await user.click(selectButton);
      
      // Should still select place without neighborhood
      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledWith(
          expect.objectContaining({
            place_id: 'place-1',
            zipcode: '10002',
            neighborhood: null,
            neighborhoodError: 'Neighborhood service unavailable'
          })
        );
      });
    });
  });

  describe('Data Flow Integration', () => {
    it('should maintain data integrity through complete workflow', async () => {
      const user = userEvent.setup();
      let reviewData = null;
      
      const BulkAddWorkflowTest = () => {
        const [step, setStep] = React.useState('input');
        const [data, setData] = React.useState([]);
        
        const handleDataSubmit = (submittedData) => {
          setData(submittedData);
          setStep('review');
          reviewData = submittedData;
        };
        
        const handleDataUpdate = (updatedItem) => {
          setData(prev => prev.map(item => 
            item.id === updatedItem.id ? updatedItem : item
          ));
        };
        
        return (
          <div>
            {step === 'input' && (
              <BulkInputForm onDataSubmit={handleDataSubmit} onClear={vi.fn()} />
            )}
            {step === 'review' && (
              <BulkReviewTable 
                data={data}
                onDataUpdate={handleDataUpdate}
                onSubmit={vi.fn()}
              />
            )}
          </div>
        );
      };
      
      render(<BulkAddWorkflowTest />);
      
      // Input step
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      await user.type(textarea, testRestaurants.join('\n'));
      
      const processButton = screen.getByRole('button', { name: /process data/i });
      await user.click(processButton);
      
      // Verify transition to review step
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('Dirt Candy')).toBeInTheDocument();
        expect(reviewData).toEqual(mockParsedData);
      });
      
      // Update an item
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);
      
      const nameInput = screen.getByTestId('name-input-1');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Restaurant Name');
      
      const saveButton = screen.getByTestId('save-button-1');
      await user.click(saveButton);
      
      // Verify data was updated
      expect(screen.getByText('Updated Restaurant Name')).toBeInTheDocument();
    });

    it('should handle format switching during input', async () => {
      const user = userEvent.setup();
      
      render(<BulkInputForm onDataSubmit={vi.fn()} onClear={vi.fn()} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      
      // Start with comma format
      detectInputFormat.mockReturnValue('comma');
      await user.type(textarea, 'Restaurant, Type, Location');
      
      expect(screen.getByText(/detected format.*comma/i)).toBeInTheDocument();
      
      // Switch to semicolon format
      detectInputFormat.mockReturnValue('semicolon');
      await user.clear(textarea);
      await user.type(textarea, 'Restaurant; Type; Location');
      
      expect(screen.getByText(/detected format.*semicolon/i)).toBeInTheDocument();
    });
  });

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Restaurant ${i + 1}`,
        type: 'restaurant',
        location: 'New York',
        cuisine: 'Various',
        status: 'new',
        lineNumber: i + 1
      }));
      
      parseInputText.mockResolvedValue(largeDataset);
      
      const user = userEvent.setup();
      render(<BulkInputForm onDataSubmit={vi.fn()} onClear={vi.fn()} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      const largeInput = Array.from({ length: 100 }, (_, i) => 
        `Restaurant ${i + 1}; restaurant; New York; Various`
      ).join('\n');
      
      await user.type(textarea, largeInput);
      
      const processButton = screen.getByRole('button', { name: /process data/i });
      await user.click(processButton);
      
      // Verify processing completes in reasonable time
      await waitFor(() => {
        expect(parseInputText).toHaveBeenCalled();
      }, { timeout: 5000 });
    });

    it('should handle concurrent place lookups', async () => {
      const user = userEvent.setup();
      const onDataUpdate = vi.fn();
      
      // Mock delayed responses
      searchPlaces.mockImplementation((query) => 
        new Promise(resolve => 
          setTimeout(() => resolve({ success: true, data: mockPlaceSearchResults }), 100)
        )
      );
      
      render(
        <BulkReviewTable 
          data={mockParsedData} 
          onDataUpdate={onDataUpdate}
          onSubmit={vi.fn()}
        />
      );
      
      // Click multiple lookup buttons quickly
      const lookupButton1 = screen.getByTestId('lookup-button-1');
      const lookupButton2 = screen.getByTestId('lookup-button-2');
      const lookupButton3 = screen.getByTestId('lookup-button-3');
      
      await user.click(lookupButton1);
      await user.click(lookupButton2);
      await user.click(lookupButton3);
      
      // Verify all searches were initiated
      await waitFor(() => {
        expect(searchPlaces).toHaveBeenCalledTimes(3);
      });
    });
  });
}); 