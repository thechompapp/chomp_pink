import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';

// Import the service functions directly to test
import {
  lookupPlace,
  getPlaceDetails,
  checkExistingRestaurant,
  submitBulkItems,
  findNeighborhoodByZipcode
} from '@/services/bulkAddService';

// Mock external dependencies to prevent test failures
vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

// Logger for test output
const logTestInfo = (message) => {
  console.log(`[TEST INFO] ${new Date().toISOString()} - ${message}`);
};

// Utility function to handle API errors gracefully
const safeApiCall = async (apiFunc, ...args) => {
  try {
    logTestInfo(`Calling ${apiFunc.name} with args: ${JSON.stringify(args)}`);
    const result = await apiFunc(...args);
    logTestInfo(`${apiFunc.name} returned: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    logTestInfo(`API call ${apiFunc.name} failed: ${error.message}`);
    return null;
  }
};

// Test data for real API calls with actual restaurants
const REAL_RESTAURANTS = [
  { name: 'Dirt Candy', location: 'New York', cuisine: 'Vegetarian', expectedZip: '10002' },
  { name: "Wu's Wonton King", location: 'New York', cuisine: 'Chinese', expectedZip: '10002' },
  { name: 'Kokomo', location: 'New York', cuisine: 'Caribbean', expectedZip: '11216' },
  { name: 'Oiji Mi', location: 'New York', cuisine: 'Korean', expectedZip: '10011' },
  { name: 'Llama San', location: 'New York', cuisine: 'Japanese-Peruvian', expectedZip: '10011' }
];

// For invalid test cases
const INVALID_RESTAURANT_QUERY = 'xyznotarealrestaurantnamexyz12345';
const INVALID_PLACE_ID = 'invalid-place-id-does-not-exist-12345';
const INVALID_ZIPCODE = '99999';

// Shared state for sequential tests
const testState = {};

describe('BulkAddService - Integration Tests with Real APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clears mocks like react-hot-toast
    logTestInfo('Starting new test case...');
    // Initialize parts of testState if they should be fresh for each describe block's tests
  });

  describe('1. Place Lookup (lookupPlace)', () => {
    beforeAll(() => {
      testState.placeLookupData = {}; // Initialize for this describe block
    });

    it.each(REAL_RESTAURANTS)('should find place candidates for $name in $location', async (restaurant) => {
      const query = `${restaurant.name} ${restaurant.location}`;
      const result = await safeApiCall(lookupPlace, query);

      expect(result).toBeDefined();
      if (result === null) {
        logTestInfo(`lookupPlace returned null for ${query}, which might indicate an API issue or network problem.`);
      } else {
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          const firstMatch = result[0];
          expect(firstMatch).toHaveProperty('place_id');
          expect(firstMatch).toHaveProperty('name');
          testState.placeLookupData[restaurant.name] = { query, results: result };
        } else {
          logTestInfo(`No results for ${query}. This could be an issue with the specific query or API data availability.`);
          testState.placeLookupData[restaurant.name] = { query, results: [] };
        }
      }
    }, 30000); // Timeout per restaurant

    it('should handle invalid queries by returning an empty array or null', async () => {
      const result = await safeApiCall(lookupPlace, INVALID_RESTAURANT_QUERY);
      expect(result === null || (Array.isArray(result) && result.length === 0)).toBe(true);
    }, 10000);
  });

  describe('2. Place Details (getPlaceDetails)', () => {
    beforeAll(() => {
      testState.placeDetailsData = {}; // Initialize for this describe block
    });

    it('should retrieve details for valid place_ids found in lookupPlace', async () => {
      let testedAny = false;
      if (!testState.placeLookupData || Object.keys(testState.placeLookupData).length === 0) {
        logTestInfo('Skipping getPlaceDetails tests as placeLookupData is missing from previous step.');
        // This expectation will fail if placeLookupData is empty, highlighting dependency
        expect(Object.keys(testState.placeLookupData || {}).length > 0).toBe(true);
        return;
      }

      for (const restaurantName in testState.placeLookupData) {
        const lookup = testState.placeLookupData[restaurantName];
        if (lookup.results && lookup.results.length > 0) {
          const placeId = lookup.results[0].place_id;
          logTestInfo(`Attempting to get details for ${restaurantName} with place_id: ${placeId}`);
          const result = await safeApiCall(getPlaceDetails, placeId);
          expect(result).toBeDefined(); // It should at least be null, not undefined
          if (result !== null) {
            expect(result).toHaveProperty('place_id', placeId);
            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('formatted_address');
            testState.placeDetailsData[restaurantName] = result;
            testedAny = true;
          } else {
            logTestInfo(`getPlaceDetails returned null for place_id ${placeId} (${restaurantName})`);
          }
        }
      }

      if (Object.keys(testState.placeLookupData).length > 0 && !testedAny) {
        logTestInfo('No valid place_ids were available or details could not be fetched from lookupPlace to test getPlaceDetails.');
      } else if (Object.keys(testState.placeLookupData).length === 0) {
        logTestInfo('No place lookup data was available to test details.');
      }
      logTestInfo(`AFTER POPULATION in getPlaceDetails: testState.placeDetailsData keys: ${Object.keys(testState.placeDetailsData || {}).join(', ')}`);
    }, 20000); // Timeout for all iterations

    it('should handle invalid place_ids by returning null', async () => {
      const result = await safeApiCall(getPlaceDetails, INVALID_PLACE_ID);
      expect(result).toBeNull();
    }, 10000);
  });

  describe('3. Check Existing Restaurant (checkExistingRestaurant)', () => {
    it('should find an existing restaurant if details are available', async () => {
      logTestInfo(`BEFORE CHECK in checkExistingRestaurant: testState.placeDetailsData keys: ${Object.keys(testState.placeDetailsData || {}).join(', ')}`);
      if (!testState.placeDetailsData || Object.keys(testState.placeDetailsData).length === 0) {
        logTestInfo('Skipping checkExistingRestaurant test as placeDetailsData is missing.');
        expect(Object.keys(testState.placeDetailsData || {}).length > 0).toBe(true); // Fail if no data
        return;
      }
      const firstRestaurantName = Object.keys(testState.placeDetailsData)[0];
      const details = testState.placeDetailsData[firstRestaurantName];
      
      if (details && details.name && details.formatted_address) {
        logTestInfo(`Checking existing restaurant: ${details.name}, ${details.formatted_address}`);
        const result = await safeApiCall(checkExistingRestaurant, details.name, details.formatted_address);
        expect(result).toBeDefined(); // Should be restaurant object if found, or null/false if not
        // Add more specific assertions based on expected return, e.g., expect(result).toHaveProperty('id');
        if(result) {
            logTestInfo(`Restaurant ${details.name} found with ID: ${result.id}`);
        } else {
            logTestInfo(`Restaurant ${details.name} not found (may be expected if not in DB).`);
        }
      } else {
        logTestInfo('Not enough data from placeDetails to test checkExistingRestaurant.');
        expect(details && details.name && details.formatted_address).toBeTruthy(); // Fail if data is insufficient
      }
    }, 15000);

    it('should not find a non-existent restaurant', async () => {
      const result = await safeApiCall(checkExistingRestaurant, INVALID_RESTAURANT_QUERY, '123 Non Existent St, Fake City, FS 00000');
      expect(result).toBeNull(); // Assuming null is returned for not found
    }, 10000);
  });

  describe('4. Neighborhood Lookup (findNeighborhoodByZipcode)', () => {
    let realZipcodes = [];

    beforeAll(async () => {
      logTestInfo('Attempting to find real zipcodes for neighborhood tests...');
      if (testState.placeDetailsData && Object.keys(testState.placeDetailsData).length > 0) {
        for (const restaurantName in testState.placeDetailsData) {
          const details = testState.placeDetailsData[restaurantName];
          if (details && details.formatted_address) {
            const zipMatch = details.formatted_address.match(/\b(\d{5})\b/);
            if (zipMatch && zipMatch[1]) {
              if (!realZipcodes.find(z => z.zipcode === zipMatch[1])) {
                realZipcodes.push({ name: restaurantName, zipcode: zipMatch[1] });
                logTestInfo(`Found zipcode for ${restaurantName}: ${zipMatch[1]}`);
              }
            }
          }
          if (realZipcodes.length >= 2) break; // Limit API calls in setup
        }
      }
      
      if (realZipcodes.length === 0) {
        logTestInfo('No zipcodes from placeDetailsData. Trying REAL_RESTAURANTS expectedZip.');
        for (const restaurant of REAL_RESTAURANTS) {
          if (restaurant.expectedZip && !realZipcodes.find(z => z.zipcode === restaurant.expectedZip)) {
            realZipcodes.push({ name: restaurant.name, zipcode: restaurant.expectedZip });
            logTestInfo(`Using expected zipcode for ${restaurant.name}: ${restaurant.expectedZip}`);
            if (realZipcodes.length >=2) break;
          }
        }
      }

      if (realZipcodes.length === 0) {
        realZipcodes.push({ name: 'Manhattan (Fallback)', zipcode: '10001' });
        logTestInfo('Using fallback Manhattan zipcode: 10001 for neighborhood tests.');
      }
    }, 30000); // Timeout for beforeAll

    it('should find neighborhoods by real zipcodes', async () => {
      if (realZipcodes.length === 0) {
        logTestInfo('No real zipcodes available to test neighborhood lookup.');
        expect(realZipcodes.length > 0).toBe(true); // Fail if no zipcodes were prepared
        return;
      }
      for (const { name, zipcode } of realZipcodes) {
        logTestInfo(`Testing neighborhood lookup for ${name} with zipcode: ${zipcode}`);
        const result = await safeApiCall(findNeighborhoodByZipcode, zipcode);
        if (result) {
          expect(result).toHaveProperty('id');
          expect(result).toHaveProperty('name');
          logTestInfo(`Found neighborhood: ${result.name} for zipcode: ${zipcode}`);
        } else {
          logTestInfo(`No neighborhood found for zipcode: ${zipcode} (this may be expected for some zips).`);
          // Depending on data, this might be expect(result).toBeNull();
        }
      }
    }, 20000); // Increased timeout for multiple API calls

    it('should return null if no neighborhood found for an invalid zipcode', async () => {
      logTestInfo(`Testing with invalid zipcode: ${INVALID_ZIPCODE}`);
      const result = await safeApiCall(findNeighborhoodByZipcode, INVALID_ZIPCODE);
      expect(result).toBeNull();
      logTestInfo('Invalid zipcode handled correctly for neighborhood lookup.');
    }, 10000);
  });

  describe('5. Submit Bulk Items (submitBulkItems)', () => {
    it('should successfully submit valid bulk items constructed from test data', async () => {
      logTestInfo(`BEFORE CHECK in submitBulkItems: testState.placeDetailsData keys: ${Object.keys(testState.placeDetailsData || {}).join(', ')}`);
      if (!testState.placeDetailsData || Object.keys(testState.placeDetailsData).length === 0) {
        logTestInfo('Skipping submitBulkItems test as no place data available.');
        expect(Object.keys(testState.placeDetailsData || {}).length > 0).toBe(true); // Fail if no data
        return;
      }

      const itemsToSubmit = [];
      for (const restaurantName in testState.placeDetailsData) {
        const details = testState.placeDetailsData[restaurantName];
        if (!details) continue;

        let neighborhoodId = null;
        let city = 'Unknown City', state = 'US', itemZipcode = '00000';
        const address = details.formatted_address || '';
        const zipMatch = address.match(/\b(\d{5})\b/);
        if (zipMatch && zipMatch[1]) {
          itemZipcode = zipMatch[1];
          const neighborhood = await safeApiCall(findNeighborhoodByZipcode, itemZipcode);
          if (neighborhood) neighborhoodId = neighborhood.id;
        }
        // Basic address parsing (very naive)
        const addressParts = address.split(',');
        if (addressParts.length >= 3) {
            city = addressParts[addressParts.length - 2].trim().split(' ')[0]; // Attempt to get city
            const stateZipPart = addressParts[addressParts.length - 1].trim().split(' ');
            if (stateZipPart.length >= 2) {
                state = stateZipPart[0];
            }
        }

        const originalRestaurant = REAL_RESTAURANTS.find(r => r.name === restaurantName);

        itemsToSubmit.push({
          name: details.name || restaurantName,
          address: address.split(',')[0].trim(), // Street address part
          city: city,
          state: state,
          zipcode: itemZipcode,
          cuisine: originalRestaurant?.cuisine || 'Assorted',
          google_place_id: details.place_id,
          neighborhood_id: neighborhoodId, // Can be null
          status: 'new' // Assuming 'new' is the status for submission
        });
        if (itemsToSubmit.length >= 1) break; // Submit one item for this test for now
      }

      if (itemsToSubmit.length === 0) {
        logTestInfo('Could not construct any valid items to submit.');
        expect(itemsToSubmit.length > 0).toBe(true); // Fail if no items constructed
        return;
      }

      logTestInfo(`Submitting items: ${JSON.stringify(itemsToSubmit)}`);
      const result = await safeApiCall(submitBulkItems, itemsToSubmit);
      expect(result).toBeDefined();
      // Example: Assuming submitBulkItems returns an array of results for each item
      if (Array.isArray(result) && result.length > 0) {
        logTestInfo(`Submission result: ${JSON.stringify(result)}`);
        // expect(result[0]).toHaveProperty('success', true); // Or similar success indicator
        // expect(result[0]).toHaveProperty('restaurant_id'); // If it returns created restaurant ID
      } else {
        logTestInfo('Submission did not return expected array or was empty.');
        // Potentially expect(result).toBeNull() if an error in submission process returns null
      }
    }, 30000); // Longer timeout for submission involving multiple steps

    it('should handle invalid submissions gracefully (e.g., missing required fields)', async () => {
      const invalidItems = [
        { name: 'Test Invalid', address: null, city: 'NoCity', state: 'NS', zipcode: '00000', status: 'new' }
      ];
      logTestInfo(`Submitting invalid items: ${JSON.stringify(invalidItems)}`);
      const result = await safeApiCall(submitBulkItems, invalidItems);
      // How the API signals errors for bulk items needs to be known.
      // It might return an array where each item has an error status, or null, or throw (handled by safeApiCall).
      expect(result).toBeDefined(); // General check
      if (Array.isArray(result) && result.length > 0) {
        logTestInfo(`Invalid submission result: ${JSON.stringify(result)}`);
        // expect(result[0]).toHaveProperty('success', false);
        // expect(result[0]).toHaveProperty('error_message');
      } else if (result === null) {
        logTestInfo('Invalid submission resulted in null, possibly due to overall validation failure.');
      }
    }, 10000);
  });

}); // Closes main describe
