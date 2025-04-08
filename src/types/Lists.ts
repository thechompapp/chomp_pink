/* src/types/List.ts */
export interface ListItem {
    list_item_id: number;
    id: number; // ID of the restaurant/dish
    item_type: 'restaurant' | 'dish';
    name: string;
    restaurant_name?: string | null;
    added_at?: string; // Or Date
    city?: string | null;
    neighborhood?: string | null;
    tags?: string[];
  }
  
  export interface List {
    id: number;
    name: string;
    description?: string | null;
    type: 'mixed' | 'restaurant' | 'dish'; // Use 'type' consistently
    saved_count: number;
    item_count: number;
    city?: string | null;
    tags: string[];
    is_public: boolean;
    is_following: boolean;
    created_by_user: boolean;
    user_id?: number | null;
    creator_handle?: string | null;
    created_at?: string; // Or Date
    updated_at?: string; // Or Date
  }
  
  // For the detailed view response which includes items
  export interface ListDetails extends List {
    items: ListItem[];
  }
  
  // For the result of adding an item
  export interface AddItemResult {
       message: string;
       item: {
          id: number;
          list_id: number;
          item_id: number;
          item_type: 'restaurant' | 'dish';
          added_at: string; // Or Date
       };
  }
  
  // For creating a list
  export interface CreateListData {
    name: string;
    description?: string | null;
    is_public?: boolean;
    list_type?: 'mixed' | 'restaurant' | 'dish'; // Match backend
    tags?: string[];
    city_name?: string | null; // Match backend if needed
  }
  
  // For adding an item to a list
  export interface AddItemPayload {
      item: { id: number; type: 'restaurant' | 'dish' };
      listId?: number | string | null; // Optional if createNew is true
      createNew?: boolean;
      listData?: CreateListData;
  }
  
  // For follow toggle response
  export interface FollowToggleResponse {
      id: number;
      is_following: boolean;
      saved_count: number;
      // Include other fields returned by backend if needed for cache updates
      name?: string;
      type?: string;
  }