/* src/pages/Lists/guaranteed-mock-lists.js */
/**
 * Guaranteed mock lists for the "Lists I'm Following" view
 * Used as a fallback when no followed lists are available from the API
 */

export const guaranteedFollowedLists = [
  {
    id: 9001,
    title: "Popular Italian Spots",
    description: "A collection of the best Italian restaurants in the city",
    image_url: "https://images.unsplash.com/photo-1516100882582-96c3a05fe590?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
    item_count: 7,
    owner_id: 2,
    user_id: 2,
    is_public: true,
    is_featured: true,
    follow_count: 289,
    is_following: true,
    created_by_user: false,
    hashtags: ['Italian', 'Pasta', 'Pizza']
  },
  {
    id: 9002,
    title: "Hidden Gems",
    description: "Lesser-known places that are worth a visit",
    image_url: "https://images.unsplash.com/photo-1525648199074-cee30ba79a4a?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
    item_count: 9,
    owner_id: 3,
    user_id: 3,
    is_public: true,
    is_featured: true,
    follow_count: 175,
    is_following: true,
    created_by_user: false,
    hashtags: ['Hidden', 'Secret', 'Local']
  },
  {
    id: 9003,
    title: "Best Brunch Spots",
    description: "Great places for weekend brunch",
    image_url: "https://images.unsplash.com/photo-1533920379810-6bedac9e31f6?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
    item_count: 6,
    owner_id: 4,
    user_id: 4,
    is_public: true,
    is_featured: false,
    follow_count: 128,
    is_following: true,
    created_by_user: false,
    hashtags: ['Brunch', 'Breakfast', 'Weekend']
  }
];
