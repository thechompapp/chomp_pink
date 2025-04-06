// src/hooks/useLazyCards.js
import { useEffect, useState, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

/**
 * Hook to progressively load items for display, typically used with infinite scroll.
 * @param {Array} items - The full list of items to paginate/lazy load.
 * @param {number} [batchSize=12] - The number of items to load in each batch.
 * @returns {{visibleItems: Array, loadMoreRef: Function, hasMore: boolean}}
 */
export const useLazyCards = (items = [], batchSize = 12) => {
  const [visibleItems, setVisibleItems] = useState([]);
  // Ref to track if the initial load has happened for the current items array reference
  const initialLoadDone = useRef(false);
  // Ref to track the specific `items` array reference the hook was initialized with or reset to
  const currentItemsRef = useRef(items);

  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: false, // Continue triggering as user scrolls up/down
  });

  // Function to load the next batch
  const loadMore = useCallback(() => {
    // Always refer to the latest `items` array via ref in case it changed
    // but the effect referencing loadMore hasn't re-run yet.
    const currentItems = currentItemsRef.current || [];
    const totalItems = currentItems.length;

    setVisibleItems(prevVisibleItems => {
        if (prevVisibleItems.length >= totalItems) {
            // Removed console log
            return prevVisibleItems; // No more items to load
        }
        const nextBatch = currentItems.slice(
            prevVisibleItems.length,
            prevVisibleItems.length + batchSize
        );
        // Removed console log
        return [...prevVisibleItems, ...nextBatch];
    });
  }, [batchSize]); // Only depends on batchSize

  // Effect for Initial Load and Resetting when `items` array *reference* changes
  useEffect(() => {
    // Update the ref tracking the current items array
    currentItemsRef.current = items || [];
    // Reset visible items to the first batch of the new array
    setVisibleItems(currentItemsRef.current.slice(0, batchSize));
    initialLoadDone.current = true; // Mark initial load done for this `items` array reference
    // Removed console logs
  }, [items, batchSize]); // Effect runs if `items` reference or `batchSize` changes

  // Effect to Load More when the trigger element is in view
  useEffect(() => {
    const currentItems = currentItemsRef.current || [];
    const hasMoreItems = visibleItems.length < currentItems.length;

    // Load more only if trigger is in view AND there are more items available
    if (inView && hasMoreItems) {
      // Removed console log
      loadMore();
    }
  }, [inView, loadMore, visibleItems.length]); // Depend on inView, loadMore, and visible count

  // Determine if there are more items left based on the current `items` ref
  const hasMore = visibleItems.length < (currentItemsRef.current || []).length;

  return {
    visibleItems,
    loadMoreRef: ref,
    hasMore,
  };
};