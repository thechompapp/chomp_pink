/* src/utils/formatting.js */
/* Patched: Add and export formatRelativeDate and formatDateTime functions */

/**
 * Converts a string to Title Case.
 * Example: "hello world" -> "Hello World"
 * @param {string | null | undefined} str The string to convert.
 * @returns {string} The title-cased string or an empty string if input is invalid.
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/([-_ ]|^)([a-z])/g, (match, separator, char) => (separator || '') + char.toUpperCase());
}

// --- ADDED Date Formatting Functions ---

// Define time units for relative formatting
const units = {
year: 24 * 60 * 60 * 1000 * 365,
month: 24 * 60 * 60 * 1000 * 30, // Approximate
week: 24 * 60 * 60 * 1000 * 7,
day: 24 * 60 * 60 * 1000,
hour: 60 * 60 * 1000,
minute: 60 * 1000,
second: 1000,
};

// Intl.RelativeTimeFormat instance (cached for performance)
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/**
* Formats a date string or Date object into a relative time string (e.g., "2 days ago").
* @param {string | Date | null | undefined} dateInput The date to format.
* @returns {string} The relative time string or a fallback message.
*/
export function formatRelativeDate(dateInput) {
if (!dateInput) return 'Date unknown';

try {
  const date = new Date(dateInput);
  // Check if the date is valid
  if (isNaN(date.getTime())) {
      // console.warn('[formatRelativeDate] Invalid date input:', dateInput);
      return typeof dateInput === 'string' ? dateInput : 'Invalid date'; // Return original string if possible
  }

  const elapsed = date.getTime() - new Date().getTime(); // Difference in milliseconds

  // Find the appropriate unit
  for (const unitName in units) {
    if (Math.abs(elapsed) > units[unitName] || unitName === 'second') {
      const value = Math.round(elapsed / units[unitName]);
      return rtf.format(value, unitName);
    }
  }
  // Should not happen if 'second' is the last unit, but as a fallback:
  return 'Just now';
} catch (error) {
  console.error('[formatRelativeDate] Error formatting date:', dateInput, error);
  return typeof dateInput === 'string' ? dateInput : 'Formatting error'; // Fallback
}
}


// Intl.DateTimeFormat instance for full date/time (cached)
const dtf = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true, // Use AM/PM
});

/**
* Formats a date string or Date object into a standard date/time string (e.g., "Apr 23, 2025, 9:00 PM").
* @param {string | Date | null | undefined} dateInput The date to format.
* @returns {string} The formatted date/time string or a fallback.
*/
export function formatDateTime(dateInput) {
  if (!dateInput) return 'Date unknown';
   try {
      const date = new Date(dateInput);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
           // console.warn('[formatDateTime] Invalid date input:', dateInput);
           return typeof dateInput === 'string' ? dateInput : 'Invalid date'; // Return original string if possible
      }
      return dtf.format(date);
   } catch (error) {
      console.error('[formatDateTime] Error formatting date:', dateInput, error);
      return typeof dateInput === 'string' ? dateInput : 'Formatting error'; // Fallback
   }
}

// Add other formatting functions here if needed