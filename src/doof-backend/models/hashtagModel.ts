/* src/doof-backend/models/hashtagModel.ts */
import db from '../db/index.js';
import type { QueryResultRow } from 'pg';

// Define Hashtag type locally or import if defined globally
export interface Hashtag extends QueryResultRow { // Extend QueryResultRow
    id: number;
    name: string;
    category?: string | null; // Allow null
    created_at?: Date | string;
    updated_at?: Date | string;
}

// FIXED: Added export
export const formatHashtag = (row: QueryResultRow | undefined): Hashtag | null => {
    if (!row || row.id == null) return null;
    return {
        id: Number(row.id),
        name: row.name,
        category: row.category ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
};

export const findHashtagById = async (id: number): Promise<Hashtag | null> => {
     // ... (implementation remains the same) ...
     if (isNaN(id) || id <= 0) return null;
     const result = await db.query<Hashtag>('SELECT * FROM hashtags WHERE id = $1', [id]);
     return formatHashtag(result.rows[0]);
};


// Function to update a hashtag
export const updateHashtag = async (id: number, hashtagData: Partial<Omit<Hashtag, 'id' | 'created_at' | 'updated_at'>>): Promise<Hashtag | null> => {
    // ... (implementation remains the same - already handles partial updates) ...
     if (isNaN(id) || id <= 0) return null;
     const fields: string[] = [];
     const values: any[] = [];
     // Build fields/values...
     if (fields.length === 0) return findHashtagById(id);
     fields.push(`updated_at = NOW()`);
     const query = `UPDATE hashtags SET ${fields.join(', ')} WHERE id = $${values.length + 1} RETURNING *;`;
     values.push(id);
     try {
         const result = await db.query<Hashtag>(query, values);
         if (result.rowCount === 0) return null;
         return formatHashtag(result.rows[0]);
     } catch (error) {
          if ((error as any)?.code === '23505') { /* ... */ }
         throw error;
     }
};

export const deleteHashtag = async (id: number): Promise<boolean> => {
     // ... (implementation remains the same) ...
      if (isNaN(id) || id <= 0) return false;
      const query = 'DELETE FROM hashtags WHERE id = $1 RETURNING id';
      try {
          const result = await db.query(query, [id]);
          return (result.rowCount ?? 0) > 0;
      } catch (error) {
           if ((error as any)?.code === '23503') { /* ... */ }
           throw error;
      }
};