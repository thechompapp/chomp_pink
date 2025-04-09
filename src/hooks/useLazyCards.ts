/* src/hooks/useLazyCards.ts */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

interface LazyCards<T> {
    visibleItems: T[];
    loadMoreRef: (node: HTMLElement | null) => void;
    hasMore: boolean;
    isLoadingInitial: boolean;
}

export const useLazyCards = <T = any>(
    items: T[] = [],
    batchSize = 12
): LazyCards<T> => {
    const [visibleItems, setVisibleItems] = useState<T[]>([]);
    const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
    const itemsRef = useRef<T[]>(items);
    const prevItemsRef = useRef<T[] | null>(null); // Track previous items for comparison

    const { ref, inView } = useInView({
        threshold: 0.1,
        triggerOnce: false,
    });

    const loadMore = useCallback(() => {
        const currentItems = itemsRef.current;
        setVisibleItems(prev => {
            if (prev.length >= currentItems.length) {
                return prev;
            }
            const nextBatch = currentItems.slice(prev.length, prev.length + batchSize);
            return [...prev, ...nextBatch];
        });
    }, [batchSize]);

    useEffect(() => {
        // Only reset if items array reference changes
        if (items !== prevItemsRef.current) {
            setIsLoadingInitial(true);
            itemsRef.current = items || [];
            const initialBatch = itemsRef.current.slice(0, batchSize);
            setVisibleItems(initialBatch);
            setIsLoadingInitial(false);
            prevItemsRef.current = items;
        }
    }, [items, batchSize]);

    useEffect(() => {
        const currentItems = itemsRef.current;
        const hasMoreItems = visibleItems.length < currentItems.length;

        if (inView && hasMoreItems && !isLoadingInitial) {
            loadMore();
        }
    }, [inView, loadMore, visibleItems.length, isLoadingInitial]);

    const hasMore = visibleItems.length < itemsRef.current.length;

    return {
        visibleItems,
        loadMoreRef: ref,
        hasMore,
        isLoadingInitial,
    };
};