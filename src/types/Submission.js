/* src/types/Submission.js */
/* REMOVED: All TypeScript interfaces */
// This file defined TypeScript interfaces. Can be kept for documentation or removed.

/*
Expected shape for Submission:
{
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
    user_handle?: string | null;
    restaurant_name?: string | null;
}

Expected shape for CreateSubmissionData:
{
    type: 'restaurant' | 'dish';
    name: string;
    location?: string | null;
    city?: string | null;
    neighborhood?: string | null;
    tags?: string[];
    place_id?: string | null;
    restaurant_name?: string | null;
}
*/