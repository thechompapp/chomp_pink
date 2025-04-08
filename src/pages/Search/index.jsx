/* src/pages/Search/index.jsx */
import React from 'react';
import useSearch from '@/hooks/useSearch'; // Use alias
import useUIStateStore from '@/stores/useUIStateStore'; // Use alias
import SearchBar from '@/components/UI/SearchBar'; // Use alias
import DishCard from '@/components/UI/DishCard'; // Use alias
import RestaurantCard from '@/components/UI/RestaurantCard'; // Use alias
import ListCard from '@/pages/Lists/ListCard'; // Use alias
import LoadingSpinner from '@/components/UI/LoadingSpinner'; // Use alias
import ErrorMessage from '@/components/UI/ErrorMessage'; // Use alias
import QueryResultDisplay from '@/components/QueryResultDisplay'; // Use alias

const SearchResultsPage = () => { // Renamed component for clarity
    const searchQuery = useUIStateStore(state => state.searchQuery);

    // Use the hook to get search results based on the query from the store
    // useSearch hook now returns the UseQueryResult object
    const queryResult = useSearch(searchQuery);

    // The SearchBar component itself now handles updating the searchQuery in the store
    // and navigation. This page just displays results based on the store's query.

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Search bar is likely in the Navbar now */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
                Search Results {searchQuery ? `for "${searchQuery}"` : ''}
            </h1>

            <QueryResultDisplay
                queryResult={queryResult} // Pass the whole result object
                loadingMessage="Searching..."
                errorMessagePrefix="Search failed"
                // Custom check for empty results across all categories
                isDataEmpty={(data) => !data || (data.dishes.length === 0 && data.restaurants.length === 0 && data.lists.length === 0)}
                noDataMessage={searchQuery ? `No results found for "${searchQuery}".` : "Enter a search term to find restaurants, dishes, or lists."}
            >
                {(results) => ( // results is the data object: { dishes: [], restaurants: [], lists: [] }
                    <div className="space-y-8">
                        {/* Dishes Section */}
                        {results.dishes.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700 mb-4">Dishes ({results.dishes.length})</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {results.dishes.map(dish => (
                                        // Ensure dish object has necessary props, including id
                                        dish && dish.id != null ? (
                                            <DishCard
                                                key={`dish-${dish.id}`}
                                                id={dish.id}
                                                name={dish.name}
                                                // Hook ensures data structure matches card needs
                                                restaurant={dish.restaurant_name || dish.restaurant}
                                                tags={dish.tags || []}
                                                adds={dish.adds}
                                                // onQuickAdd prop is optional here or handled inside DishCard
                                            />
                                        ) : null // Render nothing if dish or id is invalid
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Restaurants Section */}
                        {results.restaurants.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700 mb-4">Restaurants ({results.restaurants.length})</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {results.restaurants.map(restaurant => (
                                        // Ensure restaurant object has necessary props, including id
                                        restaurant && restaurant.id != null ? (
                                            <RestaurantCard
                                                key={`restaurant-${restaurant.id}`}
                                                id={restaurant.id} // Ensure id is passed
                                                name={restaurant.name}
                                                city={restaurant.city_name || restaurant.city}
                                                neighborhood={restaurant.neighborhood_name || restaurant.neighborhood}
                                                tags={restaurant.tags || []}
                                                adds={restaurant.adds}
                                                // onQuickAdd prop is optional here or handled inside RestaurantCard
                                            />
                                        ) : null // Render nothing if restaurant or id is invalid
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Lists Section */}
                        {results.lists.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700 mb-4">Lists ({results.lists.length})</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {results.lists.map(list => (
                                        // Ensure list object has necessary props, including id
                                        list && list.id != null ? (
                                            <ListCard
                                                key={`list-${list.id}`}
                                                // Pass all necessary props ListCard expects
                                                id={list.id}
                                                name={list.name}
                                                description={list.description}
                                                saved_count={list.saved_count ?? 0} // Use nullish coalescing
                                                item_count={list.item_count ?? 0} // Use nullish coalescing
                                                is_following={list.is_following ?? false}
                                                created_by_user={list.created_by_user ?? false}
                                                creator_handle={list.creator_handle}
                                                is_public={list.is_public ?? true}
                                                type={list.type || list.list_type} // Handle potential key difference
                                                tags={list.tags || []}
                                                user_id={list.user_id}
                                            />
                                        ) : null // Render nothing if list or id is invalid
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

export default SearchResultsPage; // Use the updated name