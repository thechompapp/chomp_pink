// Filename: /doof-backend/models/userModel.js
/* REFACTORED: Convert to ES Modules (import/export) */
import db from '../db/index.js'; // Use import and add .js extension
import bcrypt from 'bcryptjs'; // Use import for packages

// Default user role if not specified
const DEFAULT_ROLE = 'user';

// List of valid user roles
const USER_ROLES = ['user', 'contributor', 'superuser'];

const UserModel = {
    /**
     * Create a new user
     * @param {Object} userData - User data including username, email, and password
     * @returns {Promise<Object>} Created user object
     */
    async create(userData) {
        // Enhanced: Check for required fields before proceeding
        if (!userData.username || !userData.email || !userData.password) {
            console.error('[UserModel.create] Missing required fields:', userData);
            throw new Error('Missing required registration fields.');
        }
        // Hash the password before storing
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(userData.password, salt);
        const role = USER_ROLES.includes(userData.role) ? userData.role : DEFAULT_ROLE;

        const query = `
            INSERT INTO users (username, email, password_hash, role, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING id, username, email, role, created_at, updated_at;
        `;
        try {
            // Enhanced: Log attempted insert data (mask password)
            console.log('[UserModel.create] Attempting to insert user:', {
                username: userData.username,
                email: userData.email,
                role: role
            });
            const result = await db.query(query, [
                userData.username, 
                userData.email, 
                passwordHash,
                role
            ]);
            if (result.rows.length > 0) {
                return this._formatUser(result.rows[0]);
            }
            return null;
        } catch (error) {
            // Enhanced: Log full error object
            console.error('[UserModel.create] Error creating user:', error, {
                username: userData.username,
                email: userData.email,
                role: role
            });
            // Handle potential errors like duplicate username/email
            if (error.code === '23505') { // Unique violation code in PostgreSQL
                if (error.constraint === 'users_username_key') {
                    throw new Error('Username already exists.');
                } else if (error.constraint === 'users_email_key') {
                    throw new Error('Email already registered.');
                }
            }
            throw new Error('Failed to create user.');
        }
    },

    /**
     * Find user by email
     * @param {string} email - User's email
     * @returns {Promise<Object|null>} User object if found, null otherwise
     */
    async findUserByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        try {
            const result = await db.query(query, [email]);
            return result.rows.length > 0 ? this._formatUser(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    },

    /**
     * Find user by username
     * @param {string} username - Username to search for
     * @returns {Promise<Object|null>} User object if found, null otherwise
     */
    async findByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = $1';
        try {
            const result = await db.query(query, [username]);
            return result.rows.length > 0 ? this._formatUser(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding user by username:', error);
            throw error;
        }
    },

    /**
     * Find user by ID
     * @param {number} id - User ID
     * @returns {Promise<Object|null>} User object if found, null otherwise
     */
    async findUserById(id) {
        const query = 'SELECT * FROM users WHERE id = $1';
        try {
            const result = await db.query(query, [id]);
            return result.rows.length > 0 ? this._formatUser(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw error;
        }
    },

    /**
     * Compare input password with hashed password
     * @param {string} inputPassword - Plain text password
     * @param {string} hashedPassword - Hashed password from database
     * @returns {Promise<boolean>} True if passwords match, false otherwise
     */
    async comparePassword(inputPassword, hashedPassword) {
        try {
            return await bcrypt.compare(inputPassword, hashedPassword);
        } catch (error) {
            console.error('Error comparing passwords:', error);
            return false;
        }
    },

    /**
     * Update user role (admin function)
     * @param {number} userId - ID of user to update
     * @param {string} role - New role
     * @returns {Promise<Object>} Updated user object
     */
    async updateAccountType(userId, role) {
        if (!USER_ROLES.includes(role)) {
            throw new Error(`Invalid role. Must be one of: ${USER_ROLES.join(', ')}`);
        }

        const query = `
            UPDATE users 
            SET role = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *;
        `;

        try {
            const result = await db.query(query, [role, userId]);
            if (result.rows.length === 0) {
                throw new Error('User not found');
            }
            return this._formatUser(result.rows[0]);
        } catch (error) {
            console.error('Error updating user role:', error);
            throw new Error('Failed to update user role');
        }
    },

    /**
     * Format user object consistently
     * @private
     * @param {Object} user - Raw user data from database
     * @returns {Object} Formatted user object
     */
    _formatUser(user) {
        if (!user) return null;
        
        const formattedUser = {
            id: Number(user.id),
            username: user.username,
            email: user.email,
            role: USER_ROLES.includes(user.role) ? user.role : DEFAULT_ROLE,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        };
        
        // Include password_hash if it exists (needed for authentication)
        if (user.password_hash) {
            formattedUser.password_hash = user.password_hash;
        }
        
        return formattedUser;
    },
    
    /**
     * Update a user's password
     * @param {number} userId - ID of the user
     * @param {string} newHashedPassword - The new hashed password
     * @returns {Promise<boolean>} True if update was successful
     */
    async updateUserPassword(userId, newHashedPassword) {
        const query = `
            UPDATE users 
            SET password_hash = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id;
        `;
        
        try {
            const result = await db.query(query, [newHashedPassword, userId]);
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error updating user password:', error);
            throw new Error('Failed to update user password');
        }
    }
};

export default UserModel;