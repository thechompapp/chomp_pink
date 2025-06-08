// Debug script to test the findListsByUser query
import db from './doof-backend/db/index.js';

const userId = 104; // admin user
const limit = 2;
const offset = 0;

let params = [];
let paramIndex = 1;
const addParam = (val) => {
  params.push(val);
  return `$${paramIndex++}`;
};

let baseQuery = `
  SELECT DISTINCT l.id, l.name, l.description, l.list_type, l.saved_count, 
         l.city_name, l.tags, l.is_public, l.creator_handle, l.user_id, 
         l.created_at, l.updated_at, l.item_count,
         u.username as creator_username,
         CASE WHEN lf.user_id IS NOT NULL THEN true ELSE false END as is_following
  FROM lists l
  LEFT JOIN users u ON l.user_id = u.id
  LEFT JOIN listfollows lf ON l.id = lf.list_id AND lf.user_id = ${addParam(userId)}
`;

// Add default condition for user lists
let whereConditions = [];
whereConditions.push(`(l.user_id = ${addParam(userId)} OR l.is_public = true)`);

if (whereConditions.length > 0) {
  baseQuery += ` WHERE ${whereConditions.join(' AND ')}`;
}

baseQuery += ` GROUP BY l.id, u.username, lf.user_id`;
baseQuery += ` ORDER BY l.created_at DESC`;
baseQuery += ` LIMIT ${addParam(limit)} OFFSET ${addParam(offset)}`;

console.log('=== Query Debug ===');
console.log('Query:', baseQuery);
console.log('Params:', params);

try {
  const result = await db.query(baseQuery, params);
  
  console.log('\n=== Query Result ===');
  console.log('Row count:', result.rows.length);
  
  result.rows.forEach(row => {
    console.log(`List ${row.id} (${row.name}):`);
    console.log(`  - item_count: ${row.item_count} (type: ${typeof row.item_count})`);
    console.log(`  - user_id: ${row.user_id}`);
    console.log(`  - is_public: ${row.is_public}`);
  });
  
} catch (error) {
  console.error('Query error:', error);
}

process.exit(0); 