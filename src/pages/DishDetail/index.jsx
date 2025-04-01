// src/pages/DishDetail/index.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
// Ensure PlusCircle is included
import { ChevronLeft, Star, ThumbsUp, ThumbsDown, Instagram, PlusCircle, MapPin } from 'lucide-react';
import useAppStore from '@/hooks/useAppStore';
import { useQuickAdd } from '@/context/QuickAddContext';
import Button from '@/components/Button';

const DishDetail = () => {
  const { id } = useParams();
  const { trendingDishes } = useAppStore(); // Only need trendingDishes for potential initial find
  const { openQuickAdd } = useQuickAdd();
  const [dish, setDish] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Mock related content for now
  const [review, setReview] = useState({ text: "This is a mock review placeholder...", author: "Mock User", username: "@mock", verified: false, date: "2025-03-31", likes: 10, neutral: 2, dislikes: 1 });
  const [featuredLists, setFeaturedLists] = useState([{ id: 101, name: "Mock List 1", author: "@listmaker", followers: 100 }, { id: 102, name: "Mock List 2", author: "@foodfan", followers: 200 }]);
  const [similarDishes, setSimilarDishes] = useState([{ id: 201, name: "Similar Mock Dish 1", price: "$$$" }, { id: 202, name: "Similar Mock Dish 2", price: "$$" }]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    console.log(`[DishDetail] Attempting to load dish ID: ${id}`);
    // Try finding in store first
    const foundDish = trendingDishes.find(d => String(d.id) === String(id));

    if (foundDish) {
        console.log(`[DishDetail] Found dish in store:`, foundDish);
        setDish(foundDish);
        setIsLoading(false);
    } else {
        // ** Placeholder for API Fetch **
        console.warn(`[DishDetail] Dish ID ${id} not in store. Need API call. Using mock.`);
        // Simulate fetch failure / show mock after delay
        setTimeout(() => {
           // Try setting mock data if API fails or isn't implemented
           const mockDishData = {
               id, name: `Dish ${id} (Mock Load)`, restaurant: "Mock Restaurant", restaurantId: "mock-rest-id",
               rating: 4.2, category: "Mock Category", price: "$$", location: "Mock Location, NY",
               neighborhood: "Mock Neighborhood", city: "New York", tags: ["mock", "data"],
           };
           setDish(mockDishData);
           // setError(`Dish with ID ${id} not found (API fetch not implemented).`); // Optionally set error
           setIsLoading(false);
        }, 500);
        // Example API call:
        // fetch(`/api/dishes/${id}`)
        //   .then(res => res.ok ? res.json() : Promise.reject('Dish not found'))
        //   .then(data => setDish(data))
        //   .catch(err => setError(err.message))
        //   .finally(() => setIsLoading(false));
    }
  }, [id, trendingDishes]); // Re-run if ID changes or trendingDishes updates

  const handleAddToList = () => {
    if (dish) {
      openQuickAdd({ id: dish.id, name: dish.name, restaurant: dish.restaurant, tags: dish.tags || [], type: "dish" });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-pulse text-[#D1B399]">Loading Dish...</div></div>;
  }

  if (error || !dish) {
     return <div className="text-center py-10"><p className="text-red-500">{error || `Dish with ID ${id} not found.`}</p><Link to="/trending" className="text-[#D1B399] hover:underline">Back to Trending</Link></div>;
  }

  // Destructure with fallbacks
  const { name = "N/A", restaurant = "N/A", restaurantId, rating = "N/A", category = "N/A", price = "$$", location = "N/A", neighborhood = "N/A", city = "N/A", tags = [] } = dish;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-12">
      <Link to="/trending" className="inline-flex items-center text-gray-600 hover:text-[#D1B399] my-4 transition-colors"> <ChevronLeft size={20} className="mr-1" /> Back to Trending </Link>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="p-5">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{name}</h1>
              <div className="text-[#D1B399] font-medium"> at <Link to={`/restaurant/${restaurantId || '#'}`} className="hover:underline">{restaurant}</Link> </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-sm text-gray-600">
                <div className="flex items-center"><Star size={18} className="text-yellow-400 fill-current mr-1" /> <span className="font-medium">{rating}</span></div>
                <span>•</span> <span>{category}</span> <span>•</span> <span>{price}</span> <span>•</span>
                <span className="flex items-center"><MapPin size={14} className="mr-1 text-gray-400" /> {location || `${neighborhood}, ${city}`}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map(tag => (<div key={tag} className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700"> #{tag} </div>))}
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto flex-shrink-0">
              <Button className="flex-1 md:flex-initial bg-[#D1B399] hover:bg-[#c1a389] text-white opacity-50 cursor-not-allowed" disabled> <div className="mr-2">🍽️</div> Order </Button>
              <Button onClick={handleAddToList} variant="tertiary" className="flex-1 md:flex-initial border-[#D1B399] text-[#D1B399] hover:bg-[#D1B399]/5"> <PlusCircle size={20} className="mr-2" /> Add to List </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Mock Sections */}
      {review && ( <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-5"> <h2 className="text-xl font-bold text-gray-900 mb-4">The Take (Mock)</h2> <p>{review.text}</p> </div> )}
      {featuredLists.length > 0 && ( <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-5"> <h2 className="text-xl font-bold text-gray-900 mb-4">Featured On (Mock)</h2> {/* List items */} </div> )}
      {similarDishes.length > 0 && ( <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"> <h2 className="text-xl font-bold text-gray-900 mb-4">Similar Dishes (Mock)</h2> {/* Grid */} </div> )}
    </div>
  );
};
export default DishDetail;