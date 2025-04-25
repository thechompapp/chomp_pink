// Filename: /root/doof-backend/controllers/adminController.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Changed dishModel import to use named export createDish */
/* FIXED: Changed restaurantModel import to use named export createRestaurant */
import adminModel from '../models/adminModel.js'; // Use import, add .js
// Import other models as needed, ensure they are also ESM
import submissionModel from '../models/submissionModel.js';
import { createRestaurant } from '../models/restaurantModel.js'; // Use named export instead of default
import { createDish } from '../models/dishModel.js'; // Use named export
import analyticsModel from '../models/analyticsModel.js';

// Assuming logger utility uses ESM or replace with console
// import { logToDatabase } from '../utils/logger.js';
const logToDatabase = (level, message, details) => {
    console.log(`[${level.toUpperCase()}] ${message}`, details || '');
};

const handleControllerError = (res, error, message, statusCode = 500) => {
    logToDatabase('error', `${message}: ${error.message || error}`, { error });
    console.error(message, error);
    // Check for specific error messages or codes if needed
    let userMessage = error.message || 'Unknown server error.';
    if (error.message?.includes('already exists')) {
        statusCode = 409; // Conflict
        userMessage = error.message;
    } else if (error.message?.includes('Invalid reference') || error.code === '23503' ) {
         statusCode = 400; // Bad request due to invalid FK
         userMessage = error.message;
    } else if (error.message?.includes('not found')) {
         statusCode = 404;
         userMessage = error.message;
    }
    // Send structured error response
    res.status(statusCode).json({ success: false, message: userMessage });
};

// --- Generic Resource Type Middleware (Example - adjust as needed) ---
// Middleware to validate resource type and attach to request for generic controllers
const setDataTypeFromParam = (req, res, next) => {
    const { resourceType } = req.params;
    // Add validation if needed (already done by validator middleware)
    req.dataType = resourceType; // Attach for use in controller
    next();
};

// --- Exported Controller Methods ---

// GET all resources of a specific type
export const getAllResources = async (req, res) => {
    const dataType = req.params.resourceType; // Get from route param
    try {
        logToDatabase('info', `Admin requesting data for type: ${dataType}`);
        const data = await adminModel.getAdminData(dataType);
        res.json({ success: true, data: data }); // Standard success response
    } catch (error) {
        handleControllerError(res, error, `Error fetching admin data for ${dataType}`);
    }
};

// GET a single resource by ID
export const getResourceById = async (req, res) => {
     const dataType = req.params.resourceType;
     const { id } = req.params;
     try {
         logToDatabase('info', `Admin requesting data for type: ${dataType}, id: ${id}`);
         // Assuming getAdminData handles single item fetch if needed, or use a specific method
         // For simplicity, reusing generic method logic needs adjustment in model or here
         // Let's assume model needs a getAdminDataById method
         // const data = await adminModel.getAdminDataById(dataType, id);
         const data = (await adminModel.getAdminData(dataType)).find(item => String(item.id) === String(id)); // Inefficient temporary workaround
         if (!data) {
             return res.status(404).json({ success: false, message: `${dataType} with ID ${id} not found.` });
         }
         res.json({ success: true, data: data });
     } catch (error) {
         handleControllerError(res, error, `Error fetching ${dataType} with ID ${id}`);
     }
};

// CREATE a new resource
export const createResource = async (req, res) => {
    const dataType = req.params.resourceType;
    try {
        logToDatabase('info', `Admin adding data for type: ${dataType}`, { data: req.body });
        const newData = await adminModel.addAdminData(dataType, req.body);
        res.status(201).json({ success: true, data: newData }); // Standard success response
    } catch (error) {
        handleControllerError(res, error, `Error adding admin data for ${dataType}`);
    }
};

// UPDATE a resource by ID
export const updateResource = async (req, res) => {
    const dataType = req.params.resourceType;
    const { id } = req.params;
    try {
        logToDatabase('info', `Admin updating data for type: ${dataType}, id: ${id}`, { data: req.body });
        const updatedData = await adminModel.updateAdminData(dataType, id, req.body);
        if (!updatedData) {
            return res.status(404).json({ success: false, message: `${dataType.slice(0,-1)} with ID ${id} not found.` });
        }
        res.json({ success: true, data: updatedData }); // Standard success response
    } catch (error) {
        handleControllerError(res, error, `Error updating admin data for ${dataType} with ID ${id}`);
    }
};

// DELETE a resource by ID
export const deleteResource = async (req, res) => {
    const dataType = req.params.resourceType;
    const { id } = req.params;
    try {
        logToDatabase('info', `Admin deleting data for type: ${dataType}, id: ${id}`);
        const success = await adminModel.deleteAdminData(dataType, id);
        if (!success) {
            return res.status(404).json({ success: false, message: `${dataType.slice(0,-1)} with ID ${id} not found.` });
        }
        res.status(200).json({ success: true, message: `${dataType.slice(0,-1)} deleted successfully.`}); // Send success message instead of 204
    } catch (error) {
        handleControllerError(res, error, `Error deleting admin data for ${dataType} with ID ${id}`);
    }
};

// Bulk Add Handler (Generic or Specific?)
// This assumes the route determines the type and passes it, or use specific controllers
export const bulkAdd = async (req, res) => {
     const itemType = req.params.resourceType; // e.g., 'restaurants', 'dishes'
     const items = req.body[itemType]; // Expecting { restaurants: [...] } or { dishes: [...] }

     if (!items || !Array.isArray(items)) {
          return res.status(400).json({ success: false, message: `Invalid request body format. Expected key '${itemType}' containing an array.`});
     }

     try {
         logToDatabase('info', `Bulk adding ${items.length} ${itemType}.`);
         const addedItems = await adminModel.bulkAddItems(itemType, items);
         res.status(201).json({ success: true, data: addedItems }); // Return added items
     } catch (error) {
         handleControllerError(res, error, `Error bulk adding ${itemType}`);
     }
};

