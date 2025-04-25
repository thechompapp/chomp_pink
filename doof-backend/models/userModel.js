// Filename: /doof-backend/models/userModel.js
/* REFACTORED: Convert to ES Modules (import/export) */
import db from '../db/index.js'; // Use import and add .js extension
import bcrypt from 'bcryptjs'; // Use import for packages

const UserModel = {
    async createUser(username, email, password) {
        // Hash the password before storing
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO Users (username, email, password_hash, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, username, email, account_type, created_at;
        `;
        try {
            const result = await db.query(query, [username, email, passwordHash]);
            if (result.rows.length > 0) {
                 const user = result.rows[0];
                 // Ensure account_type is explicitly set (even if default in DB)
                 user.account_type = user.account_type || 'user';
                 return user;
            }
            return null;
        } catch (error) {
            // Handle potential errors like duplicate username/email
            if (error.code === '23505') { // Unique violation code in PostgreSQL
                if (error.constraint === 'users_username_key') {
                    throw new Error('Username already exists.');
                } else if (error.constraint === 'users_email_key') {
                    throw new Error('Email already registered.');
                }
            }
            console.error('Error creating user:', error);
            throw new Error('Failed to create user.'); // Generic error for other issues
        }
    },

    async findUserByEmail(email) {
        const query = 'SELECT id, username, email, password_hash, account_type FROM Users WHERE email = $1';
        try {
            const result = await db.query(query, [email]);
             if (result.rows.length > 0) {
                 const user = result.rows[0];
                 // Ensure account_type is explicitly set
                 user.account_type = user.account_type || 'user';
                 return user;
             }
            return null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error; // Re-throw db errors
        }
    },

     async findUserById(id) {
         const query = 'SELECT id, username, email, account_type, created_at FROM Users WHERE id = $1';
         try {
             const result = await db.query(query, [id]);
              if (result.rows.length > 0) {
                 const user = result.rows[0];
                 user.account_type = user.account_type || 'user';
                 return user;
             }
             return null;
         } catch (error) {
             console.error('Error finding user by ID:', error);
             throw error;
         }
     },

    async comparePassword(inputPassword, hashedPassword) {
        return bcrypt.compare(inputPassword, hashedPassword);
    },

    // Admin function to update account type
    async updateAccountType(userId, accountType) {
        const allowedTypes = ['user', 'contributor', 'superuser'];
        if (!allowedTypes.includes(accountType)) {
            throw new Error('Invalid account type specified.');
        }
        const query = `
            UPDATE Users
            SET account_type = $1
            WHERE id = $2
            RETURNING id, username, email, account_type, created_at;
        `;
        try {
            const result = await db.query(query, [accountType, userId]);
             if (result.rows.length > 0) {
                 return result.rows[0]; // Return the updated user info
             }
            return null; // User not found
        } catch (error) {
            console.error(`Error updating account type for user ${userId}:`, error);
            throw new Error('Failed to update account type.');
        }
    }
};

export default UserModel; // Use export default