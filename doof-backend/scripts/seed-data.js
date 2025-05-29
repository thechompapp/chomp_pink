/* src/doof-backend/scripts/seed-data.js */
import db from '../db/index.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Sample data arrays
const cities = [
  { name: 'New York', state: 'NY' },
  { name: 'Los Angeles', state: 'CA' },
  { name: 'Chicago', state: 'IL' },
  { name: 'Houston', state: 'TX' },
  { name: 'Phoenix', state: 'AZ' },
  { name: 'Philadelphia', state: 'PA' },
  { name: 'San Antonio', state: 'TX' },
  { name: 'San Diego', state: 'CA' },
  { name: 'Dallas', state: 'TX' },
  { name: 'Austin', state: 'TX' },
  { name: 'San Francisco', state: 'CA' },
  { name: 'Miami', state: 'FL' },
  { name: 'Seattle', state: 'WA' },
  { name: 'Boston', state: 'MA' },
  { name: 'Denver', state: 'CO' }
];

const cuisineTypes = [
  'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'Thai', 'French', 'Greek',
  'Korean', 'Vietnamese', 'Mediterranean', 'American', 'Spanish', 'Turkish', 'Lebanese',
  'Peruvian', 'Brazilian', 'Ethiopian', 'Moroccan', 'German'
];

const restaurantNames = [
  'The Golden Spoon', 'Bella Vista', 'Dragon Palace', 'Sakura Garden', 'Spice Route',
  'Bangkok Kitchen', 'Le Petit Bistro', 'Olympia Taverna', 'Seoul BBQ', 'Pho Saigon',
  'Olive Branch', 'Liberty Grill', 'Tapas Barcelona', 'Istanbul Express', 'Cedar Grove',
  'Inca Kitchen', 'Rio Grande', 'Blue Nile', 'Atlas Mountains', 'Bavarian House',
  'Corner Cafe', 'Urban Eatery', 'Riverside Diner', 'Metro Bistro', 'City Kitchen',
  'Harbor View', 'Mountain Peak', 'Valley Fresh', 'Garden Gate', 'Fire Stone Grill',
  'Steam Works', 'Salt & Pepper', 'Fresh Start', 'Green Leaf', 'Blue Ocean',
  'Red Rock', 'White Pine', 'Black Diamond', 'Silver Fork', 'Gold Mine',
  'Copper Pot', 'Iron Skillet', 'Wooden Spoon', 'Glass House', 'Stone Bridge',
  'River Walk', 'Park Place', 'Town Square', 'Main Street', 'Broadway Bites',
  'First Avenue', 'Second Street', 'Third Ward', 'Fourth Corner', 'Fifth Element'
];

const dishNames = {
  Italian: ['Margherita Pizza', 'Spaghetti Carbonara', 'Chicken Parmigiana', 'Fettuccine Alfredo', 'Lasagna Bolognese', 'Risotto Mushroom', 'Tiramisu', 'Bruschetta'],
  Mexican: ['Tacos al Pastor', 'Chicken Enchiladas', 'Beef Burrito', 'Guacamole & Chips', 'Chiles Rellenos', 'Quesadilla', 'Carne Asada', 'Churros'],
  Chinese: ['Sweet & Sour Pork', 'Kung Pao Chicken', 'Beef & Broccoli', 'Fried Rice', 'Dumplings', 'Hot Pot', 'Peking Duck', 'Mapo Tofu'],
  Japanese: ['Sushi Platter', 'Chicken Teriyaki', 'Ramen Bowl', 'Tempura', 'Miso Soup', 'Yakitori', 'Katsu Curry', 'Mochi Ice Cream'],
  Indian: ['Chicken Tikka Masala', 'Butter Chicken', 'Biryani Rice', 'Naan Bread', 'Samosas', 'Dal Curry', 'Tandoori Chicken', 'Mango Lassi'],
  Thai: ['Pad Thai', 'Green Curry', 'Tom Yum Soup', 'Massaman Curry', 'Papaya Salad', 'Sticky Rice', 'Spring Rolls', 'Mango Sticky Rice'],
  French: ['Coq au Vin', 'Beef Bourguignon', 'Ratatouille', 'French Onion Soup', 'Croissant', 'Escargot', 'Crème Brûlée', 'Bouillabaisse'],
  Greek: ['Moussaka', 'Greek Salad', 'Gyros', 'Souvlaki', 'Spanakopita', 'Tzatziki', 'Baklava', 'Dolmades'],
  Korean: ['Bulgogi', 'Kimchi', 'Bibimbap', 'Korean BBQ', 'Japchae', 'Kimchi Stew', 'Korean Fried Chicken', 'Hotteok'],
  Vietnamese: ['Pho Bo', 'Banh Mi', 'Spring Rolls', 'Vermicelli Bowl', 'Vietnamese Coffee', 'Bun Bo Hue', 'Com Tam', 'Che Ba Mau'],
  American: ['Cheeseburger', 'BBQ Ribs', 'Mac & Cheese', 'Fried Chicken', 'Apple Pie', 'Buffalo Wings', 'Clam Chowder', 'Cheesecake']
};

