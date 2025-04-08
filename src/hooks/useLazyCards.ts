/* src/hooks/useLazyCards.ts */
import { useEffect, useState, useCallback, useRef, RefCallback } from 'react'; // Added RefCallback
import { useInView } from 'react-intersection-observer';

// Interface for the hook's return value
interface LazyCards<T> {
    visibleItems: T[];
    loadMoreRef: RefCallback<any>; // Type from react-intersection-observer
    hasMore: boolean;
    isLoadingInitial: boolean; // Flag for initial load state
}

/**
 * Hook to progressively load items for display, typically used with infinite scroll.
 * @param {T[]} items - The full list of items to paginate/lazy load.
 * @param {number} [batchSize=12] - The number of items to load in each batch.
 * @returns {LazyCards<T>}
 */
export const useLazyCards = <T = any>( // Generic type T for items
    items: T[] = [], // Default to empty array
    batchSize = 12
): LazyCards<T> => {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true); // Track initial load

  // Ref to track the specific `items` array reference the hook was initialized with or reset to
  const currentItemsRef = useRef<T[]>(items);

  // Update the ref whenever the items array reference changes
  useEffect(() => {
      currentItemsRef.current = items || [];
  }, [items]);

  const { ref, inView } = useInView({
    threshold: 0.1, // How much of the trigger element is visible
    triggerOnce: false, // Keep observing
    // rootMargin: '200px 0px', // Optional: Load items earlier/later
  });

  // Function to load the next batch
  const loadMore = useCallback(() => {
    // Always refer to the latest `items` array via ref
    const currentItems = currentItemsRef.current; // No || [] needed due to init
    const totalItems = currentItems.length;

    setVisibleItems(prevVisibleItems => {
        if (prevVisibleItems.length >= totalItems) {
            return prevVisibleItems; // No more items
        }
        const nextBatch = currentItems.slice(
            prevVisibleItems.length,
            prevVisibleItems.length + batchSize
        );
        return [...prevVisibleItems, ...nextBatch];
    });
  }, [batchSize]); // Only depends on batchSize

  // Effect for Initial Load and Resetting when `items` array *reference* changes
  useEffect(() => {
    setIsLoadingInitial(true); // Set loading true on items change
    // Reset visible items to the first batch of the new array
    const newInitialItems = (items || []).slice(0, batchSize);
    setVisibleItems(newInitialItems);
    setIsLoadingInitial(false); // Set loading false after initial batch is set
    // console.log('[useLazyCards] Reset/Initial load. Visible items:', newInitialItems.length);
  }, [items, batchSize]); // Effect runs if `items` reference or `batchSize` changes

  // Effect to Load More when the trigger element is in view AND not initial loading
  useEffect(() => {
    const currentItems = currentItemsRef.current;
    const hasMoreItems = visibleItems.length < currentItems.length;

    // Load more only if trigger is in view, more items exist, AND initial load is done
    if (inView && hasMoreItems && !isLoadingInitial) {
      // console.log('[useLazyCards] Trigger in view, loading more...');
      loadMore();
    }
  }, [inView, loadMore, visibleItems.length, isLoadingInitial]); // Add isLoadingInitial dependency

  // Determine if there are more items left based on the current `items` ref
  const hasMore = visibleItems.length < currentItemsRef.current.length;

  return {
    visibleItems,
    loadMoreRef: ref, // Return the ref callback for the trigger element
    hasMore,
    isLoadingInitial, // Expose initial loading state
  };
};

// Default export not needed if named export is preferred
// export default useLazyCards;