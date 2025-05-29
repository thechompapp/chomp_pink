/* src/pages/DishDetail/index.jsx */
import React, { useEffect, useCallback } from 'react'; // Added useCallback
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Share2, PlusCircle, Utensils, Tag } from 'lucide-react'; // Added Utensils, Tag
import { dishService } from '@/services/dishService'; // Using JS file now
import { engagementService } from '@/services/engagementService';
import useAuthStore from '@/stores/useAuthStore';
import Button from '@/components/UI/Button';
import PillButton from '@/components/UI/PillButton'; // Import PillButton
import { useQuickAdd } from '@/contexts/QuickAddContext';
import ErrorMessage from '@/components/UI/ErrorMessage';
import QueryResultDisplay from '@/components/QueryResultDisplay';

// Refined Fetcher function implementation
const fetchDishDetails = async (dishId) => {
    const numericDishId = Number(dishId); // Ensure number
    if (isNaN(numericDishId) || numericDishId <= 0) {
        console.error('[fetchDishDetails] Invalid dish ID:', dishId);
        const error = new Error('Invalid dish ID provided.');
        error.status = 400; // Bad Request
        throw error;
    }
    try {
        // dishService.getDishDetails should now return formatted data or throw ApiError
        const data = await dishService.getDishDetails(numericDishId);
        return data; // Return the data directly
    } catch (error) {
        console.error(`[fetchDishDetails] Error fetching dish ${numericDishId}:`, error);
        // Re-throw the error (ApiError expected from service)
        throw error;
    }
};

// Simple Skeleton Placeholder
const DishDetailSkeleton = () => (
    <div className="animate-pulse space-y-4 bg-white p-6 rounded-lg shadow border">
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="flex gap-2">
            <div className="h-5 bg-gray-200 rounded-full w-16"></div>
            <div className="h-5 bg-gray-200 rounded-full w-20"></div>
        </div>
        <div className="flex gap-3 pt-4 border-t">
            <div className="h-10 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        </div>
    </div>
);


const DishDetail = () => {
    const { dishId: id } = useParams(); // Rename id param to dishId for clarity internally if needed
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const { openQuickAdd } = useQuickAdd();

    const queryResult = useQuery({
        queryKey: ['dishDetails', id],
        queryFn: () => fetchDishDetails(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        retry: (failureCount, error) => {
            const status = error?.status;
            return status !== 404 && failureCount < 1;
        },
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        const numericId = id ? parseInt(id, 10) : NaN;
        if (!isNaN(numericId) && numericId > 0 && queryResult.isSuccess && !queryResult.isLoading) {
            engagementService.logEngagement({
                item_id: numericId,
                item_type: 'dish',
                engagement_type: 'view',
            }).catch(err => console.error("[DishDetail] Failed to log view:", err));
        }
    }, [id, queryResult.isLoading, queryResult.isSuccess]);

    const handleAddToList = useCallback((dish) => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: window.location.pathname } });
            return;
        }
        if (!dish || !dish.id) {
            console.error("Cannot add invalid dish data to list:", dish);
            return;
        }
        openQuickAdd({
            type: 'dish',
            id: dish.id,
            name: dish.name,
            restaurantId: dish.restaurant_id,
            restaurantName: dish.restaurant_name,
            tags: dish.tags || [],
            city: dish.city,
            neighborhood: dish.neighborhood,
        });
    }, [isAuthenticated, openQuickAdd, navigate]);

    const handleShare = useCallback(() => {
        if (navigator.share) {
            navigator.share({
                title: queryResult.data?.name || 'Check out this dish!',
                text: `Found this dish on DOOF: ${queryResult.data?.name}`,
                url: window.location.href,
            }).catch((error) => console.error('Error sharing:', error));
        } else {
            navigator.clipboard.writeText(window.location.href)
                .then(() => alert('Link copied to clipboard!'))
                .catch(() => alert('Could not copy link.'));
        }
    }, [queryResult.data?.name]);

    return (
        <div className="container mx-auto px-4 py-4 max-w-4xl">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-4 group text-sm"
            >
                <ArrowLeft size={16} className="mr-1 transition-colors group-hover:text-primary" />
                <span className="transition-colors group-hover:text-primary">Back</span>
            </button>

            <QueryResultDisplay
                queryResult={queryResult}
                LoadingComponent={<DishDetailSkeleton />}
                errorMessagePrefix="Error Loading Dish"
                isDataEmpty={(data) => !data || typeof data.id === 'undefined'}
                noDataMessage="Dish not found or invalid data received."
                ErrorChildren={
                    <Button onClick={() => navigate('/')} variant="secondary" size="sm" className="mt-2">
                        Back to Home
                    </Button>
                }
            >
                {(dish) => (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 break-words mb-2">
                            {dish.name || 'Unnamed Dish'}
                        </h1>

                        {dish.restaurant_id && dish.restaurant_name && (
                            <Link
                                to={`/restaurants/${dish.restaurant_id}`}
                                // ** COLOR FIX: Use theme color **
                                className="inline-flex items-center text-primary hover:text-primary-dark dark:hover:text-primary-light mb-4 group"
                            >
                                <Utensils size={16} className="mr-1.5 flex-shrink-0 text-gray-400" />
                                <span className="text-lg font-medium group-hover:underline">
                                    at {dish.restaurant_name}
                                </span>
                            </Link>
                        )}

                        {(dish.city || dish.neighborhood) && (
                            <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-4">
                                <MapPin size={14} className="mr-1.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                <span>
                                    {dish.neighborhood ? `${dish.neighborhood}, ${dish.city}` : dish.city}
                                </span>
                            </div>
                        )}

                        {Array.isArray(dish.tags) && dish.tags.length > 0 && (
                            <div className="mb-6">
                                 <div className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                     <Tag size={14} className="mr-1.5 text-gray-400" /> Tags:
                                 </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {dish.tags.map((tag) => (
                                         <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} >
                                              {/* Use PillButton for consistency */}
                                              <PillButton label={tag} prefix="#" isActive={false} className="!text-xs !px-2 !py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-primary-dark hover:text-primary-dark dark:hover:border-primary-light dark:hover:text-primary-light"/>
                                         </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3 mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                            <Button
                                onClick={() => handleAddToList(dish)}
                                variant="primary"
                                size="md"
                                className="flex items-center justify-center flex-1 min-w-[130px]"
                                aria-label={isAuthenticated ? `Add ${dish.name} to list` : 'Log in to add to list'}
                            >
                                 <PlusCircle size={16} className="mr-1" />
                                {isAuthenticated ? 'Add to List' : 'Log in to Save'}
                            </Button>
                            <Button
                                variant="secondary"
                                size="md"
                                className="flex items-center justify-center min-w-[100px]"
                                onClick={handleShare}
                                aria-label={`Share ${dish.name}`}
                            >
                                <Share2 size={16} className="mr-1" />
                                Share
                            </Button>
                        </div>
                    </div>
                )}
            </QueryResultDisplay>
        </div>
    );
};

export default DishDetail;