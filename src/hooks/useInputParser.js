/**
 * useInputParser Hook
 * 
 * Handles parsing raw input text into structured data for bulk add operations.
 * Leverages the bulkAddUtils.js utility functions for parsing logic.
 */
import { useState, useCallback } from 'react';
import { parseInputText } from '@/utils/generalUtils';
import { logDebug, logError, logInfo } from '@/utils/logger';

/**
 * Hook for parsing raw input text into structured data
 * @returns {Object} - State and functions for input parsing
 */
const useInputParser = () => {
  // State for parsed items and errors
  const [parsedItems, setParsedItems] = useState([]);
  const [parseError, setParseError] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  
  /**
   * Parse raw input text into structured items
   * @param {string} rawText - Raw input text
   * @returns {Array} - Array of parsed items
   */
  const parseInput = useCallback((rawText) => {
    if (!rawText || !rawText.trim()) {
      setParseError('Please enter some data to process');
      setParsedItems([]);
      return [];
    }
    
    try {
      setIsParsing(true);
      setParseError(null);
      
      logInfo(`[useInputParser] Parsing input text: ${rawText.length} characters`);
      
      // Use the parseInputText utility from bulkAddUtils
      const items = parseInputText(rawText);
      
      if (!items || items.length === 0) {
        setParseError('No valid items found in input');
        setParsedItems([]);
        return [];
      }
      
      logDebug(`[useInputParser] Successfully parsed ${items.length} items`);
      
      // Update state with parsed items
      setParsedItems(items);
      
      return items;
    } catch (error) {
      logError('[useInputParser] Error parsing input:', error);
      setParseError(`Error parsing input: ${error.message}`);
      setParsedItems([]);
      return [];
    } finally {
      setIsParsing(false);
    }
  }, []);
  
  /**
   * Reset the parser state
   */
  const resetParser = useCallback(() => {
    setParsedItems([]);
    setParseError(null);
    setIsParsing(false);
  }, []);
  
  return {
    parsedItems,
    parseError,
    isParsing,
    parseInput,
    resetParser
  };
};

export default useInputParser;
