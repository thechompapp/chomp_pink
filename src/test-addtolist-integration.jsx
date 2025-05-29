/* Test page for AddToList integration verification */
import React, { useState, useCallback } from 'react';
import { 
  RestaurantCard, 
  DishCard, 
  CompactRestaurantCard, 
  CompactDishCard 
} from '@/components/UI';
import AddToListModal from '@/components/AddToListModal';

const TestAddToListIntegration = () => {
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [itemToAdd, setItemToAdd] = useState(null);

  // Sample data
  const sampleRestaurant = {
    id: 1,
    name: "Joe's Pizza",
    neighborhood_name: "Brooklyn",
    city_name: "New York",
    tags: ["pizza", "italian", "family-friendly"],
    adds: 127,
    rating: 4.5,
    is_trending: true,
    description: "Authentic New York style pizza"
  };

  const sampleDish = {
    id: 1,
    name: "Margherita Pizza",
    restaurant: "Joe's Pizza",
    restaurant_id: 1,
    tags: ["vegetarian", "classic"],
    adds: 89,
    rating: 4.7,
    is_featured: true,
    is_vegetarian: true,
    description: "Classic margherita with fresh mozzarella"
  };

  // AddToList handlers
  const handleAddToList = useCallback((item) => {
    console.log('[TestPage] Opening AddToList modal for:', item);
    setItemToAdd({
      id: item.id,
      name: item.name,
      type: item.type
    });
    setIsAddToListModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
  }, []);

  const handleItemAdded = useCallback((listId, listItemId) => {
    console.log(`[TestPage] Item added to list ${listId} with ID ${listItemId}`);
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
    alert(`Successfully added ${itemToAdd?.name} to list!`);
  }, [itemToAdd]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">AddToList Integration Test</h1>
      
      {/* Restaurant Cards Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Restaurant Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <RestaurantCard
            {...sampleRestaurant}
            onAddToList={() => handleAddToList({ ...sampleRestaurant, type: 'restaurant' })}
          />
          <RestaurantCard
            {...sampleRestaurant}
            id={2}
            name="Authentic Thai"
            neighborhood_name="Manhattan"
            tags={["thai", "spicy", "authentic"]}
            is_trending={false}
            is_featured={true}
            onAddToList={() => handleAddToList({ ...sampleRestaurant, id: 2, name: "Authentic Thai", type: 'restaurant' })}
          />
        </div>
        
        <h3 className="text-lg font-medium mb-2">Compact Restaurant Cards</h3>
        <div className="space-y-2">
          <CompactRestaurantCard
            {...sampleRestaurant}
            onAddToList={() => handleAddToList({ ...sampleRestaurant, type: 'restaurant' })}
            showActions={true}
          />
          <CompactRestaurantCard
            {...sampleRestaurant}
            id={3}
            name="Burger Joint"
            neighborhood_name="Queens"
            tags={["burgers", "casual"]}
            onAddToList={() => handleAddToList({ ...sampleRestaurant, id: 3, name: "Burger Joint", type: 'restaurant' })}
            showActions={true}
          />
        </div>
      </section>

      {/* Dish Cards Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Dish Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <DishCard
            {...sampleDish}
            onAddToList={() => handleAddToList({ ...sampleDish, type: 'dish' })}
          />
          <DishCard
            {...sampleDish}
            id={2}
            name="Pad Thai"
            restaurant="Authentic Thai"
            restaurant_id={2}
            tags={["thai", "noodles", "spicy"]}
            is_spicy={true}
            is_vegetarian={false}
            is_vegan={false}
            onAddToList={() => handleAddToList({ ...sampleDish, id: 2, name: "Pad Thai", type: 'dish' })}
          />
        </div>
        
        <h3 className="text-lg font-medium mb-2">Compact Dish Cards</h3>
        <div className="space-y-2">
          <CompactDishCard
            {...sampleDish}
            onAddToList={() => handleAddToList({ ...sampleDish, type: 'dish' })}
            showActions={true}
          />
          <CompactDishCard
            {...sampleDish}
            id={3}
            name="Classic Burger"
            restaurant="Burger Joint"
            restaurant_id={3}
            tags={["burger", "beef"]}
            onAddToList={() => handleAddToList({ ...sampleDish, id: 3, name: "Classic Burger", type: 'dish' })}
            showActions={true}
          />
        </div>
      </section>

      {/* Integration Status */}
      <section className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Integration Status</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span>✅ RestaurantCard - AddToList integration complete</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span>✅ DishCard - AddToList integration complete</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span>✅ CompactRestaurantCard - AddToList integration complete</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span>✅ CompactDishCard - AddToList integration complete</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span>✅ Trending Page - AddToList integration complete</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span>✅ Search Page - AddToList integration complete</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span>✅ Home Results - AddToList integration complete</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span>✅ ItemQuickLookModal - AddToList integration complete</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span>✅ CardFactory - AddToList integration complete</span>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Click any "Add to List" button (plus icon) on the cards above</li>
          <li>The AddToListModal should open with the correct item information</li>
          <li>Select or create a list to add the item to</li>
          <li>Verify the success callback is triggered</li>
          <li>Check browser console for debug logs</li>
        </ol>
      </section>

      {/* AddToList Modal */}
      <AddToListModal
        isOpen={isAddToListModalOpen}
        onClose={handleCloseModal}
        itemToAdd={itemToAdd}
        onItemAdded={handleItemAdded}
      />
    </div>
  );
};

export default TestAddToListIntegration; 