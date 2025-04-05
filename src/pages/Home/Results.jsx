import React, { memo, useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import DishCard from '@/components/UI/DishCard';
import RestaurantCard from '@/components/UI/RestaurantCard';
import ListCard from '@/pages/Lists/ListCard';
import useUIStateStore from '@/stores/useUIStateStore.js';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Button from '@/components/Button';
import apiClient from '@/utils/apiClient';
import ErrorMessage from '@/components/UI/ErrorMessage';
import RestaurantCardSkeleton from '@/components/UI/RestaurantCardSkeleton';
import DishCardSkeleton from '@/components/UI/DishCardSkeleton';
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton';

const fetchAllTrendingData = async () => {
    try {
        const [restaurants, dishes, lists] = await Promise.all([
            apiClient('/api/trending/restaurants', 'Home Results Restaurants'),
            apiClient('/api/trending/dishes', 'Home Results Dishes'),
            apiClient('/api/trending/lists', 'Home Results Popular Lists'),
        ]);

        const formatItems = (items) => (Array.isArray(items) ? items : []).map(item => ({
            ...item,
            tags: Array.isArray(item.tags) ? item.tags : [],
        }));
        const formatLists = (lists) => (Array.isArray(lists) ? lists : []).map(list => ({
            ...list,
            tags: Array.isArray(list.tags) ? list.tags : [],
            is_following: list.is_following ?? false,
            created_by_user: list.created_by_user ?? false,
        }));

        return {
            restaurants: formatItems(restaurants),
            dishes: formatItems(dishes),
            lists: formatLists(lists),
        };
    } catch (error) {
        console.error('[fetchAllTrendingData] Error fetching trending data:', error);
        throw new Error(error.message || 'Failed to load trending data');
    }
};

const skeletonMap = {
    dishes: DishCardSkeleton,
    restaurants: RestaurantCardSkeleton,
    lists: ListCardSkeleton,
};

// Individual selectors to prevent reference equality issues
const useCityId = () => useUIStateStore(state => state.cityId);
const useNeighborhoodId = () => useUIStateStore(state => state.neighborhoodId);
const useHashtags = () => useUIStateStore(state => state.hashtags || []);

const Results = memo(() => {
    // Use individual selectors instead of one object selector
    const cityId = useCityId();
    const neighborhoodId = useNeighborhoodId();
    const hashtags = useHashtags();

    const {
        data: trendingData = { restaurants: [], dishes: [], lists: [] },
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ['trendingData'],
        queryFn: fetchAllTrendingData,
    });

    const [expandedSections, setExpandedSections] = useState({ dishes: true, restaurants: true, lists: true });

    const filterItems = useCallback((items) => {
        const safeItems = Array.isArray(items) ? items : [];
        if (!cityId && !neighborhoodId && (!hashtags || hashtags.length === 0)) return safeItems;
        return safeItems.filter(item => {
            const matchesCity = cityId ? item.city_id === cityId || item.city_name === cityId : true;
            const matchesNeighborhood = neighborhoodId ? item.neighborhood_id === neighborhoodId || item.neighborhood_name === neighborhoodId : true;
            const matchesHashtags = hashtags.length > 0 ? item.tags.some(tag => hashtags.includes(tag)) : true;
            return matchesCity && matchesNeighborhood && matchesHashtags;
        });
    }, [cityId, neighborhoodId, hashtags]);

    const filteredRestaurants = useMemo(() => filterItems(trendingData.restaurants), [trendingData.restaurants, filterItems]);
    const filteredDishes = useMemo(() => filterItems(trendingData.dishes), [trendingData.dishes, filterItems]);
    const filteredLists = useMemo(() => filterItems(trendingData.lists), [trendingData.lists, filterItems]);

    const toggleSection = useCallback((section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    }, []);

    const renderSection = useCallback((title, items, Component, sectionKey) => {
        const safeItems = Array.isArray(items) ? items : [];
        const isExpanded = expandedSections[sectionKey];
        const displayLimit = isExpanded ? 12 : 4;
        const displayItems = safeItems.slice(0, displayLimit);
        const canExpand = safeItems.length > 4;
        const SkeletonComponent = skeletonMap[sectionKey];

        return (
            <div className="mb-6">
                <div className="flex justify-between items-center mb-3 flex-wrap">
                    <h2 className="text-lg font-semibold text-gray-800">{title} ({isLoading ? '...' : safeItems.length})</h2>
                    {canExpand && !isLoading && (
                        <button
                            onClick={() => toggleSection(sectionKey)}
                            className="text-xs text-[#A78B71] hover:text-[#D1B399] flex items-center font-medium py-1"
                            aria-expanded={isExpanded}
                        >
                            {isExpanded ? 'Show Less' : 'Show More'}
                            {isExpanded ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                        </button>
                    )}
                </div>
                {isLoading && SkeletonComponent && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 place-items-start">
                        {[...Array(4)].map((_, index) => <SkeletonComponent key={`skel-${sectionKey}-${index}`} />)}
                    </div>
                )}
                {!isLoading && safeItems.length === 0 ? (
                    <div className="text-center text-gray-500 py-4 text-sm border border-dashed border-gray-200 rounded-lg">
                        No {title.toLowerCase()} found {cityId || neighborhoodId || hashtags.length > 0 ? 'for the selected filters' : ''}.
                    </div>
                ) : null}
                {!isLoading && safeItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 place-items-start">
                        {displayItems.map(item => {
                            if (!item || typeof item.id === 'undefined' || item.id === null) return null;
                            let props = { ...item };
                            if (Component === DishCard) props.restaurant = item.restaurant_name || item.restaurant;
                            if (Component === ListCard) props.is_following = item.is_following ?? false;
                            return <Component key={`${sectionKey}-${item.id}`} {...props} />;
                        })}
                    </div>
                ) : null}
            </div>
        );
    }, [expandedSections, isLoading, cityId, neighborhoodId, hashtags, toggleSection]);

    if (isError && (!trendingData || (trendingData.restaurants.length === 0 && trendingData.dishes.length === 0 && trendingData.lists.length === 0))) {
        return (
            <ErrorMessage
                message={error?.message || 'Error loading trending data.'}
                onRetry={refetch}
                isLoadingRetry={isLoading}
                containerClassName="mt-6"
            />
        );
    }

    const noFilteredResults = !isLoading && !isError && filteredDishes.length === 0 && filteredRestaurants.length === 0 && filteredLists.length === 0;
    const hasAnyFetchedData = !isError && trendingData && (trendingData.restaurants.length > 0 || trendingData.dishes.length > 0 || trendingData.lists.length > 0);

    return (
        <div className="mt-4">
            {noFilteredResults && (cityId || neighborhoodId || hashtags.length > 0) && hasAnyFetchedData && (
                <div className="text-center py-6 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg mb-4">
                    No trending items match the selected filters.
                </div>
            )}
            {renderSection('Trending Dishes', filteredDishes, DishCard, 'dishes')}
            {renderSection('Trending Restaurants', filteredRestaurants, RestaurantCard, 'restaurants')}
            {renderSection('Popular Lists', filteredLists, ListCard, 'lists')}
        </div>
    );
});

export default Results;