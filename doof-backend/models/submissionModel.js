// Filename: /root/doof-backend/models/submissionModel.js
/* REFACTORED: Convert to ES Modules */
import db from '../db/index.js'; // Use import, add .js
import format from 'pg-format'; // Use import

// Helper function to format submission data (optional)
const formatSubmission = (row) => {
    if (!row) return null;
    return {
        id: row.id,
        user_id: row.user_id,
        user_handle: row.user_handle || null, // Include user handle if joined
        type: row.type,
        name: row.name,
        location: row.location || null,
        tags: Array.isArray(row.tags) ? row.tags : [],
        place_id: row.place_id || null,
        city: row.city || null,
        neighborhood: row.neighborhood || null,
        status: row.status,
        created_at: row.created_at,
        reviewed_at: row.reviewed_at || null,
        reviewed_by: row.reviewed_by || null,
        rejection_reason: row.rejection_reason || null, // Include if column exists
        // Include restaurant details if joined (e.g., for dish submissions)
        restaurant_id: row.restaurant_id || null,
        restaurant_name: row.restaurant_name || null,
    };
};


const submissionModel = {
    /**
     * Creates a new submission.
     */
    async createSubmission(submissionData) {
        const {
            user_id, type, name, location = null, tags = [], place_id = null,
            city = null, neighborhood = null, restaurant_id = null, restaurant_name = null // Added restaurant fields
        } = submissionData;

        // Basic validation
        if (!user_id || !type || !name) {
            throw new Error('User ID, type, and name are required for submission.');
        }
        if (!['restaurant', 'dish'].includes(type)) {
             throw new Error("Invalid submission type. Must be 'restaurant' or 'dish'.");
        }
        if (type === 'dish' && !restaurant_id && !restaurant_name) {
             throw new Error("Restaurant ID or name is required for dish submissions.");
             // Ideally, require restaurant_id if possible
        }


        const query = `
            INSERT INTO Submissions (
                user_id, type, name, location, tags, place_id, city, neighborhood, status, created_at, restaurant_id, restaurant_name
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW(), $9, $10
            ) RETURNING *;
        `;
        const params = [
             user_id, type, name, location, tags, place_id, city, neighborhood, restaurant_id, restaurant_name
        ];

        try {
            const result = await db.query(query, params);
            return formatSubmission(result.rows[0]); // Format the result
        } catch (error) {
            console.error('Error creating submission:', error);
            throw error; // Re-throw DB errors
        }
    },

    /**
     * Finds submissions by user ID, optionally filtered by status.
     */
    async findSubmissionsByUserId(userId, status = null) {
         let queryText = `
             SELECT s.*, u.username as user_handle -- Example of joining user handle
             FROM Submissions s
             LEFT JOIN Users u ON s.user_id = u.id
             WHERE s.user_id = $1
         `;
         const params = [userId];
         if (status && ['pending', 'approved', 'rejected'].includes(status)) {
             queryText += ' AND s.status = $2';
             params.push(status);
         }
         queryText += ' ORDER BY s.created_at DESC';

         try {
             const result = await db.query(queryText, params);
             return result.rows.map(formatSubmission);
         } catch (error) {
             console.error(`Error fetching submissions for user ${userId}:`, error);
             throw error;
         }
     },

    /**
     * Finds submissions by status (for admin view).
     */
    async getSubmissionsByStatus(status = null) {
        let queryText = `
            SELECT s.*, u.username as user_handle -- Join username for admin view
            FROM Submissions s
            LEFT JOIN Users u ON s.user_id = u.id
        `;
        const params = [];
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            queryText += ' WHERE s.status = $1';
            params.push(status);
        }
        queryText += ' ORDER BY s.created_at DESC';

        try {
            const result = await db.query(queryText, params);
            return result.rows.map(formatSubmission);
        } catch (error) {
            console.error(`Error fetching submissions by status (${status || 'all'}):`, error);
            throw error;
        }
    },

    /**
     * Finds a single submission by its ID.
     */
    async getSubmissionById(id) {
        const query = `
            SELECT s.*, u.username as user_handle
            FROM Submissions s
            LEFT JOIN Users u ON s.user_id = u.id
            WHERE s.id = $1;
        `;
        try {
            const result = await db.query(query, [id]);
            return formatSubmission(result.rows[0]); // Format the result
        } catch (error) {
            console.error(`Error fetching submission with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Updates the status of a submission.
     */
    async updateSubmissionStatus(id, status, reviewedById, rejectionReason = null) {
         if (!['approved', 'rejected'].includes(status)) {
              throw new Error("Invalid status provided for update. Must be 'approved' or 'rejected'.");
         }

         const query = `
            UPDATE Submissions
            SET status = $1,
                reviewed_at = NOW(),
                reviewed_by = $2,
                rejection_reason = $3 -- Include rejection reason
            WHERE id = $4 AND status = 'pending' -- Only update pending submissions
            RETURNING *;
        `;
         try {
             const result = await db.query(query, [status, reviewedById, rejectionReason, id]);
             if (result.rowCount === 0) {
                 // Could be not found, or already reviewed
                 // Use 'this' carefully or call exported function directly if needed
                 const check = await submissionModel.getSubmissionById(id); // Call using exported object name
                 if (!check) throw new Error(`Submission with ID ${id} not found.`);
                 if (check.status !== 'pending') throw new Error(`Submission with ID ${id} has already been reviewed (status: ${check.status}).`);
                 throw new Error(`Failed to update submission ${id}. Unknown reason.`); // Fallback
             }
             return formatSubmission(result.rows[0]); // Format the updated submission
         } catch (error) {
             console.error(`Error updating submission status for ID ${id}:`, error);
             throw error;
         }
     },

    // Add other necessary model functions (e.g., delete submission?)
};

export default submissionModel; // Use export default