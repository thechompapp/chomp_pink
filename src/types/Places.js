/* src/types/Places.js */
/* REMOVED: All TypeScript interfaces */
// This file defined TypeScript interfaces for Google Places data structures.
// It can be kept for documentation or removed.

/*
Expected shape for PlacePrediction:
{
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

Expected shape for PlaceDetails (simplified):
{
  place_id: string;
  formatted_address: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  // Additional fields from backend proxy if added:
  city?: string | null;
  neighborhood?: string | null;
}

// Other response/state types removed...
*/