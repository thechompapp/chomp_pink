// Note: Since we don't have the original file, this is a general guide based on the error logs

import React, { useState, useEffect, useRef } from 'react';
import { usePlacesApi } from '@/context/PlacesApiContext';
import apiClient from '@/services/apiClient';

// Assuming this is a general structure of your component
const PlacesAutocomplete = ({
  onPlaceSelected,
  onError,
  initialValue = '',
  disabled = false,
  placeholder = 'Search for a place...',
  className = '',
  enableManualEntry = false,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const { isAvailable, forceManualMode } = usePlacesApi();
  
  const timeoutRef = useRef(null);
  
  // If API is unavailable, immediately switch to manual mode
  useEffect(() => {
    if (!isAvailable && enableManualEntry) {
      setIsManualMode(true);
    }
  }, [isAvailable, enableManualEntry]);

  const fetchSuggestions = async (input) => {
    setIsLoading(true);
    setSuggestions([]);
    
    try {
      // Only attempt to fetch if API is available
      if (isAvailable) {
        const response = await apiClient(
          '/api/places/autocomplete', 
          'PlacesAutocomplete Fetch Suggestions', 
          {
            params: { input }
          }
        );
        
        if (response.success && Array.isArray(response.data)) {
          setSuggestions(response.data);
        } else {
          // If we got a successful response but invalid data, treat as API error
          console.warn('Invalid response format from Places API');
          if (enableManualEntry) {
            setIsManualMode(true);
            forceManualMode(); // Update context to inform other components
          }
        }
      } else if (enableManualEntry) {
        // If API is known to be unavailable and manual entry is enabled
        setIsManualMode(true);
      }
    } catch (error) {
      console.error('Error fetching place suggestions:', error);
      
      // Handle 404 errors specifically as API unavailability
      if (error.status === 404 && enableManualEntry) {
        setIsManualMode(true);
        forceManualMode(); // Update context to inform other components
      }
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce input to reduce API calls
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Only attempt to fetch suggestions if not in manual mode
    if (!isManualMode) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (value.length > 2) {
        timeoutRef.current = setTimeout(() => {
          fetchSuggestions(value);
        }, 300);
      } else {
        setSuggestions([]);
      }
    }
  };

  // Switch to manual entry mode
  const toggleManualMode = () => {
    setIsManualMode(!isManualMode);
    if (!isManualMode) {
      setSuggestions([]);
    }
  };

  // Handle a suggestion selection
  const handleSuggestionClick = async (suggestion) => {
    setQuery(suggestion.description || suggestion.name);
    setSuggestions([]);
    
    try {
      if (isAvailable) {
        const placeDetails = await apiClient(
          '/api/places/details', 
          'PlacesAutocomplete Fetch Place Details', 
          {
            params: { place_id: suggestion.place_id }
          }
        );
        
        if (placeDetails.success && placeDetails.data) {
          onPlaceSelected(placeDetails.data);
        }
      } else {
        // If API is unavailable, just pass back the basic info we have
        onPlaceSelected({
          name: suggestion.description || suggestion.name,
          place_id: suggestion.place_id
        });
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      if (onError) {
        onError(error);
      }
    }
  };

  // Submit the current text as a manual entry
  const handleManualSubmit = () => {
    if (query && onPlaceSelected) {
      onPlaceSelected({
        name: query,
        manual_entry: true,
      });
    }
  };

  return (
    <div className="places-autocomplete-container">
      <div className="input-wrapper">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder={isManualMode ? "Enter place name manually..." : placeholder}
          className={`places-input ${className}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isManualMode) {
              handleManualSubmit();
            }
          }}
        />
        
        {enableManualEntry && (
          <button 
            type="button" 
            onClick={toggleManualMode}
            className="manual-mode-toggle"
          >
            {isManualMode ? 'Try Search' : 'Manual Entry'}
          </button>
        )}
      </div>
      
      {isManualMode && (
        <div className="manual-entry-info">
          <p className="text-sm text-amber-600">
            Manual entry mode: Google Places data will not be available.
          </p>
          <button 
            onClick={handleManualSubmit}
            className="btn btn-sm btn-secondary mt-1"
          >
            Use This Name
          </button>
        </div>
      )}
      
      {!isManualMode && suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((suggestion) => (
            <li 
              key={suggestion.place_id} 
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.description || suggestion.name}
            </li>
          ))}
        </ul>
      )}
      
      {isLoading && (
        <div className="loading-indicator">Loading...</div>
      )}
      
      {!isAvailable && !isManualMode && (
        <div className="api-unavailable-message">
          <p className="text-sm text-red-500">
            Google Places API is currently unavailable. 
            <button 
              onClick={toggleManualMode}
              className="link-style ml-1"
            >
              Switch to manual entry
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default PlacesAutocomplete;
