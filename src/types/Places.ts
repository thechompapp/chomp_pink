export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
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
}

export interface PlacesAutocompleteResponse {
  predictions: PlacePrediction[];
  status: string;
}

export interface PlaceDetailsResponse {
  result: PlaceDetails;
  status: string;
}

// Helper type for the RestaurantLocationEditor component
export interface LocationEditorState {
  predictions: PlacePrediction[];
  selectedPlace: PlaceDetails | null;
  isLoading: boolean;
  error: string | null;
} 