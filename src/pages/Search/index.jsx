/* src/pages/Search/index.jsx */
import React from 'react';
import useSearch from '@/hooks/useSearch';
import useUIStateStore from '@/stores/useUIStateStore';
import SearchBar from '@/components/UI/SearchBar';
import DishCard from '@/components/UI/DishCard';
import RestaurantCard from '@/components/UI/RestaurantCard';
import ListCard from '@/pages/Lists/ListCard'; // Use global alias
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import QueryResultDisplay from '@/components/QueryResultDisplay'; // Import the new component

const SearchResultsPage = () => { // Renamed component for clarity
    const searchQuery = useUIStateStore(state => state.searchQuery);

    // Use the hook to get search results based on the query from the store
    const queryResult = useSearch(searchQuery); // Use the hook

    // The SearchBar component itself now handles updating the searchQuery in the store
    // and navigation. This page just displays results based on the store's query.

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Search bar is likely in the Navbar now, but kept here conceptually if needed */}
            {/* <SearchBar onSearch={handleSearch} /> */}
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
                {(results) => (
                    <div className="space-y-8">
                        {/* Dishes Section */}
                        {results.dishes.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700 mb-4">Dishes ({results.dishes.length})</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {results.dishes.map(dish => (
                                        <DishCard
                                            key={`dish-${dish.id}`}
                                            id={dish.id}
                                            name={dish.name}
                                            // Assuming service/hook provides restaurant name correctly
                                            restaurant={dish.restaurant_name || dish.restaurant}
                                            tags={dish.tags || []}
                                            adds={dish.adds}
                                            // onQuickAdd prop is optional here or handled inside DishCard
                                        />
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
                                        <RestaurantCard
                                            key={`restaurant-${restaurant.id}`}
                                            // *** CORRECTED LINE ***
                                            id={restaurant.id}
                                            name={restaurant.name}
                                            // Assuming service/hook provides names correctly
                                            city={restaurant.city_name || restaurant.city}
                                            neighborhood={restaurant.neighborhood_name || restaurant.neighborhood}
                                            tags={restaurant.tags || []}
                                            adds={restaurant.adds}
                                            // onQuickAdd prop is optional here or handled inside RestaurantCard
                                        />
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
                                        <ListCard
                                            key={`list-${list.id}`}
                                            // Pass all necessary props ListCard expects
                                            id={list.id}
                                            name={list.name}
                                            description={list.description}
                                            saved_count={list.saved_count}
                                            item_count={list.item_count}
                                            is_following={list.is_following ?? false}
                                            created_by_user={list.created_by_user ?? false}
                                            creator_handle={list.creator_handle}
                                            is_public={list.is_public ?? true}
                                            type={list.type || list.list_type} // Handle potential key difference
                                            tags={list.tags || []}
                                            user_id={list.user_id}
                                        />
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