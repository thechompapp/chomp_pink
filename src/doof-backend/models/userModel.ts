/* src/doof-backend/models/userModel.ts */
import db from '../db/index.js';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';

export interface User extends QueryResultRow {
    id: number;
    username: string;
    email: string;
    account_type: string;
    created_at?: Date | string;
    password_hash?: string;
}

export const formatUser = (row: QueryResultRow | undefined): User | null => {
    // FIXED: Restored full function body
     if (!row || row.id == null) return null;
     return {
        id: Number(row.id),
        username: row.username,
        email: row.email,
        account_type: row.account_type,
        created_at: row.created_at,
     };
}

export const findUserById = async (id: number): Promise<User | undefined> => {
    // FIXED: Restored full function body
    const result = await db.query<User>('SELECT id, username, email, account_type, created_at FROM Users WHERE id = $1', [id]);
    return formatUser(result.rows[0]) ?? undefined;
};

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
    // FIXED: Restored full function body
    const result = await db.query<User>('SELECT * FROM Users WHERE LOWER(email) = LOWER($1)', [email]);
    return result.rows[0];
};

export const findUserByUsername = async (username: string): Promise<User | undefined> => {
    // FIXED: Restored full function body
    const result = await db.query<User>('SELECT id, username, email, account_type, created_at FROM Users WHERE LOWER(username) = LOWER($1)', [username]);
    return formatUser(result.rows[0]) ?? undefined;
};

export const createUser = async (username: string, email: string, passwordHash: string): Promise<User> => {
    // FIXED: Restored full function body
    const query = `
        INSERT INTO Users (username, email, password_hash, account_type)
        VALUES ($1, $2, $3, 'user')
        RETURNING id, username, email, created_at, account_type
    `;
    const result = await db.query<User>(query, [username, email, passwordHash]);
    if (!result.rows[0]) {
        throw new Error("User creation failed, no row returned.");
    }
    return formatUser(result.rows[0])!;
};

export const updateUserAccountType = async (userId: number, accountType: string): Promise<User | undefined> => {
    // FIXED: Restored full function body
    const query = `
        UPDATE Users SET account_type = $1
        WHERE id = $2
        RETURNING id, username, email, account_type, created_at
    `;
    const result = await db.query<User>(query, [accountType, userId]);
    return formatUser(result.rows[0]) ?? undefined;
};

export const updateUser = async (userId: number, userData: Partial<Omit<User, 'id' | 'created_at' | 'password_hash'>>): Promise<User | null> => {
    // FIXED: Restored full function body
     if (isNaN(userId) || userId <= 0) {
         console.warn(`[UserModel Update] Invalid ID: ${userId}`);
         return null;
     }
     console.log(`[UserModel] Updating user ID: ${userId}`, userData);

     const fields: string[] = [];
     const values: any[] = [];
     let paramIndex = 1;

     if (userData.username !== undefined) {
         fields.push(`username = $${paramIndex++}`);
         values.push(userData.username);
     }
     if (userData.email !== undefined) {
         fields.push(`email = $${paramIndex++}`);
         values.push(userData.email);
     }
     if (userData.account_type !== undefined && ['user', 'contributor', 'superuser'].includes(userData.account_type)) {
         fields.push(`account_type = $${paramIndex++}`);
         values.push(userData.account_type);
     }

     if (fields.length === 0) {
         console.warn(`[UserModel Update] No valid fields provided for update on user ${userId}`);
         const currentUser = await findUserById(userId);
         return currentUser ?? null;
     }

     const query = `
         UPDATE Users
         SET ${fields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING id, username, email, account_type, created_at;
     `;
     values.push(userId);

     try {
         const result = await db.query<User>(query, values);
         if (result.rowCount === 0) {
             console.warn(`[UserModel Update] User with ID ${userId} not found or no rows updated.`);
             return null;
         }
         return formatUser(result.rows[0]);
     } catch (error) {
         console.error(`[UserModel updateUser] Error updating user ${userId}:`, error);
         if ((error as any)?.code === '23505') {
             const field = (error as any).constraint?.includes('email') ? 'Email' : 'Username';
             throw new Error(`Update failed: ${field} already exists.`);
         }
         throw error;
     }
};

export const getUserProfileStats = async (userId: number) => {
     // ... (implementation remains the same) ...
      const [
          listsCreatedResult,
          listsFollowingResult,
          dishesFollowingResult,
          restaurantsFollowingResult
      ] = await Promise.all([
          db.query<{ count: string }>('SELECT COUNT(*) FROM Lists WHERE user_id = $1', [userId]),
          db.query<{ count: string }>('SELECT COUNT(*) FROM ListFollows WHERE user_id = $1', [userId]),
          db.query<{ count: string }>("SELECT COUNT(*) FROM DishVotes WHERE user_id = $1 AND vote_type = 'up'", [userId]),
          Promise.resolve({ rows: [{ count: '0' }] })
      ]);

      return {
          listsCreated: parseInt(listsCreatedResult.rows[0].count, 10) || 0,
          listsFollowing: parseInt(listsFollowingResult.rows[0].count, 10) || 0,
          dishesFollowing: parseInt(dishesFollowingResult.rows[0].count, 10) || 0,
          restaurantsFollowing: parseInt(restaurantsFollowingResult.rows[0].count, 10) || 0,
      };
};