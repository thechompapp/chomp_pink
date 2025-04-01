// src/config.js

// Backend API URL - empty string for relative paths with Vite proxy
export const API_BASE_URL = '';

// Google Maps API
export const GOOGLE_MAPS_API_KEY = 'AIzaSyD_xhCWUXjhSXD4xpL-BxM5t7HfzJDf-dIY'; // Replace with your actual key
export const GOOGLE_PLACES_API_KEY = 'AIzaSyD_xhCWUXjhSXD4xpL-BxM5t7HfzJDf-dIKEY'; // Replace with your actual key

// Other configuration constants
export const DEFAULT_CITY_ID = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_LOCATION = {
  lat: 40.7128,
  lng: -74.0060
}; // New York City

// Feature flags
export const ENABLE_GOOGLE_MAPS = true;
export const ENABLE_DISTANCE_SORTING = false; // Future feature