/* src/pages/RestaurantDetail/index.jsx */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    MapPin, Utensils, Star, Eye, PlusCircle, Phone, Globe, Clock, Train, ExternalLink, Users, Info // Added more icons
} from 'lucide-react';

// Services
import { restaurantService } from '@/services/restaurantService'; // Changed to named import
import { dishService } from '@/services/dishService'; // Changed to named import
// Hooks
import useAuthStore from '@/stores/useAuthStore';
// import { useQuickAdd } from '@/context/QuickAddContext'; // Keep if Quick Add button is needed
import useApiErrorHandler from '@/hooks/useApiErrorHandler';
// Components
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/UI/Button'; // Use updated Button
import AddToListModal from '@/components/AddToListModal';
import DishCard from '@/components/UI/DishCard'; // Keep if using Dishes section
// Utilities
import { logEngagement } from '@/utils/logEngagement';

// --- Helper Components ---

// Updated DetailItem for minimalistic style (Used in Getting There)
const DetailItem = ({ icon: Icon, text, href, isLink = false, className = "" }) => {
    const content = (
        // Adjusted spacing and alignment
        <div className={`flex items-start space-x-3 text-sm text-gray-700 ${className}`}>
            <Icon className="w-4 h-4 text-gray-500 flex-shrink-0 mt-[3px]" /> {/* Adjusted vertical alignment */}
            <span className={`flex-1 ${isLink ? "hover:text-black hover:underline" : ""}`}>
                {text}
                {isLink && <ExternalLink className="w-3 h-3 text-gray-400 inline-block ml-1 mb-0.5" />}
            </span>
        </div>
    );
    // Render as link only if href is provided and valid
    return isLink && href && href !== '#' ? <a href={href} target="_blank" rel="noopener noreferrer">{content}</a> : content;
};

// Updated TagPill for minimalistic style (Used in Header)
const TagPill = ({ tag }) => (
    <span className="inline-block border border-gray-300 text-gray-600 px-3 py-1 rounded-full text-xs font-medium mr-2 mb-2 capitalize"> {/* Capitalize tags */}
        {tag}
    </span>
);

// Placeholder Card Component (Used for Lists/Similar)
const PlaceholderCard = ({ title, children }) => (
     // Simple card style matching the main sections
     <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-black mb-4">{title}</h2>
        <div className="text-sm text-gray-500 space-y-3"> {/* Added space-y */}
            {children || "Content coming soon..."}
        </div>
    </div>
);

// --- Main Component ---

