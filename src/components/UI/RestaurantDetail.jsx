import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Clock, Phone, Globe, Instagram, ChevronLeft, Share2, Bookmark, Heart, Menu } from 'lucide-react';
import QuickAddPopup from '../QuickAdd/QuickAddPopup';

// In a real app, you would fetch this data from an API
const getRestaurantData = (id) => {
  return {
    id,
    name: "Joe's Pizza",
    rating: 4.7,
    ratingCount: 1243,
    priceRange: "$$",
    cuisines: ["Pizza", "Italian"],
    address: "7 Carmine St, New York, NY 10014",
    neighborhood: "Greenwich Village",
    city: "New York",
    hours: [
      { day: "Monday", hours: "11:00 AM - 10:00 PM" },
      { day: "Tuesday", hours: "11:00 AM - 10:00 PM" },
      { day: "Wednesday", hours: "11:00 AM - 10:00 PM" },
      { day: "Thursday", hours: "11:00 AM - 10:00 PM" },
      { day: "Friday", hours: "11:00 AM - 11:00 PM" },
      { day: "Saturday", hours: "11:00 AM - 11:00 PM" },
      { day: "Sunday", hours: "11:00 AM - 10:00 PM" }
    ],
    phone: "(212) 366-1182",
    website: "http://www.joespizzanyc.com",
    instagram: "@joespizzanyc",
    description: "Joe's Pizza is a Greenwich Village institution offering classic NY-style thin crust pizza by the slice or pie since 1975.",
    popularDishes: [
      { id: 101, name: "Classic Cheese Slice", price: "$3.50", tags: ["classic", "vegetarian"] },
      { id: 102, name: "Pepperoni Slice", price: "$4.00", tags: ["popular", "meat"] },
      { id: 103, name: "Fresh Mozzarella Slice", price: "$4.50", tags: ["specialty", "vegetarian"] },
      { id: 104, name: "Sicilian Slice", price: "$4.00", tags: ["thick crust"] }
    ],
    images: [
      "https://via.placeholder.com/800x600/FF5F6D/FFFFFF?text=Joe's+Pizza+1",
      "https://via.placeholder.com/800x600/FF5F6D/FFFFFF?text=Joe's+Pizza+2",
      "https://via.placeholder.com/800x600/FF5F6D/FFFFFF?text=Joe's+Pizza+3",
      "https://via.placeholder.com/800x600/FF5F6D/FFFFFF?text=Joe's+Pizza+4"
    ],
    tags: ["pizza", "italian", "local favorite", "quick bite", "takeout"]
  };
};

