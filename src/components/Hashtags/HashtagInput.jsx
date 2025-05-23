import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { hashtagService } from '@/services/hashtagService';
import { logDebug, logError } from '@/utils/logger';

/**
 * Reusable HashtagInput component for selecting and managing hashtags
 * Features:
 * - Autocomplete suggestions from API
 * - Keyboard navigation
 * - Selected tags display with remove functionality
 * - Validation against available tags
 * - Debounced API calls
 */
const HashtagInput = ({
  selectedTags = [],
  onChange,
  placeholder = "Type to add...",
  disabled = false,
  maxTags = null,
  validateAgainstList = true,
  className = "",
  tagClassName = "",
  suggestionLimit = 10,
  debounceMs = 300,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimerRef = useRef(null);
  
  // Fetch hashtag suggestions when input changes
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    try {
      setIsLoading(true);
      const results = await hashtagService.searchHashtags(query, suggestionLimit);
      
      // Filter out already selected tags
      const filteredResults = results
        .filter(tag => !selectedTags.includes(tag.name.toLowerCase()))
        .map(tag => tag.name);
      
      setSuggestions(filteredResults);
      setHighlightedIndex(filteredResults.length > 0 ? 0 : -1);
    } catch (error) {
      logError('[HashtagInput] Error fetching suggestions:', error);
      setError('Failed to load suggestions');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTags, suggestionLimit]);
  
  // Debounced input handler
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setInputValue(value);
    setError(null);
    
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (value.trim()) {
      setShowSuggestions(true);
      
      // Set debounce timer for API call
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(value);
        debounceTimerRef.current = null;
      }, debounceMs);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [fetchSuggestions, debounceMs]);
  
  // Handle adding a new tag
  const handleAddTag = useCallback((tagToAdd) => {
    if (!tagToAdd) return;
    
    const normalizedTag = tagToAdd.trim().toLowerCase();
    if (!normalizedTag) return;
    
    // Check if tag already exists
    if (selectedTags.includes(normalizedTag)) {
      setError(`Tag "#${normalizedTag}" already added`);
      return;
    }
    
    // Check if we've reached the maximum number of tags
    if (maxTags !== null && selectedTags.length >= maxTags) {
      setError(`Maximum of ${maxTags} tags allowed`);
      return;
    }
    
    // Add the tag and notify parent
    const newTags = [...selectedTags, normalizedTag];
    onChange(newTags);
    
    // Reset input and suggestions
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
    
    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedTags, onChange, maxTags]);
  
  // Handle removing a tag
  const handleRemoveTag = useCallback((tagToRemove) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    onChange(newTags);
    setError(null);
  }, [selectedTags, onChange]);
  
  // Handle selecting a suggestion
  const handleSelectSuggestion = useCallback((suggestion) => {
    handleAddTag(suggestion);
  }, [handleAddTag]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    // Enter or comma to add tag
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        // Add highlighted suggestion
        handleSelectSuggestion(suggestions[highlightedIndex]);
      } else if (inputValue.trim()) {
        // Add current input value
        handleAddTag(inputValue);
      }
    }
    // Escape to close suggestions
    else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
    // Arrow down to navigate suggestions
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setHighlightedIndex((prevIndex) => 
          prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0
        );
      }
    }
    // Arrow up to navigate suggestions
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setHighlightedIndex((prevIndex) => 
          prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1
        );
      }
    }
  }, [highlightedIndex, suggestions, inputValue, handleSelectSuggestion, handleAddTag]);
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current && 
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  // Render selected tags
  const renderTags = useMemo(() => {
    return selectedTags.map((tag) => (
      <span 
        key={tag} 
        className={`inline-flex items-center px-2 py-0.5 bg-[#A78B71]/80 text-white rounded-full text-xs ${tagClassName}`}
      >
        #{tag}
        <button 
          type="button" 
          onClick={() => handleRemoveTag(tag)} 
          disabled={disabled}
          className="ml-1 -mr-0.5 p-0.5 text-white/70 hover:text-white focus:outline-none disabled:opacity-50" 
          aria-label={`Remove tag ${tag}`}
        >
          <X size={12} />
        </button>
      </span>
    ));
  }, [selectedTags, handleRemoveTag, disabled, tagClassName]);
  
  return (
    <div className="relative">
      <div className="flex flex-col space-y-2">
        {/* Input field */}
        <div className="relative" ref={inputRef}>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue.trim() && setShowSuggestions(true)}
            className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm disabled:opacity-60 disabled:bg-gray-100 ${className}`}
            placeholder={isLoading ? "Loading..." : placeholder}
            disabled={disabled || isLoading}
            autoComplete="off"
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul 
              ref={suggestionsRef}
              className="absolute z-10 mt-1 w-full border border-gray-200 rounded-md bg-white max-h-32 overflow-y-auto shadow-lg"
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion}
                  className={`p-2 hover:bg-gray-100 cursor-pointer text-sm ${
                    index === highlightedIndex ? 'bg-gray-100' : ''
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectSuggestion(suggestion);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  #{suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Error message */}
        {error && (
          <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
        
        {/* Selected tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {renderTags}
          </div>
        )}
      </div>
    </div>
  );
};

export default HashtagInput;
