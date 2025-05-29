import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkReviewTable } from '@/components/BulkAdd/BulkReviewTable';

// Mock dependencies
vi.mock('@/services/placeService', () => ({
  searchPlaces: vi.fn(),
  getPlaceDetails: vi.fn()
}));

vi.mock('@/components/BulkAdd/PlaceSelectionDialog', () => ({
  PlaceSelectionDialog: vi.fn(({ onSelect, onClose }) => (
    <div data-testid="place-selection-dialog">
      <button onClick={() => onSelect({ place_id: 'test-place-id', name: 'Test Place' })}>
        Select Place
      </button>
      <button onClick={onClose}>Close</button>
    </div>
  ))
}));

import { searchPlaces, getPlaceDetails } from '@/services/placeService';

describe('BulkReviewTable Component', () => {
  const mockData = [
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
      status: 'found',
      place_id: 'existing-place-id',
      lineNumber: 2
    },
    {
      id: 3,
      name: 'Invalid Restaurant',
      type: 'restaurant',
      location: '',
      cuisine: 'Unknown',
      status: 'error',
      error: 'Location is required',
      lineNumber: 3
    }
  ];

  const mockProps = {
    data: mockData,
    onDataUpdate: vi.fn(),
    onSubmit: vi.fn(),
    loading: false,
    error: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Initial State', () => {
    it('should render table with all data rows', () => {
      render(<BulkReviewTable {...mockProps} />);
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Dirt Candy')).toBeInTheDocument();
      expect(screen.getByText('Katz\'s Delicatessen')).toBeInTheDocument();
      expect(screen.getByText('Invalid Restaurant')).toBeInTheDocument();
    });

    it('should render table headers correctly', () => {
      render(<BulkReviewTable {...mockProps} />);
      
      expect(screen.getByText(/name/i)).toBeInTheDocument();
      expect(screen.getByText(/type/i)).toBeInTheDocument();
      expect(screen.getByText(/location/i)).toBeInTheDocument();
      expect(screen.getByText(/cuisine/i)).toBeInTheDocument();
      expect(screen.getByText(/status/i)).toBeInTheDocument();
      expect(screen.getByText(/actions/i)).toBeInTheDocument();
    });

    it('should show status indicators for each row', () => {
      render(<BulkReviewTable {...mockProps} />);
      
      expect(screen.getByText(/new/i)).toBeInTheDocument();
      expect(screen.getByText(/found/i)).toBeInTheDocument();
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    it('should show submit button when there are valid items', () => {
      render(<BulkReviewTable {...mockProps} />);
      
      const submitButton = screen.getByRole('button', { name: /submit all/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeEnabled();
    });
  });

  describe('Status Indicators and Icons', () => {
    it('should display correct icons for each status', () => {
      render(<BulkReviewTable {...mockProps} />);
      
      // Look for status-specific classes or icons
      expect(screen.getByTestId('status-new-1')).toBeInTheDocument();
      expect(screen.getByTestId('status-found-2')).toBeInTheDocument();
      expect(screen.getByTestId('status-error-3')).toBeInTheDocument();
    });

    it('should show error messages for items with errors', () => {
      render(<BulkReviewTable {...mockProps} />);
      
      expect(screen.getByText('Location is required')).toBeInTheDocument();
    });

    it('should highlight rows with different statuses', () => {
      render(<BulkReviewTable {...mockProps} />);
      
      const newRow = screen.getByTestId('row-1');
      const foundRow = screen.getByTestId('row-2');
      const errorRow = screen.getByTestId('row-3');
      
      expect(newRow).toHaveClass('status-new');
      expect(foundRow).toHaveClass('status-found');
      expect(errorRow).toHaveClass('status-error');
    });
  });

  describe('Place Lookup and Selection', () => {
    it('should show lookup button for new items', () => {
      render(<BulkReviewTable {...mockProps} />);
      
      const lookupButton = screen.getByTestId('lookup-button-1');
      expect(lookupButton).toBeInTheDocument();
      expect(lookupButton).toHaveTextContent(/find place/i);
    });

    it('should open place selection dialog when lookup button is clicked', async () => {
      const user = userEvent.setup();
      searchPlaces.mockResolvedValue({
        success: true,
        data: [
          { place_id: 'place-1', name: 'Dirt Candy', formatted_address: '86 Allen St, New York, NY' }
        ]
      });

      render(<BulkReviewTable {...mockProps} />);
      
      const lookupButton = screen.getByTestId('lookup-button-1');
      await user.click(lookupButton);
      
      expect(screen.getByTestId('place-selection-dialog')).toBeInTheDocument();
      expect(searchPlaces).toHaveBeenCalledWith('Dirt Candy New York');
    });

    it('should update item when place is selected', async () => {
      const user = userEvent.setup();
      searchPlaces.mockResolvedValue({
        success: true,
        data: [{ place_id: 'selected-place', name: 'Dirt Candy' }]
      });

      render(<BulkReviewTable {...mockProps} />);
      
      const lookupButton = screen.getByTestId('lookup-button-1');
      await user.click(lookupButton);
      
      const selectButton = screen.getByText('Select Place');
      await user.click(selectButton);
      
      expect(mockProps.onDataUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          place_id: 'test-place-id',
          status: 'found'
        })
      );
    });

    it('should close dialog without selection', async () => {
      const user = userEvent.setup();
      searchPlaces.mockResolvedValue({ success: true, data: [] });

      render(<BulkReviewTable {...mockProps} />);
      
      const lookupButton = screen.getByTestId('lookup-button-1');
      await user.click(lookupButton);
      
      const closeButton = screen.getByText('Close');
      await user.click(closeButton);
      
      expect(screen.queryByTestId('place-selection-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Inline Editing', () => {
    it('should make fields editable when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<BulkReviewTable {...mockProps} />);
      
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);
      
      expect(screen.getByTestId('name-input-1')).toBeInTheDocument();
      expect(screen.getByTestId('location-input-1')).toBeInTheDocument();
      expect(screen.getByTestId('cuisine-input-1')).toBeInTheDocument();
    });

    it('should save changes when save button is clicked', async () => {
      const user = userEvent.setup();
      render(<BulkReviewTable {...mockProps} />);
      
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);
      
      const nameInput = screen.getByTestId('name-input-1');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Restaurant Name');
      
      const saveButton = screen.getByTestId('save-button-1');
      await user.click(saveButton);
      
      expect(mockProps.onDataUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: 'Updated Restaurant Name'
        })
      );
    });

    it('should cancel editing when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<BulkReviewTable {...mockProps} />);
      
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);
      
      const nameInput = screen.getByTestId('name-input-1');
      await user.clear(nameInput);
      await user.type(nameInput, 'Changed Name');
      
      const cancelButton = screen.getByTestId('cancel-button-1');
      await user.click(cancelButton);
      
      expect(screen.getByText('Dirt Candy')).toBeInTheDocument();
      expect(mockProps.onDataUpdate).not.toHaveBeenCalled();
    });

    it('should validate fields during editing', async () => {
      const user = userEvent.setup();
      render(<BulkReviewTable {...mockProps} />);
      
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);
      
      const nameInput = screen.getByTestId('name-input-1');
      await user.clear(nameInput);
      
      const saveButton = screen.getByTestId('save-button-1');
      await user.click(saveButton);
      
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  describe('Row Actions', () => {
    it('should remove item when remove button is clicked', async () => {
      const user = userEvent.setup();
      render(<BulkReviewTable {...mockProps} />);
      
      const removeButton = screen.getByTestId('remove-button-1');
      await user.click(removeButton);
      
      expect(mockProps.onDataUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          status: 'removed'
        })
      );
    });

    it('should show confirmation before removing item', async () => {
      const user = userEvent.setup();
      render(<BulkReviewTable {...mockProps} />);
      
      const removeButton = screen.getByTestId('remove-button-1');
      await user.click(removeButton);
      
      expect(screen.getByText(/confirm removal/i)).toBeInTheDocument();
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);
      
      expect(mockProps.onDataUpdate).toHaveBeenCalled();
    });

    it('should allow restoring removed items', async () => {
      const user = userEvent.setup();
      const dataWithRemoved = [
        { ...mockData[0], status: 'removed' }
      ];
      
      render(<BulkReviewTable {...mockProps} data={dataWithRemoved} />);
      
      const restoreButton = screen.getByTestId('restore-button-1');
      await user.click(restoreButton);
      
      expect(mockProps.onDataUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          status: 'new'
        })
      );
    });
  });

  describe('Filtering and Sorting', () => {
    it('should filter by status', async () => {
      const user = userEvent.setup();
      render(<BulkReviewTable {...mockProps} />);
      
      const statusFilter = screen.getByTestId('status-filter');
      await user.selectOptions(statusFilter, 'error');
      
      expect(screen.getByText('Invalid Restaurant')).toBeInTheDocument();
      expect(screen.queryByText('Dirt Candy')).not.toBeInTheDocument();
    });

    it('should sort by column headers', async () => {
      const user = userEvent.setup();
      render(<BulkReviewTable {...mockProps} />);
      
      const nameHeader = screen.getByRole('button', { name: /name/i });
      await user.click(nameHeader);
      
      // Check if sorting indicators are shown
      expect(screen.getByTestId('sort-indicator-name')).toBeInTheDocument();
    });

    it('should search within table data', async () => {
      const user = userEvent.setup();
      render(<BulkReviewTable {...mockProps} />);
      
      const searchInput = screen.getByTestId('table-search');
      await user.type(searchInput, 'Dirt');
      
      expect(screen.getByText('Dirt Candy')).toBeInTheDocument();
      expect(screen.queryByText('Katz\'s Delicatessen')).not.toBeInTheDocument();
    });
  });

  describe('Batch Operations', () => {
    it('should allow selecting multiple rows', async () => {
      const user = userEvent.setup();
      render(<BulkReviewTable {...mockProps} />);
      
      const checkbox1 = screen.getByTestId('checkbox-1');
      const checkbox2 = screen.getByTestId('checkbox-2');
      
      await user.click(checkbox1);
      await user.click(checkbox2);
      
      expect(screen.getByText(/2 items selected/i)).toBeInTheDocument();
    });

    it('should allow select all functionality', async () => {
      const user = userEvent.setup();
      render(<BulkReviewTable {...mockProps} />);
      
      const selectAllCheckbox = screen.getByTestId('select-all-checkbox');
      await user.click(selectAllCheckbox);
      
      expect(screen.getByText(/3 items selected/i)).toBeInTheDocument();
    });

    it('should show batch actions when items are selected', async () => {
      const user = userEvent.setup();
      render(<BulkReviewTable {...mockProps} />);
      
      const checkbox1 = screen.getByTestId('checkbox-1');
      await user.click(checkbox1);
      
      expect(screen.getByRole('button', { name: /remove selected/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /lookup selected/i })).toBeInTheDocument();
    });

    it('should apply batch lookup to selected items', async () => {
      const user = userEvent.setup();
      searchPlaces.mockResolvedValue({ success: true, data: [] });
      
      render(<BulkReviewTable {...mockProps} />);
      
      const checkbox1 = screen.getByTestId('checkbox-1');
      await user.click(checkbox1);
      
      const batchLookupButton = screen.getByRole('button', { name: /lookup selected/i });
      await user.click(batchLookupButton);
      
      expect(searchPlaces).toHaveBeenCalledWith('Dirt Candy New York');
    });
  });

  describe('Summary and Statistics', () => {
    it('should show item count summary', () => {
      render(<BulkReviewTable {...mockProps} />);
      
      expect(screen.getByText(/3 items total/i)).toBeInTheDocument();
      expect(screen.getByText(/1 new/i)).toBeInTheDocument();
      expect(screen.getByText(/1 found/i)).toBeInTheDocument();
      expect(screen.getByText(/1 error/i)).toBeInTheDocument();
    });

    it('should show ready to submit count', () => {
      render(<BulkReviewTable {...mockProps} />);
      
      expect(screen.getByText(/2 ready to submit/i)).toBeInTheDocument();
    });

    it('should disable submit button when no valid items', () => {
      const errorOnlyData = [mockData[2]]; // Only error item
      render(<BulkReviewTable {...mockProps} data={errorOnlyData} />);
      
      const submitButton = screen.getByRole('button', { name: /submit all/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state during submission', () => {
      render(<BulkReviewTable {...mockProps} loading={true} />);
      
      expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();
      expect(screen.getByRole('img', { name: /loading/i })).toBeInTheDocument();
    });

    it('should display error messages', () => {
      const errorMessage = 'Submission failed';
      render(<BulkReviewTable {...mockProps} error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should show loading indicators for individual row operations', async () => {
      const user = userEvent.setup();
      searchPlaces.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ success: true, data: [] }), 1000);
      }));
      
      render(<BulkReviewTable {...mockProps} />);
      
      const lookupButton = screen.getByTestId('lookup-button-1');
      await user.click(lookupButton);
      
      expect(screen.getByTestId('lookup-loading-1')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<BulkReviewTable {...mockProps} />);
      
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', expect.stringContaining('bulk'));
      
      const statusCells = screen.getAllByRole('cell');
      statusCells.forEach(cell => {
        if (cell.textContent.includes('error')) {
          expect(cell).toHaveAttribute('aria-describedby');
        }
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<BulkReviewTable {...mockProps} />);
      
      // Tab through interactive elements
      await user.tab();
      expect(screen.getByTestId('select-all-checkbox')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId('checkbox-1')).toHaveFocus();
    });

    it('should announce status changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<BulkReviewTable {...mockProps} />);
      
      const editButton = screen.getByTestId('edit-button-1');
      await user.click(editButton);
      
      expect(screen.getByRole('status')).toHaveTextContent(/editing mode/i);
    });
  });

  describe('Data Persistence and Updates', () => {
    it('should maintain edit state during re-renders', () => {
      const { rerender } = render(<BulkReviewTable {...mockProps} />);
      
      // Start editing
      fireEvent.click(screen.getByTestId('edit-button-1'));
      
      // Re-render with updated props
      rerender(<BulkReviewTable {...mockProps} data={[...mockData]} />);
      
      // Should still be in edit mode
      expect(screen.getByTestId('name-input-1')).toBeInTheDocument();
    });

    it('should handle external data updates gracefully', () => {
      const updatedData = [
        { ...mockData[0], status: 'found', place_id: 'new-place-id' }
      ];
      
      const { rerender } = render(<BulkReviewTable {...mockProps} />);
      rerender(<BulkReviewTable {...mockProps} data={updatedData} />);
      
      expect(screen.getByTestId('status-found-1')).toBeInTheDocument();
    });
  });
}); 