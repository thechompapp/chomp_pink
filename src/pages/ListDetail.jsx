import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

const ListDetail = () => {
  const { id } = useParams();
  const [showPopover, setShowPopover] = useState(false);
  const [items, setItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [sortMethod, setSortMethod] = useState('default');
  const popoverRef = useRef(null);
  
  // Example list data
  const list = {
    id: id,
    title: "Best Italian Spots in NYC",
    author: "@pastafan",
    authorName: "Maria C.",
    isOwnedByUser: true, // Set to true if this is the current user's list
    isPublic: true,
    followers: 423,
    created: "March 10, 2025",
    description: "A carefully curated collection of the most authentic Italian restaurants in New York City.",
    tags: ["italian", "pasta", "pizza", "nyc", "restaurants"],
    userLists: [
      { id: 101, name: "My Favorites" },
      { id: 102, name: "Places to Try" },
      { id: 103, name: "Date Night Ideas" }
    ]
  };

  // Fetch items data (mock)
  useEffect(() => {
    // This would be an API call in a real application
    const fetchedItems = [
      { id: 1, name: "Via Carota", type: "Restaurant", neighborhood: "West Village", rating: 4.8, signature: "Cacio e Pepe" },
      { id: 2, name: "Lilia", type: "Restaurant", neighborhood: "Williamsburg", rating: 4.7, signature: "Sheep's Milk Cheese Filled Agnolotti" },
      { id: 3, name: "Rezdôra", type: "Restaurant", neighborhood: "Flatiron", rating: 4.9, signature: "Pappardelle with Ragu Modenese" },
      { id: 4, name: "Piccola Cucina", type: "Restaurant", neighborhood: "SoHo", rating: 4.7, signature: "Pasta alla Norma" },
      { id: 5, name: "L'Artusi", type: "Restaurant", neighborhood: "West Village", rating: 4.8, signature: "Mushroom Pasta" },
      { id: 6, name: "Carbone", type: "Restaurant", neighborhood: "Greenwich Village", rating: 4.6, signature: "Spicy Rigatoni Vodka" }
    ];
    
    setItems(fetchedItems);
    setOriginalItems(fetchedItems);
  }, [id]);

  const handleAddAllToList = () => {
    setShowPopover(!showPopover);
  };

  const handleQuickAdd = (e, itemId) => {
    e.preventDefault();
    e.stopPropagation();
    // Logic to add item to list would go here
    console.log(`Quick adding item ${itemId}`);
  };

  const getDetailPageUrl = (item) => {
    if (item.type === "Restaurant") {
      return `/restaurant/${item.id}`;
    } else if (item.type === "Dish") {
      return `/dish/${item.id}`;
    }
    return "#";
  };

  const handleSortChange = (e) => {
    const method = e.target.value;
    setSortMethod(method);
    
    if (method === 'default') {
      setItems([...originalItems]);
      return;
    }
    
    const sortedItems = [...items];
    
    switch (method) {
      case 'name':
        sortedItems.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        sortedItems.sort((a, b) => b.rating - a.rating);
        break;
      case 'neighborhood':
        sortedItems.sort((a, b) => a.neighborhood.localeCompare(b.neighborhood));
        break;
      default:
        break;
    }
    
    setItems(sortedItems);
  };
  
  // Simple reorder function
  const moveItem = (fromIndex, toIndex) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(newItems);
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
        <Link to="/mylists" className="text-gray-600 hover:text-gray-900 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to My Lists
        </Link>
      </div>

      {/* List Header */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{list.title}</h1>
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <span>Created by {list.author}</span>
              <span className="mx-1.5">•</span>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                {list.followers} followers
              </span>
              <span className="mx-1.5">•</span>
              <span>{list.isPublic ? 'Public' : 'Private'}</span>
            </div>
            <p className="mt-2 text-gray-600 text-sm">{list.description}</p>
          </div>
          <div className="flex">
            {!list.isOwnedByUser && (
              <div className="relative">
                <button
                  onClick={handleAddAllToList}
                  className="bg-white border border-pink-500 text-pink-500 px-3 py-1.5 rounded-lg text-sm flex items-center hover:bg-pink-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add All to My List
                </button>
                
                {showPopover && (
                  <div 
                    ref={popoverRef} 
                    className="absolute right-0 top-10 bg-white p-4 shadow-lg rounded-lg w-48 z-10 border border-gray-200"
                  >
                    <p className="text-sm font-medium mb-2">Select a list:</p>
                    {list.userLists.map(userList => (
                      <button 
                        key={userList.id}
                        className="w-full text-left py-2 px-3 hover:bg-gray-100 rounded mb-1 text-sm"
                      >
                        {userList.name}
                      </button>
                    ))}
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button className="w-full text-left py-2 px-3 text-pink-500 hover:bg-pink-50 rounded text-sm">
                        + Create New List
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!list.isOwnedByUser && (
              <button className="ml-2 bg-pink-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center hover:bg-pink-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                Follow
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-3 flex flex-wrap gap-1.5">
          {list.tags.map((tag, index) => (
            <span key={index} className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* List Items */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">{items.length} Items</h2>
          <div className="flex items-center">
            <label htmlFor="sortOrder" className="mr-2 text-sm text-gray-600">Sort by:</label>
            <select 
              id="sortOrder"
              value={sortMethod}
              onChange={handleSortChange}
              className="text-sm border border-gray-300 rounded p-1 bg-white"
            >
              <option value="default">Default order</option>
              <option value="name">Name (A-Z)</option>
              <option value="rating">Highest rated</option>
              <option value="neighborhood">Neighborhood</option>
            </select>
          </div>
        </div>
        
        <ul className="divide-y divide-gray-200">
          {items.map((item, index) => (
            <li key={item.id} className="hover:bg-gray-50">
              <Link to={getDetailPageUrl(item)} className="block">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center">
                    {list.isOwnedByUser && (
                      <div className="flex mr-3 space-x-1 text-gray-400">
                        {index > 0 && (
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              moveItem(index, index - 1);
                            }}
                            className="hover:text-pink-500"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                        {index < items.length - 1 && (
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              moveItem(index, index + 1);
                            }}
                            className="hover:text-pink-500"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <div className="flex items-center text-xs text-gray-600 mt-1">
                        <span>{item.type}</span>
                        {item.neighborhood && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{item.neighborhood}</span>
                          </>
                        )}
                        {item.rating && (
                          <>
                            <span className="mx-1">•</span>
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-500 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {item.rating}
                            </span>
                          </>
                        )}
                        {item.signature && (
                          <>
                            <span className="mx-1">•</span>
                            <span className="text-pink-600">Known for: {item.signature}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {!list.isOwnedByUser && (
                    <button
                      onClick={(e) => handleQuickAdd(e, item.id)}
                      className="text-pink-500 hover:text-pink-700 text-lg font-medium"
                    >
                      +
                    </button>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ListDetail;
