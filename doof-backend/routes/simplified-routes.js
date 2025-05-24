/**
 * Simplified Routes
 * 
 * This file contains simplified routes for E2E testing.
 */

import express from 'express';
import * as RestaurantController from '../controllers/simplified-restaurantController.js';
import * as DishController from '../controllers/simplified-dishController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Restaurant routes
router.get('/restaurants', optionalAuth, RestaurantController.getAllRestaurants);
router.get('/restaurants/:id', optionalAuth, RestaurantController.getRestaurantById);
router.post('/restaurants', requireAuth, RestaurantController.createRestaurant);
router.put('/restaurants/:id', requireAuth, RestaurantController.updateRestaurant);
router.delete('/restaurants/:id', requireAuth, RestaurantController.deleteRestaurant);

// Dish routes
router.get('/dishes', optionalAuth, DishController.getAllDishes);
router.get('/dishes/:id', optionalAuth, DishController.getDishById);
router.post('/dishes', requireAuth, DishController.createDish);
router.put('/dishes/:id', requireAuth, DishController.updateDish);
router.delete('/dishes/:id', requireAuth, DishController.deleteDish);

export default router;
