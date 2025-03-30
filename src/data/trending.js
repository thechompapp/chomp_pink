// src/data/trending.js
export const trendingData = {
    restaurants: [
      { id: 1, name: "Joe's Pizza", neighborhood: 'Greenwich Village', city: 'New York', tags: ['pizza', 'italian'], trending: 95 },
      { id: 2, name: "Shake Shack", neighborhood: 'Midtown', city: 'New York', tags: ['burgers', 'fast-food'], trending: 92 },
      // Add more as needed
    ],
    dishes: [
      { id: 1, name: "Margherita Pizza", restaurant: "Joe's Pizza", tags: ['pizza', 'vegetarian'], city: 'New York', neighborhood: 'Greenwich Village', trending: 96 },
      { id: 2, name: "ShackBurger", restaurant: "Shake Shack", tags: ['burger', 'beef'], city: 'New York', neighborhood: 'Midtown', trending: 93 },
      // Add more as needed
    ],
    lists: [
      { id: 101, name: "NYC Pizza Tour", itemCount: 8, savedCount: 245, isPublic: true, city: 'New York', tags: ['pizza', 'italian'], trending: 95 },
      { id: 102, name: "Best Burgers in Manhattan", itemCount: 12, savedCount: 187, isPublic: true, city: 'New York', tags: ['burgers', 'beef'], trending: 88 },
      // Add more as needed
    ],
  };