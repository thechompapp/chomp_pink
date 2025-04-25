/* src/pages/Home/Results.jsx */
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { trendingService } from '@/services/trendingService';
import { filterService } from '@/services/filterService';
import RestaurantCard from '@/components/UI/RestaurantCard.jsx';
import DishCard from '@/components/UI/DishCard.jsx';
import RestaurantCardSkeleton from '@/components/UI/RestaurantCardSkeleton.jsx';
import DishCardSkeleton from '@/components/UI/DishCardSkeleton.jsx';
import ListCard from '@/pages/Lists/ListCard.jsx';
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton.jsx';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';
import Button from '@/components/UI/Button.jsx';
import Select from '@/components/UI/Select.jsx';

const SectionGrid = ({ title, items, CardComponent, SkeletonComponent, type, error, isLoading, itemKey = 'id' }) => {
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <SkeletonComponent key={`skeleton-${i}`} />)}
                </div>
            );
        }

        if (error) {
            return <ErrorMessage message={`Failed to load ${title.toLowerCase()}: ${error.message || 'Unknown error'}`} />;
        }

        if (!items || items.length === 0) {
            return <p className="text-gray-500 text-center py-4">No {title.toLowerCase()} found.</p>;
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item) => {
                    if (item && item[itemKey] != null) {
                        // For ListCard, pass the `list` prop explicitly; for others, spread the item
                        const props = type === 'list' ? { list: item } : { ...item };
                        return <CardComponent key={item[itemKey]} {...props} />;
                    }
                    console.warn(`[SectionGrid: ${title}] Skipping item due to missing key (${itemKey}):`, item);
                    return null;
                })}
            </div>
        );
    };

    return (
        <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">{title}</h2>
            {renderContent()}
        </section>
    );
};

const Results = ({ cityId, neighborhoodId, hashtags }) => {
    const { data: trendingData, isLoading: isLoadingTrending, error: trendingError } = useQuery({
        queryKey: ['trendingData', cityId, neighborhoodId, hashtags],
        queryFn: () => trendingService.fetchAllTrendingData(),
        staleTime: 5 * 60 * 1000,
    });

    const { data: citiesData, isLoading: isLoadingCities, error: citiesError } = useQuery({
        queryKey: ['cities'],
        queryFn: filterService.getCities,
        staleTime: 60 * 60 * 1000,
    });

    const cities = citiesData || [];

    const popularRestaurants = useMemo(() => trendingData?.restaurants || [], [trendingData]);
    const popularDishes = useMemo(() => trendingData?.dishes || [], [trendingData]);
    const topLists = useMemo(() => trendingData?.lists || [], [trendingData]);

    return (
        <div className="container mx-auto px-4 py-8 space-y-10">
            <SectionGrid
                title="Popular Restaurants"
                items={popularRestaurants}
                CardComponent={RestaurantCard}
                SkeletonComponent={RestaurantCardSkeleton}
                type="restaurant"
                error={trendingError}
                isLoading={isLoadingTrending}
                itemKey="id"
            />

            <SectionGrid
                title="Popular Dishes"
                items={popularDishes}
                CardComponent={DishCard}
                SkeletonComponent={DishCardSkeleton}
                type="dish"
                error={trendingError}
                isLoading={isLoadingTrending}
                itemKey="dish_id"
            />

            <SectionGrid
                title="Top Lists"
                items={topLists}
                CardComponent={ListCard}
                SkeletonComponent={ListCardSkeleton}
                type="list"
                error={trendingError}
                isLoading={isLoadingTrending}
                itemKey="id"
            />

            {trendingError && (
                <ErrorMessage message={`Failed to load trending data: ${trendingError.message}`} />
            )}
        </div>
    );
};

export default Results;