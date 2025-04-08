/* src/types/Submission.ts */
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
    created_at: string; // Or Date
    reviewed_at?: string | null; // Or Date
    reviewed_by?: number | null;
    user_handle?: string | null; // Added from backend join
}

export interface CreateSubmissionData {
    type: 'restaurant' | 'dish';
    name: string;
    location?: string | null;
    city?: string | null;
    neighborhood?: string | null;
    tags?: string[];
    place_id?: string | null;
    // restaurant_name might be needed for dish submissions if place_id not used
    restaurant_name?: string | null;
}