const RestaurantDetail = () => {
  const { id } = useParams();
  const restaurant = getRestaurantData(id);
  
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Get today's day name
  const today = new Date().toLocaleString('en-us', { weekday: 'long' });
  const todayHours = restaurant.hours.find(h => h.day === today)?.hours || "Closed";

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Back button */}
      <Link to="/" className="inline-flex items-center text-gray-600 hover:text-pink-500 mb-4 transition-colors">
        <ChevronLeft size={20} className="mr-1" />
        Back to results
      </Link>
      
      {/* Image gallery */}
      <div className="relative rounded-xl overflow-hidden mb-6 bg-gray-100 h-64 md:h-96">
        <img 
          src={restaurant.images[activeImageIndex]}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        
        {/* Image navigation dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
          {restaurant.images.map((img, index) => (
            <button
              key={index}
              onClick={() => setActiveImageIndex(index)}
              className={`w-2 h-2 rounded-full ${
                index === activeImageIndex ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`View image ${index + 1}`}
            />
          ))}
        </div>
        
        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className={`p-2 rounded-full ${
              isLiked ? 'bg-pink-500 text-white' : 'bg-white/90 text-gray-700'
            } hover:shadow-md transition-all`}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <Heart size={20} fill={isLiked ? "white" : "none"} />
          </button>
          <button 
            onClick={() => setIsSaved(!isSaved)}
            className={`p-2 rounded-full ${
              isSaved ? 'bg-blue-500 text-white' : 'bg-white/90 text-gray-700'
            } hover:shadow-md transition-all`}
            aria-label={isSaved ? "Unsave" : "Save"}
          >
            <Bookmark size={20} fill={isSaved ? "white" : "none"} />
          </button>
          <button 
            className="p-2 rounded-full bg-white/90 text-gray-700 hover:shadow-md transition-all"
            aria-label="Share"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>
      
      {/* Restaurant info header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
            <div className="flex items-center text-gray-700 mb-1">
              <Star size={18} className="text-yellow-500 mr-1" fill="#F59E0B" />
              <span className="font-medium mr-1">{restaurant.rating}</span>
              <span className="text-gray-500">({restaurant.ratingCount} reviews)</span>
              <span className="mx-2">•</span>
              <span>{restaurant.priceRange}</span>
            </div>
            <div className="flex flex-wrap text-gray-600 mb-1">
              {restaurant.cuisines.map((cuisine, index) => (
                <React.Fragment key={cuisine}>
                  <span>{cuisine}</span>
                  {index < restaurant.cuisines.length - 1 && <span className="mx-1">•</span>}
                </React.Fragment>
              ))}
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin size={16} className="mr-1" />
              <span>{restaurant.neighborhood}, {restaurant.city}</span>
            </div>
          </div>
          
          <button
            onClick={() => setShowQuickAdd(true)}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-lg hover:from-pink-600 hover:to-orange-500 transition-colors shadow-sm flex items-center"
          >
            <Menu size={16} className="mr-2" />
            Add to List
          </button>
        </div>
      </div>
      
      {/* Restaurant details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-3">About</h2>
            <p className="text-gray-700">{restaurant.description}</p>
          </div>
          
          {/* Popular dishes */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Popular Dishes</h2>
            <div className="space-y-4">
              {restaurant.popularDishes.map(dish => (
                <div key={dish.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div>
                    <h3 className="font-medium text-gray-900">{dish.name}</h3>
                    <div className="flex space-x-2">
                      {dish.tags.map(tag => (
                        <span key={tag} className="text-xs text-gray-500">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{dish.price}</div>
                    <button className="text-xs text-pink-500 hover:text-pink-600">+ Add</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Tags */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {restaurant.tags.map(tag => (
                <span 
                  key={tag} 
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right column - Info sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm space-y-4">
            {/* Hours */}
            <div>
              <div 
                className="flex justify-between items-center cursor-pointer" 
                onClick={() => setShowHours(!showHours)}
              >
                <div className="flex items-center text-gray-700">
                  <Clock size={18} className="mr-2" />
                  <span>Hours</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {showHours ? "Hide" : "Show all"}
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Today: {todayHours}
              </div>
              
              {/* All hours */}
              {showHours && (
                <div className="mt-2 text-sm space-y-1 border-t pt-2">
                  {restaurant.hours.map(({ day, hours }) => (
                    <div key={day} className="flex justify-between">
                      <span className={day === today ? "font-medium" : ""}>{day}</span>
                      <span>{hours}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Contact */}
            <div className="pt-2 border-t">
              <div className="flex items-center text-gray-700 mb-2">
                <Phone size={18} className="mr-2" />
                <span>Contact</span>
              </div>
              <div className="ml-7 space-y-2 text-sm">
                <div>
                  <a href={`tel:${restaurant.phone}`} className="text-blue-600 hover:text-blue-800">
                    {restaurant.phone}
                  </a>
                </div>
                <div>
                  <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-800">
                    <Globe size={14} className="mr-1" />
                    Website
                  </a>
                </div>
                <div>
                  <a href={`https://instagram.com/${restaurant.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-800">
                    <Instagram size={14} className="mr-1" />
                    {restaurant.instagram}
                  </a>
                </div>
              </div>
            </div>
            
            {/* Location */}
            <div className="pt-2 border-t">
              <div className="flex items-center text-gray-700 mb-2">
                <MapPin size={18} className="mr-2" />
                <span>Location</span>
              </div>
              <div className="ml-7 space-y-2 text-sm">
                <p className="text-gray-600">{restaurant.address}</p>
                <div className="h-32 bg-gray-200 rounded-lg overflow-hidden mt-2">
                  {/* This would be a map in a real app */}
                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                    Map placeholder
                  </div>
                </div>
                <button className="mt-2 w-full py-2 px-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                  Get Directions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick add popup */}
      {showQuickAdd && (
        <QuickAddPopup 
          item={restaurant} 
          onClose={() => setShowQuickAdd(false)} 
        />
      )}
    </div>
  );
};

export default RestaurantDetail;