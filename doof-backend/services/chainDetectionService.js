/**
 * Chain Detection Service
 * Automatically identifies potential restaurant chains based on name similarity,
 * location patterns, and other heuristics
 */

import db from '../db/index.js';
import { logInfo, logError, logDebug } from '../utils/logger.js';

/**
 * Normalize restaurant name for comparison
 * Removes common suffixes, articles, and standardizes format
 */
function normalizeRestaurantName(name) {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    // Remove common location indicators
    .replace(/\s+(nyc|new york|manhattan|brooklyn|queens|bronx|staten island)$/i, '')
    // Remove common suffixes
    .replace(/\s+(restaurant|rest|cafe|bar|grill|kitchen|eatery|diner|bistro)$/i, '')
    // Remove branch indicators
    .replace(/\s+(location|branch|#\d+|\d+)$/i, '')
    // Remove articles
    .replace(/^(the|a|an)\s+/i, '')
    // Normalize spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateSimilarity(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len2 + 1).fill().map(() => Array(len1 + 1).fill(0));
  
  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,     // deletion
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i - 1] + 1  // substitution
        );
      }
    }
  }
  
  const maxLen = Math.max(len1, len2);
  return (maxLen - matrix[len2][len1]) / maxLen;
}

/**
 * Find restaurants with similar names that could be part of a chain
 */
export async function findPotentialChains(options = {}) {
  const {
    similarityThreshold = 0.8,  // 80% similarity threshold
    minLocations = 2,           // Minimum locations to be considered a chain
    maxResults = 100            // Maximum results to return
  } = options;

  try {
    logInfo('[ChainDetection] Starting chain detection scan...');
    
    // Get all restaurants that don't already have a chain_id
    const query = `
      SELECT id, name, address, city_id, neighborhood_id, 
             latitude, longitude, created_at
      FROM restaurants 
      WHERE chain_id IS NULL 
      ORDER BY name
    `;
    
    const result = await db.query(query);
    const restaurants = result.rows;
    
    logDebug(`[ChainDetection] Analyzing ${restaurants.length} restaurants`);
    
    const potentialChains = new Map();
    const processed = new Set();
    
    // Group restaurants by normalized name similarity
    for (let i = 0; i < restaurants.length; i++) {
      if (processed.has(restaurants[i].id)) continue;
      
      const baseRestaurant = restaurants[i];
      const baseName = normalizeRestaurantName(baseRestaurant.name);
      
      if (!baseName) continue;
      
      const similarRestaurants = [baseRestaurant];
      processed.add(baseRestaurant.id);
      
      // Find similar restaurants
      for (let j = i + 1; j < restaurants.length; j++) {
        if (processed.has(restaurants[j].id)) continue;
        
        const compareName = normalizeRestaurantName(restaurants[j].name);
        if (!compareName) continue;
        
        const similarity = calculateSimilarity(baseName, compareName);
        
        if (similarity >= similarityThreshold) {
          similarRestaurants.push(restaurants[j]);
          processed.add(restaurants[j].id);
        }
      }
      
      // If we found enough similar locations, it's a potential chain
      if (similarRestaurants.length >= minLocations) {
        // Calculate average similarity for this chain
        let totalSimilarity = 0;
        let comparisons = 0;
        
        for (let k = 0; k < similarRestaurants.length; k++) {
          for (let l = k + 1; l < similarRestaurants.length; l++) {
            const name1 = normalizeRestaurantName(similarRestaurants[k].name);
            const name2 = normalizeRestaurantName(similarRestaurants[l].name);
            totalSimilarity += calculateSimilarity(name1, name2);
            comparisons++;
          }
        }
        
        const averageSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 1;
        
        const chainKey = baseName;
        potentialChains.set(chainKey, {
          suggestedName: baseRestaurant.name, // Use original name as suggestion
          normalizedName: baseName,
          locations: similarRestaurants,
          locationCount: similarRestaurants.length,
          confidence: calculateChainConfidence(similarRestaurants),
          cities: [...new Set(similarRestaurants.map(r => r.city_id).filter(Boolean))],
          averageSimilarity: Math.round(averageSimilarity * 100) / 100
        });
      }
    }
    
    // Convert to array and sort by confidence
    const results = Array.from(potentialChains.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxResults);
    
    logInfo(`[ChainDetection] Found ${results.length} potential chains`);
    
    return {
      totalPotentialChains: results.length,
      chains: results,
      summary: {
        restaurantsAnalyzed: restaurants.length,
        averageLocationsPerChain: results.reduce((sum, chain) => sum + chain.locationCount, 0) / results.length || 0,
        topChain: results[0] || null
      }
    };
    
  } catch (error) {
    logError('[ChainDetection] Error finding potential chains:', error);
    throw new Error(`Chain detection failed: ${error.message}`);
  }
}

