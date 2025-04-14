/* src/pages/DishDetail/index.jsx */
/* REMOVED: All TypeScript syntax */
import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Share2 } from 'lucide-react';
import { dishService } from '@/services/dishService';
import { engagementService } from '@/services/engagementService';
import useAuthStore from '@/stores/useAuthStore';
import Button from '@/components/UI/Button';
import { useQuickAdd } from '@/context/QuickAddContext';
import ErrorMessage from '@/components/UI/ErrorMessage';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import QueryResultDisplay from '@/components/QueryResultDisplay';

// Fetcher function implementation
const fetchDishDetails = async (dishId) => { // REMOVED: Type hints
    if (!dishId || isNaN(parseInt(String(dishId), 10))) { // Use String() for safety
        throw new Error('Invalid dish ID');
    }
    const numericDishId = parseInt(String(dishId), 10);
    const data = await dishService.getDishDetails(numericDishId);
    // Check if data is an object and has an id property
    if (!data || typeof data !== 'object' || typeof data.id === 'undefined') {
        throw new Error('Dish not found or invalid response');
    }
    return data;
};

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
            // Check error status without TS assertion
            const status = error?.status;
            return status !== 404 && failureCount < 1;
        },
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    // Log engagement view
    useEffect(() => {
        const numericId = id ? parseInt(id, 10) : NaN;
        // Check if id is valid and query is successful before logging
        if (!isNaN(numericId) && numericId > 0 && queryResult.isSuccess && !queryResult.isLoading) {
            console.log(`[DishDetail] Logging view for dish ID: ${numericId}`);
            engagementService.logEngagement({
                item_id: numericId,
                item_type: 'dish',
                engagement_type: 'view',
            }).catch(err => console.error("[DishDetail] Failed to log view:", err)); // Add catch
        }
    }, [id, queryResult.isLoading, queryResult.isSuccess]); // Add isSuccess


    const handleAddToList = (dish) => {
        if (!dish || !dish.id) {
            console.error("Cannot add invalid dish data to list:", dish);
            return;
        }
        // Ensure restaurant_name is passed correctly
        openQuickAdd({
            type: 'dish',
            id: dish.id,
            name: dish.name,
            restaurantId: dish.restaurant_id, // Keep original id
            restaurantName: dish.restaurant_name, // Pass name
            tags: dish.tags || [],
        });
    };

    return (
        <div className="container mx-auto px-4 py-4 max-w-4xl">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-4 group text-sm"
            >
                <ArrowLeft size={16} className="mr-1 transition-colors group-hover:text-[#A78B71]" />
                <span className="transition-colors group-hover:text-[#A78B71]">Back</span>
            </button>

            <QueryResultDisplay
                queryResult={queryResult}
                loadingMessage="Loading dish details..."
                errorMessagePrefix="Error Loading Dish"
                isDataEmpty={(data) => !data || typeof data.id === 'undefined'}
                noDataMessage="Dish not found or invalid data received."
                ErrorChildren={
                    <Button onClick={() => navigate('/')} variant="secondary" size="sm" className="mt-2">
                        Back to Home
                    </Button>
                }
            >
                {(dish) => ( // dish data is guaranteed to be valid here by QueryResultDisplay
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

                        {/* Use city/neighborhood from dish object */}
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
                                onClick={isAuthenticated ? () => handleAddToList(dish) : () => navigate('/login')}
                                variant="primary"
                                size="md"
                                className="flex-1 min-w-[120px]"
                                aria-label={isAuthenticated ? `Add ${dish.name} to list` : 'Log in to add to list'}
                            >
                                {isAuthenticated ? 'Add to List' : 'Log in to Save'}
                            </Button>
                            <Button
                                variant="secondary"
                                size="md"
                                className="flex items-center justify-center min-w-[100px]"
                                onClick={() => alert('Share function not implemented yet.')} // Replace with actual share logic
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