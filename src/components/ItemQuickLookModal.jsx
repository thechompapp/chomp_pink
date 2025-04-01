// src/components/ItemQuickLookModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '@/components/UI/Modal';
import { Loader2, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '@/config';
import RestaurantCard from '@/components/UI/RestaurantCard';
import DishCard from '@/components/UI/DishCard';

// Placeholder for actual detail fetching
const fetchItemDetails = async (itemId, itemType) => {
  console.log(`[ItemQuickLookModal] Fetching details for ${itemType} ID: ${itemId}`);
  // ** TODO: Replace this with actual API call **
  // const endpoint = itemType === 'restaurant' ? \`/api/restaurants/\${itemId}\` : \`/api/dishes/\${itemId}\`;
  // const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`);
  // if (!response.ok) throw new Error(\`Failed fetch \${itemType} details\`);
  // return await response.json();

  // Simulate API call delay and return mock data
  await new Promise(resolve => setTimeout(resolve, 500));
  if (itemType === 'restaurant') {
    return { id: itemId, name: `Restaurant ${itemId} (Mock)`, neighborhood: 'Mock Hood', city: 'Mock City', tags: ['mock', 'data'], adds: 123 };
  } else if (itemType === 'dish') {
     return { id: itemId, name: `Dish ${itemId} (Mock)`, restaurant: `Mock Rest.`, restaurantId: `mock-rest-${itemId}`, tags: ['mock', 'data'], price: '$$', adds: 45 };
  } else { throw new Error(`Unknown item type: ${itemType}`); }
};

const ItemQuickLookModal = ({ isOpen, onClose, item }) => {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && item && item.id && item.type) {
      setIsLoading(true); setError(null); setDetails(null);
      console.log(`[ItemQuickLookModal useEffect] Fetch for:`, item);
      fetchItemDetails(item.id, item.type)
        .then(data => { setDetails(data); setError(null); })
        .catch(err => { console.error("Err fetch quick look:", err); setError(err.message || 'Failed load.'); setDetails(null); })
        .finally(() => setIsLoading(false));
    } else if (!isOpen) { setDetails(null); setIsLoading(false); setError(null); }
  }, [isOpen, item]);

  const renderContent = () => {
    if (isLoading) { return ( <div className="flex flex-col items-center justify-center h-64 text-gray-500"> <Loader2 className="animate-spin h-8 w-8 mb-2" /> Loading... </div> ); }
    if (error) { return ( <div className="flex flex-col items-center justify-center h-64 text-red-600"> <AlertTriangle className="h-8 w-8 mb-2" /> <p>Error:</p> <p className="text-sm text-center">{error}</p> </div> ); }
    if (!details) { return <div className="h-64 flex items-center justify-center text-gray-400">No details.</div>; }
    return ( <div className="flex justify-center items-center p-4 min-h-[200px]"> {item?.type === 'restaurant' && <RestaurantCard {...details} />} {item?.type === 'dish' && <DishCard {...details} />} {/* Handle unknown type maybe? */} </div> );
  };

  return ( <Modal isOpen={isOpen} onClose={onClose} title={`Quick Look: ${item?.name || 'Item'}`}> {renderContent()} </Modal> );
};

export default ItemQuickLookModal;