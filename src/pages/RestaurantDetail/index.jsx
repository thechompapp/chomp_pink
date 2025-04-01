// src/pages/RestaurantDetail/index.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, MapPin, Star, Instagram, Globe, Navigation, Utensils, ExternalLink, Phone, PlusCircle } from "lucide-react"; // Added PlusCircle
import useAppStore from "@/hooks/useAppStore";
import DishCard from "@/components/UI/DishCard";
import Button from "@/components/Button";
import { useQuickAdd } from "@/context/QuickAddContext";

const RestaurantDetail = () => {
  const { id } = useParams();
  const { trendingItems } = useAppStore();
  const { openQuickAdd } = useQuickAdd();
  const [restaurant, setRestaurant] = useState(null);
  const [activeTab, setActiveTab] = useState("order");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- TODO: Replace with actual API fetching ---
  useEffect(() => {
    setIsLoading(true); setError(null);
    console.log(`[RestaurantDetail] Loading restaurant ID: ${id}`);
    // Simulate finding/fetching data
    const foundRestaurant = trendingItems.find(r => String(r.id) === String(id));
    let restaurantData = foundRestaurant ? { ...foundRestaurant } : { id: id, name: `Restaurant ${id} (Mock)` };

    // Simulate adding details (replace with real data from API)
     const mockDetails = {
         ...restaurantData,
         website: restaurantData.website || "https://placeholder-site.com",
         instagram: restaurantData.instagram || "restaurant_insta",
         yelpUrl: restaurantData.yelpUrl || `https://yelp.com/biz/placeholder-${id}`,
         googleMapsUrl: restaurantData.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=Restaurant+${id}`,
         address: restaurantData.address || `123 Placeholder St, ${restaurantData.neighborhood || 'Mock Hood'}, ${restaurantData.city || 'Mock City'}, NY 10000 (Mock)`,
         crossStreets: restaurantData.crossStreets || "near Mock & Vine (Mock)",
         directions: restaurantData.directions || "Directions require backend API integration.",
         phone: restaurantData.phone || "555-MOCK-REST",
         rating: restaurantData.rating || (Math.random() * 1.5 + 3.5).toFixed(1),
         reviews: restaurantData.reviews || Math.floor(Math.random() * 500) + 20,
         dishes: restaurantData.dishes || [ /* Add mock dishes if needed */ ]
     };

    setTimeout(() => { // Simulate API delay
        setRestaurant(mockDetails);
        setIsLoading(false);
        // Replace timeout with: fetch(`/api/restaurants/${id}`).then(...).catch(...).finally(...)
    }, 500);

  }, [id, trendingItems]);
  // --- End of TODO section ---

   const handleAddToList = () => {
     if (restaurant) { openQuickAdd({ id: restaurant.id, name: restaurant.name, neighborhood: restaurant.neighborhood, city: restaurant.city, tags: restaurant.tags || [], type: "restaurant" }); }
   };

  if (isLoading) { return <div className="flex justify-center items-center h-screen"><div className="animate-pulse text-[#D1B399]">Loading Restaurant...</div></div>; }
  if (error || !restaurant) { return <div className="text-center py-10"><p className="text-red-500">{error || `Restaurant ${id} not found.`}</p><Link to="/" className="text-[#D1B399] hover:underline">Back Home</Link></div>; }

  // Destructure with fallbacks
  const { name = "N/A", neighborhood = "N/A", city = "N/A", tags = [], rating = "N/A", reviews = 0, dishes = [], website, instagram, address, crossStreets, directions, phone, googleMapsUrl, yelpUrl } = restaurant;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-12">
      <Link to="/" className="inline-flex items-center text-gray-600 hover:text-[#D1B399] my-4 transition-colors"> <ChevronLeft size={20} className="mr-1" /> Back Home </Link>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="p-5">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{name}</h1>
               <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-sm text-gray-600">
                 <div className="flex items-center"><Star size={18} className="text-yellow-400 fill-current mr-1" /><span className="font-medium">{rating}</span><span className="ml-1 text-gray-500">({reviews} reviews)</span></div>
                 {neighborhood && city && (<><span>•</span><span className="flex items-center"><MapPin size={14} className="mr-1 text-gray-400" />{neighborhood}, {city}</span></>)}
               </div>
               <div className="mt-3 flex flex-wrap gap-2"> {tags.map(tag => ( <div key={tag} className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700"> #{tag} </div> ))} </div>
            </div>
             <div className="flex gap-3 w-full md:w-auto flex-shrink-0">
               <Button onClick={handleAddToList} variant="tertiary" className="flex-1 md:flex-initial border-[#D1B399] text-[#D1B399] hover:bg-[#D1B399]/5"> <PlusCircle size={20} className="mr-2" /> Add to List </Button>
             </div>
          </div>
        </div>
      </div>
       <div className="mb-6">
         <div className="flex border-b border-gray-200">
           <button onClick={() => setActiveTab('order')} className={`py-3 px-5 font-medium transition-colors duration-150 flex items-center ${ activeTab === 'order' ? 'border-b-2 border-[#D1B399] text-[#D1B399]' : 'text-gray-500 hover:text-[#D1B399] border-b-2 border-transparent' }`} > <Utensils size={18} className="mr-2" /> What To Order </button>
           <button onClick={() => setActiveTab('gettingThere')} className={`py-3 px-5 font-medium transition-colors duration-150 flex items-center ${ activeTab === 'gettingThere' ? 'border-b-2 border-[#D1B399] text-[#D1B399]' : 'text-gray-500 hover:text-[#D1B399] border-b-2 border-transparent' }`} > <Navigation size={18} className="mr-2" /> Getting There </button>
         </div>
       </div>
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5">
             {activeTab === 'order' && (
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">What to Order</h2>
                    {dishes.length > 0 ? ( <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"> {dishes.map((dish) => ( <DishCard key={dish.id} {...dish} /> ))} </div> ) : ( <p className="text-gray-500">No specific dishes highlighted yet.</p> )}
                </div>
             )}
             {activeTab === 'gettingThere' && (
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Getting There</h2>
                    <div className="space-y-4 text-gray-700">
                        {address && ( <div className="flex items-start"> <MapPin size={18} className="mr-3 mt-1 text-[#D1B399] flex-shrink-0" /> <div> <p>{address}</p> {crossStreets && <p className="text-sm text-gray-500">{crossStreets}</p>} {googleMapsUrl && ( <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#D1B399] hover:underline inline-flex items-center mt-1"> View on Google Maps <ExternalLink size={12} className="ml-1" /> </a> )} </div> </div> )}
                        {phone && ( <div className="flex items-center"> <Phone size={18} className="mr-3 text-[#D1B399]" /> <a href={`tel:${phone}`} className="hover:underline">{phone}</a> </div> )}
                        {directions && ( <div className="flex items-start"> <Navigation size={18} className="mr-3 mt-1 text-[#D1B399] flex-shrink-0" /> <div> <p className="font-medium mb-1">Directions:</p> <p className="text-sm">{directions}</p> <p className="text-xs text-gray-400 mt-1"> (Note: Real directions require backend API integration)</p> </div> </div> )}
                        <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                            {website && ( <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-[#D1B399] hover:underline"> <Globe size={16} className="mr-1.5" /> Website <ExternalLink size={12} className="ml-1" /> </a> )}
                            {instagram && ( <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-[#D1B399] hover:underline"> <Instagram size={16} className="mr-1.5" /> Instagram <ExternalLink size={12} className="ml-1" /> </a> )}
                            {yelpUrl && ( <a href={yelpUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-[#D1B399] hover:underline"> <span className="font-bold mr-1.5">Yelp</span> <ExternalLink size={12} className="ml-1" /> </a> )}
                        </div>
                        <p className="text-xs text-gray-400 mt-4">*Details require backend updates.</p>
                    </div>
                </div>
             )}
            </div>
       </div>
    </div>
  );
};
export default RestaurantDetail;