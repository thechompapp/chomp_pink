// Filename: /doof-backend/models/userModel.js
/* REFACTORED: Convert to ES Modules (import/export) */
import db from '../db/index.js'; // Use import and add .js extension
import bcrypt from 'bcryptjs'; // Use import for packages

const UserModel = {
    async create(userData) {
        // Hash the password before storing
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(userData.password, salt);

        const query = `
            INSERT INTO Users (username, email, password_hash, created_at, role)
            VALUES ($1, $2, $3, NOW(), $4)
            RETURNING id, username, email, role, created_at;
        `;
        try {
            const result = await db.query(query, [
                userData.username, 
                userData.email, 
                passwordHash,
                userData.role || 'user'
            ]);
            
            if (result.rows.length > 0) {
                const user = result.rows[0];
                // Ensure role is explicitly set (even if default in DB)
                user.role = user.role || 'user';
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
        const query = 'SELECT id, username, email, password_hash, role FROM Users WHERE email = $1';
        try {
            const result = await db.query(query, [email]);
            if (result.rows.length > 0) {
                const user = result.rows[0];
                // Ensure role is explicitly set
                user.role = user.role || 'user';
                return user;
            }
            return null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error; // Re-throw db errors
        }
    },

    async findByUsername(username) {
        const query = 'SELECT id, username, email, role FROM Users WHERE username = $1';
        try {
            const result = await db.query(query, [username]);
            if (result.rows.length > 0) {
                const user = result.rows[0];
                user.role = user.role || 'user';
                return user;
            }
            return null;
        } catch (error) {
            console.error('Error finding user by username:', error);
            throw error; // Re-throw db errors
        }
    },

    async findUserById(id) {
        const query = 'SELECT id, username, email, role, created_at FROM Users WHERE id = $1';
        try {
            const result = await db.query(query, [id]);
            if (result.rows.length > 0) {
                const user = result.rows[0];
                user.role = user.role || 'user';
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
    async updateAccountType(userId, role) {
        const allowedTypes = ['user', 'contributor', 'admin'];
        if (!allowedTypes.includes(role)) {
            throw new Error('Invalid role specified.');
        }
        const query = `
            UPDATE Users
            SET role = $1
            WHERE id = $2
            RETURNING id, username, email, role, created_at;
        `;
        try {
            const result = await db.query(query, [role, userId]);
            if (result.rows.length > 0) {
                return result.rows[0]; // Return the updated user info
            }
            return null; // User not found
        } catch (error) {
            console.error(`Error updating role for user ${userId}:`, error);
            throw new Error('Failed to update role.');
        }
    }
};

export default UserModel; // Use export default