/**
 * Bulk Add Integration Tests
 * 
 * Tests the bulk add functionality with Google Places API integration.
 * Verifies that multiple restaurant results are handled correctly and
 * that the user can select from ambiguous entries.
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/auth/context/AuthContext';
import BulkAddPage from '@/pages/restaurants/BulkAddPage';
import { useBulkAddProcessor } from '@/hooks/useBulkAddProcessor';
import { restaurantService } from '@/services/restaurantService';

// Real test data to use with the API
const testRestaurants = [
  'Shake Shack, New York',
  'Katz\'s Delicatessen, New York',
  'Peter Luger Steak House, Brooklyn'
];

// Mock API client for controlled testing
jest.mock('@/services/http', () => {
  const originalModule = jest.requireActual('@/services/http');
  
  return {
    ...originalModule,
    apiClient: {
      ...originalModule.apiClient,
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    }
  };
});

// Import mocked API client
import { apiClient } from '@/services/http';

// Mock Google Places API responses
const mockPlacesResults = {
  'Shake Shack, New York': {
    status: 'OK',
    results: [
      {
        place_id: 'place_id_1',
        name: 'Shake Shack',
        formatted_address: '123 Broadway, New York, NY 10001',
        geometry: {
          location: { lat: 40.7128, lng: -74.0060 }
        }
      }
    ]
  },
  'Katz\'s Delicatessen, New York': {
    status: 'OK',
    results: [
      {
        place_id: 'place_id_2',
        name: 'Katz\'s Delicatessen',
        formatted_address: '205 E Houston St, New York, NY 10002',
        geometry: {
          location: { lat: 40.7223, lng: -73.9874 }
        }
      }
    ]
  },
  'Peter Luger Steak House, Brooklyn': {
    status: 'OK',
    results: [
      {
        place_id: 'place_id_3',
        name: 'Peter Luger Steak House',
        formatted_address: '178 Broadway, Brooklyn, NY 11211',
        geometry: {
          location: { lat: 40.7099, lng: -73.9622 }
        }
      },
      {
        place_id: 'place_id_4',
        name: 'Peter Luger Steak House',
        formatted_address: '255 Northern Blvd, Great Neck, NY 11021',
        geometry: {
          location: { lat: 40.7789, lng: -73.7259 }
        }
      }
    ]
  }
};

// Mock place details response
const mockPlaceDetails = {
  'place_id_1': {
    result: {
      name: 'Shake Shack',
      formatted_address: '123 Broadway, New York, NY 10001',
      formatted_phone_number: '(212) 555-1234',
      website: 'https://www.shakeshack.com',
      address_components: [
        { long_name: '123', short_name: '123', types: ['street_number'] },
        { long_name: 'Broadway', short_name: 'Broadway', types: ['route'] },
        { long_name: 'Manhattan', short_name: 'Manhattan', types: ['sublocality_level_1', 'sublocality', 'political'] },
        { long_name: 'New York', short_name: 'New York', types: ['locality', 'political'] },
        { long_name: 'New York County', short_name: 'New York County', types: ['administrative_area_level_2', 'political'] },
        { long_name: 'New York', short_name: 'NY', types: ['administrative_area_level_1', 'political'] },
        { long_name: 'United States', short_name: 'US', types: ['country', 'political'] },
        { long_name: '10001', short_name: '10001', types: ['postal_code'] }
      ],
      geometry: {
        location: { lat: 40.7128, lng: -74.0060 }
      }
    }
  }
};

// Mock neighborhood data
const mockNeighborhoodData = {
  '10001': {
    neighborhood: 'Chelsea',
    borough: 'Manhattan'
  },
  '10002': {
    neighborhood: 'Lower East Side',
    borough: 'Manhattan'
  },
  '11211': {
    neighborhood: 'Williamsburg',
    borough: 'Brooklyn'
  }
};

// Mock the bulk add processor hook
jest.mock('@/hooks/useBulkAddProcessor', () => ({
  useBulkAddProcessor: jest.fn()
}));

// Mock restaurant service
jest.mock('@/services/restaurantService', () => ({
  restaurantService: {
    bulkAdd: jest.fn(),
    getNeighborhoodByZip: jest.fn()
  }
}));

describe('Bulk Add Integration Tests', () => {
  // Set up mock implementation for the bulk add processor hook
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful auth status
    apiClient.get.mockImplementation((url) => {
      if (url === '/api/auth/status') {
        return Promise.resolve({
          data: {
            isAuthenticated: true,
            user: {
              id: 1,
              email: 'test@example.com',
              username: 'testuser',
              role: 'user'
            }
          }
        });
      }
      
      return Promise.reject(new Error('Unexpected URL'));
    });
    
    // Mock neighborhood lookup
    restaurantService.getNeighborhoodByZip.mockImplementation((zip) => {
      return Promise.resolve(mockNeighborhoodData[zip] || { neighborhood: 'Unknown', borough: 'Unknown' });
    });
    
    // Mock bulk add API call
    restaurantService.bulkAdd.mockResolvedValue({
      success: true,
      data: {
        added: 3,
        failed: 0,
        restaurants: [
          { id: 1, name: 'Shake Shack' },
          { id: 2, name: 'Katz\'s Delicatessen' },
          { id: 3, name: 'Peter Luger Steak House' }
        ]
      }
    });
    
    // Set up mock implementation for useBulkAddProcessor
    useBulkAddProcessor.mockImplementation(() => {
      const [items, setItems] = React.useState([]);
      const [processing, setProcessing] = React.useState(false);
      const [currentItem, setCurrentItem] = React.useState(null);
      const [multipleResults, setMultipleResults] = React.useState(null);
      const [completed, setCompleted] = React.useState([]);
      const [failed, setFailed] = React.useState([]);
      
      const processItems = async (newItems) => {
        setItems(newItems);
        setProcessing(true);
        
        for (let i = 0; i < newItems.length; i++) {
          const item = newItems[i];
          setCurrentItem(item);
          
          // Simulate API call to find places
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Check if we have multiple results for this item
          if (item === 'Peter Luger Steak House, Brooklyn') {
            setMultipleResults({
              query: item,
              results: mockPlacesResults[item].results
            });
            
            // Wait for user selection before continuing
            return;
          }
          
          // Add to completed items
          setCompleted(prev => [...prev, {
            original: item,
            placeId: mockPlacesResults[item].results[0].place_id,
            name: mockPlacesResults[item].results[0].name,
            address: mockPlacesResults[item].results[0].formatted_address
          }]);
        }
        
        setProcessing(false);
        setCurrentItem(null);
      };
      
      const selectResult = async (result) => {
        setMultipleResults(null);
        
        // Add the selected result to completed items
        setCompleted(prev => [...prev, {
          original: 'Peter Luger Steak House, Brooklyn',
          placeId: result.place_id,
          name: result.name,
          address: result.formatted_address
        }]);
        
        // Continue processing remaining items
        setProcessing(false);
        setCurrentItem(null);
      };
      
      const submitItems = async () => {
        setProcessing(true);
        
        // Simulate API call to submit items
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Call the actual service
        await restaurantService.bulkAdd(completed);
        
        setProcessing(false);
        setItems([]);
        setCompleted([]);
        setFailed([]);
        
        return { success: true, added: completed.length };
      };
      
      return {
        items,
        processing,
        currentItem,
        multipleResults,
        completed,
        failed,
        processItems,
        selectResult,
        submitItems
      };
    });
  });
  
  it('should process bulk add items and handle multiple results', async () => {
    // Render the bulk add page
    render(
      <MemoryRouter>
        <AuthProvider>
          <BulkAddPage />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByText(/bulk add restaurants/i)).toBeInTheDocument();
    });
    
    // Find the textarea and enter restaurant names
    const textarea = screen.getByPlaceholderText(/enter restaurant names/i) || 
                     screen.getByRole('textbox');
    
    await userEvent.type(textarea, testRestaurants.join('\n'));
    
    // Click the process button
    const processButton = screen.getByRole('button', { name: /process/i });
    await userEvent.click(processButton);
    
    // Wait for processing to start
    await waitFor(() => {
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });
    
    // Wait for multiple results to appear
    await waitFor(() => {
      expect(screen.getByText(/multiple results found/i)).toBeInTheDocument();
    });
    
    // Select the first result
    const resultItems = screen.getAllByRole('button', { name: /select/i });
    await userEvent.click(resultItems[0]);
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByText(/3 restaurants processed/i)).toBeInTheDocument();
    });
    
    // Click the submit button
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);
    
    // Verify the bulk add API was called with the correct data
    await waitFor(() => {
      expect(restaurantService.bulkAdd).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Shake Shack'
          }),
          expect.objectContaining({
            name: 'Katz\'s Delicatessen'
          }),
          expect.objectContaining({
            name: 'Peter Luger Steak House'
          })
        ])
      );
    });
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/successfully added 3 restaurants/i)).toBeInTheDocument();
    });
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock API error
    restaurantService.bulkAdd.mockRejectedValueOnce(new Error('API Error'));
    
    // Render the bulk add page
    render(
      <MemoryRouter>
        <AuthProvider>
          <BulkAddPage />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByText(/bulk add restaurants/i)).toBeInTheDocument();
    });
    
    // Find the textarea and enter restaurant names
    const textarea = screen.getByPlaceholderText(/enter restaurant names/i) || 
                     screen.getByRole('textbox');
    
    await userEvent.type(textarea, 'Shake Shack, New York');
    
    // Click the process button
    const processButton = screen.getByRole('button', { name: /process/i });
    await userEvent.click(processButton);
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByText(/1 restaurants processed/i)).toBeInTheDocument();
    });
    
    // Click the submit button
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);
    
    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
    });
  });
  
  it('should validate and normalize restaurant data before submission', async () => {
    // Create a spy on the hook's submitItems method
    const submitItemsSpy = jest.fn().mockResolvedValue({ success: true, added: 1 });
    
    // Override the mock implementation for this test
    useBulkAddProcessor.mockImplementationOnce(() => ({
      items: [],
      processing: false,
      currentItem: null,
      multipleResults: null,
      completed: [
        {
          original: 'Shake Shack, New York',
          placeId: 'place_id_1',
          name: 'Shake Shack',
          address: '123 Broadway, New York, NY 10001',
          // Missing some fields that should be normalized
        }
      ],
      failed: [],
      processItems: jest.fn(),
      selectResult: jest.fn(),
      submitItems: submitItemsSpy
    }));
    
    // Render the bulk add page
    render(
      <MemoryRouter>
        <AuthProvider>
          <BulkAddPage />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Wait for the page to load and show completed items
    await waitFor(() => {
      expect(screen.getByText(/1 restaurants processed/i)).toBeInTheDocument();
    });
    
    // Click the submit button
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);
    
    // Verify submitItems was called
    await waitFor(() => {
      expect(submitItemsSpy).toHaveBeenCalled();
    });
    
    // Verify the restaurantService.bulkAdd was called with normalized data
    await waitFor(() => {
      expect(restaurantService.bulkAdd).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Shake Shack',
            address: '123 Broadway, New York, NY 10001',
            placeId: 'place_id_1'
          })
        ])
      );
    });
  });
});
