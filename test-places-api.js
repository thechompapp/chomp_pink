/**
 * Test script to check if the Google Places API key is configured and working
 */
import axios from 'axios';

// Configuration
const API_BASE_URL = 'http://localhost:5001/api';

async function testPlacesAPI() {
  console.log('Testing Google Places API integration...');
  
  try {
    // Test the autocomplete endpoint with a simple query
    console.log('Testing autocomplete endpoint...');
    const autocompleteResponse = await axios.get(`${API_BASE_URL}/places/autocomplete`, {
      params: {
        input: 'McDonalds, New York',
        types: 'establishment'
      },
      headers: {
        'X-Places-Api-Request': 'true',
        'X-Bypass-Auth': 'true'
      }
    });
    
    console.log('Autocomplete response status:', autocompleteResponse.status);
    console.log('Autocomplete API status:', autocompleteResponse.data.status);
    console.log('Number of predictions:', autocompleteResponse.data.data?.length || 0);
    
    if (autocompleteResponse.data.data && autocompleteResponse.data.data.length > 0) {
      const placeId = autocompleteResponse.data.data[0].place_id;
      console.log('First place ID:', placeId);
      
      // Test the details endpoint with the place ID
      console.log('\nTesting details endpoint...');
      const detailsResponse = await axios.get(`${API_BASE_URL}/places/details`, {
        params: {
          place_id: placeId
        },
        headers: {
          'X-Places-Api-Request': 'true',
          'X-Bypass-Auth': 'true'
        }
      });
      
      console.log('Details response status:', detailsResponse.status);
      console.log('Details API status:', detailsResponse.data.status);
      
      // Log the full response structure to understand the format
      console.log('Response data structure:', Object.keys(detailsResponse.data));
      
      // The place details are nested under the 'data' property
      const result = detailsResponse.data.data;
      console.log('Place name:', result?.name);
      console.log('Place address:', result?.formatted_address);
      
      // Log more details about the result
      if (result) {
        console.log('\nPlace details:');
        console.log('- ID:', result.place_id);
        console.log('- Name:', result.name);
        console.log('- Formatted Address:', result.formatted_address);
        console.log('- Types:', result.types);
        console.log('- Geometry:', result.geometry?.location);
        console.log('- Has Address Components:', result.address_components ? 'Yes' : 'No');
        console.log('- Address components count:', result.address_components?.length || 0);
        
        if (result.address_components && result.address_components.length > 0) {
          console.log('\nAddress Components:');
          result.address_components.forEach((component, index) => {
            console.log(`  ${index + 1}. ${component.long_name} (${component.short_name}) - Types: ${component.types.join(', ')}`);
          });
        }
        
        // Log all available fields in the result
        console.log('\nAll available fields in result:', Object.keys(result).join(', '));
      } else {
        console.log('\nFull response data:', JSON.stringify(detailsResponse.data, null, 2));
      }
    } else {
      console.log('No places found in autocomplete response');
      console.log('Response data:', JSON.stringify(autocompleteResponse.data, null, 2));
    }
  } catch (error) {
    console.error('Error testing Places API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testPlacesAPI();
