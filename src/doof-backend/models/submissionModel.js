/* src/doof-backend/models/submissionModel.js */
import db from '../db/index.js';

export const findSubmissionsByStatus = async (status = 'pending') => {
    const query = `
        SELECT s.id, s.user_id, s.type, s.name, s.location, s.city, s.neighborhood, s.tags, s.place_id, s.created_at, u.username as user_handle
        FROM Submissions s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.status = $1
        ORDER BY s.created_at DESC
      `;
    const result = await db.query(query, [status]);
    return result.rows || [];
};

export const createSubmission = async (submissionData, userId) => {
    const { type, name, location, city, neighborhood, tags, place_id } = submissionData;
    const query = `
      INSERT INTO Submissions (user_id, type, name, location, city, neighborhood, tags, place_id, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const cleanTags = Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : [];
    const values = [userId, type, name, location || null, city || null, neighborhood || null, cleanTags, place_id || null];
    const result = await db.query(query, values);
    return result.rows[0]; // Return the created submission
};

export const findSubmissionById = async (id) => {
     const result = await db.query('SELECT * FROM submissions WHERE id = $1', [id]);
     return result.rows[0]; // Returns submission or undefined
 };

 export const updateSubmissionStatus = async (id, status, reviewerId) => {
     if (!['approved', 'rejected'].includes(status)) {
         throw new Error('Invalid status for update.');
     }
     const query = `
       UPDATE Submissions
       SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2
       WHERE id = $3 AND status = 'pending'
       RETURNING *
     `;
     const result = await db.query(query, [status, reviewerId, id]);
     return result.rows[0]; // Returns updated submission or undefined if not found/not pending
 };