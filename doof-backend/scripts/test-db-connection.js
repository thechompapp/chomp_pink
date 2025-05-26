import db from '../db/index.js';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await db.query('SELECT NOW() as now');
    console.log('Database connection successful. Current time:', result.rows[0].now);
    
    // Check if restaurants table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'restaurants'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    console.log('Restaurants table exists:', tableExists);
    
    if (tableExists) {
      // Count restaurants
      const count = await db.query('SELECT COUNT(*) FROM restaurants');
      console.log('Number of restaurants in database:', count.rows[0].count);
      
      // Get first few restaurants
      const sample = await db.query('SELECT * FROM restaurants LIMIT 3');
      console.log('Sample restaurants:', sample.rows);
    }
    
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    // Close the pool
    await db.pool.end();
    process.exit(0);
  }
}

testConnection();
