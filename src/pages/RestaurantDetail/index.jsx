// src/pages/RestaurantDetail/index.jsx
// UPDATE: Refactored to use React Query (useQuery) for data fetching
import React from "react"; // Removed useState, useEffect
import { useParams, Link } from "react-router-dom";
import { useQuery } from '@tanstack/react-query'; // *** IMPORT useQuery ***
import { ChevronLeft, MapPin, Phone, Globe, Utensils, ExternalLink, PlusCircle, Loader2, AlertTriangle } from "lucide-react"; // Added AlertTriangle
import DishCard from "@/components/UI/DishCard";
import Button from "@/components/Button";
import { useQuickAdd } from "@/context/QuickAddContext";
import { API_BASE_URL } from "@/config";

// *** Define Fetcher Function ***
const fetchRestaurantDetails = async (restaurantId) => {
    const parsedId = parseInt(restaurantId);
    if (!restaurantId || isNaN(parsedId) || parsedId <= 0) {
        throw new Error("Invalid Restaurant ID provided.");
    }
    console.log(`[fetchRestaurantDetails] Fetching details for Restaurant ID: ${parsedId}`);
    const url = `${API_BASE_URL}/api/restaurants/${parsedId}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            let errorMsg = `Failed to fetch restaurant details (${response.status})`;
            try { const errData = await response.json(); errorMsg = errData.error || errData.message || errorMsg; } catch (e) { /* ignore */ }
            console.error(`[fetchRestaurantDetails] API Error Status ${response.status}: ${errorMsg}`);
            // Handle 404 specifically
            if (response.status === 404) throw new Error("Restaurant not found.");
            throw new Error(errorMsg);
        }
        const data = await response.json();
        if (!data || typeof data !== 'object') throw new Error("Invalid restaurant data received from API.");

        console.log(`[fetchRestaurantDetails] Successfully fetched restaurant ${parsedId}.`);
        // Format data (ensure tags/dishes are arrays)
        return {
             ...data,
             tags: Array.isArray(data.tags) ? data.tags : [],
             dishes: (Array.isArray(data.dishes) ? data.dishes : []).map(dish => ({
                 ...dish,
                 tags: Array.isArray(dish.tags) ? dish.tags : []
             })),
        };
    } catch (err) {
        console.error(`[fetchRestaurantDetails] Error during fetch for restaurant ${parsedId}:`, err);
        // Rethrow error message for useQuery
        throw new Error(err.message || `Could not load restaurant details.`);
    }
};


const RestaurantDetail = () => {
  const { id: restaurantId } = useParams();
  const { openQuickAdd } = useQuickAdd(); // Keep QuickAdd context

  // --- Use React Query for fetching ---
  const {
      data: restaurant, // Contains details + dishes array
      isLoading,
      isError,
      error,
      refetch
  } = useQuery({
      queryKey: ['restaurantDetails', restaurantId], // Query key includes ID
      queryFn: () => fetchRestaurantDetails(restaurantId), // Use the fetcher function
      enabled: !!restaurantId, // Only run if ID exists
      // Optional config
      // staleTime: 1000 * 60 * 5, // 5 minutes
  });
  // --- End React Query ---


  // --- Render States ---
  if (isLoading) {
     return (
         <div className="flex justify-center items-center h-[calc(100vh-100px)]">
              <div className="text-center text-gray-500">
                 <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
                 Loading restaurant...
              </div>
         </div>
     );
   }

  if (isError) {
    return (
        <div className="p-6 max-w-3xl mx-auto text-center">
             <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
             <p className="text-red-500 mb-4">{error?.message || "Restaurant details could not be loaded."}</p>
              <div className="space-y-2">
                {error?.message !== "Invalid Restaurant ID provided." && error?.message !== "Restaurant not found." && (
                     <Button onClick={() => refetch()} variant="primary" size="sm" disabled={isLoading}>Retry</Button>
                 )}
                 <div><Link to="/" className="text-sm text-[#D1B399] hover:underline">Back to Home</Link></div>
              </div>
         </div>
     );
  }

  // Check if data exists after loading & no error
  if (!restaurant) {
       return (
           <div className="p-6 max-w-3xl mx-auto text-center">
                <p className="text-gray-500 mb-4">Restaurant not found or data is unavailable.</p>
                <Link to="/" className="text-sm text-[#D1B399] hover:underline"> Back to Home </Link>
            </div>
        );
  }


  // --- Main Render (Uses 'restaurant' data from useQuery) ---
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto text-gray-900">
      {/* Back Link */}
      <div className="mb-4">
        <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-[#D1B399] transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>
      </div>

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">{restaurant.name}</h1>
        {restaurant.address && <div className="text-sm text-gray-600">{restaurant.address}</div>}
        {/* Optional Quick Add Button for Restaurant itself */}
         {/*
         <Button size="sm" onClick={() => openQuickAdd({ id: restaurant.id, name: restaurant.name, neighborhood: restaurant.neighborhood_name, city: restaurant.city_name, tags: restaurant.tags, type: "restaurant" })}>
             + Add Restaurant to List
         </Button>
         */}
      </div>

       {/* Tags (Uses restaurant.tags from query data) */}
      {Array.isArray(restaurant.tags) && restaurant.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
             {restaurant.tags.map((tag, index) => (
               <span key={`${tag}-${index}`} className="text-xs px-2.5 py-1 bg-gray-100 rounded-full text-gray-700 border border-gray-200">
                 #{tag}
               </span>
             ))}
          </div>
       )}

      {/* Action Links (Uses restaurant details from query data) */}
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-700 mb-6 border-b pb-6">
        {restaurant.website && ( <a href={restaurant.website.startsWith('http') ? restaurant.website : `//${restaurant.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#D1B399] group"> <Globe className="w-4 h-4 text-gray-400 group-hover:text-[#D1B399]" /> Website <ExternalLink size={12} className="opacity-50"/> </a> )}
        {restaurant.phone && ( <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1.5 hover:text-[#D1B399] group"> <Phone className="w-4 h-4 text-gray-400 group-hover:text-[#D1B399]" /> Call </a> )}
        {restaurant.address && ( <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#D1B399] group"> <MapPin className="w-4 h-4 text-gray-400 group-hover:text-[#D1B399]" /> Directions <ExternalLink size={12} className="opacity-50"/> </a> )}
      </div>

       {/* Dishes Section (Uses restaurant.dishes from query data) */}
      <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Dishes ({restaurant.dishes?.length || 0})</h2>
            {/* Potential button to trigger QuickAdd for a *new* dish at this restaurant */}
            {/* <Button variant="tertiary" size="sm" onClick={() => openQuickAdd({ type: 'dish', restaurantId: restaurant.id, restaurantName: restaurant.name })}> <PlusCircle size={16} className="mr-1"/> Add Dish </Button> */}
          </div>
          {Array.isArray(restaurant.dishes) && restaurant.dishes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pass restaurant name to DishCard */}
              {restaurant.dishes.map((dish) => (
                <DishCard key={dish.id} {...dish} restaurant={restaurant.name} />
              ))}
            </div>
          ) : ( <div className="text-center py-8 px-4 bg-gray-50 border border-gray-200 rounded-lg"> <p className="text-gray-500">No dishes found for this restaurant yet.</p> </div> )}
      </div>
    </div>
  );
};

export default RestaurantDetail;