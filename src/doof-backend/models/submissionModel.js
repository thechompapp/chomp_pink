/* src/doof-backend/models/submissionModel.js */
import db from '../db/index.js';

const formatSubmission = (row) => {
    if (!row || row.id == null) {
        return null;
    }
    try {
        // Basic validation for type and status
        const type = ['restaurant', 'dish'].includes(row.type) ? row.type : null;
        const status = ['pending', 'approved', 'rejected'].includes(row.status) ? row.status : 'pending';
        if (!type) {
            console.warn(`[SubmissionModel Format] Invalid type found: ${row.type}`);
            // return null; // Or handle differently
        }

        return {
            id: Number(row.id),
            user_id: row.user_id ? Number(row.user_id) : null,
            type: type, // Use validated type
            name: row.name,
            location: row.location ?? null,
            city: row.city ?? null,
            neighborhood: row.neighborhood ?? null,
            tags: Array.isArray(row.tags) ? row.tags.filter((t) => typeof t === 'string' && !!t) : null,
            place_id: row.place_id ?? null,
            status: status, // Use validated status
            created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
            reviewed_at: row.reviewed_at instanceof Date ? row.reviewed_at.toISOString() : (row.reviewed_at ?? null),
            reviewed_by: row.reviewed_by ? Number(row.reviewed_by) : null,
            user_handle: row.user_handle ?? null,
            restaurant_name: row.restaurant_name ?? null,
        };
    } catch (e) {
        console.error(`[SubmissionModel formatSubmission Error] Failed to format row:`, row, e);
        return null;
    }
};

export const findSubmissionsByStatus = async (status = 'pending') => {
    const query = `
        SELECT s.*, u.username as user_handle
        FROM Submissions s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.status = $1
        ORDER BY s.created_at DESC
      `;
    try {
        const result = await db.query(query, [status]);
        return (result.rows || []).map(formatSubmission).filter((s) => s !== null);
    } catch (error) {
        console.error(`[SubmissionModel findSubmissionsByStatus] Error fetching submissions with status ${status}:`, error);
        throw error;
    }
};

export const createSubmission = async (submissionData, userId) => {
    const { type, name, location, city, neighborhood, tags, place_id, restaurant_name } = submissionData;
    // Basic validation before query
     if (!type || !name) {
         throw new Error("Submission type and name are required.");
     }
     if (type === 'dish' && !restaurant_name && !place_id) {
          throw new Error("Restaurant name or place ID required for dish submission.");
     }

    const query = `
      INSERT INTO Submissions (user_id, type, name, location, city, neighborhood, tags, place_id, status, created_at, restaurant_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', CURRENT_TIMESTAMP, $9)
      RETURNING *;
    `;
    const cleanTags = Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : null;
    const values = [userId, type, name, location || null, city || null, neighborhood || null, cleanTags, place_id || null, restaurant_name || null];
    try {
        const result = await db.query(query, values);
        if (!result.rows[0]) {
            throw new Error("Submission creation failed, no row returned.");
        }
        return formatSubmission(result.rows[0]);
    } catch (error) {
        console.error(`[SubmissionModel createSubmission] Error for user ${userId}:`, error);
        throw error;
    }
};

export const findSubmissionById = async (id) => {
     if (isNaN(id) || id <= 0) return undefined;
    try {
        const result = await db.query('SELECT * FROM submissions WHERE id = $1', [id]);
        return formatSubmission(result.rows[0]) ?? undefined;
    } catch (error) {
        console.error(`[SubmissionModel findSubmissionById] Error fetching submission ${id}:`, error);
        throw error;
    }
};

 export const updateSubmissionStatus = async (id, status, reviewerId) => {
     if (!['approved', 'rejected'].includes(status)) {
         throw new Error('Invalid status for update.');
     }
      if (isNaN(id) || id <= 0 || isNaN(reviewerId) || reviewerId <= 0) {
           throw new Error('Invalid ID provided for submission status update.');
       }
     const query = `
       UPDATE Submissions
       SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2
       WHERE id = $3 AND status = 'pending'
       RETURNING *;
     `;
     try {
         const result = await db.query(query, [status, reviewerId, id]);
         return formatSubmission(result.rows[0]) ?? undefined;
     } catch (error) {
         console.error(`[SubmissionModel updateSubmissionStatus] Error updating submission ${id}:`, error);
         throw error;
     }
 };