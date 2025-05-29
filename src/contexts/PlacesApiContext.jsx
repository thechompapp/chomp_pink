/* src/context/PlacesApiContext.jsx */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getDefaultApiClient } from '@/services/http';
import useAuthenticationStore from '@/stores/auth/useAuthenticationStore';
import { IS_DEVELOPMENT } from '@/config';

// Create context with a meaningful default value to help with type checking
const PlacesApiContext = createContext({
  isAvailable: false,
  isLoading: false,
  error: null,
  forceManualMode: () => {},
  resetApiCheck: () => {}
});

/**
 * Custom hook to access the Places API context
 * @returns {Object} Places API context value
 */
export const usePlacesApi = () => {
  const context = useContext(PlacesApiContext);
  if (!context) {
    throw new Error('usePlacesApi must be used within a PlacesApiProvider');
  }
  return context;
};

/**
 * Provider component for Places API functionality
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const PlacesApiProvider = ({ children }) => {
  // State management
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkCount, setCheckCount] = useState(0);

  /**
   * Check if the Places API is available
   */
  const checkApiAvailability = useCallback(async () => {
    const authState = useAuthenticationStore.getState();
    const isAuthenticated = authState.isAuthenticated;
    const token = authState.token;
    
    // Early return if not authenticated
    if (!isAuthenticated || !token) {
      console.warn('[PlacesApiContext] Authentication required for Places API');
      setIsAvailable(false);
      setError('Authentication required for Places API');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In development mode, we can bypass the actual API call
      if (IS_DEVELOPMENT) {
        console.log('[PlacesApiContext] Development mode - simulating successful API response');
        setIsAvailable(true);
        setError(null);
        setIsLoading(false);
        return;
      }
      
      // Make API request with auth token
      const response = await apiClient.get('places/autocomplete', {
        params: { input: 'New York' },
        headers: {
          'X-Bypass-Auth': 'true',
          'X-Places-Api-Request': 'true',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Validate response
      if (response.success && Array.isArray(response.data)) {
        console.log('[PlacesApiContext] Places API is available');
        setIsAvailable(true);
        setError(null);
      } else {
        const errorMessage = response.error || 'Invalid response from Places API';
        console.warn('[PlacesApiContext] Places API returned invalid response:', response);
        setIsAvailable(false);
        setError(errorMessage);
      }
    } catch (err) {
      // Handle errors with detailed information
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle API errors with detailed information
   * @param {Error} err - Error object
   */
  const handleApiError = useCallback((err) => {
    let errorMessage = err.message || 'Failed to connect to Places API';
    
    if (err.statusCode === 401 || errorMessage.includes('401')) {
      errorMessage = 'Authentication failed for Places API. Please log in again.';
    } else if (err.statusCode === 503 || (err.responseData && err.responseData.message)) {
      errorMessage = 'Service unavailable. Please try again later.';
    }
    
    console.warn('[PlacesApiContext] Places API unavailable:', { message: errorMessage, hasError: true });
    setIsAvailable(false);
    setError(errorMessage);
  }, []);

  // Effect to check API availability when checkCount changes
  useEffect(() => {
    checkApiAvailability();
  }, [checkCount, checkApiAvailability]);

  /**
   * Force manual mode (disable Places API)
   */
  const forceManualMode = useCallback(() => {
    setIsAvailable(false);
    setError('Manual mode enabled');
  }, []);

  /**
   * Reset API check to trigger a new availability check
   */
  const resetApiCheck = useCallback(() => {
    setCheckCount(prev => prev + 1);
    setError(null);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isAvailable,
    isLoading,
    error,
    forceManualMode,
    resetApiCheck
  }), [isAvailable, isLoading, error, forceManualMode, resetApiCheck]);

  return (
    <PlacesApiContext.Provider value={contextValue}>
      {children}
    </PlacesApiContext.Provider>
  );
};

export default PlacesApiProvider;