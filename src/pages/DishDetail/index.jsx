/* src/pages/DishDetail/index.jsx */
import React, { useEffect, useCallback } from 'react'; // Added useCallback
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Share2, PlusCircle } from 'lucide-react'; // Added PlusCircle
import { dishService } from '@/services/dishService'; // Using JS file now
import { engagementService } from '@/services/engagementService';
import useAuthStore from '@/stores/useAuthStore';
import Button from '@/components/UI/Button';
import { useQuickAdd } from '@/context/QuickAddContext';
import ErrorMessage from '@/components/UI/ErrorMessage';
import QueryResultDisplay from '@/components/QueryResultDisplay';
// Assuming a DishDetailSkeleton exists
// import DishDetailSkeleton from './DishDetailSkeleton';

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
    const { id } = useParams();
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
            return status !== 404 && failureCount < 1; // Don't retry 404, retry others once
        },
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    // Log engagement view
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

    // Use useCallback for handlers
    const handleAddToList = useCallback((dish) => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: window.location.pathname } }); // Redirect to login
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
            restaurantName: dish.restaurant_name, // Ensure this is passed
            tags: dish.tags || [],
            city: dish.city,
            neighborhood: dish.neighborhood,
        });
    }, [isAuthenticated, openQuickAdd, navigate]); // Added navigate dependency

    const handleShare = useCallback(() => {
        // Basic share functionality (can be enhanced)
        if (navigator.share) {
            navigator.share({
                title: queryResult.data?.name || 'Check out this dish!',
                text: `Found this dish on DOOF: ${queryResult.data?.name}`,
                url: window.location.href,
            }).catch((error) => console.error('Error sharing:', error));
        } else {
            // Fallback for browsers that don't support Web Share API
            navigator.clipboard.writeText(window.location.href)
                .then(() => alert('Link copied to clipboard!'))
                .catch(() => alert('Could not copy link.'));
        }
    }, [queryResult.data?.name]); // Depend on data

    return (
        <div className="container mx-auto px-4 py-4 max-w-4xl">
            <button
                onClick={() => navigate(-1)} // Correct navigation
                className="flex items-center text-gray-600 hover:text-gray-900 mb-4 group text-sm"
            >
                <ArrowLeft size={16} className="mr-1 transition-colors group-hover:text-[#A78B71]" />
                <span className="transition-colors group-hover:text-[#A78B71]">Back</span>
            </button>

            <QueryResultDisplay
                queryResult={queryResult}
                LoadingComponent={<DishDetailSkeleton />} // Use skeleton
                errorMessagePrefix="Error Loading Dish"
                isDataEmpty={(data) => !data || typeof data.id === 'undefined'}
                noDataMessage="Dish not found or invalid data received."
                ErrorChildren={
                    <Button onClick={() => navigate('/')} variant="secondary" size="sm" className="mt-2">
                        Back to Home
                    </Button>
                }
            >
                {(dish) => ( // dish data is valid here
                    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words mb-2">
                            {dish.name || 'Unnamed Dish'}
                        </h1>

                        {dish.restaurant_id && dish.restaurant_name && (
                            <Link
                                to={`/restaurant/${dish.restaurant_id}`}
                                className="inline-flex items-center text-[#A78B71] hover:text-[#806959] mb-4 group"
                            >
                                <span className="text-lg font-medium group-hover:underline">
                                    at {dish.restaurant_name}
                                </span>
                            </Link>
                        )}

                        {(dish.city || dish.neighborhood) && (
                            <div className="flex items-center text-gray-600 text-sm mb-4">
                                <MapPin size={14} className="mr-1.5 text-gray-400 flex-shrink-0" />
                                <span>
                                    {dish.neighborhood ? `${dish.neighborhood}, ${dish.city}` : dish.city}
                                </span>
                            </div>
                        )}

                        {Array.isArray(dish.tags) && dish.tags.length > 0 && (
                            <div className="mb-6">
                                <div className="flex flex-wrap gap-1.5">
                                    {dish.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3 mt-4 border-t border-gray-100 pt-4">
                            <Button
                                onClick={() => handleAddToList(dish)}
                                variant="primary"
                                size="md"
                                className="flex items-center justify-center flex-1 min-w-[130px]"
                                aria-label={isAuthenticated ? `Add ${dish.name} to list` : 'Log in to add to list'}
                            >
                                 {/* Use PlusCircle icon */}
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