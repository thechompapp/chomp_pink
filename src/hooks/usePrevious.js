/* src/hooks/usePrevious.js */
import { useRef, useEffect } from 'react';

/**
 * Custom hook to track the previous value of a state or prop.
 * @param {*} value - The value to track.
 * @returns {*} The previous value.
 */
export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]); // Only re-run if value changes
  return ref.current; // Return previous value (happens before update in useEffect)
}

export default usePrevious; // Default export can also be useful