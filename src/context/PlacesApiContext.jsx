/* src/context/PlacesApiContext.jsx */
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';
import useAuthStore from '@/stores/useAuthStore.js';

const PlacesApiContext = createContext(null);

export const usePlacesApi = () => {
  const context = useContext(PlacesApiContext);
  if (!context) {
    throw new Error('usePlacesApi must be used within a PlacesApiProvider');
  }
  return context;
};

export const PlacesApiProvider = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    const checkApiAvailability = async () => {
      const isAuthenticated = useAuthStore.getState().isAuthenticated;
      if (!isAuthenticated) {
        setIsAvailable(false);
        setError('Authentication required for Places API');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fix: Remove the '/api' prefix since apiClient already includes it in the baseURL
        const response = await apiClient('/places/autocomplete?input=New%20York', {
          headers: {
            'X-Bypass-Auth': 'true',
            'X-Places-Api-Request': 'true'
          }
        });
        if (response.success && Array.isArray(response.data)) {
          setIsAvailable(true);
          setError(null);
        } else {
          const errorMessage = response.error || 'Invalid response from Places API';
          console.warn('[PlacesApiContext] Places API returned invalid response:', response);
          setIsAvailable(false);
          setError(errorMessage);
        }
      } catch (err) {
        const errorMessage = err.message || 'Failed to connect to Places API';
        console.warn('[PlacesApiContext] Places API unavailable:', err);
        setIsAvailable(false);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    checkApiAvailability();
  }, [checkCount]);

  const forceManualMode = () => {
    setIsAvailable(false);
    setError('Manual mode enabled');
  };

  const resetApiCheck = () => {
    setCheckCount(prev => prev + 1);
    setError(null);
  };

  return (
    <PlacesApiContext.Provider
      value={{
        isAvailable,
        isLoading,
        error,
        forceManualMode,
        resetApiCheck
      }}
    >
      {children}
    </PlacesApiContext.Provider>
  );
};

export default PlacesApiProvider;