/**
 * useIntersectionObserver.js - Intersection Observer Hook
 * 
 * Phase 3: Advanced Optimizations
 * - Efficient intersection detection for lazy loading
 * - Performance-optimized with cleanup
 * - Configurable options for different use cases
 */

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for Intersection Observer API
 * @param {Object} options - Intersection Observer options
 * @param {number} options.threshold - Intersection threshold (0-1)
 * @param {string} options.rootMargin - Root margin for intersection detection
 * @param {boolean} options.triggerOnce - Whether to trigger only once
 * @param {Element} options.root - Root element for intersection context
 * @returns {Array} - [ref, isIntersecting, entry]
 */
export const useIntersectionObserver = (options = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = false,
    root = null
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);
  const targetRef = useRef(null);
  const observerRef = useRef(null);

  const observerCallback = useCallback((entries) => {
    const [observerEntry] = entries;
    
    setEntry(observerEntry);
    setIsIntersecting(observerEntry.isIntersecting);

    // If triggerOnce is true and element is intersecting, disconnect observer
    if (triggerOnce && observerEntry.isIntersecting && observerRef.current) {
      observerRef.current.disconnect();
    }
  }, [triggerOnce]);

  useEffect(() => {
    const target = targetRef.current;
    
    if (!target) return;

    // Create intersection observer
    observerRef.current = new IntersectionObserver(observerCallback, {
      threshold,
      rootMargin,
      root
    });

    // Start observing
    observerRef.current.observe(target);

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [observerCallback, threshold, rootMargin, root]);

  return [targetRef, isIntersecting, entry];
};

export default useIntersectionObserver; 