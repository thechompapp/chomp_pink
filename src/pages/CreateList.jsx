import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const CreateList = () => {
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [itemType, setItemType] = useState('restaurant');
  const [tags, setTags] = useState('');
  const [sortMethod, setSortMethod] = useState('default');

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    
    const newItemObject = {
      id: Date.now(),
      name: newItem,
      type: itemType,
      tags: tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean)
    };
    
    setItems([...items, newItemObject]);
    setNewItem('');
    setTags('');
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ title, isPublic, items });
    alert('List created successfully!');
  };

  const handleSortChange = (e) => {
    const method = e.target.value;
    setSortMethod(method);
    
    if (method === 'default') return;
    
    const sortedItems = [...items];
    
    switch (method) {
      case 'name':
        sortedItems.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'type':
        sortedItems.sort((a, b) => a.type.localeCompare(b.type));
        break;
      default:
        break;
    }
    
    setItems(sortedItems);
    setSortMethod('default');
  };

  const moveItem = (fromIndex, toIndex) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(newItems);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* App Header */}
      <div className="flex justify-between items-center py-4 mb-6">
        <div className="text-2xl font-bold text-pink-500">chomp</div>
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-gray-700 hover:text-gray-900">Home</Link>
          <Link to="/trending" className="text-gray-700 hover:text-gray-900">Trending</Link>
          <Link to="/mylists" className="text-gray-700 hover:text-gray-900">My Lists</Link>
          <Link to="/createlist" className="bg-gradient-to-r from-pink-500 to-orange-400 text-white py-2 px-4 rounded-full hover:from-pink-600 hover:to-orange-500 transition font-medium">
            Create a List
          </Link>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700">
            <span>U</span>
          </div>
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New List</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            List Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            placeholder="My Favorite Pizza Places"
            required
          />
        </div>

        <div>
          <div className="flex items-center">
            <input
              id="public"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
            />
            <label htmlFor="public" className="ml-2 block text-sm text-gray-700">
              Make this list public
            </label>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Public lists can be seen by anyone and will appear in search results.
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h2 className="text-lg font-medium text-gray-700 mb-3">Add Items to Your List</h2>
          
          <div className="grid grid-cols-1 gap-y-4">
            <div>
              <label htmlFor="itemType" className="block text-sm font-medium text-gray-700">
                Item Type
              </label>
              <select
                id="itemType"
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md"
              >
                <option value="restaurant">Restaurant</option>
                <option value="dish">Dish</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="item" className="block text-sm font-medium text-gray-700">
                {itemType === 'restaurant' ? 'Restaurant Name' : 'Dish Name'}
              </label>
              <input
                type="text"
                id="item"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                placeholder={itemType === 'restaurant' ? "Joe's Pizza" : "Margherita Pizza"}
              />
            </div>
            
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                Tags (comma separated)
              </label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                placeholder="italian, pizza, nyc"
              />
            </div>
            
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              Add to List
            </button>
          </div>
        </div>

        {items.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-700">Current Items</h3>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Sort by:</span>
                <select
                  value={sortMethod}
                  onChange={handleSortChange}
                  className="text-sm border border-gray-300 rounded py-1 px-2"
                >
                  <option value="default">Default order</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="type">Type</option>
                </select>
                <span className="ml-4 text-sm text-gray-500">
                  (Use arrows to reorder)
                </span>
              </div>
            </div>

            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
              {items.map((item, index) => (
                <li key={item.id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                  <div className="w-0 flex-1 flex items-center">
                    <div className="flex mr-2 space-x-1 text-gray-400">
                      {index > 0 && (
                        <button 
                          onClick={() => moveItem(index, index - 1)}
                          className="hover:text-pink-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                      {index < items.length - 1 && (
                        <button 
                          onClick={() => moveItem(index, index + 1)}
                          className="hover:text-pink-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <span className="ml-2 flex-1 w-0 truncate">
                      {item.name}
                      <span className="ml-2 text-gray-500 text-xs">
                        ({item.type})
                      </span>
                    </span>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <button
            type="submit"
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            Create List
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateList;