function RestaurantDetailPage() {
    const { restaurantId } = useParams();
    const { handleApiError } = useApiErrorHandler();
    const userId = useAuthStore((state) => state.user?.id);
    // const { openQuickAdd } = useQuickAdd(); // Commented out Quick Add button for now
    const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);

    // --- Data Fetching ---
    const {
        data: restaurantData,
        isLoading: isLoadingRestaurant,
        error: restaurantError,
        isError: isRestaurantError,
    } = useQuery({
        queryKey: ['restaurant', restaurantId],
        queryFn: () => restaurantService.getRestaurantById(restaurantId), // Updated to restaurantService.getRestaurantById
        enabled: !!restaurantId,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
        retry: 1,
        onError: (err) => handleApiError(err, 'Failed to load restaurant details')
    });

    // Keep dishes query if Dishes section is included
    const {
        data: dishesData,
        isLoading: isLoadingDishes,
        error: dishesError,
        isError: isDishesError,
    } = useQuery({
        queryKey: ['dishes', restaurantId],
        queryFn: () => dishService.getDishesByRestaurantId(restaurantId), // Updated to dishService.getDishesByRestaurantId
        enabled: !!restaurantData?.id,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
        retry: 1,
        onError: (err) => handleApiError(err, 'Failed to load dishes')
    });

    // --- TODO: Add TanStack Queries for Featured Lists & Similar Places ---

    // --- Engagement Logging ---
    useEffect(() => {
        const restaurantActualId = restaurantData?.id;
        if (restaurantActualId && userId) {
            logEngagement(userId, restaurantActualId, 'restaurant', 'view');
        }
    }, [restaurantData?.id, userId]);

    // --- Event Handlers ---
    const handleVisit = () => {
        if (restaurantData?.website && restaurantData.website !== '#') {
            window.open(restaurantData.website, '_blank', 'noopener,noreferrer');
        } else {
            console.log("No website URL available");
            // Maybe show a notification to the user
        }
    };

    const handleOpenAddToListModal = () => {
        if (userId && restaurantData) {
            setIsAddToListModalOpen(true);
        } else if (!userId) {
            handleApiError({ message: "You must be logged in to save items to lists." });
        }
    };

    const handleCloseAddToListModal = useCallback(() => setIsAddToListModalOpen(false), []);

    const modalItem = useMemo(() => {
        if (!restaurantData) return null;
        return { id: restaurantData.id, name: restaurantData.name, type: 'restaurant' };
    }, [restaurantData]);

    // --- Render Logic ---
    if (isLoadingRestaurant) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center">
                <LoadingSpinner message="Loading restaurant..." />
            </div>
        );
    }

    if (isRestaurantError || !restaurantData) {
        return (
            <div className="bg-gray-50 min-h-screen px-4 py-8">
                 <div className="max-w-4xl mx-auto">
                    <ErrorMessage message={restaurantError?.message || "Could not load restaurant data."} />
                    <Link to="/" className="text-pink-600 hover:underline mt-4 inline-block">Go Home</Link>
                </div>
            </div>
        );
    }

    // Destructure needed data, providing defaults/placeholders
    const {
        name = "Restaurant Name",
        address = "123 Main St",
        city_name = "NYC",
        neighborhood_name = "SoHo",
        latitude,
        longitude,
        average_rating = 0,
        // Extract or simulate cuisine type from tags or specific field
        cuisine_type = restaurantData?.tags?.[0] || "Cuisine Type", // Example
        tags = [],
        phone_number = "(555) 123-4567", // Placeholder
        website = "#", // Placeholder (use # if none)
        hours = "Mon-Fri 11 AM - 9 PM, Sat-Sun 12 PM - 10 PM", // Placeholder
        instagram_handle, // Optional data
        // Add other fields needed for the new sections later
    } = restaurantData || {}; // Add default empty object

    const displayRating = average_rating > 0 ? Number(average_rating).toFixed(1) : null;

    return (
        // Light gray page background
        <div className="bg-gray-100 min-h-screen py-10">
            {/* Centered content container */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* --- Header Section Card --- */}
                <div className="bg-white shadow-md rounded-lg border border-gray-200 p-6 mb-8">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                        {/* Left Side: Info */}
                        <div className='mb-4 sm:mb-0'>
                            {/* Restaurant Name */}
                            <h1 className="text-2xl md:text-3xl font-semibold text-black mb-1">{name}</h1>
                             {/* Rating / Cuisine / Location Row */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 mb-3">
                                {displayRating && (
                                    <span className="flex items-center">
                                        <Star className="w-4 h-4 text-yellow-400 mr-1" /> {displayRating} stars
                                    </span>
                                )}
                                {cuisine_type && <span>{cuisine_type}</span>}
                                {neighborhood_name && city_name && <span>{`${neighborhood_name}, ${city_name}`}</span>}
                            </div>
                            {/* Tags */}
                            {tags.length > 0 && (
                                <div className="flex flex-wrap">
                                    {tags.map(tag => <TagPill key={tag} tag={tag} />)}
                                </div>
                            )}
                        </div>
                        {/* Right Side: Buttons */}
                        <div className="flex flex-shrink-0 space-x-2 mt-2 sm:mt-0 self-start sm:self-auto"> {/* Align buttons */}
                             <Button variant="accent" size="sm" onClick={handleVisit} disabled={!website || website === '#'}>
                                Visit
                            </Button>
                            {userId && (
                                <Button variant="outline" size="sm" onClick={handleOpenAddToListModal} icon={PlusCircle}>
                                    Add to List
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- Main Content Grid --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column (Wider) */}
                    <div className="md:col-span-2 space-y-8">

                        {/* --- Getting There Section --- */}
                        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-black mb-4">Getting There</h2>
                            <div className="space-y-3">
                                <DetailItem icon={Phone} text={phone_number || 'Phone number not available'} />
                                {/* Use website field directly */}
                                <DetailItem icon={Globe} text={website === '#' ? 'Website not available' : website} href={website} isLink={!!website && website !== '#'} />
                                <DetailItem icon={Clock} text={`Hours: ${hours}`} />
                                {instagram_handle && (
                                     <DetailItem icon={Users} text={`@${instagram_handle}`} href={`https://instagram.com/${instagram_handle}`} isLink={true} />
                                )}
                                <div className="pt-4 mt-4 border-t border-gray-200">
                                     <h3 className="text-base font-medium text-black mb-2">Location & Transit</h3>
                                     <DetailItem icon={MapPin} text={`${address}, ${neighborhood_name}, ${city_name}`} />
                                     {/* Transit Placeholder */}
                                     <DetailItem icon={Train} text="Nearby Transit: Example Line (A, C, E), Another Line (1)" className="mt-2 text-xs text-gray-500" />
                                </div>
                            </div>
                        </div>

                        {/* --- Featured on Lists Section (Placeholder) --- */}
                        <PlaceholderCard title="Featured on Lists">
                            {/* Replace with actual list data mapping */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-black hover:underline cursor-pointer">Best Italian in NYC</p>
                                        <p className="text-xs text-gray-500">by @username • 1.2k followers</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="px-2 py-1 h-auto"><PlusCircle className="w-4 h-4" /></Button>
                                </div>
                                 <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-black hover:underline cursor-pointer">SoHo Date Night Gems</p>
                                        <p className="text-xs text-gray-500">by @anotheruser • 870 followers</p>
                                    </div>
                                     <Button variant="outline" size="sm" className="px-2 py-1 h-auto"><PlusCircle className="w-4 h-4" /></Button>
                                </div>
                                {/* Add link to view more lists if applicable */}
                            </div>
                        </PlaceholderCard>

                         {/* --- Similar Places Section (Placeholder) --- */}
                         <PlaceholderCard title="Similar Places">
                             {/* Replace with actual similar places data mapping */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <p className="font-medium text-black hover:underline cursor-pointer">Similar Restaurant 1</p>
                                    <p className="text-xs text-gray-500">0.5 miles away</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="font-medium text-black hover:underline cursor-pointer">Another Great Place</p>
                                    <p className="text-xs text-gray-500">1.1 miles away</p>
                                </div>
                                 <div className="flex justify-between items-center">
                                    <p className="font-medium text-black hover:underline cursor-pointer">Third Recommendation</p>
                                    <p className="text-xs text-gray-500">1.8 miles away</p>
                                </div>
                                 {/* Add link to view more similar places if applicable */}
                            </div>
                         </PlaceholderCard>

                    </div>

                    {/* Right Column (Narrower) */}
                    <div className="md:col-span-1 space-y-8">
                        {/* --- Map Section --- */}
                        {latitude && longitude && (
                            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
                                <h2 className="text-base font-semibold text-black mb-3">Location Map</h2> {/* Slightly smaller title */}
                                <div className="aspect-square bg-gray-200 rounded-md flex items-center justify-center overflow-hidden">
                                    <p className="text-gray-500 text-xs italic">Map Component Placeholder</p>
                                    {/* <ActualMapComponent lat={latitude} lng={longitude} /> */}
                                </div>
                            </div>
                        )}

                        {/* --- Dishes Section (Optional - Kept for now) --- */}
                        {(!isLoadingDishes && dishesData && dishesData.length > 0) && ( // Only show card if dishes exist
                            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-black mb-4">Popular Dishes</h2>
                                {isLoadingDishes ? (
                                    <LoadingSpinner size="sm" />
                                ) : isDishesError ? (
                                    <ErrorMessage message="Could not load dishes."/>
                                ) : dishesData && dishesData.length > 0 ? (
                                    <div className="space-y-2">
                                        {dishesData.slice(0, 5).map((dish) => (
                                            <Link key={dish.id} to={`/dish/${dish.id}`} className="text-sm text-gray-700 hover:text-black hover:underline block truncate">
                                                {dish.name}
                                            </Link>
                                        ))}
                                        {/* Optional: Link to view all dishes */}
                                        {/* {dishesData.length > 5 && <Link to="#" className="text-sm text-pink-600 hover:underline block mt-2">View all...</Link>} */}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No popular dishes listed yet.</p>
                                )}
                            </div>
                        )}
                        {/* --- End Dishes --- */}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {modalItem && (
                 <AddToListModal
                    isOpen={isAddToListModalOpen}
                    onClose={handleCloseAddToListModal}
                    item={modalItem}
                />
             )}
        </div>
    );
}

export default RestaurantDetailPage;