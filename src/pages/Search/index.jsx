/* src/pages/Search/index.jsx */
/* REMOVED: All TypeScript syntax */
import React from 'react';
import useSearch from '@/hooks/useSearch';
import useUIStateStore from '@/stores/useUIStateStore';
// SearchBar is likely in Navbar now, removed import
import DishCard from '@/components/UI/DishCard';
import RestaurantCard from '@/components/UI/RestaurantCard';
import ListCard from '@/pages/Lists/ListCard'; // Use correct path
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import QueryResultDisplay from '@/components/QueryResultDisplay';

const SearchResultsPage = () => {
    const searchQuery = useUIStateStore(state => state.searchQuery);
    const queryResult = useSearch(searchQuery); // Use the hook

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
                Search Results {searchQuery ? `for "${searchQuery}"` : ''}
            </h1>

            <QueryResultDisplay
                queryResult={queryResult}
                loadingMessage="Searching..."
                errorMessagePrefix="Search failed"
                isDataEmpty={(data) => !data || (data.dishes.length === 0 && data.restaurants.length === 0 && data.lists.length === 0)}
                noDataMessage={searchQuery ? `No results found for "${searchQuery}".` : "Enter a search term to find restaurants, dishes, or lists."}
            >
                {(results) => ( // results = { dishes: [], restaurants: [], lists: [] }
                    <div className="space-y-8">
                        {/* Dishes Section */}
                        {results.dishes?.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700 mb-4">Dishes ({results.dishes.length})</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {results.dishes.map(dish => (
                                        dish && dish.id != null ? (
                                            <DishCard
                                                key={`dish-${dish.id}`}
                                                id={dish.id}
                                                name={dish.name}
                                                restaurant={dish.restaurant_name || dish.restaurant} // Handle potential alias
                                                tags={dish.tags || []}
                                                adds={dish.adds}
                                            />
                                        ) : null
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Restaurants Section */}
                        {results.restaurants?.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700 mb-4">Restaurants ({results.restaurants.length})</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {results.restaurants.map(restaurant => (
                                        restaurant && restaurant.id != null ? (
                                            <RestaurantCard
                                                key={`restaurant-${restaurant.id}`}
                                                id={restaurant.id}
                                                name={restaurant.name}
                                                city={restaurant.city_name || restaurant.city} // Handle potential alias
                                                neighborhood={restaurant.neighborhood_name || restaurant.neighborhood} // Handle alias
                                                tags={restaurant.tags || []}
                                                adds={restaurant.adds}
                                            />
                                        ) : null
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Lists Section */}
                        {results.lists?.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700 mb-4">Lists ({results.lists.length})</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {results.lists.map(list => (
                                        list && list.id != null ? (
                                            <ListCard
                                                key={`list-${list.id}`}
                                                id={list.id}
                                                name={list.name}
                                                description={list.description}
                                                saved_count={list.saved_count ?? 0}
                                                item_count={list.item_count ?? 0}
                                                is_following={list.is_following ?? false}
                                                created_by_user={list.created_by_user ?? false}
                                                creator_handle={list.creator_handle}
                                                is_public={list.is_public ?? true}
                                                type={list.type || list.list_type} // Handle alias
                                                tags={list.tags || []}
                                                user_id={list.user_id}
                                            />
                                        ) : null
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </QueryResultDisplay>
        </div>
    );
};

export default SearchResultsPage;