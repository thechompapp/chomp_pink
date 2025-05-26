import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

const pool = new pg.Pool({
  user: process.env.DB_USER || 'doof_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'doof_db',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function updateTestUserPassword() {
  const testEmail = 'test@example.com';
  const newPassword = 'testpassword123';
  
  try {
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password in the database
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email, username',
      [hashedPassword, testEmail]
    );
    
    if (result.rows.length === 0) {
      console.error('Test user not found');
      return;
    }
    
    console.log('Successfully updated password for test user:');
    console.table(result.rows[0]);
    
  } catch (error) {
    console.error('Error updating test user password:', error);
  } finally {
    await pool.end();
  }
}

updateTestUserPassword();
