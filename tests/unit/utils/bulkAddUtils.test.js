/**
 * Unit Tests for Bulk Add Utils
 * 
 * Tests the bulk add utility functions, particularly the parser for semicolon-delimited format.
 */
import { parseInputText } from '../../../src/utils/bulkAddUtils';

describe('bulkAddUtils', () => {
  describe('parseInputText', () => {
    it('should parse semicolon-delimited input with hashtags', () => {
      // Sample input in the semicolon-delimited format
      const sampleInput = 
        'Maison Passerelle; restaurant; New York; French-Diaspora Fusion\n' +
        'Bar Bianchi; restaurant; New York; Milanese\n' +
        'JR & Son; restaurant; New York; Italian-American\n' +
        'Papa d\'Amour; restaurant; New York; French-Asian Bakery\n' +
        'Figure Eight; restaurant; New York; Chinese-American';
      
      // Parse the input
      const parsedItems = parseInputText(sampleInput);
      
      // Verify the results
      expect(parsedItems).toHaveLength(5);
      
      // Check the first item
      expect(parsedItems[0]).toMatchObject({
        name: 'Maison Passerelle',
        type: 'restaurant',
        city: 'New York',
        tags: ['French-Diaspora Fusion'],
        status: 'pending'
      });
      
      // Check the second item
      expect(parsedItems[1]).toMatchObject({
        name: 'Bar Bianchi',
        type: 'restaurant',
        city: 'New York',
        tags: ['Milanese'],
        status: 'pending'
      });
      
      // Check the third item
      expect(parsedItems[2]).toMatchObject({
        name: 'JR & Son',
        type: 'restaurant',
        city: 'New York',
        tags: ['Italian-American'],
        status: 'pending'
      });
      
      // Check the fourth item
      expect(parsedItems[3]).toMatchObject({
        name: 'Papa d\'Amour',
        type: 'restaurant',
        city: 'New York',
        tags: ['French-Asian Bakery'],
        status: 'pending'
      });
      
      // Check the fifth item
      expect(parsedItems[4]).toMatchObject({
        name: 'Figure Eight',
        type: 'restaurant',
        city: 'New York',
        tags: ['Chinese-American'],
        status: 'pending'
      });
    });
    
    it('should handle empty input', () => {
      expect(parseInputText('')).toEqual([]);
      expect(parseInputText(null)).toEqual([]);
      expect(parseInputText(undefined)).toEqual([]);
    });
    
    it('should handle malformed input', () => {
      const malformedInput = 'Incomplete Entry;';
      const parsedItems = parseInputText(malformedInput);
      
      expect(parsedItems).toHaveLength(1);
      expect(parsedItems[0]).toMatchObject({
        name: 'Incomplete Entry',
        status: 'pending'
      });
    });
  });
});