// --- Submission Handlers ---
export const approveSubmission = async (req, res) => {
     const { id } = req.params;
     // Data for the new restaurant/dish might be sent in the body
     // or derived from the submission itself + potential admin edits
     const approvedData = req.body; // Assuming body contains necessary final data
     const approverId = req.user.id;

     try {
         logToDatabase('info', `Admin approving submission ID: ${id}`, { approverId });
         const submission = await submissionModel.getSubmissionById(id);
         if (!submission) {
             return res.status(404).json({ success: false, message: 'Submission not found.' });
         }
         if (submission.status !== 'pending') {
             return res.status(400).json({ success: false, message: `Submission status is already ${submission.status}.` });
         }

         let newItem;
         const dataToCreate = {
             name: approvedData.name || submission.name,
             address: approvedData.address || submission.location, // Map fields
             google_place_id: approvedData.google_place_id || submission.place_id,
             city_name: approvedData.city_name || submission.city,
             neighborhood_name: approvedData.neighborhood_name || submission.neighborhood,
             tags: approvedData.tags || submission.tags || [],
             restaurant_id: approvedData.restaurant_id || submission.restaurant_id,
             description: approvedData.description, // For dishes
             price: approvedData.price, // for dishes
             // TODO: Add more fields as necessary, potentially requiring lookups (city_id, neighborhood_id)
         };

         if (submission.item_type === 'restaurant') {
             // TODO: Potentially look up city_id, neighborhood_id based on names before creating
             newItem = await createRestaurant(dataToCreate);
         } else if (submission.item_type === 'dish') {
             // Ensure restaurant_id is present and valid
             if (!dataToCreate.restaurant_id) {
                  throw new Error("Restaurant ID is required to approve a dish submission.");
             }
             newItem = await createDish(dataToCreate);
         } else {
             throw new Error(`Unsupported submission item type: ${submission.item_type}`);
         }

         await submissionModel.updateSubmissionStatus(id, 'approved', approverId);
         logToDatabase('info', `Submission ID ${id} approved successfully.`);
         res.json({ success: true, message: 'Submission approved successfully.', data: newItem });

     } catch (error) {
         handleControllerError(res, error, `Error approving submission ID: ${id}`);
     }
};

export const rejectSubmission = async (req, res) => {
     const { id } = req.params;
     const { rejectionReason } = req.body; // Optional reason from admin
     const approverId = req.user.id;

     try {
         logToDatabase('info', `Admin rejecting submission ID: ${id}`, { approverId, rejectionReason });
         const submission = await submissionModel.getSubmissionById(id);
         if (!submission) {
             return res.status(404).json({ success: false, message: 'Submission not found.' });
         }
         if (submission.status !== 'pending') {
             return res.status(400).json({ success: false, message: `Submission status is already ${submission.status}.` });
         }

         await submissionModel.updateSubmissionStatus(id, 'rejected', approverId, rejectionReason);
         logToDatabase('info', `Submission ID ${id} rejected successfully.`);
         res.json({ success: true, message: 'Submission rejected successfully.' });
     } catch (error) {
         handleControllerError(res, error, `Error rejecting submission ID: ${id}`);
     }
};

// --- Lookup Handlers ---
export const lookupNeighborhoods = async (req, res) => {
     const { names } = req.body;
     if (!Array.isArray(names)) {
         return res.status(400).json({ success: false, message: 'Invalid input: "names" must be an array.' });
     }
     if (names.length === 0) {
          return res.json({ success: true, data: [] }); // Return empty array if input is empty
     }

     try {
         logToDatabase('info', `Lookup requested for ${names.length} neighborhoods.`);
         // Use adminModel's checkExistingItems which expects items and fields
         const itemsToCheck = names.map(name => ({ name }));
         const existingIdentifiers = await adminModel.checkExistingItems('neighborhoods', itemsToCheck, ['name']);
         // Convert Set<"name|"> back to just array of names
         const existingNames = Array.from(existingIdentifiers).map(id => id.split('|')[0]);

         logToDatabase('debug', `Lookup found existing neighborhoods: ${existingNames.join(', ')}`);
         res.json({ success: true, data: existingNames }); // Return array in data field
     } catch (error) {
         handleControllerError(res, error, 'Error looking up neighborhoods');
     }
};

// --- Analytics Handlers ---
export const getAnalyticsSummary = async (req, res) => {
     try {
         logToDatabase('info', `Admin requesting analytics summary`);
         const summary = await analyticsModel.getSummary();
         res.json({ success: true, data: summary });
     } catch (error) {
         handleControllerError(res, error, 'Error fetching analytics summary');
     }
};

export const getEngagementAnalytics = async (req, res) => {
     try {
         logToDatabase('info', `Admin requesting engagement analytics`, { params: req.query });
         const engagementData = await analyticsModel.getEngagement(req.query);
         res.json({ success: true, data: engagementData });
     } catch (error) {
         handleControllerError(res, error, 'Error fetching engagement analytics');
     }
};

// Export controller methods individually for named imports
// Or create a default export object if preferred by routes/admin.js
const adminController = {
    getAllResources,
    getResourceById,
    createResource,
    updateResource,
    deleteResource,
    bulkAdd,
    approveSubmission,
    rejectSubmission,
    lookupNeighborhoods,
    getAnalyticsSummary,
    getEngagementAnalytics,
};
export default adminController; // Keep default export to match route import