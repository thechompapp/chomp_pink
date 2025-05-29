import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkInputForm } from '@/components/BulkAdd/BulkInputForm';

// Mock dependencies
vi.mock('@/services/bulkAddService', () => ({
  parseInputText: vi.fn(),
  validateBulkData: vi.fn()
}));

vi.mock('@/utils/bulkAddUtils', () => ({
  formatDataForDisplay: vi.fn(),
  detectInputFormat: vi.fn()
}));

import { parseInputText, validateBulkData } from '@/services/bulkAddService';
import { formatDataForDisplay, detectInputFormat } from '@/utils/bulkAddUtils';

describe('BulkInputForm Component', () => {
  const mockProps = {
    onDataSubmit: vi.fn(),
    onClear: vi.fn(),
    loading: false,
    error: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Initial State', () => {
    it('should render the form with all essential elements', () => {
      render(<BulkInputForm {...mockProps} />);
      
      expect(screen.getByRole('textbox', { name: /bulk input/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /process data/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should show format instructions by default', () => {
      render(<BulkInputForm {...mockProps} />);
      
      expect(screen.getByText(/supported formats/i)).toBeInTheDocument();
      expect(screen.getByText(/comma separated/i)).toBeInTheDocument();
      expect(screen.getByText(/pipe separated/i)).toBeInTheDocument();
      expect(screen.getByText(/semicolon separated/i)).toBeInTheDocument();
    });

    it('should have empty textarea initially', () => {
      render(<BulkInputForm {...mockProps} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      expect(textarea.value).toBe('');
    });

    it('should disable process button when textarea is empty', () => {
      render(<BulkInputForm {...mockProps} />);
      
      const processButton = screen.getByRole('button', { name: /process data/i });
      expect(processButton).toBeDisabled();
    });
  });

  describe('User Input Handling', () => {
    it('should enable process button when textarea has content', async () => {
      const user = userEvent.setup();
      render(<BulkInputForm {...mockProps} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      const processButton = screen.getByRole('button', { name: /process data/i });
      
      await user.type(textarea, 'Dirt Candy, restaurant, New York, Vegetarian');
      
      expect(processButton).toBeEnabled();
    });

    it('should detect format as user types', async () => {
      const user = userEvent.setup();
      detectInputFormat.mockReturnValue('comma');
      
      render(<BulkInputForm {...mockProps} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      await user.type(textarea, 'Restaurant, Type, Location');
      
      expect(detectInputFormat).toHaveBeenCalledWith('Restaurant, Type, Location');
    });

    it('should show detected format indicator', async () => {
      const user = userEvent.setup();
      detectInputFormat.mockReturnValue('semicolon');
      
      render(<BulkInputForm {...mockProps} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      await user.type(textarea, 'Restaurant; Type; Location');
      
      expect(screen.getByText(/detected format.*semicolon/i)).toBeInTheDocument();
    });

    it('should clear textarea when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<BulkInputForm {...mockProps} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      const clearButton = screen.getByRole('button', { name: /clear/i });
      
      await user.type(textarea, 'Some test content');
      expect(textarea.value).toBe('Some test content');
      
      await user.click(clearButton);
      expect(textarea.value).toBe('');
      expect(mockProps.onClear).toHaveBeenCalled();
    });
  });

  describe('Data Processing', () => {
    it('should process data when form is submitted', async () => {
      const user = userEvent.setup();
      const mockParsedData = [
        { name: 'Dirt Candy', type: 'restaurant', location: 'New York', cuisine: 'Vegetarian' }
      ];
      
      parseInputText.mockResolvedValue(mockParsedData);
      validateBulkData.mockReturnValue({ valid: true, errors: [] });
      
      render(<BulkInputForm {...mockProps} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      const processButton = screen.getByRole('button', { name: /process data/i });
      
      await user.type(textarea, 'Dirt Candy, restaurant, New York, Vegetarian');
      await user.click(processButton);
      
      expect(parseInputText).toHaveBeenCalledWith('Dirt Candy, restaurant, New York, Vegetarian');
      expect(validateBulkData).toHaveBeenCalledWith(mockParsedData);
      expect(mockProps.onDataSubmit).toHaveBeenCalledWith(mockParsedData);
    });

    it('should handle parsing errors gracefully', async () => {
      const user = userEvent.setup();
      const mockError = new Error('Invalid format');
      
      parseInputText.mockRejectedValue(mockError);
      
      render(<BulkInputForm {...mockProps} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      const processButton = screen.getByRole('button', { name: /process data/i });
      
      await user.type(textarea, 'Invalid data format');
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error processing data/i)).toBeInTheDocument();
        expect(screen.getByText(/invalid format/i)).toBeInTheDocument();
      });
    });

    it('should handle validation errors', async () => {
      const user = userEvent.setup();
      const mockParsedData = [
        { name: '', type: 'restaurant', location: 'New York' } // Invalid: empty name
      ];
      const mockValidation = {
        valid: false,
        errors: ['Name is required on line 1']
      };
      
      parseInputText.mockResolvedValue(mockParsedData);
      validateBulkData.mockReturnValue(mockValidation);
      
      render(<BulkInputForm {...mockProps} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      const processButton = screen.getByRole('button', { name: /process data/i });
      
      await user.type(textarea, ', restaurant, New York');
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByText(/validation errors/i)).toBeInTheDocument();
        expect(screen.getByText(/name is required on line 1/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during processing', async () => {
      const user = userEvent.setup();
      render(<BulkInputForm {...mockProps} loading={true} />);
      
      const processButton = screen.getByRole('button', { name: /processing/i });
      expect(processButton).toBeDisabled();
      expect(screen.getByRole('img', { name: /loading/i })).toBeInTheDocument();
    });
  });

  describe('Format Examples and Help', () => {
    it('should show format examples when help button is clicked', async () => {
      const user = userEvent.setup();
      render(<BulkInputForm {...mockProps} />);
      
      const helpButton = screen.getByRole('button', { name: /show examples/i });
      await user.click(helpButton);
      
      expect(screen.getByText(/example formats/i)).toBeInTheDocument();
      expect(screen.getByText(/dirt candy.*restaurant.*new york/i)).toBeInTheDocument();
    });

    it('should allow selecting format examples', async () => {
      const user = userEvent.setup();
      render(<BulkInputForm {...mockProps} />);
      
      const helpButton = screen.getByRole('button', { name: /show examples/i });
      await user.click(helpButton);
      
      const exampleButton = screen.getByRole('button', { name: /use this example/i });
      await user.click(exampleButton);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      expect(textarea.value).toContain('Dirt Candy');
    });

    it('should hide examples when hide button is clicked', async () => {
      const user = userEvent.setup();
      render(<BulkInputForm {...mockProps} />);
      
      const helpButton = screen.getByRole('button', { name: /show examples/i });
      await user.click(helpButton);
      
      const hideButton = screen.getByRole('button', { name: /hide examples/i });
      await user.click(hideButton);
      
      expect(screen.queryByText(/example formats/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display external error prop', () => {
      const errorMessage = 'External processing error';
      render(<BulkInputForm {...mockProps} error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should clear external error when user starts typing', async () => {
      const user = userEvent.setup();
      const mockPropsWithError = { ...mockProps, error: 'Previous error' };
      
      const { rerender } = render(<BulkInputForm {...mockPropsWithError} />);
      expect(screen.getByText('Previous error')).toBeInTheDocument();
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      await user.type(textarea, 'New input');
      
      // Simulate parent component clearing error
      rerender(<BulkInputForm {...mockProps} error={null} />);
      expect(screen.queryByText('Previous error')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<BulkInputForm {...mockProps} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      expect(textarea).toHaveAttribute('aria-describedby');
      
      const processButton = screen.getByRole('button', { name: /process data/i });
      expect(processButton).toHaveAttribute('type', 'submit');
    });

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
      parseInputText.mockRejectedValue(new Error('Parse error'));
      
      render(<BulkInputForm {...mockProps} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      const processButton = screen.getByRole('button', { name: /process data/i });
      
      await user.type(textarea, 'Invalid data');
      await user.click(processButton);
      
      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<BulkInputForm {...mockProps} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      const processButton = screen.getByRole('button', { name: /process data/i });
      const clearButton = screen.getByRole('button', { name: /clear/i });
      
      // Tab through elements
      await user.tab();
      expect(textarea).toHaveFocus();
      
      await user.tab();
      expect(processButton).toHaveFocus();
      
      await user.tab();
      expect(clearButton).toHaveFocus();
    });
  });

  describe('Multiple Format Support', () => {
    const formats = [
      { name: 'comma', input: 'Dirt Candy, restaurant, New York, Vegetarian' },
      { name: 'pipe', input: 'Dirt Candy | restaurant | New York | Vegetarian' },
      { name: 'semicolon', input: 'Dirt Candy; restaurant; New York; Vegetarian' }
    ];

    it.each(formats)('should detect $name format correctly', async ({ name, input }) => {
      const user = userEvent.setup();
      detectInputFormat.mockReturnValue(name);
      
      render(<BulkInputForm {...mockProps} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      await user.type(textarea, input);
      
      expect(detectInputFormat).toHaveBeenCalledWith(input);
      expect(screen.getByText(new RegExp(`detected format.*${name}`, 'i'))).toBeInTheDocument();
    });

    it('should handle mixed format input gracefully', async () => {
      const user = userEvent.setup();
      detectInputFormat.mockReturnValue('mixed');
      
      render(<BulkInputForm {...mockProps} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      await user.type(textarea, 'Restaurant, Type | Location; Cuisine');
      
      expect(screen.getByText(/mixed formats detected/i)).toBeInTheDocument();
      expect(screen.getByText(/please use consistent formatting/i)).toBeInTheDocument();
    });
  });

  describe('Line Count and Progress', () => {
    it('should show line count as user types', async () => {
      const user = userEvent.setup();
      render(<BulkInputForm {...mockProps} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      
      await user.type(textarea, 'Line 1\nLine 2\nLine 3');
      
      expect(screen.getByText(/3 lines/i)).toBeInTheDocument();
    });

    it('should show character count for large inputs', async () => {
      const user = userEvent.setup();
      render(<BulkInputForm {...mockProps} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      const longInput = 'A'.repeat(500);
      
      await user.type(textarea, longInput);
      
      expect(screen.getByText(/500 characters/i)).toBeInTheDocument();
    });

    it('should warn about maximum input size', async () => {
      const user = userEvent.setup();
      render(<BulkInputForm {...mockProps} />);
      
      const textarea = screen.getByRole('textbox', { name: /bulk input/i });
      const veryLongInput = 'A'.repeat(10000);
      
      await user.type(textarea, veryLongInput);
      
      expect(screen.getByText(/approaching maximum size/i)).toBeInTheDocument();
    });
  });
}); 