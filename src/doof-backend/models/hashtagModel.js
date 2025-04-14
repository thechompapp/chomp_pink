/* src/doof-backend/models/hashtagModel.js */
import db from '../db/index.js';

export const formatHashtag = (row) => {
    if (!row || row.id == null) return null;
    return {
        id: Number(row.id),
        name: row.name,
        category: row.category ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
};

export const findHashtagById = async (id) => {
     if (isNaN(id) || id <= 0) return null;
     const result = await db.query('SELECT * FROM hashtags WHERE id = $1', [id]);
     return formatHashtag(result.rows[0]);
};

export const updateHashtag = async (id, hashtagData) => {
     if (isNaN(id) || id <= 0) return null;
     const fields = [];
     const values = [];
     let paramIndex = 1;

     if (hashtagData.name !== undefined) {
         fields.push(`name = $${paramIndex++}`);
         values.push(hashtagData.name);
     }
     if (hashtagData.category !== undefined) {
          fields.push(`category = $${paramIndex++}`);
          values.push(hashtagData.category ?? null);
     }

     if (fields.length === 0) return findHashtagById(id);

     fields.push(`updated_at = NOW()`);
     const query = `UPDATE hashtags SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;
     values.push(id);

     try {
         const result = await db.query(query, values);
         if (result.rowCount === 0) return null;
         return formatHashtag(result.rows[0]);
     } catch (error) {
          if (error.code === '23505') {
              throw new Error("Update failed: Hashtag name likely already exists.");
          }
         throw error;
     }
};

export const deleteHashtag = async (id) => {
      if (isNaN(id) || id <= 0) return false;
      const query = 'DELETE FROM hashtags WHERE id = $1 RETURNING id';
      try {
          const result = await db.query(query, [id]);
          return (result.rowCount ?? 0) > 0;
      } catch (error) {
           if (error.code === '23503') {
               throw new Error("Cannot delete hashtag: It is referenced by other items.");
           }
           throw error;
      }
};