const neighborhoods = [
  'Downtown', 'Midtown', 'Uptown', 'Old Town', 'SoHo', 'Tribeca', 'Chelsea', 'Village',
  'Heights', 'Hill', 'District', 'Quarter', 'Bay', 'Harbor', 'Garden', 'Grove'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Get existing cities
    const existingCitiesResult = await db.query('SELECT id, name FROM cities ORDER BY id');
    const existingCities = existingCitiesResult.rows;
    console.log(`📍 Found ${existingCities.length} existing cities`);

    // Create test user if doesn't exist
    const testUserResult = await db.query('SELECT id FROM users WHERE email = $1', ['test@example.com']);
    let testUserId;
    
    if (testUserResult.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);
      const userResult = await db.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        ['testuser', 'test@example.com', hashedPassword]
      );
      testUserId = userResult.rows[0].id;
      console.log('👤 Created test user');
    } else {
      testUserId = testUserResult.rows[0].id;
      console.log('👤 Using existing test user');
    }

    // Generate restaurants
    console.log('🍽️ Generating restaurants...');
    const restaurantsToCreate = [];
    const targetRestaurantCount = 300;

    for (let i = 0; i < targetRestaurantCount; i++) {
      const city = getRandomElement(existingCities);
      const cuisine = getRandomElement(cuisineTypes);
      const neighborhood = getRandomElement(neighborhoods);
      const name = getRandomElement(restaurantNames);
      
      // Create unique name by adding neighborhood, number, or UUID part
      const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase();
      let uniqueName;
      
      if (Math.random() > 0.8) {
        uniqueName = `${name} - ${neighborhood}`;
      } else if (Math.random() > 0.6) {
        uniqueName = `${name} ${uniqueId}`;
      } else if (Math.random() > 0.4) {
        uniqueName = `${neighborhood} ${name}`;
      } else {
        uniqueName = `${name} (${cuisine})`;
      }

      restaurantsToCreate.push({
        name: uniqueName,
        cuisine: cuisine,
        city_id: city.id,
        address: `${Math.floor(Math.random() * 9999) + 1} ${neighborhood} Street`,
        price_range: '$'.repeat(Math.floor(Math.random() * 4) + 1), // $, $$, $$$, $$$$
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
        total_reviews: Math.floor(Math.random() * 1000) + 10
      });
    }

    // Insert restaurants in batches
    const batchSize = 10; // Reduced batch size for debugging
    const restaurantIds = [];
    
    for (let i = 0; i < restaurantsToCreate.length; i += batchSize) {
      const batch = restaurantsToCreate.slice(i, i + batchSize);
      const values = batch.map((_, index) => {
        const paramStart = index * 5 + 1;
        return `($${paramStart}, $${paramStart + 1}, $${paramStart + 2}, $${paramStart + 3}, $${paramStart + 4})`;
      }).join(', ');
      
      const flatValues = batch.flatMap(r => [r.name, r.cuisine, r.city_id, r.address, r.price_range]);
      
      const query = `
        INSERT INTO restaurants (name, cuisine, city_id, address, price_range)
        VALUES ${values}
        RETURNING id
      `;
      
      try {
        const result = await db.query(query, flatValues);
        restaurantIds.push(...result.rows.map(row => row.id));
      } catch (error) {
        if (error.code === '23505') {
          // Skip duplicate key errors and continue
          console.log(`Skipping duplicate restaurant batch ${i}`);
          continue;
        } else {
          throw error;
        }
      }
    }

    console.log(`✅ Created ${restaurantIds.length} restaurants`);

    // Generate dishes
    console.log('🍜 Generating dishes...');
    const dishesToCreate = [];
    const targetDishCount = 800;

    for (let i = 0; i < targetDishCount; i++) {
      const restaurantId = getRandomElement(restaurantIds);
      
      // Get restaurant info to match cuisine
      const restaurantResult = await db.query('SELECT cuisine FROM restaurants WHERE id = $1', [restaurantId]);
      const restaurantCuisine = restaurantResult.rows[0]?.cuisine;
      
      const availableDishes = dishNames[restaurantCuisine] || dishNames.American;
      const dishName = getRandomElement(availableDishes);
      
      // Add variation to dish names
      const variations = ['Special', 'Classic', 'Deluxe', 'Traditional', 'Signature', ''];
      const variation = getRandomElement(variations);
      const uniqueDishName = variation ? `${variation} ${dishName}` : dishName;

      dishesToCreate.push({
        name: uniqueDishName,
        restaurant_id: restaurantId,
        price: Math.round((Math.random() * 30 + 8) * 100) / 100, // $8.00-$38.00
        description: `Delicious ${uniqueDishName.toLowerCase()} prepared with fresh ingredients and authentic flavors.`,
        category: getRandomElement(['appetizer', 'main', 'dessert', 'beverage'])
      });
    }

    // Insert dishes in batches
    const dishIds = [];
    
    for (let i = 0; i < dishesToCreate.length; i += batchSize) {
      const batch = dishesToCreate.slice(i, i + batchSize);
      const values = batch.map((_, index) => {
        const paramStart = index * 5 + 1;
        return `($${paramStart}, $${paramStart + 1}, $${paramStart + 2}, $${paramStart + 3}, $${paramStart + 4})`;
      }).join(', ');
      
      const flatValues = batch.flatMap(d => [d.name, d.restaurant_id, d.price, d.description, d.category]);
      
      const query = `
        INSERT INTO dishes (name, restaurant_id, price, description, category)
        VALUES ${values}
        RETURNING id
      `;
      
      try {
        const result = await db.query(query, flatValues);
        dishIds.push(...result.rows.map(row => row.id));
      } catch (error) {
        if (error.code === '23505') {
          // Skip duplicate key errors and continue
          console.log(`Skipping duplicate dish batch ${i}`);
          continue;
        } else {
          throw error;
        }
      }
    }

    console.log(`✅ Created ${dishIds.length} dishes`);

    // Generate curated lists
    console.log('📝 Generating curated lists...');
    const listsToCreate = [
      // Restaurant lists
      { name: 'Best Pizza Places in NYC', type: 'restaurant', description: 'The ultimate guide to NYC pizza joints', tags: ['pizza', 'nyc', 'italian'] },
      { name: 'Top Sushi Spots', type: 'restaurant', description: 'Fresh sushi restaurants worth visiting', tags: ['sushi', 'japanese', 'fresh'] },
      { name: 'Budget-Friendly Eats', type: 'restaurant', description: 'Great food that won\'t break the bank', tags: ['budget', 'affordable', 'value'] },
      { name: 'Fine Dining Experiences', type: 'restaurant', description: 'Special occasion restaurants', tags: ['fine-dining', 'upscale', 'special'] },
      { name: 'Best Brunch Spots', type: 'restaurant', description: 'Perfect places for weekend brunch', tags: ['brunch', 'weekend', 'breakfast'] },
      { name: 'Late Night Eats', type: 'restaurant', description: 'Open late when you need food', tags: ['late-night', '24-hours', 'night-owl'] },
      { name: 'Family-Friendly Restaurants', type: 'restaurant', description: 'Great places to eat with kids', tags: ['family', 'kids', 'casual'] },
      { name: 'Romantic Date Spots', type: 'restaurant', description: 'Perfect restaurants for date night', tags: ['romantic', 'date', 'ambiance'] },
      { name: 'Best Food Trucks', type: 'restaurant', description: 'Mobile eats worth tracking down', tags: ['food-truck', 'street-food', 'mobile'] },
      { name: 'Vegetarian Paradise', type: 'restaurant', description: 'Amazing vegetarian restaurants', tags: ['vegetarian', 'plant-based', 'healthy'] },
      
      // Dish lists
      { name: 'Must-Try Desserts', type: 'dish', description: 'Sweet treats you have to experience', tags: ['dessert', 'sweet', 'treats'] },
      { name: 'Spicy Food Challenge', type: 'dish', description: 'For those who love the heat', tags: ['spicy', 'hot', 'challenge'] },
      { name: 'Comfort Food Classics', type: 'dish', description: 'Food that feels like a warm hug', tags: ['comfort', 'classic', 'hearty'] },
      { name: 'Healthy Bowl Options', type: 'dish', description: 'Nutritious and delicious bowls', tags: ['healthy', 'bowl', 'fresh'] },
      { name: 'Signature Cocktails & Apps', type: 'dish', description: 'Perfect bar food combinations', tags: ['cocktails', 'appetizers', 'bar'] },
      { name: 'Instagram-Worthy Dishes', type: 'dish', description: 'Food that looks as good as it tastes', tags: ['instagram', 'photogenic', 'pretty'] },
      { name: 'Traditional Cultural Dishes', type: 'dish', description: 'Authentic cultural specialties', tags: ['traditional', 'authentic', 'cultural'] },
      { name: 'Fusion Food Favorites', type: 'dish', description: 'Creative fusion cuisine highlights', tags: ['fusion', 'creative', 'modern'] },
      { name: 'Breakfast All Day', type: 'dish', description: 'Breakfast dishes available anytime', tags: ['breakfast', 'all-day', 'morning'] },
      { name: 'Shareable Plates', type: 'dish', description: 'Perfect dishes for sharing with friends', tags: ['sharing', 'group', 'social'] },
      
      // Mixed lists
      { name: 'Weekend Food Adventure', type: 'mixed', description: 'Restaurants and dishes for a food tour', tags: ['weekend', 'adventure', 'exploration'] },
      { name: 'Birthday Celebration Spots', type: 'mixed', description: 'Places and dishes for celebrations', tags: ['birthday', 'celebration', 'party'] },
      { name: 'First Date Food Guide', type: 'mixed', description: 'Safe restaurants and shareable dishes', tags: ['first-date', 'safe', 'conversation'] },
      { name: 'Foodie Tourist Guide', type: 'mixed', description: 'Must-visit spots and signature dishes', tags: ['tourist', 'must-visit', 'signature'] },
      { name: 'Rainy Day Comfort', type: 'mixed', description: 'Cozy spots and warming dishes', tags: ['rainy-day', 'cozy', 'comfort'] }
    ];

    for (const listData of listsToCreate) {
      const listResult = await db.query(
        `INSERT INTO lists (name, description, list_type, tags, is_public, user_id, creator_handle, city_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          listData.name,
          listData.description,
          listData.type,
          listData.tags,
          true,
          testUserId,
          'testuser',
          getRandomElement(existingCities).name
        ]
      );

      const listId = listResult.rows[0].id;

      // Add items to the list based on type
      const itemsToAdd = [];
      const itemCount = Math.floor(Math.random() * 8) + 5; // 5-12 items per list

      if (listData.type === 'restaurant') {
        const selectedRestaurants = getRandomElements(restaurantIds, itemCount);
        for (const restaurantId of selectedRestaurants) {
          itemsToAdd.push({ item_id: restaurantId, item_type: 'restaurant' });
        }
      } else if (listData.type === 'dish') {
        const selectedDishes = getRandomElements(dishIds, itemCount);
        for (const dishId of selectedDishes) {
          itemsToAdd.push({ item_id: dishId, item_type: 'dish' });
        }
      } else { // mixed
        const restaurantCount = Math.floor(itemCount / 2);
        const dishCount = itemCount - restaurantCount;
        
        const selectedRestaurants = getRandomElements(restaurantIds, restaurantCount);
        const selectedDishes = getRandomElements(dishIds, dishCount);
        
        for (const restaurantId of selectedRestaurants) {
          itemsToAdd.push({ item_id: restaurantId, item_type: 'restaurant' });
        }
        for (const dishId of selectedDishes) {
          itemsToAdd.push({ item_id: dishId, item_type: 'dish' });
        }
      }

      // Insert list items
      for (const item of itemsToAdd) {
        await db.query(
          'INSERT INTO listitems (list_id, item_id, item_type) VALUES ($1, $2, $3)',
          [listId, item.item_id, item.item_type]
        );
      }
    }

    console.log(`✅ Created ${listsToCreate.length} curated lists with items`);

    // Final count
    const finalCounts = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM restaurants) as restaurants,
        (SELECT COUNT(*) FROM dishes) as dishes,
        (SELECT COUNT(*) FROM lists) as lists,
        (SELECT COUNT(*) FROM listitems) as list_items
    `);

    console.log('📊 Final database counts:');
    console.log(`   Restaurants: ${finalCounts.rows[0].restaurants}`);
    console.log(`   Dishes: ${finalCounts.rows[0].dishes}`);
    console.log(`   Lists: ${finalCounts.rows[0].lists}`);
    console.log(`   List Items: ${finalCounts.rows[0].list_items}`);
    
    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

export default seedDatabase;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('Seeding complete, exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
} 