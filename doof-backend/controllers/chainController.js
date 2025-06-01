/**
 * Restaurant Chain Management Controller
 * Handles admin operations for restaurant chains
 */

import chainDetectionService from '../services/chainDetectionService.js';
import { logInfo, logError } from '../utils/logger.js';

/**
 * GET /api/admin/chains/scan
 * Scan for potential restaurant chains
 */
export const scanForChains = async (req, res) => {
  try {
    const {
      similarityThreshold,
      minLocations,
      maxResults
    } = req.query;

    const options = {
      similarityThreshold: parseFloat(similarityThreshold) || 0.8,
      minLocations: parseInt(minLocations) || 2,
      maxResults: parseInt(maxResults) || 100
    };

    logInfo(`[ChainController] Starting chain scan with options:`, options);

    const results = await chainDetectionService.findPotentialChains(options);

    res.json({
      success: true,
      data: results,
      message: `Found ${results.totalPotentialChains} potential chains`
    });

  } catch (error) {
    logError('[ChainController] Error scanning for chains:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/admin/chains
 * Create a new chain from suggested restaurants
 */
export const createChain = async (req, res) => {
  try {
    const { name, website, description, restaurantIds } = req.body;

    if (!name || !restaurantIds || !Array.isArray(restaurantIds) || restaurantIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Chain must have a name and at least 2 restaurant IDs'
      });
    }

    logInfo(`[ChainController] Creating chain "${name}" with ${restaurantIds.length} restaurants`);

    const result = await chainDetectionService.createChainFromSuggestion({
      name,
      website,
      description,
      restaurantIds
    });

    res.status(201).json({
      success: true,
      data: result,
      message: `Created chain "${name}" with ${result.assignedRestaurants.length} locations`
    });

  } catch (error) {
    logError('[ChainController] Error creating chain:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/admin/chains
 * Get all existing restaurant chains
 */
export const getAllChains = async (req, res) => {
  try {
    logInfo('[ChainController] Fetching all chains');

    const chains = await chainDetectionService.getAllChains();

    res.json({
      success: true,
      data: chains,
      total: chains.length
    });

  } catch (error) {
    logError('[ChainController] Error fetching chains:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * PUT /api/admin/chains/:id/remove-restaurant
 * Remove a restaurant from its chain
 */
export const removeRestaurantFromChain = async (req, res) => {
  try {
    const { restaurantId } = req.body;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant ID is required'
      });
    }

    logInfo(`[ChainController] Removing restaurant ${restaurantId} from chain`);

    const result = await chainDetectionService.removeRestaurantFromChain(restaurantId);

    res.json({
      success: true,
      data: result,
      message: `Restaurant ${result.name} removed from chain`
    });

  } catch (error) {
    logError('[ChainController] Error removing restaurant from chain:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/admin/chains/stats
 * Get chain statistics for dashboard
 */
export const getChainStats = async (req, res) => {
  try {
    logInfo('[ChainController] Fetching chain statistics');

    const chains = await chainDetectionService.getAllChains();
    
    const stats = {
      totalChains: chains.length,
      totalChainedRestaurants: chains.reduce((sum, chain) => sum + parseInt(chain.location_count), 0),
      averageLocationsPerChain: chains.length > 0 
        ? chains.reduce((sum, chain) => sum + parseInt(chain.location_count), 0) / chains.length 
        : 0,
      largestChain: chains[0] || null,
      chainsBySize: chains.reduce((acc, chain) => {
        const size = parseInt(chain.location_count);
        if (size >= 10) acc.large++;
        else if (size >= 5) acc.medium++;
        else acc.small++;
        return acc;
      }, { small: 0, medium: 0, large: 0 })
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logError('[ChainController] Error fetching chain stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default {
  scanForChains,
  createChain,
  getAllChains,
  removeRestaurantFromChain,
  getChainStats
}; 