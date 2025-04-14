/* src/pages/RestaurantDetail/index.jsx */
/* REMOVED: All TypeScript syntax */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as RadixTabs from '@radix-ui/react-tabs';
import {
    ArrowLeft, MapPin, Star, Phone, Globe, Clock, Train, ExternalLink, PlusCircle, Info, MessageSquare, CheckCircle, Instagram
} from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { engagementService } from '@/services/engagementService';
import useAuthStore from '@/stores/useAuthStore';
import Button from '@/components/UI/Button';
import { useQuickAdd } from '@/context/QuickAddContext';
import ErrorMessage from '@/components/UI/ErrorMessage';
import QueryResultDisplay from '@/components/QueryResultDisplay';
import DishCard from '@/components/UI/DishCard';
import ListCard from '@/pages/Lists/ListCard'; // Check path if ListCard moved
import RestaurantCard from '@/components/UI/RestaurantCard'; // Use UI component

// Fetcher function - Needs to align with updated backend response structure eventually
const fetchRestaurantDetails = async (restaurantId) => { // REMOVED: Type hints
    if (!restaurantId) {
        const error = new Error('Restaurant ID is required.');
        error.status = 400;
        throw error;
    }
    try {
        const response = await restaurantService.getRestaurantDetails(restaurantId);
        // Check if response is valid object with id
        if (!response || typeof response !== 'object' || typeof response.id === 'undefined') {
             const error = new Error('Restaurant not found or invalid data.');
             error.status = 404;
            throw error;
        }
        // Add basic default values for potentially missing new fields
        return {
            ...response,
            rating: response.rating ?? null,
            primary_category: response.primary_category ?? (response.tags?.[0] || null),
            phone: response.phone ?? null,
            website: response.website ?? null,
            hours: response.hours ?? null,
            instagram_handle: response.instagram_handle ?? null,
            transit_info: response.transit_info ?? null,
            the_take_review: response.the_take_review ?? null,
            the_take_reviewer_handle: response.the_take_reviewer_handle ?? null,
            the_take_reviewer_verified: response.the_take_reviewer_verified ?? false,
            featured_on_lists: response.featured_on_lists ?? [],
            similar_places: response.similar_places ?? [],
            dishes: response.dishes ?? [],
        };
    } catch (error) {
        console.error(`[fetchRestaurantDetails] Error fetching restaurant ${restaurantId}:`, error);
        const fetchError = new Error( error.message || 'Failed to load restaurant details');
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
    const [activeTab, setActiveTab] = useState('getting-there');

    const queryResult = useQuery({
        queryKey: ['restaurantDetails', id],
        queryFn: () => fetchRestaurantDetails(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        retry: (failureCount, error) => (error?.status !== 404 && failureCount < 1),
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        const numericId = id ? parseInt(id, 10) : NaN;
        if (!isNaN(numericId) && numericId > 0 && queryResult.isSuccess && !queryResult.isLoading) { // Added isLoading check
            console.log(`[RestaurantDetail] Logging view for restaurant ID: ${numericId}`);
            engagementService.logEngagement({
                item_id: numericId, item_type: 'restaurant', engagement_type: 'view',
            }).catch((err) => { console.error('[RestaurantDetail] Failed to log view engagement:', err); });
        }
    }, [id, queryResult.isLoading, queryResult.isSuccess]); // Dependencies corrected

    const handleAddToList = useCallback((restaurant) => {
         if (!isAuthenticated) {
             navigate('/login', { state: { from: location } });
             return;
         }
         if (!restaurant || typeof restaurant.id === 'undefined') return;
         openQuickAdd({
             type: 'restaurant',
             id: restaurant.id,
             name: restaurant.name,
             tags: restaurant.tags || [],
             city: restaurant.city_name,
             neighborhood: restaurant.neighborhood_name,
         });
     }, [isAuthenticated, openQuickAdd, navigate, location]);

     const handleDishQuickAdd = useCallback((dish, restaurantName) => {
         if (!isAuthenticated) {
             navigate('/login', { state: { from: location } });
             return;
         }
         if (!dish || typeof dish.id === 'undefined') return;
         openQuickAdd({
             type: 'dish',
             id: dish.id,
             name: dish.name,
             restaurantId: dish.restaurant_id, // Ensure this field exists on dish object
             restaurantName: restaurantName,
             tags: dish.tags || [],
         });
     }, [isAuthenticated, openQuickAdd, navigate, location]);

    const formatWebsiteUrl = (url) => { /* ... same logic ... */ };
    const formatInstagramUrl = (handle) => { /* ... same logic ... */ };

    return (
        <div className="p-3 md:p-5 max-w-4xl mx-auto text-gray-900">
             <button onClick={() => navigate(-1)} className="..."> {/* Back Button */}
                 <ArrowLeft size={16} className="..." />
                 <span className="...">Back to search</span>
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
                {(restaurant) => ( // restaurant data is valid here
                    <div className="space-y-6">
                        {/* Header Section */}
                        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 border border-gray-100">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                {/* Left: Info */}
                                <div className="flex-grow">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words mb-1">
                                        {restaurant.name}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 mb-2">
                                        {restaurant.rating != null && <span className="flex items-center"><Star size={14} className="mr-1 text-yellow-500 fill-current" />{restaurant.rating}</span>}
                                        {restaurant.primary_category && <span>{restaurant.primary_category}</span>}
                                        {(restaurant.neighborhood_name || restaurant.city_name) && <span className="flex items-center"><MapPin size={14} className="mr-1 text-gray-400" />{`${restaurant.neighborhood_name ? restaurant.neighborhood_name + ', ' : ''}${restaurant.city_name || ''}`}</span>}
                                    </div>
                                    {Array.isArray(restaurant.tags) && restaurant.tags.length > 0 && (
                                        <div className="flex gap-1.5 flex-wrap">
                                            {restaurant.tags.map((tag) => (<span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">#{tag}</span>))}
                                        </div>
                                    )}
                                </div>
                                {/* Right: Actions */}
                                <div className="flex-shrink-0 flex items-center gap-2 w-full sm:w-auto">
                                    {restaurant.website && formatWebsiteUrl(restaurant.website) && (
                                        <a href={formatWebsiteUrl(restaurant.website) ?? '#'} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
                                            <Button as="span" variant="primary" size="sm" className="w-full !bg-[#FF69B4] hover:!bg-[#f550a3]"><ExternalLink size={14} className="mr-1" /> Visit</Button>
                                        </a>
                                    )}
                                    <Button variant="secondary" size="sm" onClick={() => handleAddToList(restaurant)} className="flex-1 sm:flex-none !border-[#FF69B4] !text-[#FF69B4] hover:!bg-[#FF69B4]/10"><PlusCircle size={14} className="mr-1" /> Add to List</Button>
                                </div>
                            </div>
                        </div>

                        {/* "The Take" Section */}
                         {restaurant.the_take_review && restaurant.the_take_reviewer_handle && (
                             <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 shadow-sm">
                                 <div className="flex items-center mb-1.5">
                                      <span className="font-semibold mr-1.5">The Take by @{restaurant.the_take_reviewer_handle}</span>
                                      {restaurant.the_take_reviewer_verified === true && <CheckCircle size={14} className="text-blue-500" title="Verified Reviewer" />}
                                  </div>
                                 <p className="italic">"{restaurant.the_take_review}"</p>
                             </div>
                         )}

                        {/* Tabs Section */}
                        <RadixTabs.Root value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                            <RadixTabs.List className="flex border-b border-gray-200 bg-gray-50">
                                <RadixTabs.Trigger value="getting-there" className={`flex-1 py-2 px-4 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#D1B399] transition-colors ${activeTab === 'getting-there' ? 'text-[#A78B71] border-b-2 border-[#A78B71] bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>Getting There</RadixTabs.Trigger>
                                <RadixTabs.Trigger value="what-to-order" className={`flex-1 py-2 px-4 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#D1B399] transition-colors ${activeTab === 'what-to-order' ? 'text-[#A78B71] border-b-2 border-[#A78B71] bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>What to Order</RadixTabs.Trigger>
                            </RadixTabs.List>

                            {/* Getting There Content */}
                            <RadixTabs.Content value="getting-there" className="p-4 sm:p-5 text-sm focus:outline-none">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     {/* Left Column: Contact/Location */}
                                     <div className="space-y-4">
                                          <div>
                                              <h3 className="font-semibold text-gray-800 mb-2">Contact</h3>
                                              <div className="space-y-1 text-gray-700">
                                                  {restaurant.phone && <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {restaurant.phone}</p>}
                                                  {restaurant.website && formatWebsiteUrl(restaurant.website) && <p className="flex items-center gap-2"><Globe size={14} className="text-gray-400"/> <a href={formatWebsiteUrl(restaurant.website) ?? '#'} target="_blank" rel="noopener noreferrer" className="text-[#A78B71] hover:underline break-all">{restaurant.website}</a></p>}
                                                  {restaurant.hours && <p className="flex items-center gap-2"><Clock size={14} className="text-gray-400"/> {restaurant.hours}</p>}
                                                  {restaurant.instagram_handle && formatInstagramUrl(restaurant.instagram_handle) && <p className="flex items-center gap-2"><Instagram size={14} className="text-gray-400"/> <a href={formatInstagramUrl(restaurant.instagram_handle) ?? '#'} target="_blank" rel="noopener noreferrer" className="text-[#A78B71] hover:underline">@{restaurant.instagram_handle}</a></p>}
                                              </div>
                                          </div>
                                          <div>
                                              <h3 className="font-semibold text-gray-800 mb-2">Location & Getting There</h3>
                                               <div className="space-y-1 text-gray-700">
                                                  {restaurant.address && <p className="flex items-center gap-2"><MapPin size={14} className="text-gray-400"/> {restaurant.address}</p>}
                                                  {restaurant.transit_info && <p className="flex items-center gap-2"><Train size={14} className="text-gray-400"/> {restaurant.transit_info}</p>}
                                               </div>
                                          </div>
                                     </div>
                                     {/* Right Column: Map Placeholder */}
                                     <div>
                                         <div className="aspect-video bg-gray-200 rounded flex items-center justify-center text-gray-500">
                                             <MapPin size={24} className="mr-2"/> Map Placeholder
                                              {restaurant.google_place_id && (
                                                  <a href={`https://www.google.com/maps/place/?q=place_id:${restaurant.google_place_id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline ml-2">(View on Google Maps)</a> // Corrected link format
                                              )}
                                         </div>
                                     </div>
                                 </div>
                             </RadixTabs.Content>


                            {/* What to Order Content */}
                             <RadixTabs.Content value="what-to-order" className="p-4 sm:p-5 focus:outline-none">
                                 <h3 className="font-semibold text-gray-800 mb-3">Dishes at {restaurant.name}</h3>
                                 {Array.isArray(restaurant.dishes) && restaurant.dishes.length > 0 ? (
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                         {restaurant.dishes.map((dish) => (
                                             dish && dish.id != null ? ( // Check dish validity
                                                 <DishCard
                                                     key={`dish-${dish.id}`}
                                                     id={dish.id}
                                                     name={dish.name}
                                                     restaurant={restaurant.name} // Pass parent restaurant name
                                                     tags={dish.tags || []}
                                                     adds={dish.adds || 0}
                                                     onQuickAdd={(e) => {
                                                         e.stopPropagation();
                                                         e.preventDefault();
                                                         handleDishQuickAdd(dish, restaurant.name);
                                                     }}
                                                 />
                                             ) : null // Render nothing if dish is invalid
                                         ))}
                                     </div>
                                 ) : (
                                     <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-gray-200 rounded-md bg-gray-50">
                                         No specific dishes listed yet.
                                     </div>
                                 )}
                             </RadixTabs.Content>

                        </RadixTabs.Root>

                        {/* "Featured on Lists" Section */}
                         {Array.isArray(restaurant.featured_on_lists) && restaurant.featured_on_lists.length > 0 && (
                             <div>
                                <h2 className="text-xl font-semibold text-gray-800 mb-3">Featured on Lists</h2>
                                <div className="space-y-3">
                                     {restaurant.featured_on_lists.map((list) => (
                                         list && list.id != null ? ( // Check list validity
                                             <div key={`featured-${list.id}`} className="bg-white border border-gray-200 p-3 rounded-md flex justify-between items-center text-sm">
                                                  <div>
                                                       <Link to={`/lists/${list.id}`} className="font-medium hover:text-[#A78B71]">{list.name}</Link>
                                                       <p className="text-xs text-gray-500">by @{list.creator_handle || '...'} • {list.saved_count || 0} followers</p>
                                                  </div>
                                                  {isAuthenticated && (
                                                       <Button size="xs" variant="tertiary" title={`Add ${restaurant.name} to your list`} onClick={() => handleAddToList(restaurant)} className="!p-1.5"><PlusCircle size={16}/></Button>
                                                   )}
                                              </div>
                                          ) : null // Render nothing if list is invalid
                                        ))}
                                </div>
                             </div>
                         )}

                         {/* "Similar Places" Section */}
                         {Array.isArray(restaurant.similar_places) && restaurant.similar_places.length > 0 && (
                             <div>
                                <h2 className="text-xl font-semibold text-gray-800 mb-3">Similar Places Nearby</h2>
                                <div className="flex space-x-4 overflow-x-auto pb-2 -mx-4 sm:-mx-5 px-4 sm:px-5 no-scrollbar">
                                    {restaurant.similar_places.map((place) => (
                                        place && place.id != null ? ( // Check place validity
                                             <div key={`similar-${place.id}`} className="min-w-[240px] sm:min-w-[280px] flex-shrink-0">
                                                  <RestaurantCard
                                                      id={place.id}
                                                      name={place.name || 'Unknown Restaurant'}
                                                      city={place.city_name}
                                                      neighborhood={place.neighborhood_name}
                                                      adds={place.adds}
                                                      tags={place.tags}
                                                      onQuickAdd={(e) => { e.stopPropagation(); e.preventDefault(); handleAddToList(place); }}
                                                  />
                                                  {place.distance && <p className="text-center text-xs text-gray-500 mt-1">{place.distance}</p>}
                                             </div>
                                         ) : null // Render nothing if place is invalid
                                    ))}
                                </div>
                             </div>
                         )}

                    </div>
                )}
            </QueryResultDisplay>
        </div>
    );
};

export default RestaurantDetail; // Removed React.memo as it might be premature