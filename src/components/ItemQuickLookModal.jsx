// src/components/ItemQuickLookModal.jsx (Fetches real data)
import React, { useState, useEffect } from 'react';
import Modal from '@/components/UI/Modal';
import { Loader2, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '@/config';
import RestaurantCard from '@/components/UI/RestaurantCard';
import DishCard from '@/components/UI/DishCard';

// Fetches actual details from the API
const fetchItemDetails = async (itemId, itemType) => {
  console.log(`[ItemQuickLookModal] Fetching details for ${itemType} ID: ${itemId}`);
  if (!itemId || !itemType) {
      throw new Error("Item ID and type are required for fetching details.");
  }

  let endpoint = '';
  if (itemType === 'restaurant') {
    endpoint = `/api/restaurants/${itemId}`;
  } else if (itemType === 'dish') {
    endpoint = `/api/dishes/${itemId}`;
  } else {
    throw new Error(`Unknown item type: ${itemType}`);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[ItemQuickLookModal] Fetching URL: ${url}`);

  try {
      const response = await fetch(url);
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`[ItemQuickLookModal] API Error ${response.status}:`, errorData);
          throw new Error(errorData.error || `Failed to fetch ${itemType} details (${response.status})`);
      }
      const data = await response.json();
      console.log(`[ItemQuickLookModal] Received details for ${itemType} ${itemId}:`, data);
      return data;
  } catch (error) {
       console.error(`[ItemQuickLookModal] Fetch error for ${url}:`, error);
       throw error;
  }
};


const ItemQuickLookModal = ({ isOpen, onClose, item }) => {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !item || !item.id || !item.type) {
        setDetails(null); setIsLoading(false); setError(null);
        if (isOpen && (!item || !item.id || !item.type)) {
             console.warn("[ItemQuickLookModal useEffect] Modal opened with invalid item prop:", item);
             setError("Invalid item data provided for Quick Look.");
        }
        return;
    }

    setIsLoading(true); setError(null); setDetails(null);
    console.log(`[ItemQuickLookModal useEffect] Fetch triggered for: type=${item.type}, id=${item.id}`);

    fetchItemDetails(item.id, item.type)
      .then(data => { setDetails(data); setError(null); })
      .catch(err => { console.error("[ItemQuickLookModal useEffect] Error during fetch:", err); setError(err.message || `Failed to load ${item.type} details.`); setDetails(null); })
      .finally(() => { setIsLoading(false); });

  }, [isOpen, item]); // Effect dependencies

  const renderContent = () => { /* ... (Rendering logic remains the same) ... */ };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Quick Look: ${item?.name || 'Item'}`}>
      {renderContent()}
    </Modal>
  );
};

export default ItemQuickLookModal;