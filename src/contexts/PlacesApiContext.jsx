/* src/context/PlacesApiContext.jsx */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { logDebug, logInfo, logWarn } from '@/utils/logger';

// Create the Places API context
const PlacesApiContext = createContext(null);

// Places API provider component
export const PlacesApiProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [placesApi, setPlacesApi] = useState(null);
  const [error, setError] = useState(null);
  
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const loadPlacesApi = async () => {
      try {
        // Only load if authenticated
        if (!isAuthenticated) {
          logDebug('[PlacesAPI] User not authenticated, skipping Places API load');
          return;
        }

        logInfo('[PlacesAPI] Loading Google Places API...');
        
        // Check if already loaded
        if (window.google?.maps?.places) {
          logInfo('[PlacesAPI] Google Places API already loaded');
          setPlacesApi(window.google.maps.places);
          setIsLoaded(true);
          return;
        }

        // Load the Google Maps JavaScript API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          if (window.google?.maps?.places) {
            logInfo('[PlacesAPI] Google Places API loaded successfully');
            setPlacesApi(window.google.maps.places);
            setIsLoaded(true);
          } else {
            throw new Error('Google Places API not available after script load');
          }
        };

        script.onerror = () => {
          throw new Error('Failed to load Google Places API script');
        };

        document.head.appendChild(script);

      } catch (err) {
        logWarn('[PlacesAPI] Error loading Google Places API:', err);
        setError(err.message);
      }
    };

    loadPlacesApi();
  }, [isAuthenticated]);

  const contextValue = {
    isLoaded,
    placesApi,
    error,
    // Helper to check if Places API is ready
    isReady: isLoaded && placesApi && !error
  };

  return (
    <PlacesApiContext.Provider value={contextValue}>
      {children}
    </PlacesApiContext.Provider>
  );
};

// Hook to use the Places API context
export const usePlacesApi = () => {
  const context = useContext(PlacesApiContext);
  if (!context) {
    throw new Error('usePlacesApi must be used within a PlacesApiProvider');
  }
  return context;
};

export default PlacesApiContext;