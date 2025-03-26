import React, { useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import FloatingQuickAdd from '../components/FloatingQuickAdd';

// Reusable Similar Place Card Component
const SimilarPlaceCard = ({ name, distance, cuisine, rating, onQuickAdd }) => (
  <div className="border border-gray-200 rounded-lg p-3 hover:border-pink-200 hover:bg-pink-50">
    <h3 className="font-medium">{name} ({distance})</h3>
    <div className="text-xs text-gray-600 mt-1">{cuisine}</div>
    <div className="mt-2 flex justify-between items-center">
      <div className="flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-yellow-500 mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span className="text-xs ml-1">{rating}</span>
      </div>
      <button
        className="text-pink-500 text-lg hover:text-pink-700"
        onClick={onQuickAdd}
        aria-label={`Quick add ${name}`}
      >
        +
      </button>
    </div>
  </div>
);

// Reusable Featured List Card Component
const FeaturedListCard = ({ list, onQuickAdd }) => (
  <div className="flex justify-between items-center border border-gray-200 rounded-lg p-3 hover:border-pink-200 hover:bg-pink-50">
    <Link to={`/list/${list.id}`} className="flex-1">
      <h3 className="font-medium text-pink-600">{list.name}</h3>
      <div className="flex justify-between items-center mt-1 text-xs text-gray-600">
        <span>Created by {list.by}</span>
        <span>{list.followers} followers</span>
      </div>
    </Link>
    <button
      onClick={(e) => onQuickAdd(e, list.id, 'list')}
      className="text-pink-500 hover:text-pink-700 text-lg font-medium ml-2"
      aria-label={`Quick add ${list.name}`}
    >
      +
    </button>
  </div>
);

const RestaurantDetail = () => {
  const { id } = useParams();
  const [kbygSection, setKbygSection] = useState('directions');
  
  // Example restaurant data
  const restaurant = {
    id: id,
    name: "Piccola Cucina",
    type: "Restaurant",
    cuisine: "Italian",
    address: "196 Spring St, New York, NY 10012",
    neighborhood: "Soho",
    crossStreets: "Spring St & Sullivan St",
    subwayDirections: "Take the C/E train to Spring St, or the 1 train to Houston St",
    city: "NYC",
    phone: "(212) 625-3200",
    hours: "12:00 PM - 11:00 PM",
    website: "https://www.piccolacucinagroup.com",
    instagram: "@piccolacucinanyc",
    rating: 4.7,
    reviews: 236,
    distance: "0.7m",
    topDishes: [
      { id: 101, name: "Pasta alla Norma", tags: ["pasta", "signature"], adds: 342 },
      { id: 102, name: "Branzino al Sale", tags: ["seafood", "special"], adds: 267 },
      { id: 103, name: "Tiramisu", tags: ["dessert", "popular"], adds: 198 },
    ],
    tags: ["italian", "sicilian", "pasta", "seafood", "wine"],
    lists: [
      { id: 201, name: "Best Italian in NYC", by: "@pastafan", followers: 423 },
      { id: 202, name: "SoHo Hidden Gems", by: "@localfoodie", followers: 189 },
      { id: 203, name: "Worth the Wait", by: "@nycfoodie", followers: 568 },
    ],
    similarPlaces: [
      { name: "Carbone", distance: "0.8m", cuisine: "Italian", rating: 4.6 },
      { name: "Via Carota", distance: "0.4m", cuisine: "Italian", rating: 4.8 },
      { name: "Osteria Morini", distance: "0.9m", cuisine: "Italian", rating: 4.5 },
    ],
  };

  const handleQuickAdd = useCallback((e, itemId, itemType) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Quick adding ${itemType} ${itemId}`);
  }, []);

  const handleAddToList = (id, type) => {
    console.log(`Adding ${type} ${id} to list`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* App Header */}
      <div className="flex justify-between items-center py-4 mb-4">
        <Link to="/" className="w-full flex justify-center">
          <div className="text-center">
            <img
              src="/logo-placeholder.png"
              alt="Chomp Logo"
              className="h-10 w-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='40' viewBox='0 0 100 40'%3E%3Crect width='100' height='40' fill='%23f472b6'%3E%3C/rect%3E%3Ctext x='50' y='25' font-family='Arial' font-size='16' text-anchor='middle' fill='white'%3Echomp%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
        </Link>
      </div>
      
      <div className="flex items-center space-x-6 mb-4 overflow-x-auto py-2 px-4 scrollbar-hide">
        <Link to="/" className="text-gray-700 hover:text-gray-900 whitespace-nowrap">Home</Link>
        <Link to="/trending" className="text-gray-700 hover:text-gray-900 whitespace-nowrap">Trending</Link>
        <Link to="/nightplanner" className="text-gray-700 hover:text-gray-900 whitespace-nowrap">Night Planner</Link>
        <Link to="/mylists" className="text-gray-700 hover:text-gray-900 whitespace-nowrap">My Lists</Link>
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 flex-shrink-0">
          <span>U</span>
        </div>
      </div>
      
      {/* Back Navigation */}
      <div className="mb-4">
        <Link to="/" className="text-gray-600 hover:text-gray-900 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to search
        </Link>
      </div>

      {/* Restaurant Header */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
            <div className="flex items-center mt-2 text-sm text-gray-600">
              <span className="flex items-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {restaurant.rating}
              </span>
              <span className="mr-3">•</span>
              <span className="mr-3">{restaurant.cuisine}</span>
              <span className="mr-3">•</span>
              <span>{restaurant.neighborhood}, {restaurant.city}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {restaurant.tags.map((tag, index) => (
                <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex mt-4 md:mt-0">
            <button className="bg-pink-500 text-white px-4 py-2 rounded-lg mr-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              Visit
            </button>
            <button
              onClick={() => handleAddToList(restaurant.id, 'restaurant')}
              className="bg-white border border-pink-500 text-pink-500 px-4 py-2 rounded-lg flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
              Add to List
            </button>
          </div>
        </div>
      </div>

      {/* KBYG Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setKbygSection('directions')}
              className={`px-4 py-3 text-sm font-medium ${
                kbygSection === 'directions'
                  ? 'bg-pink-50 border-b-2 border-pink-500 text-pink-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Getting There
            </button>
            <button
              onClick={() => setKbygSection('order')}
              className={`px-4 py-3 text-sm font-medium ${
                kbygSection === 'order'
                  ? 'bg-pink-50 border-b-2 border-pink-500 text-pink-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              What to Order
            </button>
          </nav>
        </div>
        <div className="p-4">
          {kbygSection === 'directions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">Contact</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div className="text-gray-500">Phone:</div>
                    <div>{restaurant.phone}</div>
                    <div className="text-gray-500">Website:</div>
                    <div>
                      <a
                        href={restaurant.website}
                        className="text-pink-500 hover:text-pink-700 truncate block"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {restaurant.website.replace('https://', '')}
                      </a>
                    </div>
                    <div className="text-gray-500">Hours:</div>
                    <div>{restaurant.hours}</div>
                  </div>
                </div>
                <a
                  href={`https://instagram.com/${restaurant.instagram.substring(1)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-shrink-0 bg-gradient-to-r from-pink-500 to-orange-400 text-white p-2 rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Location & Getting There</h3>
                <div className="text-sm space-y-1.5">
                  <p>
                    <span className="font-medium text-gray-700">{restaurant.address}</span>
                    <span className="text-gray-500 ml-1">
                      ({restaurant.neighborhood}, near {restaurant.crossStreets})
                    </span>
                  </p>
                  <p className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-1 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h2a1 1 0 00.9-.55l4-8a1 1 0 00-.94-1.45H5a1 1 0 00-1 1v1zm1 7V6a1 1 0 011-1h6.5l-3.25 6.5H4z" />
                    </svg>
                    <span className="text-gray-700">{restaurant.subwayDirections}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
          {kbygSection === 'order' && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Most Popular Dishes</h3>
              <div className="grid gap-3">
                {restaurant.topDishes.map((dish, index) => (
                  <Link
                    key={index}
                    to={`/dish/${dish.id}`}
                    className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:border-pink-200 hover:bg-pink-50"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{dish.name}</h4>
                      <div className="flex items-center mt-1 text-xs">
                        <span className="text-pink-600">+{dish.adds} adds</span>
                        <span className="mx-1.5">•</span>
                        <div className="flex gap-1">
                          {dish.tags.map((tag, idx) => (
                            <span key={idx} className="text-gray-500">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button className="text-pink-500 text-lg font-medium ml-2">+</button>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Featured on Lists */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Featured on Lists</h2>
        </div>
        <div className="p-4 grid gap-3">
          {restaurant.lists.map((list, index) => (
            <FeaturedListCard key={index} list={list} onQuickAdd={handleQuickAdd} />
          ))}
        </div>
      </div>

      {/* Similar Places */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Similar Places</h2>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {restaurant.similarPlaces.map((place, index) => (
            <SimilarPlaceCard
              key={index}
              name={place.name}
              distance={place.distance}
              cuisine={place.cuisine}
              rating={place.rating}
              onQuickAdd={(e) => handleQuickAdd(e, place.name, 'restaurant')}
            />
          ))}
        </div>
      </div>

      {/* Floating Quick Add Button */}
      <FloatingQuickAdd />

      {/* Custom CSS for scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default RestaurantDetail;
