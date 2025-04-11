/* src/doof-backend/models/submissionModel.ts */
import db from '../db/index.js'; // Ensure .js extension
import type { PoolClient } from 'pg';
// Corrected import path - Use local duplicated types
import type { Submission, CreateSubmissionData } from './submissionTypes.js';

// Define Raw DB Row Type - explicitly list fields returned by query
interface RawSubmissionRow {
    id: number | string;
    user_id?: number | string | null;
    type: string; // 'restaurant' | 'dish'
    name: string;
    location?: string | null;
    city?: string | null;
    neighborhood?: string | null;
    tags?: string[] | null;
    place_id?: string | null;
    status: string; // 'pending' | 'approved' | 'rejected'
    created_at: Date | string;
    reviewed_at?: Date | string | null;
    reviewed_by?: number | string | null;
    user_handle?: string | null; // From JOIN
    restaurant_name?: string | null; // From INSERT potentially
}

// Helper function to format submission data
const formatSubmission = (row: RawSubmissionRow | undefined): Submission | null => {
    if (!row || row.id == null) {
        return null;
    }
    try {
        return {
            id: Number(row.id),
            user_id: row.user_id ? Number(row.user_id) : null,
            type: row.type as 'restaurant' | 'dish',
            name: row.name,
            location: row.location ?? null,
            city: row.city ?? null,
            neighborhood: row.neighborhood ?? null,
            tags: Array.isArray(row.tags) ? row.tags.filter((t): t is string => typeof t === 'string' && !!t) : null,
            place_id: row.place_id ?? null,
            status: row.status as 'pending' | 'approved' | 'rejected',
            // Convert Date to ISO string if necessary for Submission type consistency
            created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at), // Ensure string
            reviewed_at: row.reviewed_at instanceof Date ? row.reviewed_at.toISOString() : (row.reviewed_at ?? null),
            reviewed_by: row.reviewed_by ? Number(row.reviewed_by) : null,
            user_handle: row.user_handle ?? null,
            // Add restaurant_name if it's part of the Submission type
            restaurant_name: row.restaurant_name ?? null,
        };
    } catch (e) {
        console.error(`[SubmissionModel formatSubmission Error] Failed to format row:`, row, e);
        return null;
    }
};

export const findSubmissionsByStatus = async (status: string = 'pending'): Promise<Submission[]> => {
    const query = `
        SELECT s.*, u.username as user_handle
        FROM Submissions s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.status = $1
        ORDER BY s.created_at DESC
      `;
    try {
        const result = await db.query<RawSubmissionRow>(query, [status]);
        return (result.rows || []).map(formatSubmission).filter((s): s is Submission => s !== null);
    } catch (error) {
        console.error(`[SubmissionModel findSubmissionsByStatus] Error fetching submissions with status ${status}:`, error);
        throw error;
    }
};

export const createSubmission = async (submissionData: CreateSubmissionData, userId: number): Promise<Submission | null> => {
    const { type, name, location, city, neighborhood, tags, place_id, restaurant_name } = submissionData;
    const query = `
      INSERT INTO Submissions (user_id, type, name, location, city, neighborhood, tags, place_id, status, created_at, restaurant_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', CURRENT_TIMESTAMP, $9)
      RETURNING *;
    `;
    // Ensure tags are properly handled as nullable text array
    const cleanTags = Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : null;
    const values = [userId, type, name, location || null, city || null, neighborhood || null, cleanTags, place_id || null, restaurant_name || null];
    try {
        const result = await db.query<RawSubmissionRow>(query, values);
        if (!result.rows[0]) {
            throw new Error("Submission creation failed, no row returned.");
        }
        return formatSubmission(result.rows[0]);
    } catch (error) {
        console.error(`[SubmissionModel createSubmission] Error for user ${userId}:`, error);
        throw error;
    }
};

export const findSubmissionById = async (id: number): Promise<Submission | undefined> => {
    try {
        const result = await db.query<RawSubmissionRow>('SELECT * FROM submissions WHERE id = $1', [id]);
        const formatted = formatSubmission(result.rows[0]);
        return formatted ?? undefined; // Return formatted or undefined
    } catch (error) {
        console.error(`[SubmissionModel findSubmissionById] Error fetching submission ${id}:`, error);
        throw error;
    }
};

 export const updateSubmissionStatus = async (id: number, status: 'approved' | 'rejected', reviewerId: number): Promise<Submission | undefined> => {
     if (!['approved', 'rejected'].includes(status)) {
         throw new Error('Invalid status for update.');
     }
     const query = `
       UPDATE Submissions
       SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2
       WHERE id = $3 AND status = 'pending'
       RETURNING *;
     `;
     try {
         const result = await db.query<RawSubmissionRow>(query, [status, reviewerId, id]);
         const formatted = formatSubmission(result.rows[0]);
         return formatted ?? undefined; // Return formatted or undefined if not found/not pending
     } catch (error) {
         console.error(`[SubmissionModel updateSubmissionStatus] Error updating submission ${id}:`, error);
         throw error;
     }
 };