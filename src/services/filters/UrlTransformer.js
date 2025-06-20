/**
 * UrlTransformer.js - URL Parameter Handling Only
 * 
 * Single Responsibility: Transform between filters and URL parameters
 * - Clean URL generation
 * - URL parameter parsing
 * - Simple, focused transformations
 */

import { logDebug, logError } from '@/utils/logger';
import { apiTransformer } from './ApiTransformer';

/**
 * UrlTransformer - Clean URL parameter handling
 */
class UrlTransformer {
  /**
   * Transform filters to URL search parameters
   */
  toUrlParams(filters) {
    const params = new URLSearchParams();
    
    try {
      // First convert to API format, then to URL
      const apiFormatted = apiTransformer.toApiFormat(filters);
      
      Object.entries(apiFormatted).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, String(value));
        }
      });
      
      logDebug('[UrlTransformer] Created URL params:', params.toString());
      return params;
    } catch (error) {
      logError('[UrlTransformer] Error creating URL params:', error);
      return new URLSearchParams();
    }
  }

  /**
   * Transform URL parameters back to internal filter format
   */
  fromUrlParams(urlParams) {
    try {
      const params = typeof urlParams === 'string' 
        ? new URLSearchParams(urlParams) 
        : urlParams;
      
      const apiData = {};
      
      // Parse URL parameters to API format
      for (const [key, value] of params.entries()) {
        if (value.includes(',')) {
          // Handle comma-separated arrays
          apiData[key] = value.split(',').filter(Boolean);
        } else {
          apiData[key] = this._parseValue(value);
        }
      }
      
      // Convert API format to internal format
      const filters = apiTransformer.fromApiFormat(apiData);
      
      logDebug('[UrlTransformer] Parsed URL params to filters:', filters);
      return filters;
    } catch (error) {
      logError('[UrlTransformer] Error parsing URL params:', error);
      return {};
    }
  }

  /**
   * Create a shareable URL with current filters
   */
  createShareableUrl(filters, baseUrl = window.location.origin + window.location.pathname) {
    try {
      const params = this.toUrlParams(filters);
      const url = new URL(baseUrl);
      url.search = params.toString();
      return url.toString();
    } catch (error) {
      logError('[UrlTransformer] Error creating shareable URL:', error);
      return baseUrl;
    }
  }

  /**
   * Parse string value to appropriate JavaScript type
   * Handles: numbers, booleans, null/undefined, and strings
   */
  _parseValue(value) {
    // Handle empty string
    if (value === '') {
      return null;
    }
    
    // Handle explicit null/undefined
    if (value === 'null' || value === 'undefined') {
      return null;
    }
    
    // Handle booleans
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Handle numbers (integers and decimals, positive and negative)
    if (/^-?\d+\.?\d*$/.test(value) && !isNaN(Number(value))) {
      const num = Number(value);
      return Number.isInteger(num) ? parseInt(value, 10) : parseFloat(value);
    }
    
    // Return as string for everything else
    return value;
  }
}

// Export singleton instance
export const urlTransformer = new UrlTransformer();
export default urlTransformer; 