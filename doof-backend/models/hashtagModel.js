// Filename: /root/doof-backend/models/hashtagModel.js
/* REFACTORED: Convert to ES Modules (import/export) */
import db from '../db/index.js';
import format from 'pg-format';

// Function to extract hashtags from text
export const extractHashtags = (text) => {
  if (!text || typeof text !== 'string') return [];
  const regex = /#([a-zA-Z0-9_]+)/g;
  const matches = text.match(regex);
  return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : [];
};

// Function to find existing tags or create new ones
export const findOrCreateHashtags = async (tagNames, client = db) => {
  if (!tagNames || tagNames.length === 0) {
    return [];
  }
  const uniqueTags = [...new Set(tagNames.map(tag => tag.toLowerCase().trim()).filter(Boolean))];
  if (uniqueTags.length === 0) return [];

  try {
    const findQuery = format('SELECT id, name FROM hashtags WHERE name IN (%L)', uniqueTags);
    const existingResult = await client.query(findQuery);
    const existingTagsMap = new Map(existingResult.rows.map(tag => [tag.name, tag.id]));

    const tagIds = [...existingTagsMap.values()];
    const tagsToCreate = uniqueTags.filter(tag => !existingTagsMap.has(tag));

    if (tagsToCreate.length > 0) {
      const createValues = tagsToCreate.map(tag => [tag]);
      const createQuery = format('INSERT INTO hashtags (name) VALUES %L RETURNING id, name', createValues);
      const createResult = await client.query(createQuery);
      createResult.rows.forEach(newTag => tagIds.push(newTag.id));
    }

    return tagIds;
  } catch (error) {
    console.error('Error in findOrCreateHashtags:', error);
    throw new Error(`Failed to find or create hashtags: ${error.message}`);
  }
};

// Function to associate tags with a restaurant
export const linkTagsToRestaurant = async (restaurantId, tagIds, client = db) => {
  if (!restaurantId || !tagIds || tagIds.length === 0) {
    return;
  }
  const values = tagIds.map(tagId => [restaurantId, tagId]);
  const query = format(
    'INSERT INTO RestaurantHashtags (restaurant_id, hashtag_id) VALUES %L ON CONFLICT (restaurant_id, hashtag_id) DO NOTHING',
    values
  );
  try {
    await client.query(query);
  } catch (error) {
    console.error(`Error linking tags to restaurant ${restaurantId}:`, error);
    throw new Error(`Failed to link tags to restaurant: ${error.message}`);
  }
};

// Function to associate tags with a dish
export const linkTagsToDish = async (dishId, tagIds, client = db) => {
  if (!dishId || !tagIds || tagIds.length === 0) {
    return;
  }
  const values = tagIds.map(tagId => [dishId, tagId]);
  const query = format(
    'INSERT INTO DishHashtags (dish_id, hashtag_id) VALUES %L ON CONFLICT (dish_id, hashtag_id) DO NOTHING',
    values
  );
  try {
    await client.query(query);
  } catch (error) {
    console.error(`Error linking tags to dish ${dishId}:`, error);
    throw new Error(`Failed to link tags to dish: ${error.message}`);
  }
};

// Function to get all distinct categories
export const getAllCategories = async () => {
  const query = 'SELECT DISTINCT category FROM hashtags WHERE category IS NOT NULL ORDER BY category';
  try {
    const result = await db.query(query);
    return result.rows.map(row => row.category);
  } catch (error) {
    console.error('Error fetching hashtag categories:', error);
    throw error;
  }
};

// Function to get top 15 hashtags by usage
export const getTopHashtags = async (limit = 15) => {
  const safeLimit = Math.max(1, parseInt(limit, 10) || 15);
  const query = `
    SELECT h.name, COUNT(*) as usage_count
    FROM hashtags h
    LEFT JOIN restauranthashtags rh ON h.id = rh.hashtag_id
    LEFT JOIN dishhashtags dh ON h.id = dh.hashtag_id
    WHERE h.name IS NOT NULL
    GROUP BY h.name
    ORDER BY usage_count DESC, h.name
    LIMIT $1;
  `;
  try {
    const result = await db.query(query, [safeLimit]);
    return result.rows.map(row => ({ name: row.name, usage_count: parseInt(row.usage_count, 10) }));
  } catch (error) {
    console.error('Error fetching top hashtags:', error);
    throw new Error(`Failed to fetch top hashtags: ${error.message}`);
  }
};