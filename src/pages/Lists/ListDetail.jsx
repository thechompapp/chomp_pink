import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Instagram, MapPin, Share2, Globe } from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';

const ListDetail = () => {
  const { id } = useParams();
  const userLists = useAppStore((state) => state.userLists);
  const updateListVisibility = useAppStore((state) => state.updateListVisibility);
  const [list, setList] = useState(null);
  const [sortMethod, setSortMethod] = useState('default');

  useEffect(() => {
    const foundList = userLists.find(l => l.id === Number(id));
    setList(foundList);
  }, [id, userLists]);

  const handleToggleVisibility = () => {
    if (list) {
      updateListVisibility(list.id, !list.isPublic);
      setList({ ...list, isPublic: !list.isPublic });
    }
  };

  const getSortedItems = () => {
    if (!list || !list.items) return [];
    const itemsToSort = [...list.items];
    switch (sortMethod) {
      case 'a-z': return itemsToSort.sort((a, b) => a.name.localeCompare(b.name));
      case 'z-a': return itemsToSort.sort((a, b) => b.name.localeCompare(a.name));
      case 'date': return itemsToSort.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
      default: return itemsToSort;
    }
  };

  if (!list) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-pulse text-[#D1B399]">Loading...</div></div>;
  }

  const sortedItems = getSortedItems();

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-12">
      <Link to="/lists" className="inline-flex items-center text-gray-600 hover:text-[#D1B399] my-4 transition-colors">
        <ChevronLeft size={20} className="mr-1" />
        Back to lists
      </Link>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{list.name}</h1>
        <p className="text-gray-600 mb-4">{list.items.length} {list.items.length === 1 ? 'item' : 'items'}</p>
        <div className="flex flex-wrap gap-4 mb-4">
          <button onClick={() => setSortMethod('a-z')} className={`px-3 py-1 rounded-full text-sm font-medium ${sortMethod === 'a-z' ? 'bg-[#D1B399] text-white' : 'bg-gray-100 text-gray-700 hover:bg-[#D1B399]/10'}`}>A-Z</button>
          <button onClick={() => setSortMethod('z-a')} className={`px-3 py-1 rounded-full text-sm font-medium ${sortMethod === 'z-a' ? 'bg-[#D1B399] text-white' : 'bg-gray-100 text-gray-700 hover:bg-[#D1B399]/10'}`}>Z-A</button>
          <button onClick={() => setSortMethod('date')} className={`px-3 py-1 rounded-full text-sm font-medium ${sortMethod === 'date' ? 'bg-[#D1B399] text-white' : 'bg-gray-100 text-gray-700 hover:bg-[#D1B399]/10'}`}>Date Added</button>
        </div>
        {/* Added padding */}
        <div className="pt-6 flex items-center gap-4">
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input type="checkbox" id="togglePublic" checked={list.isPublic} onChange={handleToggleVisibility} className="toggle-checkbox absolute opacity-0 w-0 h-0" />
            <label htmlFor="togglePublic" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer">
              <span className={`toggle-inner absolute block w-4 h-4 mt-1 ml-1 rounded-full bg-white shadow transition-transform duration-300 ease-in-out ${list.isPublic ? 'translate-x-4 bg-[#D1B399]' : 'translate-x-0'}`}></span>
            </label>
          </div>
          <span className="text-sm text-gray-700">{list.isPublic ? 'Public' : 'Private'}</span>
          <button className="ml-4 p-2 bg-[#D1B399] text-white rounded-full hover:bg-[#c1a389] transition-colors"><Share2 size={20} /></button>
          {/* Modernized icons */}
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-[#D1B399]/10 text-[#D1B399] rounded-full hover:bg-[#D1B399]/20 transition-colors"><Instagram size={20} /></a>
          <a href="https://yelp.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-[#D1B399]/10 text-[#D1B399] rounded-full hover:bg-[#D1B399]/20 transition-colors"><Globe size={20} /></a>
          <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-[#D1B399]/10 text-[#D1B399] rounded-full hover:bg-[#D1B399]/20 transition-colors"><MapPin size={20} /></a>
        </div>
      </div>
      <div className="space-y-4">
        {sortedItems.map((item, index) => (
          <div key={index} className="bg-white rounded-xl border border-[#D1B399]/20 p-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
              {item.restaurant && <p className="text-sm text-gray-600">at {item.restaurant}</p>}
              {item.neighborhood && <p className="text-sm text-gray-600">{item.neighborhood}, {item.city}</p>}
            </div>
            <div className="flex items-center gap-2">
              {item.tags && item.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 border border-[#D1B399] rounded-full text-xs text-gray-600">#{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListDetail;