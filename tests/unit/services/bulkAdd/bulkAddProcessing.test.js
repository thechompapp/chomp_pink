import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { parseInputText, formatItemForSubmission } from '@/utils/bulkAddUtils';

// Test configuration following the TESTING_STRATEGY.md
const CONFIG = {
  TEST_TIMEOUT: 5000, // 5 seconds as per strategy
  
  // Test data from existing bulk add files
  TEST_RESTAURANTS: [
    { name: 'Maison Passerelle', location: 'New York', cuisine: 'French-Diaspora Fusion' },
    { name: 'Bar Bianchi', location: 'New York', cuisine: 'Milanese' },
    { name: 'JR & Son', location: 'New York', cuisine: 'Italian-American' },
    { name: 'Papa d\'Amour', location: 'New York', cuisine: 'French-Asian Bakery' },
    { name: 'Figure Eight', location: 'New York', cuisine: 'Chinese-American' }
  ],
  
  // Test input formats
  TEST_INPUT_FORMATS: [
    // Standard comma-separated format
    'Maison Passerelle, 123 Main St, New York, NY, 10001',
    'Bar Bianchi, 456 Second Ave, New York, NY, 10002',
    
    // Pipe-separated format
    'JR & Son | 789 Third St | New York | NY | 10003',
    
    // Mixed format with full address
    'Papa d\'Amour, 101 Pastry Lane, New York, NY 10004',
    
    // Name only
    'Figure Eight',
    
    // With special characters
    'Café Zürn & Co., 555 Special St, New York, NY, 10005'
  ]
};

