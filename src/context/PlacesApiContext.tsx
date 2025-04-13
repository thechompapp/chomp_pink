import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '@/services/apiClient';

interface PlacesApiContextType {
  isAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  forceManualMode: () => void;
  resetApiCheck: () => void;
}

const PlacesApiContext = createContext<PlacesApiContextType | null>(null);

export const usePlacesApi = () => {
  const context = useContext(PlacesApiContext);
  if (!context) {
    throw new Error('usePlacesApi must be used within a PlacesApiProvider');
  }
  return context;
};

interface PlacesApiProviderProps {
  children: ReactNode;
}

export const PlacesApiProvider: React.FC<PlacesApiProviderProps> = ({ children }) => {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [checkCount, setCheckCount] = useState<number>(0);

  useEffect(() => {
    const checkApiAvailability = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Use a simple test query that should work in most locations
        const response = await apiClient('/api/places/proxy/autocomplete?input=New York', 'Places API Status Check');
        
        if (response.success && Array.isArray(response.data)) {
          setIsAvailable(true);
          setError(null);
        } else {
          const errorMessage = response.error || 'Invalid response from Places API';
          console.warn('[PlacesApiContext] Places API returned invalid response:', response);
          setIsAvailable(false);
          setError(errorMessage);
        }
      } catch (err: any) {
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
