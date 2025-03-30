import React from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, MapPin, Star, Instagram, Globe } from "lucide-react";
import DishCard from "@/components/UI/DishCard"; // Use alias

const RestaurantDetail = () => {
  const { id } = useParams();

  // Sample data for the restaurant (replace with actual data fetching logic)
  const restaurant = {
    id: id || 1,
    name: "Joe's Pizza",
    neighborhood: "Greenwich Village",
    city: "New York",
    rating: 4.5,
    reviews: 120,
    tags: ["pizza", "italian"],
    website: "https://joespizza.com",
    instagram: "joespizzanyc",
    dishes: [
      { id: 1, name: "Margherita Pizza", restaurant: "Joe's Pizza", tags: ["pizza", "vegetarian"], price: "$$ • ", adds: 78 },
      { id: 2, name: "Pepperoni Pizza", restaurant: "Joe's Pizza", tags: ["pizza", "meat"], price: "$$ • ", adds: 65 },
      { id: 3, name: "Cheese Pizza", restaurant: "Joe's Pizza", tags: ["pizza", "classic"], price: "$$ • ", adds: 60 },
      { id: 4, name: "Veggie Pizza", restaurant: "Joe's Pizza", tags: ["pizza", "vegetarian"], price: "$$ • ", adds: 55 },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-[#D1B399] p-8 md:p-12">
        <Link to="/" className="flex items-center text-white hover:text-[#b89e89] mb-6">
          <ChevronLeft size={24} className="mr-2" />
          Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
          {restaurant.name}
        </h1>
        <div className="flex justify-center items-center text-white mb-4">
          <MapPin size={20} className="mr-2" />
          <span>{restaurant.neighborhood}, {restaurant.city}</span>
        </div>
        <div className="flex justify-center items-center text-white mb-6">
          <Star size={20} className="mr-2 text-yellow-400" />
          <span>{restaurant.rating} ({restaurant.reviews} reviews)</span>
        </div>
        <div className="flex justify-center gap-4">
          {restaurant.website && (
            <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#b89e89]">
              <Globe size={24} />
            </a>
          )}
          {restaurant.instagram && (
            <a href={`https://instagram.com/${restaurant.instagram}`} target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#b89e89]">
              <Instagram size={24} />
            </a>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
        {/* Tags */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {restaurant.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* What to Order Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">What to Order</h2>
          <div className="grid grid-cols-4 gap-6">
            {restaurant.dishes.map((dish, index) => (
              <DishCard key={`${dish.name}-${index}`} {...dish} restaurantId={restaurant.id} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;