describe('Bulk Add Processing Tests', () => {
  
  describe('1. Data Parsing and Validation', () => {
    it('should parse comma-separated input correctly', async () => {
      const input = 'Maison Passerelle, 123 Main St, New York, NY, 10001';
      const parsed = parseInputText(input);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toMatchObject({
        name: 'Maison Passerelle',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipcode: '10001',
        status: 'pending'
      });
    }, CONFIG.TEST_TIMEOUT);

    it('should parse pipe-separated input correctly', async () => {
      const input = 'JR & Son | 789 Third St | New York | NY | 10003';
      const parsed = parseInputText(input);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toMatchObject({
        name: 'JR & Son',
        address: '789 Third St',
        city: 'New York',
        state: 'NY',
        zipcode: '10003',
        status: 'pending'
      });
    }, CONFIG.TEST_TIMEOUT);

    it('should handle multiple lines of input', async () => {
      const input = CONFIG.TEST_INPUT_FORMATS.slice(0, 3).join('\n');
      const parsed = parseInputText(input);
      
      expect(parsed).toHaveLength(3);
      expect(parsed[0].name).toBe('Maison Passerelle');
      expect(parsed[1].name).toBe('Bar Bianchi');
      expect(parsed[2].name).toBe('JR & Son');
    }, CONFIG.TEST_TIMEOUT);

    it('should handle special characters in restaurant names', async () => {
      const input = 'Papa d\'Amour & Co., 101 Pastry Lane, New York, NY, 10004';
      const parsed = parseInputText(input);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Papa d\'Amour & Co.');
      expect(parsed[0].address).toBe('101 Pastry Lane');
    }, CONFIG.TEST_TIMEOUT);

    it('should handle name-only input', async () => {
      const input = 'Figure Eight';
      const parsed = parseInputText(input);
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toMatchObject({
        name: 'Figure Eight',
        address: '',
        city: '',
        state: '',
        zipcode: '',
        status: 'pending'
      });
    }, CONFIG.TEST_TIMEOUT);
  });

  describe('2. Error Handling and Edge Cases', () => {
    it('should handle empty input', async () => {
      const parsed = parseInputText('');
      expect(parsed).toHaveLength(0);
    }, CONFIG.TEST_TIMEOUT);

    it('should handle whitespace-only input', async () => {
      const parsed = parseInputText('   \n  \t  \n  ');
      expect(parsed).toHaveLength(0);
    }, CONFIG.TEST_TIMEOUT);

    it('should handle malformed lines gracefully', async () => {
      const input = 'Valid Restaurant, 123 Main St\n\n,,,\nAnother Valid, 456 Second St';
      const parsed = parseInputText(input);
      
      expect(parsed).toHaveLength(3);
      expect(parsed[0].name).toBe('Valid Restaurant');
      expect(parsed[1].status).toBe('error'); // Malformed line
      expect(parsed[2].name).toBe('Another Valid');
    }, CONFIG.TEST_TIMEOUT);

    it('should assign line numbers correctly', async () => {
      const input = 'First Restaurant\nSecond Restaurant\nThird Restaurant';
      const parsed = parseInputText(input);
      
      expect(parsed).toHaveLength(3);
      expect(parsed[0]._lineNumber).toBe(1);
      expect(parsed[1]._lineNumber).toBe(2);
      expect(parsed[2]._lineNumber).toBe(3);
    }, CONFIG.TEST_TIMEOUT);
  });

  describe('3. Data Formatting for API Submission', () => {
    it('should format parsed data for API submission', async () => {
      const parsedItem = {
        name: 'Test Restaurant',
        address: '123 Test St',
        city: 'New York',
        state: 'NY',
        zipcode: '10001',
        tags: ['Italian', 'Pizza'],
        _lineNumber: 1
      };
      
      const formatted = formatItemForSubmission(parsedItem);
      
      expect(formatted).toMatchObject({
        name: 'Test Restaurant',
        type: 'restaurant',
        address: '123 Test St',
        city: 'New York',
        state: 'NY',
        zipcode: '10001',
        tags: ['Italian', 'Pizza'],
        _lineNumber: 1
      });
      
      // Should have default values for missing fields
      expect(formatted.city_id).toBe(1);
      expect(formatted.latitude).toBe(0);
      expect(formatted.longitude).toBe(0);
    }, CONFIG.TEST_TIMEOUT);

    it('should handle missing optional fields', async () => {
      const parsedItem = {
        name: 'Minimal Restaurant',
        _lineNumber: 1
      };
      
      const formatted = formatItemForSubmission(parsedItem);
      
      expect(formatted).toMatchObject({
        name: 'Minimal Restaurant',
        type: 'restaurant',
        address: '',
        city: '',
        state: '',
        zipcode: '',
        tags: [],
        _lineNumber: 1
      });
    }, CONFIG.TEST_TIMEOUT);
  });

  describe('4. Bulk Processing Simulation', () => {
    it('should process multiple restaurants in batch', async () => {
      const input = CONFIG.TEST_RESTAURANTS.map(r => 
        `${r.name}, 123 ${r.cuisine} St, ${r.location}, NY, 10001`
      ).join('\n');
      
      const parsed = parseInputText(input);
      expect(parsed).toHaveLength(CONFIG.TEST_RESTAURANTS.length);
      
      // Simulate processing each item
      const processed = parsed.map(item => {
        const formatted = formatItemForSubmission(item);
        return {
          ...formatted,
          processed: true,
          status: 'ready_for_submission'
        };
      });
      
      expect(processed).toHaveLength(CONFIG.TEST_RESTAURANTS.length);
      expect(processed.every(item => item.processed)).toBe(true);
      expect(processed.every(item => item.status === 'ready_for_submission')).toBe(true);
    }, CONFIG.TEST_TIMEOUT);

    it('should handle mixed success and error scenarios', async () => {
      const input = [
        'Valid Restaurant, 123 Main St, New York, NY, 10001',
        '', // Empty line - should be filtered out
        'Another Valid, 456 Second St, New York, NY, 10002',
        '   ', // Whitespace only - should be filtered out
        'Third Valid, 789 Third St, New York, NY, 10003'
      ].join('\n');
      
      const parsed = parseInputText(input);
      
      // Should only have valid entries
      expect(parsed).toHaveLength(3);
      expect(parsed.every(item => item.name && item.name.trim())).toBe(true);
      
      // Simulate processing with some failures
      const results = parsed.map((item, index) => {
        if (index === 1) {
          // Simulate a processing error for the second item
          return {
            ...item,
            status: 'error',
            message: 'Simulated processing error'
          };
        }
        return {
          ...formatItemForSubmission(item),
          status: 'success'
        };
      });
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      expect(successCount).toBe(2);
      expect(errorCount).toBe(1);
    }, CONFIG.TEST_TIMEOUT);
  });

  describe('5. Integration with Test Data', () => {
    it('should process all test restaurants correctly', async () => {
      const input = CONFIG.TEST_RESTAURANTS.map(restaurant => 
        `${restaurant.name}, 123 ${restaurant.cuisine.replace(/[^a-zA-Z0-9\s]/g, '')} Street, ${restaurant.location}, NY, 10001`
      ).join('\n');
      
      const parsed = parseInputText(input);
      
      expect(parsed).toHaveLength(CONFIG.TEST_RESTAURANTS.length);
      
      // Verify each restaurant was parsed correctly
      CONFIG.TEST_RESTAURANTS.forEach((expected, index) => {
        expect(parsed[index].name).toBe(expected.name);
        expect(parsed[index].city).toBe(expected.location);
        expect(parsed[index].status).toBe('pending');
      });
      
      // Format for submission
      const formatted = parsed.map(formatItemForSubmission);
      
      expect(formatted).toHaveLength(CONFIG.TEST_RESTAURANTS.length);
      expect(formatted.every(item => item.type === 'restaurant')).toBe(true);
      expect(formatted.every(item => item.name && item.name.trim())).toBe(true);
    }, CONFIG.TEST_TIMEOUT);

    it('should maintain data integrity through processing pipeline', async () => {
      const originalData = CONFIG.TEST_RESTAURANTS[0];
      const input = `${originalData.name}, 123 Test Street, ${originalData.location}, NY, 10001, ${originalData.cuisine}`;
      
      // Step 1: Parse
      const parsed = parseInputText(input);
      expect(parsed).toHaveLength(1);
      
      const parsedItem = parsed[0];
      expect(parsedItem.name).toBe(originalData.name);
      expect(parsedItem.city).toBe(originalData.location);
      
      // Step 2: Format for submission
      const formatted = formatItemForSubmission(parsedItem);
      expect(formatted.name).toBe(originalData.name);
      expect(formatted.city).toBe(originalData.location);
      expect(formatted.type).toBe('restaurant');
      
      // Step 3: Verify data integrity
      expect(formatted._lineNumber).toBe(1);
      expect(formatted.address).toBe('123 Test Street');
      expect(formatted.state).toBe('NY');
      expect(formatted.zipcode).toBe('10001');
    }, CONFIG.TEST_TIMEOUT);
  });
}); 