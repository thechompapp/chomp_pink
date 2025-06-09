/**
 * Cleanup Controller
 * 
 * Handles data cleanup API endpoints for the admin panel.
 * Provides analysis and fix application functionality.
 */

import * as AdminModel from '../models/adminModel.js';
import { logInfo, logError, logWarn } from '../utils/logger.js';
import db from '../db/index.js';

/**
 * Extracts a 5-digit zip code from a string.
 * @param {string} address - The address string.
 * @returns {string|null} The extracted zip code or null.
 */
const extractZipCode = (address) => {
  if (!address) return null;
  const zipMatch = address.match(/\b\d{5}\b/);
  return zipMatch ? zipMatch[0] : null;
};

/**
 * Apply cleanup fixes to data
 */
export const applyFixes = async (req, res) => {
  try {
    const { resourceType } = req.params;
    const { changes } = req.body;

    logInfo(`[CleanupController] Applying ${changes.length} fixes for ${resourceType}`);

    if (resourceType !== 'restaurants') {
      return res.status(400).json({ success: false, message: 'Cleanup fixes are only supported for restaurants.' });
    }

    if (!changes || !Array.isArray(changes) || changes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes provided'
      });
    }

    const applied = [];
    const failed = [];

    for (const change of changes) {
      const { resourceId, proposedValue } = change;
      try {
        await db.query(
          'UPDATE restaurants SET neighborhood_id = $1 WHERE id = $2',
          [proposedValue, resourceId]
        );
        applied.push(change.changeId);
      } catch (error) {
        logError(`[CleanupController] Failed to apply change ${change.changeId}:`, error);
        failed.push(change.changeId);
      }
    }

    logInfo(`[CleanupController] Applied ${applied.length} fixes, ${failed.length} failed.`);

    return res.status(200).json({
      success: true,
      message: `Applied ${applied.length} fixes successfully. ${failed.length} failed.`,
      results: { applied, failed }
    });
  } catch (error) {
    logError('[CleanupController] Error applying fixes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to apply fixes',
      error: error.message
    });
  }
};

/**
 * Get cleanup analysis status
 */
export const getStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    // For now, return a mock status
    // In a real implementation, this would check the status of a background job
    
    return res.status(200).json({
      success: true,
      status: 'completed',
      progress: 100,
      message: 'Analysis completed'
    });
  } catch (error) {
    logError('[CleanupController] Error getting cleanup status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get cleanup status',
      error: error.message
    });
  }
};

/**
 * Analyze data for cleanup
 */
export const analyzeData = async (req, res) => {
  try {
    const { resourceType } = req.params;
    logInfo(`[CleanupController] Starting analysis for ${resourceType}`);

    if (resourceType !== 'restaurants') {
      return res.status(400).json({ success: false, message: 'Cleanup analysis is only supported for restaurants.' });
    }

    // 1. Find restaurants with null or invalid neighborhood_id
    const restaurantsToFix = await db.query(`
      SELECT r.id, r.name, r.address, r.neighborhood_id
      FROM restaurants r
      LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id
      WHERE r.neighborhood_id IS NULL OR n.id IS NULL
    `);

    if (restaurantsToFix.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No restaurants found needing neighborhood cleanup.',
        data: []
      });
    }

    logInfo(`[CleanupController] Found ${restaurantsToFix.rows.length} restaurants to analyze.`);

    const changes = [];
    for (const restaurant of restaurantsToFix.rows) {
      const zipCode = extractZipCode(restaurant.address);
      if (zipCode) {
        // 2. Find neighborhood by zip code
        const neighborhoodResult = await db.query(
          'SELECT id, name FROM neighborhoods WHERE $1 = ANY(zipcode_ranges)',
          [zipCode]
        );

        if (neighborhoodResult.rows.length > 0) {
          const newNeighborhood = neighborhoodResult.rows[0];
          changes.push({
            changeId: `${restaurant.id}-neighborhood-fix`,
            resourceId: restaurant.id,
            resourceName: restaurant.name,
            field: 'neighborhood_id',
            currentValue: restaurant.neighborhood_id,
            proposedValue: newNeighborhood.id,
            proposedValueName: newNeighborhood.name,
            reason: `Found matching neighborhood '${newNeighborhood.name}' for zip code ${zipCode}.`
          });
        }
      }
    }

    logInfo(`[CleanupController] Generated ${changes.length} potential cleanup changes.`);

    return res.status(200).json({
      success: true,
      message: `Analysis complete. Found ${changes.length} potential fixes.`,
      data: changes,
    });

  } catch (error) {
    logError('[CleanupController] Error analyzing data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze data',
      error: error.message
    });
  }
}; 