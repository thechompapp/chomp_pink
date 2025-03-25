import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const DishDetail = () => {
  const { id } = useParams();
  const [voteStatus, setVoteStatus] = useState(null); // null, 'upvote', 'meh', 'downvote'
  
  // Example dish data
  const dish = {
    id: id,
    name: "Cacio e Pepe",
    restaurant: "Via Carota",
    description: "A classic Roman pasta dish featuring spaghetti tossed with Pecorino Romano cheese and freshly ground black pepper. The simplicity of ingredients highlights the chef's technique and the quality of the pasta.",
    price: "$24",
    category: "Pasta",
    address: "51 Grove St, New York, NY 10014",
    neighborhood: "West Village",
    city: "NYC",
    distance: "0.4m",
    rating: 4.9,
    reviews: 156,
    tags: ["pasta", "italian", "signature", "vegetarian"],
    lists: [
      { name: "Best Pasta in NYC", by: "@pastafan", followers: 423 },
      { name: "Simple but Perfect Dishes", by: "@minimalchef", followers: 286 },
      { name: "Must Try in West Village", by: "@nycfoodie", followers: 568 }
    ],
    similarDishes: [
      { name: "Carbonara at Lilia", price: "$22", rating: 4.7 },
      { name: "Tagliatelle al Ragù at L'Artusi", price: "$26", rating: 4.8 },
      { name: "Bucatini all'Amatriciana at I Sodi", price: "$24", rating: 4.6 }
    ],
    theTake: {
      author: "Maria Rossi",
      profile: "@pastaexpert",
      verified: true,
      text: "The Cacio e Pepe at Via Carota represents the pinnacle of simple pasta perfection. The handmade spaghetti has ideal texture - a proper al dente with substantial bite. The sauce achieves that elusive creamy consistency without becoming gluey, a common pitfall with this dish. The chef uses an aged Pecorino Romano that delivers a sharp, complex flavor that balances perfectly with the generous amount of freshly cracked black pepper. What elevates this beyond other versions in the city is the restraint - no added ingredients or unnecessary flourishes, just the traditional three components executed flawlessly. Worth the wait, though I recommend visiting on weekday evenings to avoid the weekend crowds.",
      votes: {
        upvotes: 724,
        mehs: 53,
        downvotes: 12
      },
      date: "March 18, 2025"
    }
  };

  const handleVote = (vote) => {
    setVoteStatus(vote);
    // In a real app, would send this to a backend
    console.log(`Voted ${vote} for dish ${dish.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* App Header */}
      <div className="flex justify-between items-center py-4 mb-4">
        <div className="text-2xl font-bold text-pink-500">chomp</div>
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-gray-700 hover:text-gray-900">Home</Link>
          <Link to="/trending" className="text-gray-700 hover:text-gray-900">Trending</Link>
          <Link to="/mylists" className="text-gray-700 hover:text-gray-900">My Lists</Link>
          <Link to="/createlist" className="bg-gradient-to-r from-pink-500 to-orange-400 text-white py-2 px-4 rounded-full hover:from-pink-600 hover:to-orange-500 transition">
            Create a List
          </Link>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700">
            <span>U</span>
          </div>
        </div>
      </div>
      
      {/* Back Navigation */}
      <div className="mb-4">
        <Link to="/" className="text-gray-600 hover:text-gray-900 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to search
        </Link>
      </div>

      {/* Dish Header */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{dish.name}</h1>
            <Link to={`/restaurant/${dish.restaurant.toLowerCase().replace(/\s+/g, '-')}`} className="text-xl text-pink-600 mt-1 block hover:text-pink-800">
              at {dish.restaurant}
            </Link>
            <div className="flex items-center mt-2 text-sm text-gray-600">
              <span className="flex items-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {dish.rating}
              </span>
              <span className="mr-3">•</span>
              <span className="mr-3">{dish.category}</span>
              <span className="mr-3">•</span>
              <span className="mr-3">{dish.price}</span>
              <span className="mr-3">•</span>
              <span>{dish.neighborhood}, {dish.city}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {dish.tags.map((tag, index) => (
                <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex mt-4 md:mt-0">
            <button className="bg-pink-500 text-white px-4 py-2 rounded-lg mr-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
              Order
            </button>
            <button className="bg-white border border-pink-500 text-pink-500 px-4 py-2 rounded-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
              Add to List
            </button>
          </div>
        </div>
      </div>

      {/* Dish Description */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <p className="text-gray-700">{dish.description}</p>
      </div>

      {/* The Take Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">The Take</h2>
          <div className="flex items-center text-sm">
            <span className="font-medium text-gray-700">{dish.theTake.author}</span>
            <span className="mx-1 text-gray-500">•</span>
            <span className="text-gray-500">{dish.theTake.profile}</span>
            {dish.theTake.verified && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
        <div className="p-4">
          <p className="text-gray-700 mb-4">{dish.theTake.text}</p>
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-500">{dish.theTake.date}</div>
            <div className="flex items-center space-x-3 bg-gray-100 rounded-full px-3 py-1">
              <button 
                onClick={() => handleVote('upvote')}
                className={`flex items-center ${voteStatus === 'upvote' ? 'text-green-600 font-medium' : 'text-gray-500 hover:text-green-600'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                {dish.theTake.votes.upvotes + (voteStatus === 'upvote' ? 1 : 0)}
              </button>
              <button 
                onClick={() => handleVote('meh')}
                className={`flex items-center ${voteStatus === 'meh' ? 'text-yellow-600 font-medium' : 'text-gray-500 hover:text-yellow-600'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                {dish.theTake.votes.mehs + (voteStatus === 'meh' ? 1 : 0)}
              </button>
              <button 
                onClick={() => handleVote('downvote')}
                className={`flex items-center ${voteStatus === 'downvote' ? 'text-red-600 font-medium' : 'text-gray-500 hover:text-red-600'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {dish.theTake.votes.downvotes + (voteStatus === 'downvote' ? 1 : 0)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Lists */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Featured on Lists</h2>
        </div>
        <div className="p-4">
          <div className="grid gap-3">
            {dish.lists.map((list, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 hover:border-pink-200 hover:bg-pink-50">
                <h3 className="font-medium text-pink-600">{list.name}</h3>
                <div className="flex justify-between items-center mt-1 text-xs text-gray-600">
                  <span>Created by {list.by}</span>
                  <span>{list.followers} followers</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Similar Dishes */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Similar Dishes</h2>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {dish.similarDishes.map((similar, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 hover:border-pink-200 hover:bg-pink-50">
              <h3 className="font-medium">{similar.name}</h3>
              <div className="text-xs text-gray-600 mt-1">{similar.price}</div>
              <div className="mt-2 flex justify-between items-center">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs ml-1">{similar.rating}</span>
                </div>
                <button className="text-pink-500 text-sm">+</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DishDetail;
