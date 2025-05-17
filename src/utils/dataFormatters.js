/**
 * Utility functions for data formatting and validation
 */

/**
 * Format a phone number to a standard format
 * @param {string} phone - The phone number to format
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // Return original if we can't format it
  return phone;
};

/**
 * Format a website URL to ensure it has a protocol
 * @param {string} url - The URL to format
 * @returns {string} - Formatted URL
 */
export const formatWebsiteUrl = (url) => {
  if (!url) return '';
  
  // Trim whitespace
  url = url.trim();
  
  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  
  return url;
};

/**
 * Format an address for display
 * @param {Object} address - Address object
 * @param {string} address.street - Street address
 * @param {string} address.city - City
 * @param {string} address.state - State
 * @param {string} address.zip - ZIP code
 * @returns {string} - Formatted address
 */
export const formatAddress = (address) => {
  if (!address) return '';
  
  const { street, city, state, zip } = address;
  const parts = [];
  
  if (street) parts.push(street);
  if (city && state) parts.push(`${city}, ${state}`);
  else if (city) parts.push(city);
  else if (state) parts.push(state);
  if (zip) parts.push(zip);
  
  return parts.join(', ');
};

/**
 * Format a price for display
 * @param {number|string} price - The price to format
 * @param {string} [currency='USD'] - Currency code
 * @returns {string} - Formatted price
 */
export const formatPrice = (price, currency = 'USD') => {
  if (price === null || price === undefined) return '';
  
  // Convert to number if it's a string
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Format using Intl.NumberFormat
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericPrice);
};

/**
 * Truncate text to a specified length
 * @param {string} text - Text to truncate
 * @param {number} [maxLength=100] - Maximum length
 * @param {string} [ellipsis='...'] - Ellipsis string
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 100, ellipsis = '...') => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
};

/**
 * Validate an email address
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether the email is valid
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate a phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Whether the phone number is valid
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check length (10 digits for US numbers, or 11 if starting with 1)
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith('1'));
};

/**
 * Validate a URL
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
export const isValidUrl = (url) => {
  if (!url) return false;
  
  try {
    // Use URL constructor for validation
    new URL(formatWebsiteUrl(url));
    return true;
  } catch (e) {
    return false;
  }
};
