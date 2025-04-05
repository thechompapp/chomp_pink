// src/pages/Home/Results.jsx
import React, { memo, useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import DishCard from '@/components/UI/DishCard';
import RestaurantCard from '@/components/UI/RestaurantCard';
import ListCard from '@/pages/Lists/ListCard'; // <<< CORRECTED PATH
import useUIStateStore from '@/stores/useUIStateStore.js';
import { ChevronDown, ChevronUp } from 'lucide-react';
// import Button from '@/components/Button'; // Button not used here currently
import apiClient from '@/utils/apiClient';
import ErrorMessage from '@/components/UI/ErrorMessage';
import RestaurantCardSkeleton from '@/components/UI/RestaurantCardSkeleton';
import DishCardSkeleton from '@/components/UI/DishCardSkeleton';
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton'; // <<< CORRECTED PATH

// Standard fetch function (remains the same)
const fetchAllTrendingData = async () => { /* ... */ };

// Skeleton mapping (ensure ListCardSkeleton key is correct if path changes name)
const skeletonMap = {
    dishes: DishCardSkeleton,
    restaurants: RestaurantCardSkeleton,
    lists: ListCardSkeleton, // Key should match sectionKey used below
};

// Selectors (remain the same)
const useCityId = () => useUIStateStore(state => state.cityId);
const useNeighborhoodId = () => useUIStateStore(state => state.neighborhoodId);
const useHashtags = () => useUIStateStore(state => state.hashtags || []);

const Results = memo(() => {
    // Hooks and state (remain the same)
    const cityId = useCityId();
    const neighborhoodId = useNeighborhoodId();
    const hashtags = useHashtags();
    const { data: trendingData = { restaurants: [], dishes: [], lists: [] }, isLoading, isError, error, refetch } = useQuery({ queryKey: ['trendingData'], queryFn: fetchAllTrendingData, staleTime: 5 * 60 * 1000 });
    const [expandedSections, setExpandedSections] = useState({ dishes: true, restaurants: true, lists: true });

    // Callbacks and Memos (remain the same, check dependencies)
    const filterItems = useCallback((items) => { /* ... */ }, [cityId, neighborhoodId, hashtags]);
    const filteredRestaurants = useMemo(() => filterItems(trendingData.restaurants), [trendingData.restaurants, filterItems]);
    const filteredDishes = useMemo(() => filterItems(trendingData.dishes), [trendingData.dishes, filterItems]);
    const filteredLists = useMemo(() => filterItems(trendingData.lists), [trendingData.lists, filterItems]);
    const toggleSection = useCallback((section) => { /* ... */ }, []);

    // Render section callback (ensure Component for lists is correct)
    const renderSection = useCallback((title, items, Component, sectionKey) => {
        // ... (logic for loading, empty, rendering items)
        // Ensure correct SkeletonComponent is used based on sectionKey
        const SkeletonComponent = skeletonMap[sectionKey];
        // ...
         if (!isLoading && safeItems.length > 0) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 place-items-start">
                    {displayItems.map(item => {
                        if (!item || typeof item.id === 'undefined' || item.id === null) return null;
                        let props = { ...item };
                        if (Component === DishCard) props.restaurant = item.restaurant_name || item.restaurant;
                        // Use ListCard component imported from the correct path
                        if (sectionKey === "lists" && Component === ListCard) props.is_following = item.is_following ?? false;
                        return <Component key={`${sectionKey}-${item.id}`} {...props} />;
                    })}
                </div>
            );
         }
         return null; // Or return loading/empty states
    }, [expandedSections, isLoading, cityId, neighborhoodId, hashtags, toggleSection]); // Ensure dependencies are minimal and stable

    // Render logic (remains the same)
    // ...

    return (
        <div className="mt-4">
            {/* ... No results message ... */}
            {/* Pass ListCard (correctly imported) to renderSection for 'lists' */}
            {renderSection('Trending Restaurants', filteredRestaurants, RestaurantCard, 'restaurants')}
            {renderSection('Trending Dishes', filteredDishes, DishCard, 'dishes')}
            {renderSection('Popular Lists', filteredLists, ListCard, 'lists')}
            {/* ... Error display ... */}
        </div>
    );
});

export default Results;