/* src/pages/RestaurantDetail/index.jsx */
import React, { useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Share2 } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { engagementService } from '@/services/engagementService';
import useAuthStore from '@/stores/useAuthStore';
import Button from '@/components/Button';
import { useQuickAdd } from '@/context/QuickAddContext';
import ErrorMessage from '@/components/UI/ErrorMessage';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import QueryResultDisplay from '@/components/QueryResultDisplay';
import DishCard from '@/components/UI/DishCard';

const fetchRestaurantDetails = async (restaurantId) => {
    if (!restaurantId) {
        const error = new Error('Restaurant ID is required.');
        error.status = 400;
        throw error;
    }
    try {
        const response = await restaurantService.getRestaurantDetails(restaurantId);
        if (!response || typeof response.id === 'undefined') {
            const error = new Error('Restaurant not found.');
            error.status = 404;
            throw error;
        }
        return response;
    } catch (error) {
        console.error(`[fetchRestaurantDetails] Error fetching restaurant ${restaurantId}:`, error);
        const fetchError = new Error(error.message || 'Failed to load restaurant details');
        fetchError.status = error.status || 500;
        throw fetchError;
    }
};

const RestaurantDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const { openQuickAdd } = useQuickAdd();

    const queryResult = useQuery({
        queryKey: ['restaurantDetails', id],
        queryFn: () => fetchRestaurantDetails(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        retry: (failureCount, error) => error?.status !== 404 && failureCount < 1,
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        const numericId = id ? parseInt(id, 10) : NaN;
        if (!isNaN(numericId) && numericId > 0 && !queryResult.isLoading && queryResult.isSuccess) {
            console.log(`[RestaurantDetail] Logging view for restaurant ID: ${numericId}`);
            engagementService.logEngagement({
                item_id: numericId,
                item_type: 'restaurant',
                engagement_type: 'view',
            }).catch((err) => {
                console.error('[RestaurantDetail] Failed to log view engagement:', err);
            });
        }
    }, [id, queryResult.isLoading, queryResult.isSuccess]);

    const renderDish = useCallback(
        (dish, restaurantName) => {
            if (!dish || typeof dish.id === 'undefined') return null;
            return (
                <DishCard
                    key={`dish-${dish.id}`}
                    id={dish.id}
                    name={dish.name}
                    restaurant={restaurantName}
                    tags={dish.tags || []}
                    adds={dish.adds || 0}
                    onQuickAdd={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (!isAuthenticated) {
                            console.log('Login required for Quick Add');
                            navigate('/login', { state: { from: location } });
                            return;
                        }
                        openQuickAdd({
                            type: 'dish',
                            id: dish.id,
                            name: dish.name,
                            restaurantId: dish.restaurant_id,
                            restaurantName: restaurantName,
                            tags: dish.tags || [],
                        });
                    }}
                />
            );
        },
        [openQuickAdd, isAuthenticated, navigate, location]
    );

    const googleMapsUrl = useMemo(() => {
        const restaurant = queryResult.data;
        if (restaurant && queryResult.isSuccess) {
            if (restaurant.google_place_id) {
                return `https://www.google.com/maps/search/?api=1&query_place_id=${restaurant.google_place_id}`;
            } else if (restaurant.address && restaurant.name) {
                return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.name}, ${restaurant.address}`)}`;
            } else if (restaurant.latitude && restaurant.longitude) {
                return `https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`;
            }
        }
        return null;
    }, [queryResult.data, queryResult.isSuccess]);

    return (
        <div className="p-3 md:p-5 max-w-4xl mx-auto text-gray-900">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-4 group text-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] rounded px-1 py-0.5"
            >
                <ArrowLeft size={16} className="mr-1 transition-colors group-hover:text-[#A78B71]" />
                <span className="transition-colors group-hover:text-[#A78B71]">Back</span>
            </button>

            <QueryResultDisplay
                queryResult={queryResult}
                loadingMessage="Loading restaurant details..."
                errorMessagePrefix="Error Loading Restaurant"
                isDataEmpty={(data) => !data || typeof data.id === 'undefined'}
                noDataMessage={queryResult.error?.status === 404 ? 'Restaurant not found.' : 'Restaurant details could not be loaded.'}
                ErrorChildren={
                    <Button onClick={() => navigate('/')} variant="secondary" size="sm" className="mt-2">
                        Back to Home
                    </Button>
                }
            >
                {(restaurant) => (
                    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
                        <div className="mb-4">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words mb-1">
                                {restaurant.name}
                            </h1>
                            {(restaurant.neighborhood_name || restaurant.city_name) && (
                                <div className="flex items-center text-gray-600 text-sm">
                                    <MapPin size={14} className="mr-1.5 text-gray-400 flex-shrink-0" />
                                    <span>
                                        {`${restaurant.neighborhood_name ? restaurant.neighborhood_name + ', ' : ''}${restaurant.city_name || ''}`}
                                    </span>
                                </div>
                            )}
                        </div>

                        {Array.isArray(restaurant.tags) && restaurant.tags.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap mb-5">
                                {restaurant.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm mb-5 border-b border-gray-100 pb-5">
                            {googleMapsUrl && (
                                <a
                                    href={googleMapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-[#A78B71] hover:underline group focus:outline-none focus:ring-1 focus:ring-[#D1B399] rounded px-1 py-0.5"
                                >
                                    <MapPin size={14} className="mr-1.5 text-gray-400 group-hover:text-[#A78B71]" />
                                    View Map
                                </a>
                            )}
                            <button
                                onClick={() => alert('Share functionality not yet implemented.')}
                                className="flex items-center text-[#A78B71] hover:underline group focus:outline-none focus:ring-1 focus:ring-[#D1B399] rounded px-1 py-0.5"
                            >
                                <Share2 size={14} className="mr-1.5 text-gray-400 group-hover:text-[#A78B71]" />
                                Share
                            </button>
                        </div>

                        <div className="mb-4">
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">Dishes</h2>
                            {Array.isArray(restaurant.dishes) && restaurant.dishes.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {restaurant.dishes.map((dish) => renderDish(dish, restaurant.name))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-gray-200 rounded-md bg-gray-50">
                                    No dishes listed for this restaurant yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </QueryResultDisplay>
        </div>
    );
};

export default RestaurantDetail;