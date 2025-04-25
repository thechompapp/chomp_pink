// Filename: /root/doof-backend/controllers/filterController.js
/* REFACTORED: Convert to ES Modules */
import FilterModel from '../models/filterModel.js'; // Default import assumed

// Controller to get filter options based on type
export const getFilterOptions = async (req, res, next) => {
    const { type } = req.params;
    const { cityId } = req.query;

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
                const cityIdNum = cityId ? parseInt(String(cityId), 10) : null;
                if (cityId && isNaN(cityIdNum)) {
                    return res.status(400).json({ success: false, message: 'Invalid cityId parameter.' });
                }
                options = await FilterModel.getNeighborhoodsByCity(cityIdNum); // Use correct function name
                break;
            default:
                return res.status(400).json({ success: false, message: `Invalid filter type specified: ${type}` });
        }
        res.json({ success: true, message: `Filter options for ${type} retrieved successfully.`, data: options || [] });
    } catch (error) { next(error); }
};