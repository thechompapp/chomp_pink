/* src/doof-backend/models/userModel.js */
import db from '../db/index.js';
import bcrypt from 'bcryptjs';
// REMOVED: import type { PoolClient, QueryResult, QueryResultRow } from 'pg'; // <-- REMOVED THIS LINE

export const formatUser = (row) => {
     if (!row || row.id == null) return null;
     const { password_hash, ...userData } = row;
     return {
        id: Number(userData.id),
        username: userData.username,
        email: userData.email,
        account_type: userData.account_type || 'user',
        created_at: userData.created_at,
     };
}

export const findUserById = async (id) => {
    if (isNaN(id) || id <= 0) return undefined;
    const result = await db.query('SELECT * FROM Users WHERE id = $1', [id]);
    return formatUser(result.rows[0]) ?? undefined;
};

export const findUserByEmail = async (email) => {
    const result = await db.query('SELECT * FROM Users WHERE LOWER(email) = LOWER($1)', [email]);
    return result.rows[0]; // Return raw row including password_hash for login check
};

export const findUserByUsername = async (username) => {
    const result = await db.query('SELECT * FROM Users WHERE LOWER(username) = LOWER($1)', [username]);
    return formatUser(result.rows[0]) ?? undefined;
};

export const createUser = async (username, email, passwordHash, accountType = 'user') => {
    const query = `
        INSERT INTO Users (username, email, password_hash, account_type)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    const validAccountType = ['user', 'contributor', 'superuser'].includes(accountType) ? accountType : 'user';
    const result = await db.query(query, [username, email, passwordHash, validAccountType]);
    if (!result.rows[0]) {
        throw new Error("User creation failed, no row returned.");
    }
    return formatUser(result.rows[0]);
};

export const updateUserAccountType = async (userId, accountType) => {
    if (!['user', 'contributor', 'superuser'].includes(accountType)) {
        throw new Error("Invalid account type specified.");
    }
     if (isNaN(userId) || userId <= 0) return undefined;
    const query = `
        UPDATE Users SET account_type = $1
        WHERE id = $2
        RETURNING *
    `;
    const result = await db.query(query, [accountType, userId]);
    return formatUser(result.rows[0]) ?? undefined;
};

export const updateUser = async (userId, userData) => {
     if (isNaN(userId) || userId <= 0) {
         console.warn(`[UserModel Update] Invalid ID: ${userId}`);
         return null;
     }
     const fields = [];
     const values = [];
     let paramIndex = 1;
     if (userData.username !== undefined) { fields.push(`username = $${paramIndex++}`); values.push(userData.username); }
     if (userData.email !== undefined) { fields.push(`email = $${paramIndex++}`); values.push(userData.email); }
     if (userData.account_type !== undefined && ['user', 'contributor', 'superuser'].includes(userData.account_type)) {
         fields.push(`account_type = $${paramIndex++}`); values.push(userData.account_type);
     }
     if (userData.password || userData.password_hash) { console.warn(`[UserModel Update] Ignoring password update attempt for user ${userId}.`); }
     if (fields.length === 0) { const currentUser = await findUserById(userId); return currentUser ?? null; }
     const query = `UPDATE Users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
     values.push(userId);
     try {
         const result = await db.query(query, values);
         if (result.rowCount === 0) return null;
         return formatUser(result.rows[0]);
     } catch (error) {
         console.error(`[UserModel updateUser] Error updating user ${userId}:`, error);
         if (error.code === '23505') { const field = error.constraint?.includes('email') ? 'Email' : 'Username'; throw new Error(`Update failed: ${field} already exists.`); }
         throw error;
     }
};

export const getUserProfileStats = async (userId) => {
    if (isNaN(userId) || userId <= 0) return { listsCreated: 0, listsFollowing: 0, dishesFollowing: 0, restaurantsFollowing: 0 };
      const [ listsCreatedResult, listsFollowingResult, dishesFollowingResult ] = await Promise.all([
          db.query('SELECT COUNT(*) FROM Lists WHERE user_id = $1', [userId]),
          db.query('SELECT COUNT(*) FROM ListFollows WHERE user_id = $1', [userId]),
          db.query("SELECT COUNT(*) FROM DishVotes WHERE user_id = $1 AND vote_type = 'up'", [userId]),
          Promise.resolve({ rows: [{ count: '0' }] }) // Placeholder restaurant follows
      ]);
      return {
          listsCreated: parseInt(listsCreatedResult.rows[0]?.count || '0', 10),
          listsFollowing: parseInt(listsFollowingResult.rows[0]?.count || '0', 10),
          dishesFollowing: parseInt(dishesFollowingResult.rows[0]?.count || '0', 10),
          restaurantsFollowing: 0,
      };
};