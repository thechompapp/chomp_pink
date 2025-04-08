/* src/doof-backend/models/userModel.js */
import db from '../db/index.js';

export const findUserById = async (id) => {
    const result = await db.query('SELECT id, username, email, account_type, created_at FROM Users WHERE id = $1', [id]);
    return result.rows[0]; // Returns user or undefined
};

export const findUserByEmail = async (email) => {
     const result = await db.query('SELECT * FROM Users WHERE LOWER(email) = LOWER($1)', [email]);
     return result.rows[0];
 };

export const findUserByUsername = async (username) => {
     const result = await db.query('SELECT * FROM Users WHERE LOWER(username) = LOWER($1)', [username]);
     return result.rows[0];
};

export const createUser = async (username, email, passwordHash) => {
     const query = `
         INSERT INTO Users (username, email, password_hash) VALUES ($1, $2, $3)
         RETURNING id, username, email, created_at, account_type
     `;
     const result = await db.query(query, [username, email, passwordHash]);
     return result.rows[0];
};

export const updateUserAccountType = async (userId, accountType) => {
     const query = `UPDATE Users SET account_type = $1 WHERE id = $2 RETURNING id, username, email, account_type`;
     const result = await db.query(query, [accountType, userId]);
     return result.rows[0];
};

export const getUserProfileStats = async (userId) => {
     const [
         listsCreatedResult,
         listsFollowingResult,
         dishesFollowingResult, // Assuming 'up' votes count as following
         restaurantsFollowingResult // Placeholder - define actual logic if needed
     ] = await Promise.all([
       db.query('SELECT COUNT(*) FROM Lists WHERE user_id = $1', [userId]),
       db.query('SELECT COUNT(*) FROM ListFollows WHERE user_id = $1', [userId]),
       db.query("SELECT COUNT(*) FROM DishVotes WHERE user_id = $1 AND vote_type = 'up'", [userId]),
       Promise.resolve({ rows: [{ count: '0' }] }) // Replace with actual query if restaurant following is implemented
       // db.query('SELECT COUNT(*) FROM RestaurantFollows WHERE user_id = $1', [userId]), // Example if exists
     ]);

     return {
       listsCreated: parseInt(listsCreatedResult.rows[0].count, 10) || 0,
       listsFollowing: parseInt(listsFollowingResult.rows[0].count, 10) || 0,
       dishesFollowing: parseInt(dishesFollowingResult.rows[0].count, 10) || 0,
       restaurantsFollowing: parseInt(restaurantsFollowingResult.rows[0].count, 10) || 0,
     };
};