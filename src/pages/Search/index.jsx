// src/pages/Search/index.jsx
/* FIXED: Changed useUIStateStore import to named import */
/* FIXED: Changed useSearch import to default import */
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import SearchBar from '@/components/UI/SearchBar';
import { useUIStateStore } from '@/stores/useUIStateStore'; // Correct named import
import useSearch from '@/hooks/useSearch'; // Correct default import
import RestaurantCard from '@/components/UI/RestaurantCard';
import DishCard from '@/components/UI/DishCard';
import ListCard from '@/pages/Lists/ListCard'; // Assuming ListCard exists
import RestaurantCardSkeleton from '@/components/UI/RestaurantCardSkeleton';
import DishCardSkeleton from '@/components/UI/DishCardSkeleton';
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton'; // Assuming ListCardSkeleton exists
import ErrorMessage from '@/components/UI/ErrorMessage';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import AddToListModal from '@/components/AddToListModal';
import { cn } from '@/lib/utils'; // Assuming cn utility exists
import { GRID_LAYOUTS, CONTAINER, TYPOGRAPHY } from '@/utils/layoutConstants';

const skeletonMap = {
    restaurants: RestaurantCardSkeleton,
    dishes: DishCardSkeleton,
    lists: ListCardSkeleton,
    // Add users if you have a UserCard/Skeleton
};

const componentMap = {
    restaurants: RestaurantCard,
    dishes: DishCard,
    lists: ListCard,
    // Add users if you have a UserCard
};

