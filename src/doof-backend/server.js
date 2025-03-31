const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Client } = require('@googlemaps/google-maps-services-js');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5001;

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'doof_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'doof_db',
  password: process.env.DB_PASSWORD || 'doof',
  port: process.env.DB_PORT || 5432,
});

// Google Maps client
const googleMapsClient = new Client({});

// Middleware
app.use(cors());
app.use(express.json());

// Flag to determine if DB is accessible
let dbAccessible = true;

// Test database connection
pool.connect(async (err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err.stack);
    dbAccessible = false;
    process.exit(1);
  }
  console.log('Connected to PostgreSQL database');
  release();
});

// Mock data for fallback
const mockRestaurants = [
  { id: 1, name: "Joe's Pizza", neighborhood: "Greenwich Village", city: "New York", tags: ["pizza", "italian"], adds: 78, created_at: new Date() },
  { id: 2, name: "Shake Shack", neighborhood: "Midtown", city: "New York", tags: ["burger", "american"], adds: 52, created_at: new Date() },
];

const mockDishes = [
  { id: 1, name: "Margherita Pizza", restaurant: "Joe's Pizza", tags: ["pizza", "vegetarian"], price: "$$ • ", adds: 78, created_at: new Date() },
  { id: 2, name: "ShackBurger", restaurant: "Shake Shack", tags: ["burger", "beef"], price: "$$ • ", adds: 52, created_at: new Date() },
];

const mockLists = [
  { id: 1, name: "NYC Pizza Tour", items: [], itemCount: 5, savedCount: 120, city: "New York", tags: ["pizza", "nyc"], isFollowing: false, createdByUser: false, creatorHandle: "@foodie1", created_at: new Date() },
  { id: 2, name: "Best Burgers NYC", items: [], itemCount: 8, savedCount: 150, city: "New York", tags: ["burgers", "nyc"], isFollowing: false, createdByUser: false, creatorHandle: "@burgerlover", created_at: new Date() },
];

