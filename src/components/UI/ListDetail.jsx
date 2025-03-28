import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Share2, MapPin, Instagram, ExternalLink, ChevronLeft, SortAsc, SortDesc, CalendarDays } from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';

const ListDetail = () => {
  const { id } = useParams();
  const [list, setList] = useState(null);
  const [sortMethod, setSortMethod] = useState('default');
  const [isOwner, setIsOwner] = useState(true); // In a real app, you would check if the user is the owner
  const [isPublic, setIsPublic] = useState(false);
  
  const userLists = useAppStore((state) => state.userLists);
  const updateListVisibility = useAppStore((state) => state.updateListVisibility);
  
  useEffect(() => {
    // Find the list by id
    const foundList = userLists.find(list => list.id === parseInt(id));
    if (foundList) {
      setList(foundList);
      setIsPublic(foundList.isPublic || false);
    }
  }, [id, userLists]);
  
  const handleToggleVisibility = () => {
    const newVisibility = !isPublic;
    setIsPublic(newVisibility);
    if (updateListVisibility) {
      updateListVisibility(parseInt(id), newVisibility);
    }
  };
  
  const getSortedItems = () => {
    if (!list || !list.items) return [];
    
    const items = [...list.items];
    
    switch (sortMethod) {
      case 'a-z':
        return items.sort((a, b) => a.name.localeCompare(b.name));
      case 'z-a':
        return items.sort((a, b) => b.name.localeCompare(a.name));
      case 'date':
        return items.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
      case 'default':
      default:
        return items;
    }
  };
  
  if (!list) {
    return <div className="p-8 text-center">List not found</div>;
  }
  
  const listType = list.listType || (list.items && list.items.length > 0 && list.items[0].restaurant ? 'dishes' : 'restaurants');
  const sortedItems = getSortedItems();

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Back button */}
      <Link to="/lists" className="inline-flex items-center text-gray-600 hover:text-[#D1B399] my-4 transition-colors">
        <ChevronLeft size={20} className="mr-1" />
        Back to lists
      </Link>
      
      {/* List header */}
      <div className="bg-white rounded-xl border border-[#D1B399]/20 mb-6">
        <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{list.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                listType === 'restaurants' 
                  ? 'bg-pink-100 text-pink-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {listType === 'restaurants' ? 'Restaurants' : 'Dishes'}
              </span>
            </div>
            
            <p className="text-gray-500 mt-1">{list.items.length} {list.items.length === 1 ? 'item' : 'items'}</p>
          </div>
          
          <div className="flex mt-4 md:mt-0 items-center space-x-3">
            {/* Sort buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setSortMethod('a-z')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center ${
                  sortMethod === 'a-z'
                    ? 'bg-[#D1B399] text-white'
                    : 'bg-white text-gray-700 hover:bg-[#D1B399]/10 border border-[#D1B399]/20'
                }`}
              >
                <SortAsc size={16} className="mr-1" />
                A-Z
              </button>
              <button
                onClick={() => setSortMethod('z-a')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center ${
                  sortMethod === 'z-a'
                    ? 'bg-[#D1B399] text-white'
                    : 'bg-white text-gray-700 hover:bg-[#D1B399]/10 border border-[#D1B399]/20'
                }`}
              >
                <SortDesc size={16} className="mr-1" />
                Z-A
              </button>
              <button
                onClick={() => setSortMethod('date')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center ${
                  sortMethod === 'date'
                    ? 'bg-[#D1B399] text-white'
                    : 'bg-white text-gray-700 hover:bg-[#D1B399]/10 border border-[#D1B399]/20'
                }`}
              >
                <CalendarDays size={16} className="mr-1" />
                Date
              </button>
            </div>
            
            {/* Visibility toggle and share button */}
            <div className="flex space-x-2">
              {/* Visibility toggle (only for owner) */}
              {isOwner && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{isPublic ? 'Public' : 'Private'}</span>
                  <button 
                    onClick={handleToggleVisibility} 
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                      isPublic ? 'bg-[#D1B399]' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                      isPublic ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              )}
              
              {/* Share button */}
              <button className="p-2 text-gray-600 hover:text-[#D1B399] border border-gray-200 rounded-lg hover:border-[#D1B399] transition-colors">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* List items */}
      <div className="space-y-4 mb-12">
        {sortedItems.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-xl border border-[#D1B399]/20">
            <p className="text-gray-500">This list is empty</p>
          </div>
        ) : (
          sortedItems.map((item, index) => (
            <div key={item.name} className="bg-white p-4 rounded-xl border border-[#D1B399]/20 flex justify-between">
              <div className="flex">
                <div className="w-8 h-8 bg-[#D1B399]/10 rounded-full flex items-center justify-center mr-3 text-[#D1B399] font-medium">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                  {item.restaurant ? (
                    <p className="text-sm text-gray-600">at {item.restaurant}</p>
                  ) : (
                    <p className="text-sm text-gray-600">{item.neighborhood}, {item.city}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.tags && item.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs text-gray-500">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* External links */}
              <div className="flex space-x-2 items-start">
                <a 
                  href={`https://maps.google.com/?q=${item.name} ${item.city || ''}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-1.5 text-gray-500 hover:text-[#D1B399] transition-colors" 
                  title="View on Google Maps"
                >
                  <MapPin size={16} />
                </a>
                <a 
                  href={`https://www.instagram.com/explore/tags/${encodeURIComponent(item.name.replace(/\s+/g, ''))}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-1.5 text-gray-500 hover:text-[#D1B399] transition-colors" 
                  title="Find on Instagram"
                >
                  <Instagram size={16} />
                </a>
                <a 
                  href={`https://www.yelp.com/search?find_desc=${encodeURIComponent(item.name)}&find_loc=${encodeURIComponent(item.city || '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-1.5 text-gray-500 hover:text-[#D1B399] transition-colors" 
                  title="Find on Yelp"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ListDetail;