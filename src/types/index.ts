export * from './List';
export * from './User';

export interface DishDetail {
    id: number;
    name: string;
    restaurant_name?: string | null;
    city?: string | null;
    neighborhood?: string | null;
    tags?: string[];
    created_at?: string;
    updated_at?: string;
}