// Admin Panel Endpoints
app.get('/api/admin/restaurants', async (req, res) => {
  if (!dbAccessible) {
    return res.json(mockRestaurants);
  }
  try {
    const { sort = 'name_asc' } = req.query;
    let orderBy;
    switch (sort) {
      case 'name_asc':
        orderBy = 'name ASC';
        break;
      case 'name_desc':
        orderBy = 'name DESC';
        break;
      case 'date_asc':
        orderBy = 'created_at ASC';
        break;
      case 'date_desc':
        orderBy = 'created_at DESC';
        break;
      default:
        orderBy = 'name ASC';
    }
    const result = await pool.query(`SELECT * FROM Restaurants ORDER BY ${orderBy}`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching restaurants:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.put('/api/admin/restaurants/:id', async (req, res) => {
  if (!dbAccessible) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  const { id } = req.params;
  const { name, neighborhood, city, tags, adds } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Restaurants SET name = $1, neighborhood = $2, city = $3, tags = $4, adds = $5 WHERE id = $6 RETURNING *',
      [name, neighborhood, city, tags, adds, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating restaurant:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.delete('/api/admin/restaurants/:id', async (req, res) => {
  if (!dbAccessible) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM Restaurants WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json({ message: 'Restaurant deleted' });
  } catch (err) {
    console.error('Error deleting restaurant:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/api/admin/dishes', async (req, res) => {
  if (!dbAccessible) {
    return res.json(mockDishes);
  }
  try {
    const { sort = 'name_asc' } = req.query;
    let orderBy;
    switch (sort) {
      case 'name_asc':
        orderBy = 'name ASC';
        break;
      case 'name_desc':
        orderBy = 'name DESC';
        break;
      case 'date_asc':
        orderBy = 'created_at ASC';
        break;
      case 'date_desc':
        orderBy = 'created_at DESC';
        break;
      default:
        orderBy = 'name ASC';
    }
    const result = await pool.query(`SELECT d.*, r.name AS restaurant FROM Dishes d JOIN Restaurants r ON d.restaurant_id = r.id ORDER BY ${orderBy}`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching dishes:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.put('/api/admin/dishes/:id', async (req, res) => {
  if (!dbAccessible) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  const { id } = req.params;
  const { name, restaurant_id, tags, adds } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Dishes SET name = $1, restaurant_id = $2, tags = $3, adds = $4 WHERE id = $5 RETURNING *',
      [name, restaurant_id, tags, adds, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Dish not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating dish:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.delete('/api/admin/dishes/:id', async (req, res) => {
  if (!dbAccessible) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM Dishes WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Dish not found' });
    }
    res.json({ message: 'Dish deleted' });
  } catch (err) {
    console.error('Error deleting dish:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/api/admin/lists', async (req, res) => {
  if (!dbAccessible) {
    return res.json(mockLists);
  }
  try {
    const { sort = 'name_asc' } = req.query;
    let orderBy;
    switch (sort) {
      case 'name_asc':
        orderBy = 'name ASC';
        break;
      case 'name_desc':
        orderBy = 'name DESC';
        break;
      case 'date_asc':
        orderBy = 'created_at ASC';
        break;
      case 'date_desc':
        orderBy = 'created_at DESC';
        break;
      default:
        orderBy = 'name ASC';
    }
    const result = await pool.query(`SELECT * FROM Lists ORDER BY ${orderBy}`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching lists:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.put('/api/admin/lists/:id', async (req, res) => {
  if (!dbAccessible) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  const { id } = req.params;
  const { name, items, item_count, saved_count, city, tags, is_public, created_by_user, creator_handle, is_following } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Lists SET name = $1, items = $2, item_count = $3, saved_count = $4, city = $5, tags = $6, is_public = $7, created_by_user = $8, creator_handle = $9, is_following = $10 WHERE id = $11 RETURNING *',
      [name, items, item_count, saved_count, city, tags, is_public, created_by_user, creator_handle, is_following, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'List not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating list:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.delete('/api/admin/lists/:id', async (req, res) => {
  if (!dbAccessible) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM Lists WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'List not found' });
    }
    res.json({ message: 'List deleted' });
  } catch (err) {
    console.error('Error deleting list:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Fetch common dishes for autofill
app.get('/api/common-dishes', async (req, res) => {
  if (!dbAccessible) {
    return res.json([]);
  }
  try {
    const { input = '' } = req.query;
    const result = await pool.query(
      'SELECT name FROM CommonDishes WHERE name ILIKE $1 LIMIT 10',
      [`%${input}%`]
    );
    res.json(result.rows.map(row => row.name));
  } catch (err) {
    console.error('Error fetching common dishes:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Fetch filters for dynamic hashtag suggestions
app.get('/api/filters', async (req, res) => {
  if (!dbAccessible) {
    return res.json([]);
  }
  try {
    const { category = '', relatedTag = '' } = req.query;
    let query = 'SELECT name FROM Filters WHERE category = $1';
    const params = [category];
    
    if (relatedTag) {
      // Simple logic to fetch related tags based on category and relatedTag
      // In a real app, this could be more sophisticated (e.g., using a tag relationship table)
      query += ' AND name ILIKE $2';
      params.push(`%${relatedTag}%`);
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows.map(row => row.name));
  } catch (err) {
    console.error('Error fetching filters:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Existing endpoints
app.get('/api/trending/restaurants', async (req, res) => {
  if (!dbAccessible) {
    return res.json(mockRestaurants);
  }
  try {
    const result = await pool.query('SELECT * FROM Restaurants ORDER BY adds DESC LIMIT 15');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching trending restaurants:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/api/trending/dishes', async (req, res) => {
  if (!dbAccessible) {
    return res.json(mockDishes);
  }
  try {
    const result = await pool.query(`
      SELECT d.*, r.name AS restaurant 
      FROM Dishes d 
      JOIN Restaurants r ON d.restaurant_id = r.id 
      ORDER BY d.adds DESC 
      LIMIT 15
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching trending dishes:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/api/trending/lists', async (req, res) => {
  if (!dbAccessible) {
    return res.json(mockLists);
  }
  try {
    const result = await pool.query('SELECT * FROM Lists WHERE is_public = TRUE ORDER BY saved_count DESC LIMIT 15');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching trending lists:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/api/lists', async (req, res) => {
  if (!dbAccessible) {
    return res.json(mockLists);
  }
  try {
    const result = await pool.query('SELECT * FROM Lists');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user lists:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.post('/api/submissions', async (req, res) => {
  if (!dbAccessible) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  const { user_id, type, name, location, tags, place_id, city, neighborhood } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Submissions (user_id, type, name, location, tags, place_id, city, neighborhood, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [user_id || 1, type, name, location, tags, place_id, city, neighborhood || 'Unknown', 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding submission:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/api/submissions', async (req, res) => {
  if (!dbAccessible) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  try {
    const result = await pool.query('SELECT * FROM Submissions WHERE status = $1', ['pending']);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching submissions:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.post('/api/submissions/:id/approve', async (req, res) => {
  if (!dbAccessible) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  const { id } = req.params;
  try {
    const submission = await pool.query('SELECT * FROM Submissions WHERE id = $1', [id]);
    if (!submission.rows.length) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    const sub = submission.rows[0];
    if (sub.type === 'restaurant') {
      const existingRestaurant = await pool.query(
        'SELECT * FROM Restaurants WHERE name = $1',
        [sub.name]
      );
      if (existingRestaurant.rows.length > 0) {
        const existing = existingRestaurant.rows[0];
        const updatedAdds = (existing.adds || 0) + 1;
        const updatedTags = [...new Set([...(existing.tags || []), ...(sub.tags || [])])];
        await pool.query(
          'UPDATE Restaurants SET adds = $1, tags = $2 WHERE id = $3',
          [updatedAdds, updatedTags, existing.id]
        );
      } else {
        await pool.query(
          'INSERT INTO Restaurants (name, neighborhood, city, tags) VALUES ($1, $2, $3, $4) RETURNING id',
          [sub.name, sub.neighborhood, sub.city, sub.tags]
        );
      }
    } else if (sub.type === 'dish') {
      const restaurant = await pool.query('SELECT id FROM Restaurants WHERE name = $1', [sub.location.split(',')[0].trim()]);
      const restaurantId = restaurant.rows[0]?.id || 1;
      await pool.query(
        'INSERT INTO Dishes (name, restaurant_id, tags) VALUES ($1, $2, $3)',
        [sub.name, restaurantId, sub.tags]
      );
    }
    await pool.query('UPDATE Submissions SET status = $1 WHERE id = $2', ['approved', id]);
    res.json({ message: 'Submission approved' });
  } catch (err) {
    console.error('Error approving submission:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.post('/api/submissions/:id/reject', async (req, res) => {
  if (!dbAccessible) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  const { id } = req.params;
  try {
    await pool.query('UPDATE Submissions SET status = $1 WHERE id = $2', ['rejected', id]);
    res.json({ message: 'Submission rejected' });
  } catch (err) {
    console.error('Error rejecting submission:', err.stack);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/api/places/autocomplete', async (req, res) => {
  const { input } = req.query;
  if (!input) {
    return res.status(400).json({ error: 'Input query is required' });
  }
  try {
    const response = await googleMapsClient.placeAutocomplete({
      params: {
        input,
        types: 'establishment',
        key: process.env.GOOGLE_API_KEY,
      },
    });
    if (response.data.status === 'OK') {
      res.json(response.data.predictions);
    } else {
      console.error('Google Places API error:', response.data.status, response.data.error_message);
      res.status(403).json({ error: 'Google Places API error', message: response.data.error_message || response.data.status });
    }
  } catch (error) {
    console.error('Error fetching place autocomplete:', error.message);
    res.status(500).json({ error: 'Failed to fetch place suggestions', message: error.message });
  }
});

app.get('/api/places/details', async (req, res) => {
  const { placeId } = req.query;
  if (!placeId) {
    return res.status(400).json({ error: 'Place ID is required' });
  }
  try {
    const response = await googleMapsClient.placeDetails({
      params: {
        place_id: placeId,
        fields: ['address_components', 'geometry', 'name'],
        key: process.env.GOOGLE_API_KEY,
      },
    });
    if (response.data.status === 'OK') {
      const place = response.data.result;
      let city = '';
      let neighborhood = '';
      let zipCode = '';
      let formattedAddress = '';

      place.address_components.forEach((component) => {
        if (component.types.includes('locality')) city = component.long_name;
        if (component.types.includes('neighborhood')) neighborhood = component.long_name;
        if (component.types.includes('postal_code')) zipCode = component.long_name;
        if (component.types.includes('street_number') || component.types.includes('route')) {
          formattedAddress += component.long_name + ' ';
        }
      });
      formattedAddress = formattedAddress.trim();
      if (city) formattedAddress += `, ${city}`;

      if (!neighborhood && zipCode && city) {
        const result = await pool.query(
          'SELECT neighborhood FROM Neighborhoods WHERE zip_code = $1 AND city = $2',
          [zipCode, city]
        );
        if (result.rows.length > 0) {
          neighborhood = result.rows[0].neighborhood;
        }
      }

      res.json({
        formattedAddress: formattedAddress || 'Unknown Location',
        city: city || 'Unknown',
        neighborhood: neighborhood || 'Unknown',
      });
    } else {
      console.error('Google Places API error:', response.data.status, response.data.error_message);
      res.status(500).json({ error: 'Google Places API error', message: response.data.error_message || response.data.status });
    }
  } catch (error) {
    console.error('Error fetching place details:', error.message);
    res.status(500).json({ error: 'Failed to fetch place details', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});