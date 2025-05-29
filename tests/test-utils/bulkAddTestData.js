/**
 * Test data for bulk add functionality
 */

export const BULK_ADD_TEST_DATA = [
  { name: 'Le Chêne', type: 'restaurant', city: 'New York', cuisine: 'French' },
  { name: 'Ceres', type: 'restaurant', city: 'New York', cuisine: 'Italian-American Pizza' },
  { name: 'El Camino', type: 'restaurant', city: 'New York', cuisine: 'Spanish Tapas' },
  { name: 'Cafe Zaffri', type: 'restaurant', city: 'New York', cuisine: 'Levantine' },
  { name: "Massi's", type: 'restaurant', city: 'New York', cuisine: 'Italian-American Sandwiches' },
  { name: 'Binondo', type: 'restaurant', city: 'New York', cuisine: 'Filipino-Chinese' },
  { name: 'Lisbonata', type: 'restaurant', city: 'New York', cuisine: 'Portuguese Bakery' },
  { name: 'Mustard', type: 'restaurant', city: 'New York', cuisine: 'Indian' },
  { name: 'Bar Tizio', type: 'restaurant', city: 'New York', cuisine: 'Italian Wine Bar' },
  { name: 'Smashy Club', type: 'restaurant', city: 'New York', cuisine: 'Hungarian-American Smashburgers' }
];

export const MOCK_PLACE_DETAILS = {
  place_id: 'test_place_id',
  name: 'Test Restaurant',
  formatted_address: '123 Test St, New York, NY 10001',
  geometry: { 
    location: { 
      lat: 40.7128, 
      lng: -74.0060 
    } 
  },
  formatted_phone_number: '(123) 456-7890',
  website: 'http://test-restaurant.com',
  opening_hours: {
    weekday_text: [
      'Monday: 9:00 AM – 10:00 PM',
      'Tuesday: 9:00 AM – 10:00 PM',
      'Wednesday: 9:00 AM – 10:00 PM',
      'Thursday: 9:00 AM – 10:00 PM',
      'Friday: 9:00 AM – 11:00 PM',
      'Saturday: 10:00 AM – 11:00 PM',
      'Sunday: 10:00 AM – 9:00 PM'
    ]
  },
  rating: 4.5,
  user_ratings_total: 100,
  types: ['restaurant', 'food', 'point_of_interest', 'establishment']
};
