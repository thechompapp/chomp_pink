/* Test page for card uniformity verification */
import React, { useState, useCallback } from 'react';
import { 
  RestaurantCard, 
  DishCard,
  ListCard,
  CardFactory
} from '@/components/UI';
import AddToListModal from '@/components/AddToListModal';
import { GRID_LAYOUTS, CARD_SPECS } from '@/utils/layoutConstants';

const TestCardUniformity = () => {
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [itemToAdd, setItemToAdd] = useState(null);

  // Sample data with all possible fields for testing
  const sampleRestaurant = {
    id: 1,
    name: 'La Bella Vista Restaurant',
    neighborhood_name: "Little Italy",
    city_name: "New York",
    description: "Authentic Italian cuisine with a modern twist, featuring fresh ingredients and traditional recipes passed down through generations.",
    tags: ["italian", "fine-dining", "romantic", "pasta", "wine"],
    adds: 247,
    rating: 4.7,
    is_trending: true,
    is_featured: true,
    website: "https://labellavista.com",
    phone: "+1-555-0123",
    hours: "Open until 11 PM",
    image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
    price_range: "$$$"
  };

  const sampleDish = {
    id: 2,
    name: 'Truffle Risotto alla Milanese',
    restaurant: 'La Bella Vista Restaurant',
    restaurant_id: 1,
    description: "Creamy Arborio rice cooked with saffron, finished with black truffle shavings and aged Parmigiano-Reggiano cheese.",
    tags: ["risotto", "truffle", "italian", "vegetarian", "premium"],
    price: "$38.00",
    adds: 156,
    rating: 4.8,
    is_featured: true,
    is_vegetarian: true,
    is_vegan: false,
    is_spicy: false,
    prep_time: "25 mins",
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
    spice_level: 0
  };

  const sampleList = {
    id: 3,
    name: 'Best Fine Dining in NYC',
    description: 'A curated collection of the finest restaurants in New York City for special occasions and memorable dining experiences.',
    list_type: 'recommendations',
    tags: ["fine-dining", "nyc", "special-occasions", "date-night", "michelin"],
    items: [
      { id: 1, name: 'La Bella Vista Restaurant', item_type: 'restaurant' },
      { id: 2, name: 'Truffle Risotto alla Milanese', item_type: 'dish' },
      { id: 3, name: 'Le Bernardin', item_type: 'restaurant' }
    ],
    items_count: 12,
    view_count: 1847,
    follow_count: 234,
    comment_count: 89,
    is_trending: true,
    is_featured: true,
    is_public: true,
    is_following: false,
    can_follow: true,
    user: {
      id: 101,
      name: 'Chef Maria Rodriguez',
      username: 'chef_maria',
      avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=100'
    },
    created_by_user: false,
    cover_image_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400',
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  };

  // Multiple instances for grid testing
  const restaurants = Array.from({ length: 6 }, (_, i) => ({
    ...sampleRestaurant,
    id: i + 1,
    name: `Restaurant ${i + 1}`,
    adds: sampleRestaurant.adds + (i * 15),
    rating: Math.max(4.0, sampleRestaurant.rating - (i * 0.1)),
    is_trending: i % 3 === 0,
    is_featured: i % 4 === 0,
  }));

  const dishes = Array.from({ length: 6 }, (_, i) => ({
    ...sampleDish,
    id: i + 10,
    name: `Delicious Dish ${i + 1}`,
    restaurant: `Restaurant ${i + 1}`,
    restaurant_id: i + 1,
    adds: sampleDish.adds + (i * 12),
    rating: Math.max(4.0, sampleDish.rating - (i * 0.08)),
    is_featured: i % 3 === 0,
    is_vegetarian: i % 2 === 0,
    is_vegan: i % 4 === 0,
    is_spicy: i % 3 === 1,
  }));

  const lists = Array.from({ length: 6 }, (_, i) => ({
    ...sampleList,
    id: i + 20,
    name: `Curated List ${i + 1}`,
    description: `A carefully curated list of the best items in category ${i + 1}.`,
    items_count: sampleList.items_count + (i * 3),
    follow_count: sampleList.follow_count + (i * 20),
    view_count: sampleList.view_count + (i * 150),
    is_trending: i % 3 === 0,
    is_featured: i % 4 === 0,
    is_following: i % 2 === 0,
    user: {
      ...sampleList.user,
      id: 101 + i,
      name: `Curator ${i + 1}`,
      username: `curator_${i + 1}`
    }
  }));

  // Event handlers
  const handleAddToList = useCallback((item) => {
    setItemToAdd(item);
    setIsAddToListModalOpen(true);
  }, []);

  const handleQuickAdd = useCallback((data) => {
    console.log('Quick add triggered:', data);
    // In a real app, this would open a quick add modal
    alert(`Quick add to list: ${data.listName || 'Unknown List'}`);
  }, []);

  const handleFollow = useCallback(async (listId) => {
    console.log('Following list:', listId);
    // In a real app, this would make an API call
    return new Promise(resolve => {
      setTimeout(() => {
        alert(`Followed list ${listId}`);
        resolve();
      }, 500);
    });
  }, []);

  const handleUnfollow = useCallback(async (listId) => {
    console.log('Unfollowing list:', listId);
    // In a real app, this would make an API call
    return new Promise(resolve => {
      setTimeout(() => {
        alert(`Unfollowed list ${listId}`);
        resolve();
      }, 500);
    });
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
  }, []);

  const handleItemAdded = useCallback((listId, listItemId) => {
    console.log(`Item added to list ${listId} with ID ${listItemId}`);
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
    alert('Item successfully added to list!');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Card Uniformity Test Page
          </h1>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-3">Testing Criteria:</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✅ All cards must have identical dimensions: <code>{CARD_SPECS.HEIGHT}</code> (256px height)</li>
              <li>✅ All cards must use consistent padding: <code>{CARD_SPECS.PADDING}</code></li>
              <li>✅ All cards must have the same border style: <code>{CARD_SPECS.BORDER}</code></li>
              <li>✅ Restaurant cards should have "Add to List" functionality (black button, top-right)</li>
              <li>✅ Dish cards should have "Add to List" functionality (black button, top-right)</li>
              <li>✅ List cards should have "Follow/Unfollow" (blue/white button, far right) and "Quick Add" (black button, left of follow)</li>
              <li>✅ All cards should display appropriate type badges</li>
              <li>✅ All cards should work in the same grid layouts</li>
            </ul>
          </div>
        </div>

        {/* Individual Card Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Individual Card Components</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Restaurant Card</h3>
              <RestaurantCard 
                {...sampleRestaurant}
                onAddToList={() => handleAddToList({ ...sampleRestaurant, type: 'restaurant' })}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Dish Card</h3>
              <DishCard 
                {...sampleDish}
                onAddToList={() => handleAddToList({ ...sampleDish, type: 'dish' })}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">List Card</h3>
              <ListCard 
                {...sampleList}
                onQuickAdd={handleQuickAdd}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
              />
            </div>
          </div>
        </section>

        {/* PRIMARY Grid Layout Test */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">PRIMARY Grid Layout (5 columns max)</h2>
          <div className={GRID_LAYOUTS.PRIMARY}>
            {restaurants.slice(0, 3).map(restaurant => (
              <RestaurantCard 
                key={`restaurant-${restaurant.id}`}
                {...restaurant}
                onAddToList={() => handleAddToList({ ...restaurant, type: 'restaurant' })}
              />
            ))}
            {dishes.slice(0, 3).map(dish => (
              <DishCard 
                key={`dish-${dish.id}`}
                {...dish}
                onAddToList={() => handleAddToList({ ...dish, type: 'dish' })}
              />
            ))}
            {lists.slice(0, 4).map(list => (
              <ListCard 
                key={`list-${list.id}`}
                {...list}
                onQuickAdd={handleQuickAdd}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
              />
            ))}
          </div>
        </section>

        {/* SEARCH Grid Layout Test */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">SEARCH Grid Layout (4 columns max)</h2>
          <div className={GRID_LAYOUTS.SEARCH}>
            {restaurants.slice(0, 2).map(restaurant => (
              <RestaurantCard 
                key={`search-restaurant-${restaurant.id}`}
                {...restaurant}
                onAddToList={() => handleAddToList({ ...restaurant, type: 'restaurant' })}
              />
            ))}
            {dishes.slice(0, 2).map(dish => (
              <DishCard 
                key={`search-dish-${dish.id}`}
                {...dish}
                onAddToList={() => handleAddToList({ ...dish, type: 'dish' })}
              />
            ))}
            {lists.slice(0, 4).map(list => (
              <ListCard 
                key={`search-list-${list.id}`}
                {...list}
                onQuickAdd={handleQuickAdd}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
              />
            ))}
          </div>
        </section>

        {/* CardFactory Test */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">CardFactory Test (Mixed Content)</h2>
          <div className={GRID_LAYOUTS.PRIMARY}>
            <CardFactory 
              type="restaurant" 
              data={sampleRestaurant}
              onAddToList={handleAddToList}
            />
            <CardFactory 
              type="dish" 
              data={sampleDish}
              onAddToList={handleAddToList}
            />
            <CardFactory 
              type="list" 
              data={sampleList}
              onQuickAdd={handleQuickAdd}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
            />
          </div>
        </section>

        {/* Size Consistency Visual Test */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Size Consistency Visual Test</h2>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-4">
              All cards below should have identical heights and align perfectly. 
              Any size inconsistencies will be visually apparent.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <div className="absolute inset-0 border-2 border-red-500 opacity-50 pointer-events-none"></div>
                <RestaurantCard 
                  {...sampleRestaurant}
                  onAddToList={() => handleAddToList({ ...sampleRestaurant, type: 'restaurant' })}
                />
              </div>
              <div className="relative">
                <div className="absolute inset-0 border-2 border-blue-500 opacity-50 pointer-events-none"></div>
                <DishCard 
                  {...sampleDish}
                  onAddToList={() => handleAddToList({ ...sampleDish, type: 'dish' })}
                />
              </div>
              <div className="relative">
                <div className="absolute inset-0 border-2 border-green-500 opacity-50 pointer-events-none"></div>
                <ListCard 
                  {...sampleList}
                  onQuickAdd={handleQuickAdd}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Test all card interactions to ensure functionality is working correctly.</p>
          <p>Check responsive behavior by resizing the browser window.</p>
        </div>
      </div>

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

export default TestCardUniformity; 