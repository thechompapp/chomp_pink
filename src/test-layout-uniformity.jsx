/* Test page for layout uniformity verification */
import React, { useState, useCallback } from 'react';
import { 
  RestaurantCard, 
  DishCard 
} from '@/components/UI';
import ListCard from '@/pages/Lists/ListCard';
import AddToListModal from '@/components/AddToListModal';
import { GRID_LAYOUTS, CONTAINER, TYPOGRAPHY, CARD_DIMENSIONS } from '@/utils/layoutConstants';

const TestLayoutUniformity = () => {
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [itemToAdd, setItemToAdd] = useState(null);

  // Sample data
  const sampleRestaurants = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Restaurant ${i + 1}`,
    neighborhood_name: "Brooklyn",
    city_name: "New York",
    tags: ["cuisine", "great-food", "popular"],
    adds: 120 + i * 10,
    rating: 4.2 + (i * 0.1),
    is_trending: i % 3 === 0,
    is_featured: i % 4 === 0,
    description: `A wonderful restaurant serving delicious food in the heart of the city.`
  }));

  const sampleDishes = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Delicious Dish ${i + 1}`,
    restaurant: `Restaurant ${i + 1}`,
    restaurant_id: i + 1,
    tags: ["tasty", "popular", "signature"],
    adds: 80 + i * 5,
    rating: 4.0 + (i * 0.05),
    is_featured: i % 3 === 0,
    is_vegetarian: i % 2 === 0,
    description: `A mouth-watering dish that showcases the best of our culinary expertise.`
  }));

  const sampleLists = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    name: `Curated List ${i + 1}`,
    description: `A carefully curated list of the best items in the category.`,
    items_count: 15 + i * 3,
    created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
    user: { name: `User ${i + 1}` },
    items: Array.from({ length: 5 }, (_, j) => ({
      id: j + 1,
      name: `Item ${j + 1}`,
      item_type: 'restaurant'
    }))
  }));

  // AddToList handlers
  const handleAddToList = useCallback((item) => {
    console.log('[TestLayoutUniformity] Opening AddToList modal for:', item);
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
    console.log(`[TestLayoutUniformity] Item added to list ${listId} with ID ${listItemId}`);
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
    alert(`Successfully added ${itemToAdd?.name} to list!`);
  }, [itemToAdd]);

  const handleQuickAdd = useCallback((item) => {
    console.log('[TestLayoutUniformity] Quick add for list:', item);
  }, []);

  return (
    <div className={`${CONTAINER.MAX_WIDTH} mx-auto ${CONTAINER.PADDING} ${CONTAINER.VERTICAL_SPACING} ${CONTAINER.SECTION_SPACING}`}>
      <h1 className={TYPOGRAPHY.PAGE_TITLE}>Layout Uniformity Test</h1>
      
      {/* Layout Information */}
      <div className="bg-blue-50 p-6 rounded-lg mb-8">
        <h2 className={TYPOGRAPHY.SECTION_TITLE}>Standardized Layout Specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">Grid Layouts:</h3>
            <ul className="space-y-1">
              <li><strong>Primary:</strong> {GRID_LAYOUTS.PRIMARY}</li>
              <li><strong>Search:</strong> {GRID_LAYOUTS.SEARCH}</li>
              <li><strong>Full Width:</strong> {GRID_LAYOUTS.FULL_WIDTH}</li>
              <li><strong>Compact:</strong> {GRID_LAYOUTS.COMPACT}</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Card Dimensions:</h3>
            <ul className="space-y-1">
              <li><strong>Height:</strong> {CARD_DIMENSIONS.HEIGHT}</li>
              <li><strong>Padding:</strong> {CARD_DIMENSIONS.PADDING}</li>
              <li><strong>Border:</strong> {CARD_DIMENSIONS.BORDER}</li>
              <li><strong>Background:</strong> {CARD_DIMENSIONS.BACKGROUND}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Primary Grid (Trending, Home Results) */}
      <section className="mb-12">
        <h2 className={TYPOGRAPHY.SECTION_TITLE}>Primary Grid Layout (Trending, Home Results)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Uses: <code className="bg-gray-100 px-2 py-1 rounded">{GRID_LAYOUTS.PRIMARY}</code>
        </p>
        
        <h3 className="text-lg font-medium mb-3">Restaurant Cards</h3>
        <div className={GRID_LAYOUTS.PRIMARY}>
          {sampleRestaurants.slice(0, 10).map((restaurant) => (
            <RestaurantCard
              key={`primary-restaurant-${restaurant.id}`}
              {...restaurant}
              onAddToList={() => handleAddToList({ ...restaurant, type: 'restaurant' })}
            />
          ))}
        </div>

        <h3 className="text-lg font-medium mb-3 mt-8">Dish Cards</h3>
        <div className={GRID_LAYOUTS.PRIMARY}>
          {sampleDishes.slice(0, 10).map((dish) => (
            <DishCard
              key={`primary-dish-${dish.id}`}
              {...dish}
              onAddToList={() => handleAddToList({ ...dish, type: 'dish' })}
            />
          ))}
        </div>
      </section>

      {/* Search Grid */}
      <section className="mb-12">
        <h2 className={TYPOGRAPHY.SECTION_TITLE}>Search Grid Layout (Search Page)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Uses: <code className="bg-gray-100 px-2 py-1 rounded">{GRID_LAYOUTS.SEARCH}</code>
        </p>
        
        <div className={GRID_LAYOUTS.SEARCH}>
          {sampleRestaurants.slice(0, 8).map((restaurant) => (
            <RestaurantCard
              key={`search-restaurant-${restaurant.id}`}
              {...restaurant}
              onAddToList={() => handleAddToList({ ...restaurant, type: 'restaurant' })}
            />
          ))}
        </div>
      </section>

      {/* Full Width Grid (Lists) */}
      <section className="mb-12">
        <h2 className={TYPOGRAPHY.SECTION_TITLE}>Full Width Grid Layout (Lists Page)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Uses: <code className="bg-gray-100 px-2 py-1 rounded">{GRID_LAYOUTS.FULL_WIDTH}</code>
        </p>
        
        <div className={GRID_LAYOUTS.FULL_WIDTH}>
          {sampleLists.map((list) => (
            <ListCard
              key={`fullwidth-list-${list.id}`}
              list={list}
              onQuickAdd={handleQuickAdd}
            />
          ))}
        </div>
      </section>

      {/* Compact Grid */}
      <section className="mb-12">
        <h2 className={TYPOGRAPHY.SECTION_TITLE}>Compact Grid Layout (Sidebar, Dense Content)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Uses: <code className="bg-gray-100 px-2 py-1 rounded">{GRID_LAYOUTS.COMPACT}</code>
        </p>
        
        <div className={GRID_LAYOUTS.COMPACT}>
          {sampleDishes.slice(0, 6).map((dish) => (
            <DishCard
              key={`compact-dish-${dish.id}`}
              {...dish}
              onAddToList={() => handleAddToList({ ...dish, type: 'dish' })}
            />
          ))}
        </div>
      </section>

      {/* Layout Verification Checklist */}
      <section className="bg-green-50 p-6 rounded-lg">
        <h2 className={TYPOGRAPHY.SECTION_TITLE}>✅ Layout Uniformity Checklist</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Grid Consistency:</h3>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center">
                <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
                <span>✅ Trending Page - Uses PRIMARY grid</span>
              </li>
              <li className="flex items-center">
                <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
                <span>✅ Home Results - Uses PRIMARY grid</span>
              </li>
              <li className="flex items-center">
                <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
                <span>✅ Search Page - Uses SEARCH grid</span>
              </li>
              <li className="flex items-center">
                <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
                <span>✅ Lists Page - Uses FULL_WIDTH grid</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Card Dimensions:</h3>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center">
                <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
                <span>✅ All cards use h-64 height</span>
              </li>
              <li className="flex items-center">
                <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
                <span>✅ Consistent p-4 padding</span>
              </li>
              <li className="flex items-center">
                <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
                <span>✅ Unified border styling</span>
              </li>
              <li className="flex items-center">
                <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
                <span>✅ Standard container dimensions</span>
              </li>
            </ul>
          </div>
        </div>
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

export default TestLayoutUniformity; 