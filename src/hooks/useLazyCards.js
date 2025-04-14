/* src/hooks/useLazyCards.js */
/* REMOVED: All TypeScript syntax */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

// REMOVED: interface LazyCards<T> { ... }

export const useLazyCards = (items = [], batchSize = 12) => { // REMOVED: Generic <T = any>, return type hint
    const [visibleItems, setVisibleItems] = useState([]); // REMOVED: <T[]>
    const [isLoadingInitial, setIsLoadingInitial] = useState(true); // REMOVED: <boolean>
    const itemsRef = useRef(items); // REMOVED: <T[]>
    const prevItemsRef = useRef(null); // REMOVED: <T[] | null>

    const { ref, inView } = useInView({
        threshold: 0.1, // Trigger when 10% visible
        triggerOnce: false, // Keep triggering as user scrolls up/down
    });

    // Function to load the next batch of items
    const loadMore = useCallback(() => {
        const currentItems = itemsRef.current || []; // Ensure it's an array
        setVisibleItems(prev => {
            // Check if all items are already visible
            if (prev.length >= currentItems.length) {
                return prev;
            }
            // Slice the next batch from the full item list
            const nextBatch = currentItems.slice(prev.length, prev.length + batchSize);
            return [...prev, ...nextBatch];
        });
    }, [batchSize]); // Dependency only on batchSize

    // Effect to reset visible items when the input `items` array changes reference
    useEffect(() => {
        // Only reset if the items array *reference* is different from the previous one
        if (items !== prevItemsRef.current) {
            setIsLoadingInitial(true); // Indicate initial loading/reset
            const currentItems = items || []; // Ensure items is an array
            itemsRef.current = currentItems;
            const initialBatch = currentItems.slice(0, batchSize);
            setVisibleItems(initialBatch);
            setIsLoadingInitial(false); // Done with initial load/reset
            prevItemsRef.current = items; // Store the current reference for next comparison
        }
    }, [items, batchSize]); // Dependencies: run when items or batchSize changes

    // Effect to load more items when the ref element comes into view
    useEffect(() => {
        const currentItems = itemsRef.current || [];
        const hasMoreItems = visibleItems.length < currentItems.length;

        // Load more only if in view, more items exist, and initial load is complete
        if (inView && hasMoreItems && !isLoadingInitial) {
            loadMore();
        }
    }, [inView, loadMore, visibleItems.length, isLoadingInitial]); // Dependencies

    // Calculate if there are more items to load
    const hasMore = visibleItems.length < (itemsRef.current?.length || 0); // Check length safely

    return {
        visibleItems,
        loadMoreRef: ref, // The ref to attach to the trigger element
        hasMore,
        isLoadingInitial, // State indicating initial load/reset
    };
};