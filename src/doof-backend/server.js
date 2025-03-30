const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Client } = require('@googlemaps/google-maps-services-js');

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Google Maps client
const googleMapsClient = new Client({});

// Middleware
app.use(cors());
app.use(express.json());

// Mock in-memory database
let trendingItems = [
  { id: 1, name: "Joe's Pizza", neighborhood: "Greenwich Village", city: "New York", tags: ["pizza", "italian"], adds: 78 },
  { id: 2, name: "Shake Shack", neighborhood: "Midtown", city: "New York", tags: ["burger", "american"], adds: 52 },
  { id: 3, name: "Katz's Deli", neighborhood: "Lower East Side", city: "New York", tags: ["deli", "sandwiches"], adds: 95 },
  { id: 4, name: "In-N-Out", neighborhood: "Hollywood", city: "Los Angeles", tags: ["burger", "fast-food"], adds: 88 },
  { id: 5, name: "Pizzeria Mozza", neighborhood: "West Hollywood", city: "Los Angeles", tags: ["pizza", "italian"], adds: 65 },
  { id: 6, name: "Girl & The Goat", neighborhood: "West Loop", city: "Chicago", tags: ["american", "small-plates"], adds: 72 },
  { id: 7, name: "Lou Malnati's", neighborhood: "River North", city: "Chicago", tags: ["pizza", "deep-dish"], adds: 80 },
  { id: 8, name: "Joe's Stone Crab", neighborhood: "South Beach", city: "Miami", tags: ["seafood", "upscale"], adds: 90 },
  { id: 9, name: "The Halal Guys", neighborhood: "Midtown", city: "New York", tags: ["halal", "street-food"], adds: 60 },
  { id: 10, name: "Gjelina", neighborhood: "Venice", city: "Los Angeles", tags: ["american", "vegetarian"], adds: 70 },
  { id: 11, name: "Au Cheval", neighborhood: "West Loop", city: "Chicago", tags: ["burger", "diner"], adds: 85 },
  { id: 12, name: "Versailles", neighborhood: "Little Havana", city: "Miami", tags: ["cuban", "latin"], adds: 75 },
  { id: 13, name: "Blue Ribbon Sushi", neighborhood: "SoHo", city: "New York", tags: ["sushi", "japanese"], adds: 68 },
  { id: 14, name: "Rolf's", neighborhood: "Gramercy", city: "New York", tags: ["german", "festive"], adds: 55 },
  { id: 15, name: "Ci Siamo", neighborhood: "Hudson Yards", city: "New York", tags: ["italian", "modern"], adds: 62 },
];

let trendingDishes = [
  { id: 1, name: "Margherita Pizza", restaurant: "Joe's Pizza", tags: ["pizza", "vegetarian"], price: "$$ • ", adds: 78 },
  { id: 2, name: "ShackBurger", restaurant: "Shake Shack", tags: ["burger", "beef"], price: "$$ • ", adds: 52 },
  { id: 3, name: "Pastrami Sandwich", restaurant: "Katz's Deli", tags: ["sandwich", "meat"], price: "$$$ • ", adds: 95 },
  { id: 4, name: "Double-Double", restaurant: "In-N-Out", tags: ["burger", "fast-food"], price: "$ • ", adds: 88 },
  { id: 5, name: "Butterscotch Budino", restaurant: "Pizzeria Mozza", tags: ["dessert", "italian"], price: "$$ • ", adds: 65 },
  { id: 6, name: "Goat Empanadas", restaurant: "Girl & The Goat", tags: ["small-plates", "fusion"], price: "$$$ • ", adds: 72 },
  { id: 7, name: "Deep Dish Pizza", restaurant: "Lou Malnati's", tags: ["pizza", "cheese"], price: "$$ • ", adds: 80 },
  { id: 8, name: "Stone Crab Claws", restaurant: "Joe's Stone Crab", tags: ["seafood", "signature"], price: "$$$$ • ", adds: 90 },
  { id: 9, name: "Chicken Over Rice", restaurant: "The Halal Guys", tags: ["halal", "street-food"], price: "$ • ", adds: 60 },
  { id: 10, name: "Grilled Octopus", restaurant: "Gjelina", tags: ["seafood", "vegetarian-friendly"], price: "$$$ • ", adds: 70 },
  { id: 11, name: "Cheeseburger", restaurant: "Au Cheval", tags: ["burger", "classic"], price: "$$ • ", adds: 85 },
  { id: 12, name: "Cubano Sandwich", restaurant: "Versailles", tags: ["sandwich", "cuban"], price: "$$ • ", adds: 75 },
  { id: 13, name: "Spicy Tuna Roll", restaurant: "Blue Ribbon Sushi", tags: ["sushi", "spicy"], price: "$$$ • ", adds: 68 },
  { id: 14, name: "Schnitzel", restaurant: "Rolf's", tags: ["german", "traditional"], price: "$$ • ", adds: 55 },
  { id: 15, name: "Pasta al Forno", restaurant: "Ci Siamo", tags: ["pasta", "italian"], price: "$$$ • ", adds: 62 },
];

