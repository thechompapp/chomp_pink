import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Star, PlusCircle, ThumbsUp, ThumbsDown, Instagram } from 'lucide-react';

const DishDetail = () => {
  const { id } = useParams();
  const [dish, setDish] = useState(null);
  const [review, setReview] = useState(null);
  const [featuredLists, setFeaturedLists] = useState([]);
  const [similarDishes, setSimilarDishes] = useState([]);
  const [showAddToList, setShowAddToList] = useState(false);

  useEffect(() => {
    // In a real app, fetch dish data from API
    // This is mock data based on the screenshot
    const fetchDish = async () => {
      const mockDish = {
        id,
        name: "Cacio e Pepe",
        restaurant: "Via Carota",
        restaurantId: "via-carota",
        rating: 4.9,
        category: "Pasta",
        price: "$24",
        location: "West Village, NYC",
        tags: ["pasta", "italian", "signature", "vegetarian"],
      };
      setDish(mockDish);

      // Mock review data
      const mockReview = {
        text: "The Cacio e Pepe at Via Carota represents the pinnacle of simple pasta perfection. The handmade spaghetti has ideal texture - a proper al dente with substantial bite. The sauce achieves that elusive creamy consistency without becoming gluey, a common pitfall with this dish. The chef uses an aged Pecorino Romano that delivers a sharp, complex flavor that balances perfectly with the generous amount of freshly cracked black pepper. What elevates this beyond other versions in the city is the restraint - no added ingredients or unnecessary flourishes, just the traditional three components executed flawlessly. Worth the wait, though I recommend visiting on weekday evenings to avoid the weekend crowds.",
        author: "Maria Rossi",
        username: "@pastaexpert",
        verified: true,
        date: "March 18, 2025",
        likes: 724,
        neutral: 53,
        dislikes: 12
      };
      setReview(mockReview);

      // Mock featured lists
      const mockLists = [
        { id: 1, name: "Best Pasta in NYC", author: "@pastafan", followers: 423 },
        { id: 2, name: "Simple but Perfect Dishes", author: "@minimalchef", followers: 286 },
        { id: 3, name: "Must Try in West Village", author: "@nycfoodie", followers: 568 }
      ];
      setFeaturedLists(mockLists);

      // Mock similar dishes
      const mockSimilar = [
        { id: 101, name: "Carbonara at Lilia", price: "$22" },
        { id: 102, name: "Tagliatelle al Ragù at L'Artusi", price: "$26" },
        { id: 103, name: "Bucatini all'Amatriciana at I Sodi", price: "$24" }
      ];
      setSimilarDishes(mockSimilar);
    };

    fetchDish();
  }, [id]);

  if (!dish) {
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
      
      {/* Dish header card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="p-5">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{dish.name}</h1>
              <div className="text-[#D1B399] font-medium">at {dish.restaurant}</div>
              
              <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Star size={18} className="text-yellow-400 fill-yellow-400 mr-1" />
                  <span className="font-medium">{dish.rating}</span>
                </div>
                <span>•</span>
                <span>{dish.category}</span>
                <span>•</span>
                <span>{dish.price}</span>
                <span>•</span>
                <span>{dish.location}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {dish.tags.map(tag => (
                  <div key={tag} className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                    #{tag}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-initial bg-[#D1B399] hover:bg-[#c1a389] text-white rounded-lg py-3 px-4 font-medium flex items-center justify-center transition-colors">
                <div className="mr-2">🍽️</div>
                Order
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
      
      {/* The Take (Review) */}
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
      
      {/* Similar Dishes */}
      {similarDishes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Similar Dishes</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {similarDishes.map(similar => (
                <div key={similar.id} className="border border-gray-100 rounded-lg p-3 hover:border-[#D1B399] transition-colors">
                  <Link to={`/dish/${similar.id}`} className="font-medium text-gray-800 hover:text-[#D1B399]">
                    {similar.name}
                  </Link>
                  <div className="text-gray-500 text-sm">{similar.price}</div>
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
            <p className="text-gray-600 mb-4">Select a list to add this dish to:</p>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {[
                "My Favorites", 
                "Must Try", 
                "West Village Gems",
                "Italian Specialties",
                "Pasta Love"
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

export default DishDetail;