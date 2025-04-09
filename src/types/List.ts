/* src/types/List.ts */
export interface ListItem {
  list_item_id: number;
  id: number; // ID of the restaurant/dish
  item_type: 'restaurant' | 'dish';
  name: string;
  restaurant_name?: string | null;
  added_at?: string; // ISO string (e.g., '2023-01-01T12:00:00Z'), optional
  city?: string | null;
  neighborhood?: string | null;
  tags?: string[];
}

export interface List {
  id: number;
  name: string;
  description?: string | null;
  type: 'mixed' | 'restaurant' | 'dish'; // Consistent with backend/frontend usage
  saved_count: number;
  item_count: number;
  city?: string | null;
  tags: string[];
  is_public: boolean;
  is_following: boolean;
  created_by_user: boolean;
  user_id?: number | null;
  creator_handle?: string | null;
  created_at?: string; // ISO string, optional
  updated_at?: string; // ISO string, optional
}

export interface ListDetails extends List {
  items: ListItem[];
}

export interface AddItemResult {
  message: string;
  item: {
    id: number;
    list_id: number;
    item_id: number;
    item_type: 'restaurant' | 'dish';
    added_at: string; // ISO string
  };
}

export interface CreateListData {
  name: string;
  description?: string | null;
  is_public?: boolean;
  list_type?: 'mixed' | 'restaurant' | 'dish'; // Matches backend field
  tags?: string[];
  city_name?: string | null; // Matches backend if applicable
}

export interface AddItemPayload {
  item: { id: number; type: 'restaurant' | 'dish' };
  listId?: number | string | null; // Optional if creating a new list
  createNew?: boolean;
  listData?: CreateListData;
}

export interface FollowToggleResponse {
  id: number;
  is_following: boolean;
  saved_count: number;
  name?: string; // Optional for cache updates
  type?: 'mixed' | 'restaurant' | 'dish'; // Optional for consistency
}

// Optional: Array type for multiple lists, if needed elsewhere
export type ListArray = List[];