let popularLists = [
  { id: 1, name: "NYC Pizza Tour", items: [], itemCount: 5, savedCount: 120, city: "New York", tags: ["pizza", "nyc"], isFollowing: false, createdByUser: false },
  { id: 2, name: "Best Burgers NYC", items: [], itemCount: 8, savedCount: 150, city: "New York", tags: ["burgers", "nyc"], isFollowing: false, createdByUser: false },
  { id: 3, name: "LA Foodie Gems", items: [], itemCount: 6, savedCount: 90, city: "Los Angeles", tags: ["foodie", "la"], isFollowing: false, createdByUser: false },
  { id: 4, name: "Chicago Deep Dish", items: [], itemCount: 4, savedCount: 110, city: "Chicago", tags: ["pizza", "chicago"], isFollowing: false, createdByUser: false },
  { id: 5, name: "Miami Seafood Spots", items: [], itemCount: 7, savedCount: 130, city: "Miami", tags: ["seafood", "miami"], isFollowing: false, createdByUser: false },
  { id: 6, name: "NYC Street Food", items: [], itemCount: 5, savedCount: 85, city: "New York", tags: ["street-food", "nyc"], isFollowing: false, createdByUser: false },
  { id: 7, name: "LA Vegan Eats", items: [], itemCount: 6, savedCount: 95, city: "Los Angeles", tags: ["vegan", "la"], isFollowing: false, createdByUser: false },
  { id: 8, name: "Chicago Brunch", items: [], itemCount: 5, savedCount: 100, city: "Chicago", tags: ["brunch", "chicago"], isFollowing: false, createdByUser: false },
  { id: 9, name: "Miami Nightlife Bites", items: [], itemCount: 4, savedCount: 80, city: "Miami", tags: ["nightlife", "miami"], isFollowing: false, createdByUser: false },
  { id: 10, name: "NYC Italian Classics", items: [], itemCount: 7, savedCount: 140, city: "New York", tags: ["italian", "nyc"], isFollowing: false, createdByUser: false },
  { id: 11, name: "LA Taco Trail", items: [], itemCount: 6, savedCount: 115, city: "Los Angeles", tags: ["tacos", "la"], isFollowing: false, createdByUser: false },
  { id: 12, name: "Chicago BBQ", items: [], itemCount: 5, savedCount: 105, city: "Chicago", tags: ["bbq", "chicago"], isFollowing: false, createdByUser: false },
  { id: 13, name: "Miami Cuban Eats", items: [], itemCount: 6, savedCount: 125, city: "Miami", tags: ["cuban", "miami"], isFollowing: false, createdByUser: false },
  { id: 14, name: "NYC Sushi Stops", items: [], itemCount: 5, savedCount: 135, city: "New York", tags: ["sushi", "nyc"], isFollowing: false, createdByUser: false },
  { id: 15, name: "LA Dessert Dash", items: [], itemCount: 4, savedCount: 70, city: "Los Angeles", tags: ["dessert", "la"], isFollowing: false, createdByUser: false },
];

let pendingSubmissions = [];

// Routes for trending data
app.get('/api/trending/restaurants', (req, res) => {
  res.json(trendingItems);
});

app.get('/api/trending/dishes', (req, res) => {
  res.json(trendingDishes);
});

app.get('/api/trending/lists', (req, res) => {
  res.json(popularLists);
});

app.post('/api/submissions', (req, res) => {
  const newSubmission = req.body;
  pendingSubmissions.push(newSubmission);
  res.status(201).json(newSubmission);
});

app.get('/api/submissions', (req, res) => {
  res.json(pendingSubmissions);
});

app.post('/api/submissions/:id/approve', (req, res) => {
  const { id } = req.params;
  const submission = pendingSubmissions.find((s) => s.id === parseInt(id));
  if (!submission) {
    return res.status(404).json({ message: "Submission not found" });
  }

  if (submission.type === "restaurant") {
    trendingItems.push({ ...submission, status: "approved" });
  } else if (submission.type === "dish") {
    trendingDishes.push({ ...submission, status: "approved" });
  }

  pendingSubmissions = pendingSubmissions.filter((s) => s.id !== parseInt(id));
  res.json({ message: "Submission approved" });
});

app.post('/api/submissions/:id/reject', (req, res) => {
  const { id } = req.params;
  pendingSubmissions = pendingSubmissions.filter((s) => s.id !== parseInt(id));
  res.json({ message: "Submission rejected" });
});

// New endpoint for place autocomplete using Places API (New)
app.get('/api/places/autocomplete', async (req, res) => {
  const { input } = req.query;

  if (!input) {
    return res.status(400).json({ error: "Input query is required" });
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
      // Return a more specific error to the frontend
      res.status(403).json({ error: "Google Places API error", message: response.data.error_message || response.data.status });
    }
  } catch (error) {
    console.error("Error fetching place autocomplete:", error.message || error);
    res.status(500).json({ error: "Failed to fetch place suggestions", message: error.message || "Unknown error" });
  }
});

// New endpoint for place details using Places API (New)
app.get('/api/places/details', async (req, res) => {
  const { placeId } = req.query;

  if (!placeId) {
    return res.status(400).json({ error: "Place ID is required" });
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
      let city = "";
      let neighborhood = "";
      let formattedAddress = "";

      // Extract city and neighborhood from address components
      place.address_components.forEach((component) => {
        if (component.types.includes("locality")) {
          city = component.long_name;
        }
        if (component.types.includes("neighborhood")) {
          neighborhood = component.long_name;
        }
        if (component.types.includes("street_number") || component.types.includes("route")) {
          formattedAddress += component.long_name + " ";
        }
      });

      formattedAddress = formattedAddress.trim();
      if (city) formattedAddress += `, ${city}`;

      res.json({
        formattedAddress: formattedAddress || "Unknown Location",
        city,
        neighborhood,
      });
    } else {
      // Return a more specific error to the frontend
      res.status(403).json({ error: "Google Places API error", message: response.data.error_message || response.data.status });
    }
  } catch (error) {
    console.error("Error fetching place details:", error.message || error);
    res.status(500).json({ error: "Failed to fetch place details", message: error.message || "Unknown error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});