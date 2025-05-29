import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/UI/SearchBar';

// Mock debounce utility
vi.mock('@/utils/debounce', () => ({
  debounce: vi.fn((fn) => fn)
}));

describe('SearchBar Component', () => {
  const mockProps = {
    onSearch: vi.fn(),
    placeholder: 'Search restaurants...',
    value: '',
    className: ''
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Initial State', () => {
    it('should render search input with placeholder', () => {
      render(<SearchBar {...mockProps} />);
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search restaurants...');
    });

    it('should render with initial value', () => {
      render(<SearchBar {...mockProps} value="initial search" />);
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput.value).toBe('initial search');
    });

    it('should render search icon', () => {
      render(<SearchBar {...mockProps} />);
      
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('should render clear button when input has value', () => {
      render(<SearchBar {...mockProps} value="search term" />);
      
      expect(screen.getByTestId('clear-button')).toBeInTheDocument();
    });

    it('should not render clear button when input is empty', () => {
      render(<SearchBar {...mockProps} value="" />);
      
      expect(screen.queryByTestId('clear-button')).not.toBeInTheDocument();
    });
  });

  describe('User Input and Search Functionality', () => {
    it('should call onSearch when user types', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} />);
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'pizza');
      
      expect(mockProps.onSearch).toHaveBeenCalledWith('pizza');
    });

    it('should handle controlled input updates', () => {
      const { rerender } = render(<SearchBar {...mockProps} value="initial" />);
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput.value).toBe('initial');
      
      rerender(<SearchBar {...mockProps} value="updated" />);
      expect(searchInput.value).toBe('updated');
    });

    it('should call onSearch when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} value="search term" />);
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, '{Enter}');
      
      expect(mockProps.onSearch).toHaveBeenCalledWith('search term');
    });

    it('should clear input when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} value="search term" />);
      
      const clearButton = screen.getByTestId('clear-button');
      await user.click(clearButton);
      
      expect(mockProps.onSearch).toHaveBeenCalledWith('');
    });

    it('should focus input when search icon is clicked', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} />);
      
      const searchIcon = screen.getByTestId('search-icon');
      const searchInput = screen.getByRole('searchbox');
      
      await user.click(searchIcon);
      
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Debounced Search', () => {
    it('should debounce search calls when enabled', async () => {
      const debouncedSearch = vi.fn();
      vi.mocked(require('@/utils/debounce').debounce).mockReturnValue(debouncedSearch);
      
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} debounceMs={300} />);
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'pizza');
      
      expect(require('@/utils/debounce').debounce).toHaveBeenCalledWith(
        expect.any(Function),
        300
      );
    });

    it('should not debounce when debounceMs is 0', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} debounceMs={0} />);
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'p');
      
      expect(mockProps.onSearch).toHaveBeenCalledWith('p');
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      render(<SearchBar {...mockProps} loading={true} />);
      
      expect(screen.getByTestId('search-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('search-icon')).not.toBeInTheDocument();
    });

    it('should hide search icon when loading', () => {
      render(<SearchBar {...mockProps} loading={true} />);
      
      expect(screen.queryByTestId('search-icon')).not.toBeInTheDocument();
    });

    it('should disable input when loading', () => {
      render(<SearchBar {...mockProps} loading={true} />);
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toBeDisabled();
    });
  });

  describe('Search Suggestions and Autocomplete', () => {
    const suggestions = [
      { id: 1, text: 'Pizza Palace', type: 'restaurant' },
      { id: 2, text: 'Pasta Place', type: 'restaurant' },
      { id: 3, text: 'Manhattan', type: 'location' }
    ];

    it('should show suggestions dropdown when available', () => {
      render(<SearchBar {...mockProps} suggestions={suggestions} showSuggestions={true} />);
      
      expect(screen.getByTestId('suggestions-dropdown')).toBeInTheDocument();
      expect(screen.getByText('Pizza Palace')).toBeInTheDocument();
      expect(screen.getByText('Pasta Place')).toBeInTheDocument();
      expect(screen.getByText('Manhattan')).toBeInTheDocument();
    });

    it('should not show suggestions when showSuggestions is false', () => {
      render(<SearchBar {...mockProps} suggestions={suggestions} showSuggestions={false} />);
      
      expect(screen.queryByTestId('suggestions-dropdown')).not.toBeInTheDocument();
    });

    it('should handle suggestion selection', async () => {
      const onSuggestionSelect = vi.fn();
      const user = userEvent.setup();
      
      render(
        <SearchBar 
          {...mockProps} 
          suggestions={suggestions} 
          showSuggestions={true}
          onSuggestionSelect={onSuggestionSelect}
        />
      );
      
      const suggestion = screen.getByText('Pizza Palace');
      await user.click(suggestion);
      
      expect(onSuggestionSelect).toHaveBeenCalledWith(suggestions[0]);
    });

    it('should navigate suggestions with keyboard', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} suggestions={suggestions} showSuggestions={true} />);
      
      const searchInput = screen.getByRole('searchbox');
      
      // Arrow down should highlight first suggestion
      await user.type(searchInput, '{ArrowDown}');
      expect(screen.getByTestId('suggestion-0')).toHaveClass('suggestion-highlighted');
      
      // Arrow down again should highlight second suggestion
      await user.type(searchInput, '{ArrowDown}');
      expect(screen.getByTestId('suggestion-1')).toHaveClass('suggestion-highlighted');
      
      // Arrow up should go back to first
      await user.type(searchInput, '{ArrowUp}');
      expect(screen.getByTestId('suggestion-0')).toHaveClass('suggestion-highlighted');
    });

    it('should select highlighted suggestion with Enter', async () => {
      const onSuggestionSelect = vi.fn();
      const user = userEvent.setup();
      
      render(
        <SearchBar 
          {...mockProps} 
          suggestions={suggestions} 
          showSuggestions={true}
          onSuggestionSelect={onSuggestionSelect}
        />
      );
      
      const searchInput = screen.getByRole('searchbox');
      
      await user.type(searchInput, '{ArrowDown}');
      await user.type(searchInput, '{Enter}');
      
      expect(onSuggestionSelect).toHaveBeenCalledWith(suggestions[0]);
    });

    it('should close suggestions on Escape', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} suggestions={suggestions} showSuggestions={true} />);
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, '{Escape}');
      
      expect(screen.queryByTestId('suggestions-dropdown')).not.toBeInTheDocument();
    });

    it('should show different icons for different suggestion types', () => {
      render(<SearchBar {...mockProps} suggestions={suggestions} showSuggestions={true} />);
      
      expect(screen.getByTestId('restaurant-icon-1')).toBeInTheDocument();
      expect(screen.getByTestId('restaurant-icon-2')).toBeInTheDocument();
      expect(screen.getByTestId('location-icon-3')).toBeInTheDocument();
    });
  });

  describe('Search History', () => {
    const searchHistory = ['pizza', 'sushi', 'burgers'];

    it('should show search history when input is focused and empty', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} searchHistory={searchHistory} />);
      
      const searchInput = screen.getByRole('searchbox');
      await user.click(searchInput);
      
      expect(screen.getByText(/recent searches/i)).toBeInTheDocument();
      expect(screen.getByText('pizza')).toBeInTheDocument();
      expect(screen.getByText('sushi')).toBeInTheDocument();
      expect(screen.getByText('burgers')).toBeInTheDocument();
    });

    it('should select search history item', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} searchHistory={searchHistory} />);
      
      const searchInput = screen.getByRole('searchbox');
      await user.click(searchInput);
      
      const historyItem = screen.getByText('pizza');
      await user.click(historyItem);
      
      expect(mockProps.onSearch).toHaveBeenCalledWith('pizza');
    });

    it('should clear individual history items', async () => {
      const onClearHistoryItem = vi.fn();
      const user = userEvent.setup();
      
      render(
        <SearchBar 
          {...mockProps} 
          searchHistory={searchHistory}
          onClearHistoryItem={onClearHistoryItem}
        />
      );
      
      const searchInput = screen.getByRole('searchbox');
      await user.click(searchInput);
      
      const clearButton = screen.getByTestId('clear-history-pizza');
      await user.click(clearButton);
      
      expect(onClearHistoryItem).toHaveBeenCalledWith('pizza');
    });
  });

  describe('Advanced Search Features', () => {
    it('should show advanced search toggle', () => {
      render(<SearchBar {...mockProps} showAdvancedSearch={true} />);
      
      expect(screen.getByTestId('advanced-search-toggle')).toBeInTheDocument();
    });

    it('should open advanced search panel', async () => {
      const onAdvancedSearch = vi.fn();
      const user = userEvent.setup();
      
      render(
        <SearchBar 
          {...mockProps} 
          showAdvancedSearch={true}
          onAdvancedSearch={onAdvancedSearch}
        />
      );
      
      const advancedToggle = screen.getByTestId('advanced-search-toggle');
      await user.click(advancedToggle);
      
      expect(onAdvancedSearch).toHaveBeenCalled();
    });

    it('should show search filters when enabled', () => {
      const filters = [
        { key: 'cuisine', label: 'Cuisine', value: 'Italian' },
        { key: 'price', label: 'Price', value: '$$' }
      ];
      
      render(<SearchBar {...mockProps} activeFilters={filters} />);
      
      expect(screen.getByText('Italian')).toBeInTheDocument();
      expect(screen.getByText('$$')).toBeInTheDocument();
    });

    it('should remove filters', async () => {
      const onRemoveFilter = vi.fn();
      const user = userEvent.setup();
      const filters = [
        { key: 'cuisine', label: 'Cuisine', value: 'Italian' }
      ];
      
      render(
        <SearchBar 
          {...mockProps} 
          activeFilters={filters}
          onRemoveFilter={onRemoveFilter}
        />
      );
      
      const removeButton = screen.getByTestId('remove-filter-cuisine');
      await user.click(removeButton);
      
      expect(onRemoveFilter).toHaveBeenCalledWith('cuisine');
    });
  });

  describe('Voice Search', () => {
    const mockSpeechRecognition = {
      start: vi.fn(),
      stop: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    beforeEach(() => {
      global.SpeechRecognition = vi.fn(() => mockSpeechRecognition);
      global.webkitSpeechRecognition = global.SpeechRecognition;
    });

    it('should show voice search button when supported', () => {
      render(<SearchBar {...mockProps} enableVoiceSearch={true} />);
      
      expect(screen.getByTestId('voice-search-button')).toBeInTheDocument();
    });

    it('should start voice recognition when button is clicked', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} enableVoiceSearch={true} />);
      
      const voiceButton = screen.getByTestId('voice-search-button');
      await user.click(voiceButton);
      
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
    });

    it('should show listening state during voice recognition', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} enableVoiceSearch={true} />);
      
      const voiceButton = screen.getByTestId('voice-search-button');
      await user.click(voiceButton);
      
      expect(screen.getByTestId('voice-listening')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SearchBar {...mockProps} />);
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label', expect.stringContaining('search'));
    });

    it('should have proper ARIA attributes for suggestions', () => {
      const suggestions = [{ id: 1, text: 'Pizza', type: 'restaurant' }];
      render(<SearchBar {...mockProps} suggestions={suggestions} showSuggestions={true} />);
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-expanded', 'true');
      expect(searchInput).toHaveAttribute('aria-autocomplete', 'list');
      
      const dropdown = screen.getByTestId('suggestions-dropdown');
      expect(dropdown).toHaveAttribute('role', 'listbox');
    });

    it('should announce search results to screen readers', () => {
      render(<SearchBar {...mockProps} resultCount={42} />);
      
      expect(screen.getByText(/42 results found/i)).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should support high contrast mode', () => {
      render(<SearchBar {...mockProps} highContrast={true} />);
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveClass('high-contrast');
    });
  });

  describe('Performance and Optimization', () => {
    it('should not trigger search for very short inputs', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} minSearchLength={3} />);
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'ab');
      
      expect(mockProps.onSearch).not.toHaveBeenCalled();
    });

    it('should trigger search when minimum length is met', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} minSearchLength={3} />);
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'abc');
      
      expect(mockProps.onSearch).toHaveBeenCalledWith('abc');
    });

    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(<SearchBar {...mockProps} />);
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalled();
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing onSearch gracefully', async () => {
      const user = userEvent.setup();
      render(<SearchBar {...mockProps} onSearch={undefined} />);
      
      const searchInput = screen.getByRole('searchbox');
      
      // Should not throw error
      await user.type(searchInput, 'test');
    });

    it('should handle invalid suggestions gracefully', () => {
      const invalidSuggestions = [null, undefined, { text: 'Valid' }];
      
      render(
        <SearchBar 
          {...mockProps} 
          suggestions={invalidSuggestions} 
          showSuggestions={true}
        />
      );
      
      expect(screen.getByText('Valid')).toBeInTheDocument();
    });
  });
}); 