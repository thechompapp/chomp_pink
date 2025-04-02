// src/pages/RestaurantDetail/index.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  MapPin,
  Phone,
  Globe,
  // Navigation, // Replaced by MapPin for Directions link text
  Utensils, // Keeping for potential future use?
  ExternalLink, // Added for Website link clarity
  PlusCircle,
} from "lucide-react";
// import useAppStore from "@/hooks/useAppStore"; // Not currently used here
import DishCard from "@/components/UI/DishCard";
import Button from "@/components/Button"; // Use Button component if desired for consistency
import { useQuickAdd } from "@/context/QuickAddContext";
import { API_BASE_URL } from "@/config";

const RestaurantDetail = () => {
  const { id } = useParams();
  const { openQuickAdd } = useQuickAdd();
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      setIsLoading(true);
      setError(null); // Reset error on new fetch
      try {
        console.log(`[RestaurantDetail] Fetching restaurant with ID: ${id}`);
        const res = await fetch(`${API_BASE_URL}/api/restaurants/${id}`);
        if (!res.ok) {
             console.error(`[RestaurantDetail] Fetch failed: ${res.status} ${res.statusText}`);
             const errorData = await res.json().catch(() => ({})); // Try parsing error body
             throw new Error(errorData.error || `Failed to fetch (${res.status})`);
        }
        const data = await res.json();
        console.log("[RestaurantDetail] Received data:", data);
        setRestaurant(data);
      } catch (err) {
        console.error("[RestaurantDetail] Error loading restaurant:", err);
        setError(err.message || "Could not load restaurant.");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) { // Only fetch if ID is present
        fetchRestaurant();
    } else {
        setError("No restaurant ID provided.");
        setIsLoading(false);
    }
  }, [id]); // Dependency array includes 'id'

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

  if (error || !restaurant) {
    return (
        <div className="p-6 max-w-3xl mx-auto text-center">
             <p className="text-red-500 mb-4">{error || "Restaurant not found."}</p>
             <Link to="/" className="text-[#D1B399] hover:underline"> Back to Home </Link>
         </div>
     );
  }

  // --- Main Render ---
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto text-gray-900"> {/* Increased max-width */}
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
      </div>

       {/* Tags */}
      {Array.isArray(restaurant.tags) && restaurant.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
             {restaurant.tags.map((tag, index) => (
               <span key={`${tag}-${index}`} className="text-xs px-2.5 py-1 bg-gray-100 rounded-full text-gray-700 border border-gray-200">
                 #{tag}
               </span>
             ))}
          </div>
       )}

      {/* Action Links (Website, Phone, Directions) */}
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-700 mb-6 border-b pb-6">
        {restaurant.website && (
          <a href={restaurant.website.startsWith('http') ? restaurant.website : `//${restaurant.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[#D1B399] group">
            <Globe className="w-4 h-4 text-gray-400 group-hover:text-[#D1B399]" /> Website <ExternalLink size={12} className="opacity-50"/>
          </a>
        )}
        {restaurant.phone && (
          <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1.5 hover:text-[#D1B399] group">
            <Phone className="w-4 h-4 text-gray-400 group-hover:text-[#D1B399]" /> Call
          </a>
        )}
        {restaurant.address && (
          <a
            // Correct Google Maps Search URL
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-[#D1B399] group"
          >
            <MapPin className="w-4 h-4 text-gray-400 group-hover:text-[#D1B399]" /> Directions <ExternalLink size={12} className="opacity-50"/>
          </a>
        )}
      </div>

       {/* Dishes Section */}
      <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Dishes ({restaurant.dishes?.length || 0})</h2>
             {/* Use QuickAdd context to open modal for adding a dish TO this restaurant */}
            {/* <button
                // onClick={() => openQuickAdd({ type: "submission", subtype: "dish", restaurantId: restaurant.id, restaurantName: restaurant.name })}
                className="text-sm text-[#D1B399] hover:underline flex items-center gap-1"
            >
                <PlusCircle className="w-4 h-4" /> Add Dish
            </button> */}
          </div>

          {Array.isArray(restaurant.dishes) && restaurant.dishes.length > 0 ? (
            // Use grid for better layout on larger screens
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {restaurant.dishes.map((dish) => (
                // Ensure restaurant name and ID are passed to DishCard
                <DishCard
                    key={dish.id}
                    {...dish} // Pass all dish properties
                    restaurant={restaurant.name} // Pass restaurant name explicitly
                    restaurantId={restaurant.id} // Pass restaurant ID explicitly
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4 bg-gray-50 border border-gray-200 rounded-lg">
                 <p className="text-gray-500">No dishes found for this restaurant yet.</p>
                 {/* Add button to submit a dish? Needs QuickAdd integration */}
            </div>
          )}
      </div>

    </div>
  );
};

export default RestaurantDetail;