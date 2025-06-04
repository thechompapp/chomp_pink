/* Add dishes to existing restaurants */
import db from '../db/index.js';

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

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function addDishesToRestaurants() {
  try {
    console.log('🍜 Adding dishes to existing restaurants...');
    
    // Get all existing restaurants
    const restaurantsResult = await db.query('SELECT id, name, cuisine FROM restaurants ORDER BY id');
    const restaurants = restaurantsResult.rows;
    
    console.log(`Found ${restaurants.length} restaurants`);
    
    const dishesToCreate = [];
    const dishesPerRestaurant = 5; // Add 5 dishes per restaurant
    
    for (const restaurant of restaurants) {
      const restaurantCuisine = restaurant.cuisine || 'American';
      const availableDishes = dishNames[restaurantCuisine] || dishNames.American;
      
      console.log(`Adding dishes to ${restaurant.name} (${restaurantCuisine})`);
      
      // Create multiple dishes for this restaurant
      for (let i = 0; i < dishesPerRestaurant; i++) {
        const dishName = getRandomElement(availableDishes);
        
        // Add variation to dish names to avoid duplicates
        const variations = ['Special', 'Classic', 'Deluxe', 'Traditional', 'Signature', 'House', 'Chef\'s'];
        const variation = getRandomElement(variations);
        const uniqueDishName = `${variation} ${dishName}`;

        dishesToCreate.push({
          name: uniqueDishName,
          restaurant_id: restaurant.id,
          description: `Delicious ${uniqueDishName.toLowerCase()} prepared with fresh ingredients and authentic ${restaurantCuisine.toLowerCase()} flavors.`,
          category: getRandomElement(['appetizer', 'main', 'dessert', 'beverage'])
        });
      }
    }
    
    console.log(`Creating ${dishesToCreate.length} dishes...`);
    
    // Insert dishes in batches
    const batchSize = 20;
    let totalCreated = 0;
    
    for (let i = 0; i < dishesToCreate.length; i += batchSize) {
      const batch = dishesToCreate.slice(i, i + batchSize);
      
      for (const dish of batch) {
        try {
          const result = await db.query(
            'INSERT INTO dishes (name, restaurant_id, description, category) VALUES ($1, $2, $3, $4) RETURNING id',
            [dish.name, dish.restaurant_id, dish.description, dish.category]
          );
          totalCreated++;
          
          if (totalCreated % 50 === 0) {
            console.log(`Created ${totalCreated} dishes...`);
          }
        } catch (error) {
          if (error.code === '23505') {
            // Skip duplicate dish names
            console.log(`Skipping duplicate dish: ${dish.name}`);
            continue;
          } else {
            console.error(`Error creating dish ${dish.name}:`, error.message);
          }
        }
      }
    }
    
    console.log(`✅ Successfully created ${totalCreated} dishes`);
    
    // Show final counts
    const finalCounts = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM restaurants) as restaurants,
        (SELECT COUNT(*) FROM dishes) as dishes
    `);
    
    console.log('📊 Final database counts:');
    console.log(`   Restaurants: ${finalCounts.rows[0].restaurants}`);
    console.log(`   Dishes: ${finalCounts.rows[0].dishes}`);
    
    console.log('🎉 Dishes added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding dishes:', error);
    throw error;
  } finally {
    process.exit();
  }
}

// Run the script
addDishesToRestaurants().catch(console.error); 