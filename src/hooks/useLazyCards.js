// src/hooks/useLazyCards.js
import { useEffect, useState, useCallback, useRef } from 'react'; // Added useRef
import { useInView } from 'react-intersection-observer';

/**
 * Hook to progressively load items for display, typically used with infinite scroll.
 * @param {Array} items - The full list of items to paginate/lazy load.
 * @param {number} [batchSize=12] - The number of items to load in each batch.
 * @returns {{visibleItems: Array, loadMoreRef: Function, hasMore: boolean}}
 */
export const useLazyCards = (items = [], batchSize = 12) => { // Default items to empty array
  const [visibleItems, setVisibleItems] = useState([]);
  // Ref to track if the initial load has happened for the current items array
  const initialLoadDone = useRef(false);

  // Intersection observer hook
  const [ref, inView] = useInView({
    threshold: 0.1, // Trigger when 10% of the element is visible
    triggerOnce: false // Keep observing even after becoming visible once
  });

  // Function to load the next batch of items
  // Wrapped in useCallback to stabilize its reference
  const loadMore = useCallback(() => {
    // Ensure items is an array before accessing length
    const totalItems = Array.isArray(items) ? items.length : 0;
    if (visibleItems.length < totalItems) {
      const nextBatch = items.slice(
        visibleItems.length,
        visibleItems.length + batchSize
      );
      setVisibleItems(prev => [...prev, ...nextBatch]);
      console.log(`[useLazyCards] Loaded ${nextBatch.length} more items. Total visible: ${visibleItems.length + nextBatch.length}`);
    } else {
         console.log('[useLazyCards] No more items to load.');
    }
  }, [items, visibleItems.length, batchSize]); // Dependencies: items array, current count, batch size

  // Effect for Initial Load and Resetting when items array changes
  useEffect(() => {
     console.log('[useLazyCards] Items array changed or initial mount.');
     // Reset visibility and initial load flag when the underlying items array changes reference
     setVisibleItems(items.slice(0, batchSize));
     initialLoadDone.current = true; // Mark initial load done for this `items` array
     console.log(`[useLazyCards] Initial load/reset done. Visible: ${items.slice(0, batchSize).length}`);
  // This effect runs when the `items` array reference changes or batchSize changes.
  }, [items, batchSize]);

  // Effect to Load More when the trigger element comes into view
  useEffect(() => {
    // Only load more if the trigger is in view AND there are more items potentially loadable
    const hasMoreItems = Array.isArray(items) && visibleItems.length < items.length;
    if (inView && hasMoreItems) {
       console.log('[useLazyCards] Trigger in view, loading more...');
      loadMore();
    }
  // Dependencies: inView status, the loadMore function itself, and checks for more items
  }, [inView, loadMore, items, visibleItems.length]);


  // Determine if there are more items left to load from the original array
  const hasMore = Array.isArray(items) && visibleItems.length < items.length;

  return {
       visibleItems, // The currently visible subset of items
       loadMoreRef: ref, // Ref to attach to the trigger element
       hasMore // Boolean indicating if more items can be loaded
    };
};