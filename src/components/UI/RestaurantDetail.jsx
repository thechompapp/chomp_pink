import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, MapPin, Star, PlusCircle, Instagram, Globe } from 'lucide-react';
import DishCard from './DishCard';

const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [showAddToList, setShowAddToList] = useState(false);

  useEffect(() => {
    const fetchRestaurant = async () => {
      const mockRestaurant = {
        id,
        name: "Via Carota",
        neighborhood: "West Village",
        city: "NYC",
        rating: 4.7,
        cuisine: "Italian",
        priceRange: "$$$",
        tags: ["italian", "cozy", "popular"],
        website: "https://viacarota.com",
        instagram: "viacarota_nyc",
      };
      setRestaurant(mockRestaurant);
    };
    fetchRestaurant();
  }, [id]);

  if (!restaurant) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-pulse text-[#D1B399]">Loading...</div></div>;
  }

  // Mock dishes for What to Order
  const mockDishes = [
    { id: 1, name: "Cacio e Pepe", restaurant: "Via Carota", tags: ["pasta", "italian"], price: "$24" },
    { id: 2, name: "Svizzera", restaurant: "Via Carota", tags: ["meat", "signature"], price: "$28" },
    { id: 3, name: "Insalata Verde", restaurant: "Via Carota", tags: ["salad", "fresh"], price: "$16" },
    { id: 4, name: "Tiramisu", restaurant: "Via Carota", tags: ["dessert", "italian"], price: "$12" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-12">
      <Link to="/search" className="inline-flex items-center text-gray-600 hover:text-[#D1B399] my-4 transition-colors">
        <ChevronLeft size={20} className="mr-1" />
        Back to search
      </Link>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="p-5">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{restaurant.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Star size={18} className="text-yellow-400 fill-yellow-400 mr-1" />
                  <span className="font-medium">{restaurant.rating}</span>
                </div>
                <span>•</span>
                <span>{restaurant.cuisine}</span>
                <span>•</span>
                <span>{restaurant.priceRange}</span>
                <span>•</span>
                <span>{restaurant.neighborhood}, {restaurant.city}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {restaurant.tags.map(tag => (
                  <div key={tag} className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">#{tag}</div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              {/* Replaced Visit with OpenTable */}
              <a
                href="https://www.opentable.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-initial bg-[#D1B399] hover:bg-[#c1a389] text-white rounded-lg py-3 px-4 font-medium flex items-center justify-center transition-colors"
              >
                OpenTable
              </a>
              <button
                onClick={() => setShowAddToList(true)}
                className="flex-1 md:flex-initial border border-[#D1B399] text-[#D1B399] hover:bg-[#D1B399]/5 rounded-lg py-3 px-4 font-medium flex items-center justify-center transition-colors"
              >
                <PlusCircle size={20} className="mr-2" />
                Add to List
              </button>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-[#D1B399]"><Globe size={20} /></a>
            <a href={`https://instagram.com/${restaurant.instagram}`} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-[#D1B399]"><Instagram size={20} /></a>
          </div>
        </div>
      </div>
      {/* Replaced What to Order with DishCards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="p-5">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What to Order</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockDishes.map(dish => (
              <DishCard key={dish.id} {...dish} />
            ))}
          </div>
        </div>
      </div>
      {/* Updated modal to close on outside click */}
      {showAddToList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAddToList(false)}>
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Add to List</h3>
            <p className="text-gray-600 mb-4">Select a list to add {restaurant.name} to:</p>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {["My Favorites", "Must Try", "West Village Gems"].map(list => (
                <div key={list} className="border border-gray-200 hover:border-[#D1B399] rounded-lg p-3 flex justify-between items-center cursor-pointer">
                  <span>{list}</span>
                  <PlusCircle size={18} className="text-[#D1B399]" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAddToList(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
              <button className="px-4 py-2 bg-[#D1B399] text-white rounded-lg hover:bg-[#c1a389]">Create New List</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetail;