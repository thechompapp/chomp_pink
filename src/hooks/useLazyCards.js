/* src/hooks/useLazyCards.js */
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';

/**
 * Custom hook for lazy loading cards/items in batches as the user scrolls
 * 
 * @param {Array} items - The full array of items to be lazily loaded
 * @param {number} [batchSize=12] - Number of items to load in each batch
 * @param {Object} [options] - Additional configuration options
 * @param {number} [options.threshold=0.1] - IntersectionObserver threshold (0-1)
 * @param {boolean} [options.resetOnItemsChange=true] - Whether to reset when items change
 * @param {number} [options.initialBatchMultiplier=1] - Multiplier for initial batch size
 * @returns {Object} Lazy loading state and controls
 */
export const useLazyCards = (items = [], batchSize = 12, options = {}) => {
    const {
        threshold = 0.1,
        resetOnItemsChange = true,
        initialBatchMultiplier = 1
    } = options;
    
    // State for visible items and loading status
    const [visibleItems, setVisibleItems] = useState([]);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    
    // Refs to track items and prevent unnecessary re-renders
    const itemsRef = useRef(items);
    const itemsLengthRef = useRef(items.length);
    const visibleItemsLengthRef = useRef(0);
    
    // Setup intersection observer with configurable threshold
    const { ref, inView } = useInView({
        threshold,
        triggerOnce: false,
        rootMargin: '100px', // Load slightly before element is in view for smoother experience
    });

    /**
     * Load the next batch of items
     */
    const loadMore = useCallback(() => {
        // Prevent multiple simultaneous load operations
        if (isLoadingMore) return;
        
        setIsLoadingMore(true);
        
        // Use setTimeout to avoid blocking the main thread
        // This improves perceived performance especially with large data sets
        setTimeout(() => {
            setVisibleItems(prev => {
                const currentItems = itemsRef.current || [];
                
                // Check if all items are already visible
                if (prev.length >= currentItems.length) {
                    setIsLoadingMore(false);
                    return prev;
                }
                
                // Slice the next batch from the full item list
                const nextBatch = currentItems.slice(prev.length, prev.length + batchSize);
                const newVisibleItems = [...prev, ...nextBatch];
                
                // Update ref for dependency checking
                visibleItemsLengthRef.current = newVisibleItems.length;
                setIsLoadingMore(false);
                
                return newVisibleItems;
            });
        }, 0);
    }, [batchSize, isLoadingMore]);

    /**
     * Reset the visible items (used when items array changes)
     */
    const resetItems = useCallback(() => {
        setIsLoadingInitial(true);
        
        // Update refs
        itemsRef.current = items || [];
        itemsLengthRef.current = items?.length || 0;
        
        // Calculate initial batch size (can be larger than subsequent batches)
        const initialBatchSize = batchSize * initialBatchMultiplier;
        const initialBatch = items?.slice(0, initialBatchSize) || [];
        
        setVisibleItems(initialBatch);
        visibleItemsLengthRef.current = initialBatch.length;
        setIsLoadingInitial(false);
    }, [items, batchSize, initialBatchMultiplier]);

    // Effect to reset visible items when the input items array changes
    useEffect(() => {
        // Only reset if resetOnItemsChange is true and items have changed
        if (resetOnItemsChange && (
            items !== itemsRef.current || 
            items?.length !== itemsLengthRef.current
        )) {
            resetItems();
        }
    }, [items, resetItems, resetOnItemsChange]);

    // Effect to load more items when the ref element comes into view
    useEffect(() => {
        const currentItemsLength = itemsLengthRef.current;
        const visibleItemsLength = visibleItemsLengthRef.current;
        const hasMoreItems = visibleItemsLength < currentItemsLength;

        // Load more only if in view, more items exist, and not currently loading
        if (inView && hasMoreItems && !isLoadingInitial && !isLoadingMore) {
            loadMore();
        }
    }, [inView, loadMore, isLoadingInitial, isLoadingMore]);

    // Memoize the return value to prevent unnecessary re-renders
    return useMemo(() => ({
        visibleItems,
        loadMoreRef: ref,
        hasMore: visibleItems.length < (itemsRef.current?.length || 0),
        isLoadingInitial,
        isLoadingMore,
        loadMore, // Expose loadMore for manual triggering if needed
        resetItems // Expose resetItems for manual reset if needed
    }), [visibleItems, ref, isLoadingInitial, isLoadingMore, loadMore, resetItems]);
};