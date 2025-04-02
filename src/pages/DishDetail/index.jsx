// src/pages/DishDetail/index.jsx
// FIXED: Added missing import for Loader2
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ThumbsUp, ThumbsDown, Minus, User, Loader2 } from 'lucide-react'; // <-- ADDED IMPORT
import { useQuickAdd } from '@/context/QuickAddContext';
import { API_BASE_URL } from '@/config';
import Button from '@/components/Button';

const DishDetail = () => {
  const { id } = useParams();
  const { openQuickAdd } = useQuickAdd();
  const [dish, setDish] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data (keep as is for now)
  const [review] = useState({ /* ... */ });
  const [featuredLists] = useState([ /* ... */ ]);
  const [similarDishes] = useState([ /* ... */ ]);

  useEffect(() => {
    const fetchDish = async () => {
      setIsLoading(true);
      setError(null); // Reset error
      try {
        const res = await fetch(`${API_BASE_URL}/api/dishes/${id}`);
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.error || `Dish not found (${res.status})`);
        }
        const data = await res.json();
        setDish(data);
      } catch (err) {
        console.error("[DishDetail] Fetch Error:", err);
        setError(err.message || 'Could not load dish.');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) { fetchDish(); }
    else { setError("No dish ID provided."); setIsLoading(false); }
  }, [id]);

  // Use Loader2 in loading state
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

  if (error || !dish) {
    return (
        <div className="p-6 max-w-3xl mx-auto text-center">
             <p className="text-red-500 mb-4">{error || "Dish not found."}</p>
             <Link to="/" className="text-[#D1B399] hover:underline"> Back to Home </Link>
         </div>
     );
  }

  // --- Main Render (JSX remains the same) ---
  return (
    <div className="p-4 max-w-4xl mx-auto text-neutral-900">
      <Link to="/" className="flex items-center text-sm text-neutral-500 hover:text-neutral-800 mb-4">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home {/* Updated text */}
      </Link>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 leading-tight mb-1">{dish.name}</h1>
          {dish.restaurant_name && ( <Link to={`/restaurant/${dish.restaurant_id}`} className="text-sm text-neutral-600 hover:underline"> at {dish.restaurant_name} </Link> )}
        </div>
        {/* Pass correct dish object to QuickAdd */}
        <Button size="sm" onClick={() => openQuickAdd({ id: dish.id, name: dish.name, restaurant: dish.restaurant_name, tags: dish.tags, type: "dish" })}>
          + Add to List
        </Button>
      </div>

      {dish.description && <p className="text-sm text-neutral-600 mb-4 max-w-prose">{dish.description}</p>}

      <div className="flex flex-wrap gap-2 mb-6">
        {dish.tags?.map((tag, i) => ( <span key={i} className="text-xs px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full border border-neutral-300"> #{tag} </span> ))}
      </div>

      {/* Mock Sections Remain */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 mb-6 shadow-sm"> {/* The Take */} </div>
      <div className="mb-6"> {/* Featured Lists */} </div>
      <div> {/* Similar Dishes */} </div>
    </div>
  );
};

export default DishDetail;