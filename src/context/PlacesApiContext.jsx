/* src/context/PlacesApiContext.jsx */
/* REMOVED: TypeScript syntax (interfaces, types) */
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';

// REMOVED: interface PlacesApiContextType { ... }

const PlacesApiContext = createContext(null); // REMOVED: <PlacesApiContextType | null>

export const usePlacesApi = () => {
  const context = useContext(PlacesApiContext);
  if (!context) {
    throw new Error('usePlacesApi must be used within a PlacesApiProvider');
  }
  return context;
};

// REMOVED: interface PlacesApiProviderProps { ... }

export const PlacesApiProvider/*REMOVED: : React.FC<PlacesApiProviderProps>*/ = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState(false); // REMOVED: <boolean>
  const [isLoading, setIsLoading] = useState(true); // REMOVED: <boolean>
  const [error, setError] = useState(null); // REMOVED: <string | null>
  const [checkCount, setCheckCount] = useState(0); // REMOVED: <number>

  useEffect(() => {
    const checkApiAvailability = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient('/api/places/proxy/autocomplete?input=New York', 'Places API Status Check');

        // Use standard JS checks
        if (response.success && Array.isArray(response.data)) {
          setIsAvailable(true);
          setError(null);
        } else {
          const errorMessage = response.error || 'Invalid response from Places API';
          console.warn('[PlacesApiContext] Places API returned invalid response:', response);
          setIsAvailable(false);
          setError(errorMessage);
        }
      } catch (err/*REMOVED: : any*/) {
        const errorMessage = err.message || 'Failed to connect to Places API';
        console.warn('[PlacesApiContext] Places API appears to be unavailable:', err);
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