const SearchResultsPage = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialQuery = queryParams.get('q') || '';
    const initialType = queryParams.get('type') || 'all';

    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [searchType, setSearchType] = useState(initialType);
    const [searchTriggered, setSearchTriggered] = useState(!!initialQuery); // Trigger search immediately if query exists

    // AddToList modal state
    const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
    const [itemToAdd, setItemToAdd] = useState(null);

    const { data, isLoading, isError, error, refetch } = useSearch(searchQuery, {
        type: searchType,
        enabled: searchTriggered && searchQuery.length > 0, // Only run query if triggered and query exists
        staleTime: 5 * 60 * 1000, // 5 minutes stale time
        // Add other react-query options as needed
    });

    console.log(`[SearchPage] Search state:`, {
        searchQuery,
        searchType,
        searchTriggered,
        isLoading,
        isError,
        error: error?.message,
        data,
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : 'no data'
    });

    useEffect(() => {
        // Update local state if URL query params change
        const urlQuery = queryParams.get('q') || '';
        const urlType = queryParams.get('type') || 'all';
        setSearchQuery(urlQuery);
        setSearchType(urlType);
        setSearchTriggered(!!urlQuery); // Trigger if query in URL
    }, [location.search]); // Re-run when URL search string changes

    const handleSearch = (query, type = 'all') => {
        console.log(`[SearchPage] handleSearch called with query: "${query}", type: "${type}"`);
        setSearchQuery(query);
        setSearchType(type);
        setSearchTriggered(true);

        // Update URL - consider using useNavigate from react-router-dom
        const newSearchParams = new URLSearchParams();
        if (query) newSearchParams.set('q', query);
        if (type && type !== 'all') newSearchParams.set('type', type);
        // Example using window.history (useNavigate is preferred in React Router v6+)
        window.history.pushState({}, '', `${location.pathname}?${newSearchParams.toString()}`);
    };

    // AddToList handlers
    const handleAddToList = useCallback((item) => {
        console.log('[SearchPage] Opening AddToList modal for:', item);
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
        console.log(`[SearchPage] Item added to list ${listId} with ID ${listItemId}`);
        setIsAddToListModalOpen(false);
        setItemToAdd(null);
        // Optional: Show success notification
    }, []);

     // Determine if there are any results across all types
     const hasResults = data && (
        (data.restaurants && data.restaurants.length > 0) ||
        (data.dishes && data.dishes.length > 0) ||
        (data.lists && data.lists.length > 0) ||
        (data.users && data.users.length > 0)
    );

    const renderSection = (title, items, sectionKey) => {
        if (!items || items.length === 0) return null; // Don't render empty sections

        const CardComponent = componentMap[sectionKey];
        if (!CardComponent) return null; // No card component for this type

        return (
            <div className="mb-8">
                <h2 className={TYPOGRAPHY.SECTION_TITLE}>{title} ({items.length})</h2>
                <div className={GRID_LAYOUTS.SEARCH}>
                    {items.map(item => {
                        // Safely extract only the needed primitive props
                        const baseProps = {
                            key: `${sectionKey}-${item.id}`,
                            id: item.id,
                            name: String(item.name || ''),
                            description: String(item.description || ''),
                            imageUrl: String(item.imageUrl || item.image_url || ''),
                            rating: Number(item.rating || 0),
                            price: item.price ? String(item.price) : '',
                            address: String(item.address || ''),
                            city: String(item.city || ''),
                            restaurant: item.restaurant ? String(item.restaurant) : '',
                            restaurantId: item.restaurant_id || item.restaurantId,
                            createdBy: item.created_by ? String(item.created_by) : '',
                            createdAt: item.created_at ? String(item.created_at) : '',
                            itemCount: Number(item.itemCount || item.item_count || 0),
                            // Only include defined primitive values
                            ...(item.hashtags && Array.isArray(item.hashtags) ? { hashtags: item.hashtags.map(h => String(h)) } : {}),
                            ...(item.neighborhood ? { neighborhood: String(item.neighborhood) } : {}),
                            ...(item.phone ? { phone: String(item.phone) } : {}),
                            ...(item.website ? { website: String(item.website) } : {}),
                            ...(item.priceRange ? { priceRange: String(item.priceRange) } : {})
                        };
                        
                        // Add onAddToList for restaurant and dish cards
                        if (sectionKey === 'restaurants') {
                            baseProps.onAddToList = () => handleAddToList({ 
                                id: item.id, 
                                name: String(item.name || ''), 
                                type: 'restaurant' 
                            });
                        } else if (sectionKey === 'dishes') {
                            baseProps.onAddToList = () => handleAddToList({ 
                                id: item.id, 
                                name: String(item.name || ''), 
                                type: 'dish' 
                            });
                        }
                        
                        return <CardComponent {...baseProps} />;
                    })}
                </div>
            </div>
        );
    };

    const renderSkeletons = (sectionKey) => {
        const SkeletonComponent = skeletonMap[sectionKey];
        if (!SkeletonComponent) return null;
        return (
            <div className="mb-8">
                 <div className="h-6 bg-muted rounded w-1/4 mb-3 animate-pulse"></div> {/* Skeleton for title */}
                <div className={GRID_LAYOUTS.SEARCH}>
                    {Array.from({ length: 4 }).map((_, index) => ( // Show 4 skeletons
                        <SkeletonComponent key={`skel-${sectionKey}-${index}`} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`page-container ${CONTAINER.MAX_WIDTH} mx-auto ${CONTAINER.PADDING} ${CONTAINER.VERTICAL_SPACING} ${CONTAINER.SECTION_SPACING}`}>
            {/* Keep SearchBar at the top */}
            <SearchBar 
                onSearch={handleSearch} 
                initialQuery={searchQuery}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                contentType={searchType}
            />

            {/* Loading State */}
            {isLoading && searchTriggered && (
                <div className='space-y-8 mt-6'>
                    {searchType === 'all' || searchType === 'restaurants' ? renderSkeletons('restaurants') : null}
                    {searchType === 'all' || searchType === 'dishes' ? renderSkeletons('dishes') : null}
                    {searchType === 'all' || searchType === 'lists' ? renderSkeletons('lists') : null}
                    {/* Add user skeletons if applicable */}
                </div>
            )}

            {/* Error State */}
            {isError && searchTriggered && (
                <ErrorMessage
                    message={error?.message || 'Failed to perform search.'}
                    onRetry={refetch}
                />
            )}

            {/* Results State */}
            {!isLoading && !isError && searchTriggered && (
                <div className="mt-6">
                    {hasResults ? (
                        <>
                            {renderSection('Restaurants', data.restaurants, 'restaurants')}
                            {renderSection('Dishes', data.dishes, 'dishes')}
                            {renderSection('Lists', data.lists, 'lists')}
                            {/* Render users section if applicable */}
                            {/* {renderSection('Users', data.users, 'users')} */}
                        </>
                    ) : (
                        <p className="text-center text-muted-foreground py-10 border border-dashed border-border rounded-lg bg-secondary">
                            No results found for "{searchQuery}"{searchType !== 'all' ? ` in ${searchType}s` : ''}.
                        </p>
                    )}
                </div>
            )}

             {/* Initial State (before first search is triggered) */}
             {!searchTriggered && (
                 <p className="text-center text-muted-foreground py-10">
                     Enter a search term above to find restaurants, dishes, lists, or users.
                 </p>
             )}

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

export default SearchResultsPage;