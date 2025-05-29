{
      "long_name": "10011",
      "short_name": "10011",
      "types": [
        "postal_code"
      ]
    },
    {
      "long_name": "4332",
      "short_name": "4332",
      "types": [
        "postal_code_suffix"
      ]
    }
  ],
  "zipcode": "10011"
}
[INFO][2025-05-28T23:16:54.909Z] [BulkAddService] For placeId 'ChIJee0VTWZZwokRDYFpAoConlw': Initial 'formatted_address' present: false, Value: 'undefined'

stderr | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should retrieve details for valid place_ids found in lookupPlace
[ERROR][2025-05-28T23:16:54.909Z] [BulkAddService] Error in getPlaceDetails for placeId "ChIJee0VTWZZwokRDYFpAoConlw": {
  name: 'ReferenceError',
  message: 'logWarn is not defined',
  stack: 'ReferenceError: logWarn is not defined\n' +
    '    at getPlaceDetails (/Users/naf/Downloads/doof/src/services/bulkAddService.js:69:9)\n' +
    '    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n' +
    '    at safeApiCall (/Users/naf/Downloads/doof/tests/unit/services/bulkAddService.test.js:29:20)\n' +
    '    at /Users/naf/Downloads/doof/tests/unit/services/bulkAddService.test.js:113:26\n' +
    '    at file:///Users/naf/Downloads/doof/node_modules/@vitest/runner/dist/index.js:596:20'
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should retrieve details for valid place_ids found in lookupPlace
[TEST INFO] 2025-05-28T23:16:54.909Z - getPlaceDetails returned: null

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should retrieve details for valid place_ids found in lookupPlace
[TEST INFO] 2025-05-28T23:16:54.909Z - getPlaceDetails returned null for place_id ChIJee0VTWZZwokRDYFpAoConlw (Oiji Mi)
[TEST INFO] 2025-05-28T23:16:54.909Z - Attempting to get details for Llama San with place_id: ChIJ8youq41ZwokRqnnXghN1DIs
[TEST INFO] 2025-05-28T23:16:54.909Z - Calling getPlaceDetails with args: ["ChIJ8youq41ZwokRqnnXghN1DIs"]
[DEBUG][2025-05-28T23:16:54.909Z] [BulkAddService] Getting place details for: ChIJ8youq41ZwokRqnnXghN1DIs
[DEBUG][2025-05-28T23:16:54.909Z] [PlaceService] Fetching details for placeId "ChIJ8youq41ZwokRqnnXghN1DIs"

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should retrieve details for valid place_ids found in lookupPlace
[DEBUG][2025-05-28T23:16:54.909Z] [LoadingStateManager] Started loading: /places/details

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should retrieve details for valid place_ids found in lookupPlace
[DEBUG][2025-05-28T23:16:54.909Z] [API] GET /places/details {
  params: {
    place_id: 'ChIJ8youq41ZwokRqnnXghN1DIs',
    fields: 'place_id,name,formatted_address,geometry,address_components,types,vicinity'
  },
  hasData: false
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should retrieve details for valid place_ids found in lookupPlace
[DEBUG][2025-05-28T23:16:55.008Z] [API] GET /places/details - 200 {
  hasData: true,
  dataType: 'object',
  dataKeys: [ 'success', 'data', 'status' ]
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should retrieve details for valid place_ids found in lookupPlace
[DEBUG][2025-05-28T23:16:55.009Z] [LoadingStateManager] Stopped loading: /places/details

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should retrieve details for valid place_ids found in lookupPlace
[DEBUG][2025-05-28T23:16:55.009Z] [PlaceService] Successfully retrieved details for place ID: ChIJ8youq41ZwokRqnnXghN1DIs {
  placeId: 'ChIJ8youq41ZwokRqnnXghN1DIs',
  name: 'Llama San',
  formattedAddress: '359 6th Ave, New York, NY 10014, USA',
  location: { lat: 40.7322744, lng: -74.00082789999999 },
  addressComponents: [
    { long_name: '359', short_name: '359', types: [Array] },
    { long_name: '6th Avenue', short_name: '6th Ave', types: [Array] },
    { long_name: 'Manhattan', short_name: 'Manhattan', types: [Array] },
    { long_name: 'New York', short_name: 'New York', types: [Array] },
    {
      long_name: 'New York County',
      short_name: 'New York County',
      types: [Array]
    },
    { long_name: 'New York', short_name: 'NY', types: [Array] },
    { long_name: 'United States', short_name: 'US', types: [Array] },
    { long_name: '10014', short_name: '10014', types: [Array] }
  ],
  zipcode: '10014'
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should retrieve details for valid place_ids found in lookupPlace
[INFO][2025-05-28T23:16:55.010Z] [BulkAddService] Full serviceResponse from placeService.getPlaceDetails for placeId 'ChIJ8youq41ZwokRqnnXghN1DIs': {
  "details": {
    "placeId": "ChIJ8youq41ZwokRqnnXghN1DIs",
    "name": "Llama San",
    "formattedAddress": "359 6th Ave, New York, NY 10014, USA",
    "location": {
      "lat": 40.7322744,
      "lng": -74.00082789999999
    },
    "addressComponents": [
      {
        "long_name": "359",
        "short_name": "359",
        "types": [
          "street_number"
        ]
      },
      {
        "long_name": "6th Avenue",
        "short_name": "6th Ave",
        "types": [
          "route"
        ]
      },
      {
        "long_name": "Manhattan",
        "short_name": "Manhattan",
        "types": [
          "sublocality_level_1",
          "sublocality",
          "political"
        ]
      },
      {
        "long_name": "New York",
        "short_name": "New York",
        "types": [
          "locality",
          "political"
        ]
      },
      {
        "long_name": "New York County",
        "short_name": "New York County",
        "types": [
          "administrative_area_level_2",
          "political"
        ]
      },
      {
        "long_name": "New York",
        "short_name": "NY",
        "types": [
          "administrative_area_level_1",
          "political"
        ]
      },
      {
        "long_name": "United States",
        "short_name": "US",
        "types": [
          "country",
          "political"
        ]
      },
      {
        "long_name": "10014",
        "short_name": "10014",
        "types": [
          "postal_code"
        ]
      }
    ],
    "zipcode": "10014"
  },
  "status": "OK",
  "source": "google"
}
[INFO][2025-05-28T23:16:55.010Z] [BulkAddService] Extracted 'details' object for placeId 'ChIJ8youq41ZwokRqnnXghN1DIs'. Keys: placeId, name, formattedAddress, location, addressComponents, zipcode. Full details: {
  "placeId": "ChIJ8youq41ZwokRqnnXghN1DIs",
  "name": "Llama San",
  "formattedAddress": "359 6th Ave, New York, NY 10014, USA",
  "location": {
    "lat": 40.7322744,
    "lng": -74.00082789999999
  },
  "addressComponents": [
    {
      "long_name": "359",
      "short_name": "359",
      "types": [
        "street_number"
      ]
    },
    {
      "long_name": "6th Avenue",
      "short_name": "6th Ave",
      "types": [
        "route"
      ]
    },
    {
      "long_name": "Manhattan",
      "short_name": "Manhattan",
      "types": [
        "sublocality_level_1",
        "sublocality",
        "political"
      ]
    },
    {
      "long_name": "New York",
      "short_name": "New York",
      "types": [
        "locality",
        "political"
      ]
    },
    {
      "long_name": "New York County",
      "short_name": "New York County",
      "types": [
        "administrative_area_level_2",
        "political"
      ]
    },
    {
      "long_name": "New York",
      "short_name": "NY",
      "types": [
        "administrative_area_level_1",
        "political"
      ]
    },
    {
      "long_name": "United States",
      "short_name": "US",
      "types": [
        "country",
        "political"
      ]
    },
    {
      "long_name": "10014",
      "short_name": "10014",
      "types": [
        "postal_code"
      ]
    }
  ],
  "zipcode": "10014"
}
[INFO][2025-05-28T23:16:55.010Z] [BulkAddService] For placeId 'ChIJ8youq41ZwokRqnnXghN1DIs': Initial 'formatted_address' present: false, Value: 'undefined'

stderr | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should retrieve details for valid place_ids found in lookupPlace
[ERROR][2025-05-28T23:16:55.010Z] [BulkAddService] Error in getPlaceDetails for placeId "ChIJ8youq41ZwokRqnnXghN1DIs": {
  name: 'ReferenceError',
  message: 'logWarn is not defined',
  stack: 'ReferenceError: logWarn is not defined\n' +
    '    at getPlaceDetails (/Users/naf/Downloads/doof/src/services/bulkAddService.js:69:9)\n' +
    '    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n' +
    '    at safeApiCall (/Users/naf/Downloads/doof/tests/unit/services/bulkAddService.test.js:29:20)\n' +
    '    at /Users/naf/Downloads/doof/tests/unit/services/bulkAddService.test.js:113:26\n' +
    '    at file:///Users/naf/Downloads/doof/node_modules/@vitest/runner/dist/index.js:596:20'
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should retrieve details for valid place_ids found in lookupPlace
[TEST INFO] 2025-05-28T23:16:55.010Z - getPlaceDetails returned: null

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should retrieve details for valid place_ids found in lookupPlace
[TEST INFO] 2025-05-28T23:16:55.010Z - getPlaceDetails returned null for place_id ChIJ8youq41ZwokRqnnXghN1DIs (Llama San)
[TEST INFO] 2025-05-28T23:16:55.010Z - No valid place_ids were available or details could not be fetched from lookupPlace to test getPlaceDetails.
[TEST INFO] 2025-05-28T23:16:55.010Z - AFTER POPULATION in getPlaceDetails: testState.placeDetailsData keys: 

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[TEST INFO] 2025-05-28T23:16:55.010Z - Starting new test case...

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[TEST INFO] 2025-05-28T23:16:55.010Z - Calling getPlaceDetails with args: ["invalid-place-id-does-not-exist-12345"]
[DEBUG][2025-05-28T23:16:55.014Z] [BulkAddService] Getting place details for: invalid-place-id-does-not-exist-12345
[DEBUG][2025-05-28T23:16:55.014Z] [PlaceService] Fetching details for placeId "invalid-place-id-does-not-exist-12345"

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[DEBUG][2025-05-28T23:16:55.015Z] [LoadingStateManager] Started loading: /places/details

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[DEBUG][2025-05-28T23:16:55.015Z] [API] GET /places/details {
  params: {
    place_id: 'invalid-place-id-does-not-exist-12345',
    fields: 'place_id,name,formatted_address,geometry,address_components,types,vicinity'
  },
  hasData: false
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[DEBUG][2025-05-28T23:16:55.156Z] [API] GET /places/details - 200 {
  hasData: true,
  dataType: 'object',
  dataKeys: [ 'success', 'data', 'status' ]
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[DEBUG][2025-05-28T23:16:55.156Z] [LoadingStateManager] Stopped loading: /places/details

stderr | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[WARN][2025-05-28T23:16:55.156Z] [PlaceService] Attempt 1/3 failed for place details (invalid-place-id-does-not-exist-12345): Google API returned status: INVALID_REQUEST

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[DEBUG][2025-05-28T23:16:56.158Z] [LoadingStateManager] Started loading: /places/details

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[DEBUG][2025-05-28T23:16:56.159Z] [API] GET /places/details {
  params: {
    place_id: 'invalid-place-id-does-not-exist-12345',
    fields: 'place_id,name,formatted_address,geometry,address_components,types,vicinity'
  },
  hasData: false
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[DEBUG][2025-05-28T23:16:56.218Z] [API] GET /places/details - 200 {
  hasData: true,
  dataType: 'object',
  dataKeys: [ 'success', 'data', 'status' ]
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[DEBUG][2025-05-28T23:16:56.219Z] [LoadingStateManager] Stopped loading: /places/details

stderr | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[WARN][2025-05-28T23:16:56.219Z] [PlaceService] Attempt 2/3 failed for place details (invalid-place-id-does-not-exist-12345): Google API returned status: INVALID_REQUEST

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[DEBUG][2025-05-28T23:16:57.220Z] [LoadingStateManager] Started loading: /places/details

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[DEBUG][2025-05-28T23:16:57.221Z] [API] GET /places/details {
  params: {
    place_id: 'invalid-place-id-does-not-exist-12345',
    fields: 'place_id,name,formatted_address,geometry,address_components,types,vicinity'
  },
  hasData: false
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[DEBUG][2025-05-28T23:16:57.319Z] [API] GET /places/details - 200 {
  hasData: true,
  dataType: 'object',
  dataKeys: [ 'success', 'data', 'status' ]
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[DEBUG][2025-05-28T23:16:57.319Z] [LoadingStateManager] Stopped loading: /places/details

stderr | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[WARN][2025-05-28T23:16:57.319Z] [PlaceService] Attempt 3/3 failed for place details (invalid-place-id-does-not-exist-12345): Google API returned status: INVALID_REQUEST
[ERROR][2025-05-28T23:16:57.320Z] [PlaceService] All 3 attempts failed for place details (invalid-place-id-does-not-exist-12345). {
  name: 'Error',
  message: 'Google API returned status: INVALID_REQUEST',
  stack: 'Error: Google API returned status: INVALID_REQUEST\n' +
    '    at Object.getPlaceDetails (/Users/naf/Downloads/doof/src/services/placeService.js:241:17)\n' +
    '    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n' +
    '    at getPlaceDetails (/Users/naf/Downloads/doof/src/services/bulkAddService.js:52:29)\n' +
    '    at safeApiCall (/Users/naf/Downloads/doof/tests/unit/services/bulkAddService.test.js:29:20)\n' +
    '    at /Users/naf/Downloads/doof/tests/unit/services/bulkAddService.test.js:136:22\n' +
    '    at file:///Users/naf/Downloads/doof/node_modules/@vitest/runner/dist/index.js:596:20'
}

stderr | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[ERROR][2025-05-28T23:16:57.320Z] [BulkAddService] Error in getPlaceDetails for placeId "invalid-place-id-does-not-exist-12345": {
  name: 'Error',
  message: 'Failed to get place details after 3 attempts: Google API returned status: INVALID_REQUEST',
  stack: 'Error: Failed to get place details after 3 attempts: Google API returned status: INVALID_REQUEST\n' +
    '    at Object.getPlaceDetails (/Users/naf/Downloads/doof/src/services/placeService.js:257:11)\n' +
    '    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n' +
    '    at getPlaceDetails (/Users/naf/Downloads/doof/src/services/bulkAddService.js:52:29)\n' +
    '    at safeApiCall (/Users/naf/Downloads/doof/tests/unit/services/bulkAddService.test.js:29:20)\n' +
    '    at /Users/naf/Downloads/doof/tests/unit/services/bulkAddService.test.js:136:22\n' +
    '    at file:///Users/naf/Downloads/doof/node_modules/@vitest/runner/dist/index.js:596:20'
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null
[TEST INFO] 2025-05-28T23:16:57.320Z - getPlaceDetails returned: null

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 3. Check Existing Restaurant (checkExistingRestaurant) > should find an existing restaurant if details are available
[TEST INFO] 2025-05-28T23:16:57.321Z - Starting new test case...

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 3. Check Existing Restaurant (checkExistingRestaurant) > should find an existing restaurant if details are available
[TEST INFO] 2025-05-28T23:16:57.321Z - BEFORE CHECK in checkExistingRestaurant: testState.placeDetailsData keys: 
[TEST INFO] 2025-05-28T23:16:57.321Z - Skipping checkExistingRestaurant test as placeDetailsData is missing.

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 3. Check Existing Restaurant (checkExistingRestaurant) > should not find a non-existent restaurant
[TEST INFO] 2025-05-28T23:16:57.325Z - Starting new test case...

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 3. Check Existing Restaurant (checkExistingRestaurant) > should not find a non-existent restaurant
[TEST INFO] 2025-05-28T23:16:57.325Z - Calling checkExistingRestaurant with args: ["xyznotarealrestaurantnamexyz12345","123 Non Existent St, Fake City, FS 00000"]
[DEBUG][2025-05-28T23:16:57.325Z] [BulkAddService] Checking if restaurant exists: xyznotarealrestaurantnamexyz12345, 123 Non Existent St, Fake City, FS 00000
[DEBUG][2025-05-28T23:16:57.325Z] [RestaurantSearchService] Searching restaurants with params: {
  name: 'xyznotarealrestaurantnamexyz12345',
  address: '123 Non Existent St, Fake City, FS 00000',
  exact: true
}
[DEBUG][2025-05-28T23:16:57.327Z] [RestaurantSearchService] GET /restaurants/search

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 3. Check Existing Restaurant (checkExistingRestaurant) > should not find a non-existent restaurant
[DEBUG][2025-05-28T23:16:57.327Z] [LoadingStateManager] Started loading: /restaurants/search

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 3. Check Existing Restaurant (checkExistingRestaurant) > should not find a non-existent restaurant
[DEBUG][2025-05-28T23:16:57.327Z] [API] GET /restaurants/search {
  params: {
    page: 1,
    limit: 20,
    name: 'xyznotarealrestaurantnamexyz12345',
    address: '123 Non Existent St, Fake City, FS 00000',
    exact: true
  },
  hasData: false
}

stderr | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 3. Check Existing Restaurant (checkExistingRestaurant) > should not find a non-existent restaurant
[ERROR][2025-05-28T23:16:57.332Z] [API] GET /restaurants/search - 400 {
  message: 'Request failed with status code 400',
  hasResponse: true,
  responseData: {
    success: false,
    message: 'Validation failed.',
    errors: [ [Object] ]
  }
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 3. Check Existing Restaurant (checkExistingRestaurant) > should not find a non-existent restaurant
[DEBUG][2025-05-28T23:16:57.333Z] [LoadingStateManager] Stopped loading: /restaurants/search

stderr | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 3. Check Existing Restaurant (checkExistingRestaurant) > should not find a non-existent restaurant
[WARN][2025-05-28T23:16:57.333Z] [ErrorInterceptor] Bad request: {
  success: false,
  message: 'Validation failed.',
  errors: [
    {
      type: 'field',
      msg: 'id must be a positive integer.',
      path: 'id',
      location: 'params',
      value: 'search'
    }
  ]
}
[ERROR][2025-05-28T23:16:57.333Z] [HttpErrorInterceptor] Error: {
  message: 'Request failed with status code 400',
  statusCode: 400,
  responseData: {
    success: false,
    message: 'Validation failed.',
    errors: [ [Object] ]
  },
  context: 'HttpErrorInterceptor'
}

stderr | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 3. Check Existing Restaurant (checkExistingRestaurant) > should not find a non-existent restaurant
[ERROR][2025-05-28T23:16:57.335Z] [RestaurantSearchService] Error in GET /restaurants/search: {
  name: 'AxiosError',
  message: 'Request failed with status code 400',
  stack: 'AxiosError: Request failed with status code 400\n' +
    '    at settle (/Users/naf/Downloads/doof/node_modules/axios/lib/core/settle.js:19:12)\n' +
    '    at XMLHttpRequest.onloadend (/Users/naf/Downloads/doof/node_modules/axios/lib/adapters/xhr.js:59:13)\n' +
    '    at XMLHttpRequest.invokeTheCallbackFunction (/Users/naf/Downloads/doof/node_modules/jsdom/lib/jsdom/living/generated/EventHandlerNonNull.js:14:28)\n' +
    '    at XMLHttpRequest.<anonymous> (/Users/naf/Downloads/doof/node_modules/jsdom/lib/jsdom/living/helpers/create-event-accessor.js:35:32)\n' +
    '    at innerInvokeEventListeners (/Users/naf/Downloads/doof/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:350:25)\n' +
    '    at invokeEventListeners (/Users/naf/Downloads/doof/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:286:3)\n' +
    '    at XMLHttpRequestImpl._dispatch (/Users/naf/Downloads/doof/node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:233:9)\n' +
    '    at fireAnEvent (/Users/naf/Downloads/doof/node_modules/jsdom/lib/jsdom/living/helpers/events.js:18:36)\n' +
    '    at Request.<anonymous> (/Users/naf/Downloads/doof/node_modules/jsdom/lib/jsdom/living/xhr/XMLHttpRequest-impl.js:891:5)\n' +
    '    at Request.emit (node:events:530:35)\n' +
    '    at Axios.request (/Users/naf/Downloads/doof/node_modules/axios/lib/core/Axios.js:45:41)\n' +
    '    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n' +
    '    at RestaurantSearchService.request (/Users/naf/Downloads/doof/src/services/utils/BaseService.js:55:24)\n' +
    '    at RestaurantSearchService.searchRestaurants (/Users/naf/Downloads/doof/src/services/restaurant/RestaurantSearchService.js:47:22)\n' +
    '    at checkExistingRestaurant (/Users/naf/Downloads/doof/src/services/bulkAddService.js:175:30)\n' +
    '    at safeApiCall (/Users/naf/Downloads/doof/tests/unit/services/bulkAddService.test.js:29:20)\n' +
    '    at /Users/naf/Downloads/doof/tests/unit/services/bulkAddService.test.js:169:22\n' +
    '    at file:///Users/naf/Downloads/doof/node_modules/@vitest/runner/dist/index.js:596:20',
  code: 'ERR_BAD_REQUEST',
  status: 400,
  response: {
    status: 400,
    statusText: 'Bad Request',
    url: undefined,
    data: { success: false, message: 'Validation failed.', errors: [Array] }
  }
}

stderr | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 3. Check Existing Restaurant (checkExistingRestaurant) > should not find a non-existent restaurant
[WARN][2025-05-28T23:16:57.336Z] [RestaurantSearchService] No restaurants found with search params: {
  page: 1,
  limit: 20,
  name: 'xyznotarealrestaurantnamexyz12345',
  address: '123 Non Existent St, Fake City, FS 00000',
  exact: true
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 3. Check Existing Restaurant (checkExistingRestaurant) > should not find a non-existent restaurant
[TEST INFO] 2025-05-28T23:16:57.336Z - checkExistingRestaurant returned: null

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode)
[TEST INFO] 2025-05-28T23:16:57.336Z - Attempting to find real zipcodes for neighborhood tests...
[TEST INFO] 2025-05-28T23:16:57.336Z - No zipcodes from placeDetailsData. Trying REAL_RESTAURANTS expectedZip.
[TEST INFO] 2025-05-28T23:16:57.336Z - Using expected zipcode for Dirt Candy: 10002
[TEST INFO] 2025-05-28T23:16:57.336Z - Using expected zipcode for Kokomo: 11216

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes
[TEST INFO] 2025-05-28T23:16:57.336Z - Starting new test case...

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes
[TEST INFO] 2025-05-28T23:16:57.336Z - Testing neighborhood lookup for Dirt Candy with zipcode: 10002
[TEST INFO] 2025-05-28T23:16:57.336Z - Calling findNeighborhoodByZipcode with args: ["10002"]
[DEBUG][2025-05-28T23:16:57.336Z] [BulkAddService] Finding neighborhood for zipcode: 10002
[DEBUG][2025-05-28T23:16:57.336Z] [FilterService] Looking up neighborhood for zipcode: 10002

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes
[DEBUG][2025-05-28T23:16:57.336Z] [LoadingStateManager] Started loading: /neighborhoods/by-zipcode/10002

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes
[DEBUG][2025-05-28T23:16:57.336Z] [API] GET /neighborhoods/by-zipcode/10002 { params: {}, hasData: false }

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes
[DEBUG][2025-05-28T23:16:57.419Z] [API] GET /neighborhoods/by-zipcode/10002 - 200 { hasData: true, dataType: 'object', dataKeys: [ '0' ] }

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes
[DEBUG][2025-05-28T23:16:57.419Z] [LoadingStateManager] Stopped loading: /neighborhoods/by-zipcode/10002

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes
[DEBUG][2025-05-28T23:16:57.419Z] [FilterService.findNeighborhoodByZipcode] Response received: {
  status: 200,
  statusText: 'OK',
  hasData: true,
  dataType: 'object',
  dataKeys: [ '0' ],
  success: undefined,
  fullResponse: {
    data: [ [Object] ],
    status: 200,
    statusText: 'OK',
    headers: Object [AxiosHeaders] {
      'content-security-policy': "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
      'cross-origin-opener-policy': 'same-origin',
      'cross-origin-resource-policy': 'same-origin',
      'origin-agent-cluster': '?1',
      'referrer-policy': 'no-referrer',
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'x-content-type-options': 'nosniff',
      'x-dns-prefetch-control': 'off',
      'x-download-options': 'noopen',
      'x-frame-options': 'SAMEORIGIN',
      'x-permitted-cross-domain-policies': 'none',
      'x-xss-protection': '0',
      'x-request-id': 'req-1748474217338-xcsv8d9jg',
      vary: 'Origin, Accept-Encoding',
      'access-control-allow-credentials': 'true',
      'content-type': 'application/json; charset=utf-8',
      'content-length': '147',
      etag: 'W/"93-VO1w4rXoEPGBT9+o/l0bK+2DT94"',
      'x-response-time': '79ms',
      date: 'Wed, 28 May 2025 23:16:57 GMT',
      connection: 'keep-alive',
      'keep-alive': 'timeout=5'
    },
    config: {
      transitional: [Object],
      adapter: [Array],
      transformRequest: [Array],
      transformResponse: [Array],
      timeout: 30000,
      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',
      maxContentLength: -1,
      maxBodyLength: -1,
      env: [Object],
      validateStatus: [Function: validateStatus],
      headers: [Object [AxiosHeaders]],
      baseURL: 'http://localhost:5001/api',
      withCredentials: true,
      method: 'get',
      url: '/neighborhoods/by-zipcode/10002',
      allowAbsoluteUrls: true,
      metadata: [Object],
      data: undefined
    },
    request: XMLHttpRequest {}
  }
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes
[DEBUG][2025-05-28T23:16:57.420Z] [FilterService] Found neighborhood for zipcode 10002: Bowery

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes
[TEST INFO] 2025-05-28T23:16:57.420Z - findNeighborhoodByZipcode returned: {"id":88,"name":"Bowery","neighborhood":"Bowery","neighborhood_name":"Bowery","borough_id":null,"borough_name":null,"city_id":1,"city_name":"New York","zipcode":"10002"}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes
[TEST INFO] 2025-05-28T23:16:57.420Z - Found neighborhood: Bowery for zipcode: 10002
[TEST INFO] 2025-05-28T23:16:57.420Z - Testing neighborhood lookup for Kokomo with zipcode: 11216
[TEST INFO] 2025-05-28T23:16:57.420Z - Calling findNeighborhoodByZipcode with args: ["11216"]
[DEBUG][2025-05-28T23:16:57.420Z] [BulkAddService] Finding neighborhood for zipcode: 11216
[DEBUG][2025-05-28T23:16:57.420Z] [FilterService] Looking up neighborhood for zipcode: 11216

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes
[DEBUG][2025-05-28T23:16:57.420Z] [LoadingStateManager] Started loading: /neighborhoods/by-zipcode/11216

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes
[DEBUG][2025-05-28T23:16:57.420Z] [API] GET /neighborhoods/by-zipcode/11216 { params: {}, hasData: false }

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes
[DEBUG][2025-05-28T23:16:57.424Z] [API] GET /neighborhoods/by-zipcode/11216 - 200 { hasData: true, dataType: 'object', dataKeys: [ '0' ] }

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes
[DEBUG][2025-05-28T23:16:57.424Z] [LoadingStateManager] Stopped loading: /neighborhoods/by-zipcode/11216

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes
[DEBUG][2025-05-28T23:16:57.424Z] [FilterService.findNeighborhoodByZipcode] Response received: {
  status: 200,
  statusText: 'OK',
  hasData: true,
  dataType: 'object',
  dataKeys: [ '0' ],
  success: undefined,
  fullResponse: {
    data: [ [Object] ],
    status: 200,
    statusText: 'OK',
    headers: Object [AxiosHeaders] {
      'content-security-policy': "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
      'cross-origin-opener-policy': 'same-origin',
      'cross-origin-resource-policy': 'same-origin',
      'origin-agent-cluster': '?1',
      'referrer-policy': 'no-referrer',
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'x-content-type-options': 'nosniff',
      'x-dns-prefetch-control': 'off',
      'x-download-options': 'noopen',
      'x-frame-options': 'SAMEORIGIN',
      'x-permitted-cross-domain-policies': 'none',
      'x-xss-protection': '0',
      'x-request-id': 'req-1748474217421-svbegw69q',
      vary: 'Origin, Accept-Encoding',
      'access-control-allow-credentials': 'true',
      'content-type': 'application/json; charset=utf-8',
      'content-length': '192',
      etag: 'W/"c0-LjhU8iCPuejaejg/5rJAqB40xOA"',
      'x-response-time': '2ms',
      date: 'Wed, 28 May 2025 23:16:57 GMT',
      connection: 'keep-alive',
      'keep-alive': 'timeout=5'
    },
    config: {
      transitional: [Object],
      adapter: [Array],
      transformRequest: [Array],
      transformResponse: [Array],
      timeout: 30000,
      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',
      maxContentLength: -1,
      maxBodyLength: -1,
      env: [Object],
      validateStatus: [Function: validateStatus],
      headers: [Object [AxiosHeaders]],
      baseURL: 'http://localhost:5001/api',
      withCredentials: true,
      method: 'get',
      url: '/neighborhoods/by-zipcode/11216',
      allowAbsoluteUrls: true,
      metadata: [Object],
      data: undefined
    },
    request: XMLHttpRequest {}
  }
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes
[DEBUG][2025-05-28T23:16:57.424Z] [FilterService] Found neighborhood for zipcode 11216: Bedford-Stuyvesant

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes
[TEST INFO] 2025-05-28T23:16:57.424Z - findNeighborhoodByZipcode returned: {"id":22,"name":"Bedford-Stuyvesant","neighborhood":"Bedford-Stuyvesant","neighborhood_name":"Bedford-Stuyvesant","borough_id":null,"borough_name":null,"city_id":1,"city_name":"New York","zipcode":"11216"}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes
[TEST INFO] 2025-05-28T23:16:57.424Z - Found neighborhood: Bedford-Stuyvesant for zipcode: 11216

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should return null if no neighborhood found for an invalid zipcode
[TEST INFO] 2025-05-28T23:16:57.424Z - Starting new test case...

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should return null if no neighborhood found for an invalid zipcode
[TEST INFO] 2025-05-28T23:16:57.424Z - Testing with invalid zipcode: 99999
[TEST INFO] 2025-05-28T23:16:57.424Z - Calling findNeighborhoodByZipcode with args: ["99999"]
[DEBUG][2025-05-28T23:16:57.424Z] [BulkAddService] Finding neighborhood for zipcode: 99999
[DEBUG][2025-05-28T23:16:57.424Z] [FilterService] Looking up neighborhood for zipcode: 99999

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should return null if no neighborhood found for an invalid zipcode
[DEBUG][2025-05-28T23:16:57.424Z] [LoadingStateManager] Started loading: /neighborhoods/by-zipcode/99999

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should return null if no neighborhood found for an invalid zipcode
[DEBUG][2025-05-28T23:16:57.424Z] [API] GET /neighborhoods/by-zipcode/99999 { params: {}, hasData: false }

stderr | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should return null if no neighborhood found for an invalid zipcode
[ERROR][2025-05-28T23:16:57.428Z] [API] GET /neighborhoods/by-zipcode/99999 - 404 {
  message: 'Request failed with status code 404',
  hasResponse: true,
  responseData: {
    success: false,
    message: 'No neighborhoods found for zipcode: 99999'
  }
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should return null if no neighborhood found for an invalid zipcode
[DEBUG][2025-05-28T23:16:57.428Z] [LoadingStateManager] Stopped loading: /neighborhoods/by-zipcode/99999

stderr | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should return null if no neighborhood found for an invalid zipcode
[WARN][2025-05-28T23:16:57.428Z] [ErrorInterceptor] Resource not found: /neighborhoods/by-zipcode/99999
[ERROR][2025-05-28T23:16:57.428Z] [HttpErrorInterceptor] Error: {
  message: 'Request failed with status code 404',
  statusCode: 404,
  responseData: {
    success: false,
    message: 'No neighborhoods found for zipcode: 99999'
  },
  context: 'HttpErrorInterceptor'
}

stderr | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should return null if no neighborhood found for an invalid zipcode
[ERROR][2025-05-28T23:16:57.429Z] [FilterService.findNeighborhoodByZipcode] API Error (404) {
  message: 'Request failed with status code 404',
  responseData: {
    success: false,
    message: 'No neighborhoods found for zipcode: 99999'
  },
  status: 404
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should return null if no neighborhood found for an invalid zipcode
[DEBUG][2025-05-28T23:16:57.429Z] [FilterService] No neighborhoods match zipcode: 99999

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should return null if no neighborhood found for an invalid zipcode
[TEST INFO] 2025-05-28T23:16:57.429Z - findNeighborhoodByZipcode returned: null

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should return null if no neighborhood found for an invalid zipcode
[TEST INFO] 2025-05-28T23:16:57.430Z - Invalid zipcode handled correctly for neighborhood lookup.

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 5. Submit Bulk Items (submitBulkItems) > should successfully submit valid bulk items constructed from test data
[TEST INFO] 2025-05-28T23:16:57.430Z - Starting new test case...

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 5. Submit Bulk Items (submitBulkItems) > should successfully submit valid bulk items constructed from test data
[TEST INFO] 2025-05-28T23:16:57.430Z - BEFORE CHECK in submitBulkItems: testState.placeDetailsData keys: 
[TEST INFO] 2025-05-28T23:16:57.430Z - Skipping submitBulkItems test as no place data available.

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 5. Submit Bulk Items (submitBulkItems) > should handle invalid submissions gracefully (e.g., missing required fields)
[TEST INFO] 2025-05-28T23:16:57.430Z - Starting new test case...

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 5. Submit Bulk Items (submitBulkItems) > should handle invalid submissions gracefully (e.g., missing required fields)
[TEST INFO] 2025-05-28T23:16:57.430Z - Submitting invalid items: [{"name":"Test Invalid","address":null,"city":"NoCity","state":"NS","zipcode":"00000","status":"new"}]
[TEST INFO] 2025-05-28T23:16:57.430Z - Calling submitBulkItems with args: [[{"name":"Test Invalid","address":null,"city":"NoCity","state":"NS","zipcode":"00000","status":"new"}]]
[INFO][2025-05-28T23:16:57.430Z] [BulkAddService] Submitting 1 items
[DEBUG][2025-05-28T23:16:57.430Z] [AdminService] Creating restaurants resource

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 5. Submit Bulk Items (submitBulkItems) > should handle invalid submissions gracefully (e.g., missing required fields)
[DEBUG][2025-05-28T23:16:57.430Z] [LoadingStateManager] Started loading: /admin/restaurants

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 5. Submit Bulk Items (submitBulkItems) > should handle invalid submissions gracefully (e.g., missing required fields)
[DEBUG][2025-05-28T23:16:57.430Z] [API] POST /admin/restaurants { params: {}, hasData: true }

stderr | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 5. Submit Bulk Items (submitBulkItems) > should handle invalid submissions gracefully (e.g., missing required fields)
[ERROR][2025-05-28T23:16:57.436Z] [API] POST /admin/restaurants - 500 {
  message: 'Request failed with status code 500',
  hasResponse: true,
  responseData: {
    success: false,
    message: 'Failed to create restaurants. Error: null value in column "name" of relation "restaurants" violates not-null constraint'
  }
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 5. Submit Bulk Items (submitBulkItems) > should handle invalid submissions gracefully (e.g., missing required fields)
[DEBUG][2025-05-28T23:16:57.436Z] [LoadingStateManager] Stopped loading: /admin/restaurants

stderr | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 5. Submit Bulk Items (submitBulkItems) > should handle invalid submissions gracefully (e.g., missing required fields)
[WARN][2025-05-28T23:16:57.436Z] [ErrorInterceptor] Retrying request (1/3): /admin/restaurants

stderr | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 5. Submit Bulk Items (submitBulkItems) > should handle invalid submissions gracefully (e.g., missing required fields)
[ERROR][2025-05-28T23:16:58.437Z] [ErrorInterceptor] Server error: {
  status: 500,
  data: {
    success: false,
    message: 'Failed to create restaurants. Error: null value in column "name" of relation "restaurants" violates not-null constraint'
  },
  url: '/admin/restaurants'
}
[ERROR][2025-05-28T23:16:58.437Z] [HttpErrorInterceptor] Error: {
  message: 'Request failed with status code 500',
  statusCode: 500,
  responseData: {
    success: false,
    message: 'Failed to create restaurants. Error: null value in column "name" of relation "restaurants" violates not-null constraint'
  },
  context: 'HttpErrorInterceptor'
}

stderr | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 5. Submit Bulk Items (submitBulkItems) > should handle invalid submissions gracefully (e.g., missing required fields)
[ERROR][2025-05-28T23:16:58.438Z] [AdminService Createrestaurants] API Error (500) {
  message: 'Request failed with status code 500',
  responseData: {
    success: false,
    message: 'Failed to create restaurants. Error: null value in column "name" of relation "restaurants" violates not-null constraint'
  },
  status: 500
}

stdout | tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 5. Submit Bulk Items (submitBulkItems) > should handle invalid submissions gracefully (e.g., missing required fields)
[TEST INFO] 2025-05-28T23:16:58.438Z - submitBulkItems returned: {"success":false,"message":"Failed to create restaurants. Error: null value in column \"name\" of relation \"restaurants\" violates not-null constraint","error":{"type":"api_error","status":500,"message":"Request failed with status code 500","details":{"success":false,"message":"Failed to create restaurants. Error: null value in column \"name\" of relation \"restaurants\" violates not-null constraint"}}}

 ❯ tests/unit/services/bulkAddService.test.js (14 tests | 2 failed) 4525ms
   ✓ BulkAddService - Integration Tests with Real APIs > 1. Place Lookup (lookupPlace) > should find place candidates for 'Dirt Candy' in 'New York' 229ms
   ✓ BulkAddService - Integration Tests with Real APIs > 1. Place Lookup (lookupPlace) > should find place candidates for 'Wu\'s Wonton King' in 'New York' 95ms
   ✓ BulkAddService - Integration Tests with Real APIs > 1. Place Lookup (lookupPlace) > should find place candidates for 'Kokomo' in 'New York' 86ms
   ✓ BulkAddService - Integration Tests with Real APIs > 1. Place Lookup (lookupPlace) > should find place candidates for 'Oiji Mi' in 'New York' 90ms
   ✓ BulkAddService - Integration Tests with Real APIs > 1. Place Lookup (lookupPlace) > should find place candidates for 'Llama San' in 'New York' 90ms
   ✓ BulkAddService - Integration Tests with Real APIs > 1. Place Lookup (lookupPlace) > should handle invalid queries by returning an empty array or null 53ms
   ✓ BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should retrieve details for valid place_ids found in lookupPlace  453ms
   ✓ BulkAddService - Integration Tests with Real APIs > 2. Place Details (getPlaceDetails) > should handle invalid place_ids by returning null  2311ms
   × BulkAddService - Integration Tests with Real APIs > 3. Check Existing Restaurant (checkExistingRestaurant) > should find an existing restaurant if details are available 4ms
     → expected false to be true // Object.is equality
   ✓ BulkAddService - Integration Tests with Real APIs > 3. Check Existing Restaurant (checkExistingRestaurant) > should not find a non-existent restaurant 11ms
   ✓ BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should find neighborhoods by real zipcodes 88ms
   ✓ BulkAddService - Integration Tests with Real APIs > 4. Neighborhood Lookup (findNeighborhoodByZipcode) > should return null if no neighborhood found for an invalid zipcode 5ms
   × BulkAddService - Integration Tests with Real APIs > 5. Submit Bulk Items (submitBulkItems) > should successfully submit valid bulk items constructed from test data 1ms
     → expected false to be true // Object.is equality
   ✓ BulkAddService - Integration Tests with Real APIs > 5. Submit Bulk Items (submitBulkItems) > should handle invalid submissions gracefully (e.g., missing required fields)  1008ms

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 3. Check Existing Restaurant (checkExistingRestaurant) > should find an existing restaurant if details are available
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 ❯ tests/unit/services/bulkAddService.test.js:146:74
    144|       if (!testState.placeDetailsData || Object.keys(testState.placeDetailsData).length === 0) {
    145|         logTestInfo('Skipping checkExistingRestaurant test as placeDetailsData is missing.');
    146|         expect(Object.keys(testState.placeDetailsData || {}).length > 0).toBe(true); // Fail if no data
       |                                                                          ^
    147|         return;
    148|       }

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/2]⎯

 FAIL  tests/unit/services/bulkAddService.test.js > BulkAddService - Integration Tests with Real APIs > 5. Submit Bulk Items (submitBulkItems) > should successfully submit valid bulk items constructed from test data
AssertionError: expected false to be true // Object.is equality

- Expected
+ Received

- true
+ false

 ❯ tests/unit/services/bulkAddService.test.js:245:74
    243|       if (!testState.placeDetailsData || Object.keys(testState.placeDetailsData).length === 0) {
    244|         logTestInfo('Skipping submitBulkItems test as no place data available.');
    245|         expect(Object.keys(testState.placeDetailsData || {}).length > 0).toBe(true); // Fail if no data
       |                                                                          ^
    246|         return;
    247|       }

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/2]⎯


 Test Files  1 failed (1)
      Tests  2 failed | 12 passed (14)
   Start at  19:16:52
   Duration  6.07s (transform 195ms, setup 124ms, collect 483ms, tests 4.52s, environment 414ms, prepare 46ms)

naf@NAFs-MacBook-Air doof %                                                    