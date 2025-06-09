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
        if (window.google?.maps?.places && window.google?.maps?.marker) {
          logInfo('[PlacesAPI] Google Places and Marker libraries already loaded');
          setPlacesApi(window.google.maps);
          setIsLoaded(true);
          return;
        }

        // Prevent duplicate script injection
        if (window.googleMapsScriptLoaded) {
          logDebug('[PlacesAPI] Google Maps script injection already in progress.');
          // If script is already being loaded, wait for it to finish
          const interval = setInterval(() => {
            if (window.google?.maps?.places && window.google?.maps?.marker) {
              clearInterval(interval);
              setIsLoaded(true);
              setPlacesApi(window.google.maps);
            }
          }, 100);
          return;
        }
        window.googleMapsScriptLoaded = true;

        // Load the Google Maps JavaScript API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          if (window.google?.maps?.places && window.google?.maps?.marker) {
            logInfo('[PlacesAPI] Google Maps API loaded successfully');
            setPlacesApi(window.google.maps);
            setIsLoaded(true);
          } else {
            throw new Error('Google Maps API not available after script load');
          }
        };

        script.onerror = () => {
          throw new Error('Failed to load Google Maps API script');
        };

        document.head.appendChild(script);

      } catch (err) {
        logWarn('[PlacesAPI] Error loading Google Maps API:', err);
        setError(err.message);
      }
    };

    loadPlacesApi();
  }, [isAuthenticated]);

  const contextValue = {
    isLoaded,
    placesApi,
    google: window.google, // Expose the full google object
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