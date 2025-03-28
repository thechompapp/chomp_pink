import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Star, PlusCircle, MapPin, Clock, Phone, Globe, Instagram, ThumbsUp, ThumbsDown } from 'lucide-react';

const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [review, setReview] = useState(null);
  const [activeTab, setActiveTab] = useState('getting-there');
  const [featuredLists, setFeaturedLists] = useState([]);
  const [similarPlaces, setSimilarPlaces] = useState([]);
  const [showAddToList, setShowAddToList] = useState(false);

  useEffect(() => {
    // In a real app, fetch restaurant data from API
    // This is mock data based on the screenshot
    const fetchRestaurant = async () => {
      const mockRestaurant = {
        id,
        name: "Piccola Cucina",
        rating: 4.7,
        category: "Italian",
        location: "Soho, NYC",
        address: "196 Spring St, New York, NY 10012",
        addressDetail: "(Soho, near Spring St & Sullivan St)",
        transitDirections: "Take the C/E train to Spring St, or the 1 train to Houston St",
        tags: ["italian", "sicilian", "pasta", "seafood", "wine"],
        phone: "(212) 625-3200",
        website: "www.piccolacucinagroup.com",
        hours: "12:00 PM - 11:00 PM"
      };
      setRestaurant(mockRestaurant);

      // Mock review data
      const mockReview = {
        text: "Piccola Cucina offers an authentic slice of Sicily in SoHo. The intimate space may be cramped, but that's part of its charm - it captures the bustling energy of a true Italian trattoria. Their seafood dishes are the standouts here, particularly the grilled octopus and spaghetti alle vongole. The pasta is perfectly al dente and the seafood is impeccably fresh. Don't miss their cannoli for dessert - it's the real deal, not overly sweet and with a perfectly crisp shell. Service can be a bit hectic during peak hours, but the staff is passionate and knowledgeable about the menu. The wine selection, while not extensive, is well-curated with excellent Sicilian options. A true neighborhood gem worth the wait.",
        author: "Alex Rossini",
        username: "@nycfoodcritic",
        verified: true,
        date: "February 12, 2025",
        likes: 528,
        neutral: 41,
        dislikes: 7
      };
      setReview(mockReview);

      // Mock featured lists
      const mockLists = [
        { id: 1, name: "Best Italian in NYC", author: "@pastafan", followers: 423 },
        { id: 2, name: "SoHo Hidden Gems", author: "@localfoodie", followers: 189 },
        { id: 3, name: "Worth the Wait", author: "@nycfoodie", followers: 568 }
      ];
      setFeaturedLists(mockLists);

      // Mock similar restaurants
      const mockSimilar = [
        { id: 101, name: "Carbone", distance: "0.8m" },
        { id: 102, name: "Via Carota", distance: "0.4m" },
        { id: 103, name: "Osteria Morini", distance: "0.9m" }
      ];
      setSimilarPlaces(mockSimilar);
    };

    fetchRestaurant();
  }, [id]);

  if (!restaurant) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse text-[#D1B399]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-12">
      {/* Back button */}
      <Link to="/search" className="inline-flex items-center text-gray-600 hover:text-[#D1B399] my-4 transition-colors">
        <ChevronLeft size={20} className="mr-1" />
        Back to search
      </Link>
      
      {/* Restaurant header card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="p-5">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
              
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Star size={18} className="text-yellow-400 fill-yellow-400 mr-1" />
                  <span className="font-medium">{restaurant.rating}</span>
                </div>
                <span>•</span>
                <span>{restaurant.category}</span>
                <span>•</span>
                <span>{restaurant.location}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {restaurant.tags.map(tag => (
                  <div key={tag} className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                    #{tag}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-initial bg-[#D1B399] hover:bg-[#c1a389] text-white rounded-lg py-3 px-4 font-medium flex items-center justify-center transition-colors">
                <div className="mr-2">👁️</div>
                Visit
              </button>
              <button 
                onClick={() => setShowAddToList(true)}
                className="flex-1 md:flex-initial border border-[#D1B399] text-[#D1B399] hover:bg-[#D1B399]/5 rounded-lg py-3 px-4 font-medium flex items-center justify-center transition-colors"
              >
                <PlusCircle size={20} className="mr-2" />
                Add to List
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* The Take (Review) Section */}
      {review && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">The Take</h2>
              <div className="flex items-center">
                <span className="text-gray-700 font-medium">{review.author}</span>
                <span className="mx-1">•</span>
                <span className="text-gray-500">{review.username}</span>
                {review.verified && (
                  <div className="ml-1 text-blue-500 bg-blue-100 rounded-full p-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-gray-700 mb-4">{review.text}</p>
            
            <div className="flex justify-between items-center text-sm">
              <div className="text-gray-500">{review.date}</div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <ThumbsUp size={16} className="text-gray-500" />
                  <span>{review.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>—</span>
                  <span>{review.neutral}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsDown size={16} className="text-gray-500" />
                  <span>{review.dislikes}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              className={`py-3 px-5 font-medium text-sm border-b-2 ${
                activeTab === 'getting-there' ? 'border-[#D1B399] text-[#D1B399]' : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('getting-there')}
            >
              Getting There
            </button>
            <button
              className={`py-3 px-5 font-medium text-sm border-b-2 ${
                activeTab === 'what-to-order' ? 'border-[#D1B399] text-[#D1B399]' : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('what-to-order')}
            >
              What to Order
            </button>
          </div>
        </div>
        
        <div className="p-5">
          {activeTab === 'getting-there' && (
            <div>
              <h2 className="font-bold text-gray-900 mb-3">Contact</h2>
              <div className="grid grid-cols-12 gap-2 mb-4">
                <div className="col-span-3 text-gray-500">Phone:</div>
                <div className="col-span-9">{restaurant.phone}</div>
                
                <div className="col-span-3 text-gray-500">Website:</div>
                <div className="col-span-9">
                  <a href={`https://${restaurant.website}`} target="_blank" rel="noopener noreferrer"
                    className="text-[#D1B399] hover:underline">
                    {restaurant.website}
                  </a>
                </div>
                
                <div className="col-span-3 text-gray-500">Hours:</div>
                <div className="col-span-9">{restaurant.hours}</div>
              </div>
              
              <h2 className="font-bold text-gray-900 mt-6 mb-3">Location & Getting There</h2>
              <div className="text-gray-700 mb-2">
                {restaurant.address} <span className="text-gray-500">{restaurant.addressDetail}</span>
              </div>
              <div className="flex items-start gap-2 text-gray-700">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                <span>{restaurant.transitDirections}</span>
              </div>
              
              {/* Map placeholder */}
              <div className="mt-4 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                Map would go here
              </div>
            </div>
          )}
          
          {activeTab === 'what-to-order' && (
            <div className="text-gray-700">
              <p>This content would include recommended dishes, specialties, and other ordering information.</p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 hover:border-[#D1B399] transition-colors">
                  <h3 className="font-bold text-gray-900 mb-1">Spaghetti alla Vongole</h3>
                  <p className="text-gray-500 text-sm mb-2">$28 • Signature dish</p>
                  <p className="text-sm">Fresh clams in a white wine and garlic sauce with al dente spaghetti.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:border-[#D1B399] transition-colors">
                  <h3 className="font-bold text-gray-900 mb-1">Sicilian Arancini</h3>
                  <p className="text-gray-500 text-sm mb-2">$16 • Appetizer</p>
                  <p className="text-sm">Crispy rice balls filled with ragù, peas, and mozzarella.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:border-[#D1B399] transition-colors">
                  <h3 className="font-bold text-gray-900 mb-1">Branzino al Forno</h3>
                  <p className="text-gray-500 text-sm mb-2">$34 • Main course</p>
                  <p className="text-sm">Whole Mediterranean sea bass roasted with herbs and lemon.</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 hover:border-[#D1B399] transition-colors">
                  <h3 className="font-bold text-gray-900 mb-1">Cannoli Siciliani</h3>
                  <p className="text-gray-500 text-sm mb-2">$12 • Dessert</p>
                  <p className="text-sm">Traditional Sicilian pastry filled with sweet ricotta cream and pistachios.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Instagram link */}
          <div className="mt-6 flex justify-end">
            <a
              href="https://www.instagram.com/piccolacucina/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D1B399] p-2 rounded-full hover:bg-[#D1B399]/10 transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={24} />
            </a>
          </div>
        </div>
      </div>
      
      {/* Featured on Lists */}
      {featuredLists.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <div className="p-5">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Featured on Lists</h2>
            <div className="space-y-3">
              {featuredLists.map(list => (
                <div key={list.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-[#D1B399] hover:text-[#c1a389] transition-colors">
                        {list.name}
                      </h3>
                      <div className="text-sm text-gray-500">Created by {list.author}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-500">{list.followers} followers</div>
                      <button className="text-[#D1B399]">
                        <PlusCircle size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Similar Places */}
      {similarPlaces.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Similar Places</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {similarPlaces.map(place => (
                <div key={place.id} className="border border-gray-100 rounded-lg p-3 hover:border-[#D1B399] transition-colors">
                  <Link to={`/restaurant/${place.id}`} className="font-medium text-gray-800 hover:text-[#D1B399]">
                    {place.name}
                  </Link>
                  <div className="text-gray-500 text-sm">{place.distance}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Add to list modal (simplified for example) */}
      {showAddToList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-5">
            <h3 className="text-lg font-bold mb-4">Add to List</h3>
            <p className="text-gray-600 mb-4">Select a list to add this restaurant to:</p>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {[
                "My Favorites", 
                "Must Try Restaurants", 
                "SoHo Hotspots",
                "Italian Tour",
                "Date Night Spots"
              ].map(list => (
                <div key={list} className="border border-gray-200 hover:border-[#D1B399] rounded-lg p-3 flex justify-between items-center cursor-pointer">
                  <span>{list}</span>
                  <PlusCircle size={18} className="text-[#D1B399]" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowAddToList(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-[#D1B399] text-white rounded-lg hover:bg-[#c1a389]">
                Create New List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetail;