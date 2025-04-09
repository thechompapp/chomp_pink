/* src/doof-backend/models/userModel.ts */
import db from '../db/index.js'; // Keep .js extension for importing the compiled db index
import type { PoolClient, QueryResult } from 'pg'; // Import pg types

// Define more specific types if possible
export interface User {
    id: number;
    username: string;
    email: string;
    account_type: string;
    created_at?: Date;
    password_hash?: string; // Only included in some queries
}

export const findUserById = async (id: number): Promise<User | undefined> => {
    const result = await db.query('SELECT id, username, email, account_type, created_at FROM Users WHERE id = $1', [id]);
    return result.rows[0];
};

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
    const result = await db.query('SELECT * FROM Users WHERE LOWER(email) = LOWER($1)', [email]);
    return result.rows[0];
};

export const findUserByUsername = async (username: string): Promise<User | undefined> => {
    const result = await db.query('SELECT * FROM Users WHERE LOWER(username) = LOWER($1)', [username]);
    return result.rows[0];
};

export const createUser = async (username: string, email: string, passwordHash: string): Promise<User> => {
    const query = `
        INSERT INTO Users (username, email, password_hash, account_type) 
        VALUES ($1, $2, $3, 'user')
        RETURNING id, username, email, created_at, account_type
    `;
    const result = await db.query(query, [username, email, passwordHash]);
    if (!result.rows[0]) {
        throw new Error("User creation failed, no row returned.");
    }
    return result.rows[0];
};

export const updateUserAccountType = async (userId: number, accountType: string): Promise<User | undefined> => {
    const query = `
        UPDATE Users SET account_type = $1 
        WHERE id = $2 
        RETURNING id, username, email, account_type
    `;
    const result = await db.query(query, [accountType, userId]);
    return result.rows[0];
};

export const getUserProfileStats = async (userId: number) => {
    const [
        listsCreatedResult,
        listsFollowingResult,
        dishesFollowingResult, // Assuming this tracks liked dishes via DishVotes
        restaurantsFollowingResult // Assuming this tracks liked restaurants (needs implementation)
    ] = await Promise.all([
        db.query('SELECT COUNT(*) FROM Lists WHERE user_id = $1', [userId]),
        db.query('SELECT COUNT(*) FROM ListFollows WHERE user_id = $1', [userId]),
        // Changed this query to reflect actual table `dishvotes`
        db.query("SELECT COUNT(*) FROM DishVotes WHERE user_id = $1 AND vote_type = 'up'", [userId]),
        // Placeholder for restaurant following - needs a table/logic
        Promise.resolve({ rows: [{ count: '0' }] })
    ]);

    return {
        listsCreated: parseInt(listsCreatedResult.rows[0].count, 10) || 0,
        listsFollowing: parseInt(listsFollowingResult.rows[0].count, 10) || 0,
        dishesFollowing: parseInt(dishesFollowingResult.rows[0].count, 10) || 0, // Use correct result
        restaurantsFollowing: parseInt(restaurantsFollowingResult.rows[0].count, 10) || 0,
    };
};