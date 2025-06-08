// Debug script to test the formatList function
import { formatList } from './doof-backend/utils/formatters.js';

const sampleRow = {
  id: 59,
  name: 'Test QuickAdd List',
  description: 'Testing quickadd functionality',
  list_type: 'mixed',
  saved_count: 0,
  city_name: null,
  tags: [],
  is_public: true,
  creator_handle: 'admin',
  user_id: 104,
  created_at: '2025-06-02T00:26:53.129Z',
  updated_at: '2025-06-04T02:31:32.399Z',
  item_count: 6,  // This should be preserved!
  creator_username: 'admin',
  is_following: false
};

console.log('=== formatList Debug ===');
console.log('Input row:', {
  id: sampleRow.id,
  name: sampleRow.name,
  item_count: sampleRow.item_count,
  items_count: sampleRow.items_count
});

const formatted = formatList(sampleRow);

console.log('\nFormatted result:', {
  id: formatted.id,
  name: formatted.name,
  item_count: formatted.item_count
});

console.log('\nFull formatted object:');
console.log(JSON.stringify(formatted, null, 2)); 