export interface Submission {
    id: number;
    user_id?: number | null;
    type: 'restaurant' | 'dish';
    name: string;
    location?: string | null;
    city?: string | null;
    neighborhood?: string | null;
    tags?: string[] | null;
    place_id?: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    reviewed_at?: string | null;
    reviewed_by?: number | null;
    user_handle?: string | null;
    restaurant_name?: string | null;
}
export interface CreateSubmissionData {
    type: 'restaurant' | 'dish';
    name: string;
    location?: string | null;
    city?: string | null;
    neighborhood?: string | null;
    tags?: string[];
    place_id?: string | null;
    restaurant_name?: string | null;
}
