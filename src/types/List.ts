/* src/types/List.js */ // Assuming renamed from .ts
/* REMOVED: All TypeScript interfaces/types */
// This file defined TypeScript interfaces. Can be kept for documentation or removed.

/*
Expected shape for ListItem:
{
  list_item_id: number;
  id: number; // ID of the restaurant/dish
  item_id?: number; // Original id from item table
  item_type: 'restaurant' | 'dish';
  name: string;
  restaurant_name?: string | null;
  added_at?: string; // ISO string
  city?: string | null;
  neighborhood?: string | null;
  tags?: string[];
}

Expected shape for List:
{
  id: number;
  name: string;
  description?: string | null;
  type: 'restaurant' | 'dish'; // No 'mixed'
  list_type?: 'restaurant' | 'dish';
  saved_count: number;
  item_count: number;
  city?: string | null;
  city_name?: string | null;
  tags: string[];
  is_public: boolean;
  is_following: boolean;
  created_by_user: boolean;
  user_id?: number | null;
  creator_handle?: string | null;
  created_at?: string; // ISO string
  updated_at?: string; // ISO string
}

Expected shape for ListDetails extends List:
{
  // ...List fields
  items: ListItem[];
}

// Other related types removed...
// AddItemResult, CreateListData, AddItemPayload, FollowToggleResponse, ListArray, AddItemData, ListParams, UpdateVisibilityData
*/