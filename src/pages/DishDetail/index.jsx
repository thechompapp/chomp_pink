// src/pages/DishDetail/index.jsx
// UPDATE: Refactored to use React Query (useQuery) for data fetching
import React from 'react'; // Removed useState, useEffect
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query'; // *** IMPORT useQuery ***
import { ChevronLeft, ThumbsUp, ThumbsDown, Minus, User, Loader2, AlertTriangle } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';
import { API_BASE_URL } from '@/config';
import Button from '@/components/Button';

// *** Define fetch function outside the component ***
const fetchDishDetails = async (dishId) => {
    const parsedDishId = parseInt(dishId);
    if (!dishId || isNaN(parsedDishId) || parsedDishId <= 0) {
        throw new Error("Invalid Dish ID provided.");
    }
    console.log(`[fetchDishDetails] Fetching details for Dish ID: ${parsedDishId}`);
    const url = `${API_BASE_URL}/api/dishes/${parsedDishId}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            let errorMsg = `Failed to fetch dish details (${response.status})`;
            try { const errData = await response.json(); errorMsg = errData.error || errData.message || errorMsg; } catch (e) { /* ignore */ }
            console.error(`[fetchDishDetails] API Error Status ${response.status}: ${errorMsg}`);
            throw new Error(errorMsg);
        }
        const data = await response.json();
        if (!data || typeof data !== 'object') throw new Error("Invalid dish data received from API.");
        console.log(`[fetchDishDetails] Successfully fetched dish ${parsedDishId}.`);
        // Format data if needed (e.g., ensure tags is an array)
        return {
             ...data,
             tags: Array.isArray(data.tags) ? data.tags : [],
        };
    } catch (err) {
        console.error(`[fetchDishDetails] Error during fetch for dish ${parsedDishId}:`, err);
        throw new Error(err.message || `Could not load dish details.`); // Re-throw formatted error
    }
};


const DishDetail = () => {
  const { id: dishId } = useParams();
  const { openQuickAdd } = useQuickAdd();

  // --- Use React Query for fetching ---
  const {
      data: dish, // Data returned by fetchDishDetails
      isLoading, // Loading state from useQuery
      isError,   // Error state from useQuery
      error,     // Error object from useQuery
      refetch    // Function to refetch
  } = useQuery({
      queryKey: ['dishDetails', dishId], // Unique query key
      queryFn: () => fetchDishDetails(dishId), // Fetch function
      enabled: !!dishId, // Only run if dishId is truthy
      // Optional config:
      // staleTime: 1000 * 60 * 5, // 5 minutes
  });
  // --- End React Query ---

  // Mock data (can be removed or kept depending on if features are implemented)
  // const [review] = useState({ /* ... */ });
  // const [featuredLists] = useState([ /* ... */ ]);
  // const [similarDishes] = useState([ /* ... */ ]);

  // --- Render States ---
  if (isLoading) {
      return (
         <div className="flex justify-center items-center h-[calc(100vh-100px)]">
              <div className="text-center text-gray-500">
                 <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
                 Loading dish...
              </div>
         </div>
      );
  }

  // Use isError and error from useQuery
  if (isError) {
    return (
        <div className="p-6 max-w-3xl mx-auto text-center">
             <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
             <p className="text-red-500 mb-4">{error?.message || "Dish details could not be loaded."}</p>
             <div className="space-y-2">
                {error?.message !== "Invalid Dish ID provided." && (
                    <Button onClick={() => refetch()} variant="primary" size="sm" disabled={isLoading}>Retry</Button>
                )}
                <div><Link to="/" className="text-sm text-[#D1B399] hover:underline">Back to Home</Link></div>
             </div>
         </div>
     );
  }

  // Check if data exists after loading & no error
   if (!dish) {
     return (
         <div className="p-6 max-w-3xl mx-auto text-center">
              <p className="text-gray-500 mb-4">Dish not found or data is unavailable.</p>
              <Link to="/" className="text-sm text-[#D1B399] hover:underline"> Back to Home </Link>
          </div>
      );
   }


  // --- Main Render (Uses 'dish' data from useQuery) ---
  return (
    <div className="p-4 max-w-4xl mx-auto text-neutral-900">
      <Link to="/" className="flex items-center text-sm text-neutral-500 hover:text-neutral-800 mb-4">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
      </Link>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 leading-tight mb-1">{dish.name}</h1>
          {/* Link to restaurant detail page if ID is available */}
          {dish.restaurant_id && dish.restaurant_name && (
             <Link to={`/restaurant/${dish.restaurant_id}`} className="text-sm text-neutral-600 hover:underline">
                at {dish.restaurant_name}
             </Link>
          )}
          {/* Fallback if only name is available */}
          {!dish.restaurant_id && dish.restaurant_name && (
              <span className="text-sm text-neutral-600">at {dish.restaurant_name}</span>
          )}
        </div>
        {/* Pass correct dish object to QuickAdd */}
        <Button size="sm" onClick={() => openQuickAdd({ id: dish.id, name: dish.name, restaurant: dish.restaurant_name, tags: dish.tags, type: "dish" })}>
          + Add to List
        </Button>
      </div>

      {dish.description && <p className="text-sm text-neutral-600 mb-4 max-w-prose">{dish.description}</p>}

      {/* Ensure dish.tags is an array */}
      {Array.isArray(dish.tags) && dish.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {dish.tags.map((tag, i) => ( <span key={i} className="text-xs px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full border border-neutral-300"> #{tag} </span> ))}
          </div>
      )}

      {/* Mock Sections Remain */}
      {/* <div className="rounded-xl border border-neutral-200 bg-white p-4 mb-6 shadow-sm"> The Take </div> */}
      {/* <div className="mb-6"> Featured Lists </div> */}
      {/* <div> Similar Dishes </div> */}
    </div>
  );
};

export default DishDetail;