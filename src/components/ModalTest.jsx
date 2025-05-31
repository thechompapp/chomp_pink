import React, { useState } from 'react';
import EnhancedListModal from '@/components/modals/EnhancedListModal';
import ListCard from '@/pages/Lists/ListCard';

const ModalTest = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const testList = {
    id: 1,
    name: "Test Restaurant List",
    description: "This is a test list for modal functionality",
    user_id: 1,
    creator_handle: "testuser",
    item_count: 5,
    list_type: "restaurant",
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: 1,
        name: "Test Restaurant 1",
        restaurant_name: "Test Restaurant 1",
        city_name: "New York",
        item_type: "restaurant"
      },
      {
        id: 2,
        name: "Test Restaurant 2", 
        restaurant_name: "Test Restaurant 2",
        city_name: "Los Angeles",
        item_type: "restaurant"
      }
    ]
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Modal Test</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Direct Modal Test</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Open Test Modal Directly
        </button>

        <EnhancedListModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          list={testList}
          onShare={(listData) => {
            console.log('Sharing list:', listData);
          }}
        />
      </div>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">ListCard Component Test</h2>
        <p className="text-sm text-gray-600 mb-4">
          Click on the list card below to test the modal functionality:
        </p>
        <div className="max-w-sm">
          <ListCard 
            list={testList}
            onQuickAdd={(item) => console.log('Quick add:', item)}
          />
        </div>
      </div>
    </div>
  );
};

export default ModalTest; 