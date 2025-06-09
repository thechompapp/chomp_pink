// Filename: /root/doof-backend/controllers/filterController.js
/* REFACTORED: Convert to ES Modules */
import FilterModel from '../models/filterModel.js'; // Default import assumed
import * as NeighborhoodModel from '../models/neighborhoodModel.js'; // Import neighborhood model

// Controller to get filter options based on type
export const getFilterOptions = async (req, res, next) => {
    const { type } = req.params;
    const { cityId, boroughId } = req.query;

    let options;
    try {
        switch (type) {
            case 'cities':
                options = await FilterModel.getCities();
                break;
            case 'cuisines':
                // Assuming getCuisines is part of FilterModel or another model
                options = await FilterModel.getCuisines(); // Ensure this exists
                break;
            case 'neighborhoods':
                // Handle both borough and neighborhood requests
                if (boroughId) {
                    // Get neighborhoods for a specific borough
                    const boroughIdNum = parseInt(String(boroughId), 10);
                    if (isNaN(boroughIdNum)) {
                        return res.status(400).json({ success: false, message: 'Invalid boroughId parameter.' });
                    }
                    options = await NeighborhoodModel.getNeighborhoodsByParent(boroughIdNum);
                } else if (cityId) {
                    // Get boroughs for a specific city
                    const cityIdNum = parseInt(String(cityId), 10);
                    if (isNaN(cityIdNum)) {
                        return res.status(400).json({ success: false, message: 'Invalid cityId parameter.' });
                    }
                    options = await NeighborhoodModel.getBoroughsByCity(cityIdNum);
                } else {
                    return res.status(400).json({ success: false, message: 'Either cityId or boroughId parameter is required for neighborhoods.' });
                }
                break;
            default:
                return res.status(400).json({ success: false, message: `Invalid filter type specified: ${type}` });
        }
        res.json({ success: true, message: `Filter options for ${type} retrieved successfully.`, data: options || [] });
    } catch (error) { next(error); }
};