/**
 * Calculate confidence score for a potential chain
 * Based on multiple factors: location count, geographic spread, name consistency
 */
function calculateChainConfidence(locations) {
  let confidence = 0;
  
  // Base score from location count (more locations = higher confidence)
  const locationScore = Math.min(locations.length / 10, 1) * 40; // Up to 40 points
  confidence += locationScore;
  
  // Geographic diversity score (multiple cities = higher confidence)
  const uniqueCities = new Set(locations.map(l => l.city_id).filter(Boolean)).size;
  const geoScore = Math.min(uniqueCities / 3, 1) * 30; // Up to 30 points
  confidence += geoScore;
  
  // Name consistency score
  const originalNames = locations.map(l => l.name);
  const uniqueNames = new Set(originalNames).size;
  const nameConsistency = 1 - (uniqueNames - 1) / locations.length;
  const nameScore = nameConsistency * 30; // Up to 30 points
  confidence += nameScore;
  
  return Math.round(confidence);
}

/**
 * Create a new restaurant chain and assign restaurants to it
 */
export async function createChainFromSuggestion(chainData) {
  const { name, website, description, restaurantIds } = chainData;
  
  if (!name || !restaurantIds || restaurantIds.length < 2) {
    throw new Error('Chain must have a name and at least 2 restaurant locations');
  }
  
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    // Create the chain
    const insertChainQuery = `
      INSERT INTO restaurant_chains (name, website, description, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const chainResult = await client.query(insertChainQuery, [
      name,
      website || null,
      description || null
    ]);
    
    const newChain = chainResult.rows[0];
    
    // Update restaurants to belong to this chain
    const updateRestaurantsQuery = `
      UPDATE restaurants 
      SET chain_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY($2)
      RETURNING id, name
    `;
    
    const updatedRestaurants = await client.query(updateRestaurantsQuery, [
      newChain.id,
      restaurantIds
    ]);
    
    await client.query('COMMIT');
    
    logInfo(`[ChainDetection] Created chain "${name}" with ${updatedRestaurants.rows.length} locations`);
    
    return {
      chain: newChain,
      assignedRestaurants: updatedRestaurants.rows
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logError('[ChainDetection] Error creating chain:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Remove a restaurant from its chain
 */
export async function removeRestaurantFromChain(restaurantId) {
  try {
    const query = `
      UPDATE restaurants 
      SET chain_id = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, name, chain_id
    `;
    
    const result = await db.query(query, [restaurantId]);
    
    if (result.rows.length === 0) {
      throw new Error('Restaurant not found');
    }
    
    logInfo(`[ChainDetection] Removed restaurant ${restaurantId} from chain`);
    return result.rows[0];
    
  } catch (error) {
    logError('[ChainDetection] Error removing restaurant from chain:', error);
    throw error;
  }
}

/**
 * Get all existing chains with their restaurant counts
 */
export async function getAllChains() {
  try {
    const query = `
      SELECT 
        c.*,
        COUNT(r.id) as location_count,
        ARRAY_AGG(
          DISTINCT CASE WHEN r.city_id IS NOT NULL THEN
            (SELECT name FROM cities WHERE id = r.city_id)
          END
        ) FILTER (WHERE r.city_id IS NOT NULL) as cities
      FROM restaurant_chains c
      LEFT JOIN restaurants r ON c.id = r.chain_id
      GROUP BY c.id, c.name, c.website, c.description, c.created_at, c.updated_at
      ORDER BY location_count DESC, c.name
    `;
    
    const result = await db.query(query);
    return result.rows;
    
  } catch (error) {
    logError('[ChainDetection] Error fetching chains:', error);
    throw error;
  }
}

export default {
  findPotentialChains,
  createChainFromSuggestion,
  removeRestaurantFromChain,
  getAllChains,
  normalizeRestaurantName,
  calculateSimilarity
}; 