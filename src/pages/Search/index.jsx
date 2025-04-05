import React from 'react';
import useSearch from '@/hooks/useSearch';
import useUIStateStore from '@/stores/useUIStateStore';
import SearchBar from '@/components/UI/SearchBar';
import DishCard from '@/components/UI/DishCard';
import RestaurantCard from '@/components/UI/RestaurantCard';
import ListCard from '@/pages/Lists/ListCard';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';

const Search = () => {
    const searchQuery = useUIStateStore(state => state.searchQuery);

    const { data: results = { dishes: [], restaurants: [], lists: [] }, isLoading, isError, error, refetch } = useSearch(searchQuery);

    const handleSearch = (query) => {
        console.log("Search query:", query);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Search</h1>
            <SearchBar onSearch={handleSearch} />
            <div className="mt-6">
                {isLoading ? (
                    <LoadingSpinner size="lg" message="Searching..." />
                ) : isError ? (
                    <ErrorMessage
                        message={error?.message || 'Search failed'}
                        onRetry={refetch}
                        isLoadingRetry={isLoading}
                    />
                ) : !searchQuery ? (
                    <p className="text-gray-600">Enter a search term to find restaurants, dishes, or lists.</p>
                ) : (
                    <>
                        <p className="text-gray-600 mb-4">Searching for: <strong>{searchQuery}</strong></p>
                        {results.dishes.length === 0 && results.restaurants.length === 0 && results.lists.length === 0 ? (
                            <p className="text-gray-500 text-center py-6">No results found for "{searchQuery}".</p>
                        ) : (
                            <>
                                {results.dishes.length > 0 && (
                                    <div className="mb-6">
                                        <h2 className="text-lg font-semibold text-gray-800 mb-3">Dishes ({results.dishes.length})</h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {results.dishes.map(dish => (
                                                <DishCard
                                                    key={dish.id}
                                                    id={dish.id}
                                                    name={dish.name}
                                                    restaurant={dish.restaurant_name}
                                                    tags={dish.tags || []}
                                                    adds={dish.adds}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {results.restaurants.length > 0 && (
                                    <div className="mb-6">
                                        <h2 className="text-lg font-semibold text-gray-800 mb-3">Restaurants ({results.restaurants.length})</h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {results.restaurants.map(restaurant => (
                                                <RestaurantCard
                                                    key={restaurant.id}
                                                    id Wakarusa
                                                    name={restaurant.name}
                                                    city={restaurant.city_name}
                                                    neighborhood={restaurant.neighborhood_name}
                                                    tags={restaurant.tags || []}
                                                    adds={restaurant.adds}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {results.lists.length > 0 && (
                                    <div className="mb-6">
                                        <h2 className="text-lg font-semibold text-gray-800 mb-3">Lists ({results.lists.length})</h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {results.lists.map(list => (
                                                <ListCard
                                                    key={list.id}
                                                    id={list.id}
                                                    name={list.name}
                                                    description={list.description}
                                                    saved_count={list.saved_count}
                                                    item_count={list.item_count}
                                                    is_following={list.is_following ?? false}
                                                    created_by_user={list.created_by_user ?? false}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Search;