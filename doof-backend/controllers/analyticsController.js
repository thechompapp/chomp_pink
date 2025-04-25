// Filename: /root/doof-backend/controllers/analyticsController.js
/* REFACTORED: Convert to ES Modules */
import AnalyticsModel from '../models/analyticsModel.js'; // Default import assumed based on model refactor

// Placeholder logger if logger utility isn't converted yet
const logToDatabase = (level, message, details) => {
    console.log(`[${level.toUpperCase()}] ${message}`, details || '');
};

const handleControllerError = (res, error, message, statusCode = 500) => {
    logToDatabase('error', `${message}: ${error.message || error}`, { error });
    console.error(message, error);
    // Check for specific error messages or codes if needed
    let userMessage = error.message || 'Unknown server error.';
    if (error.message?.includes('not found')) {
         statusCode = 404;
         userMessage = error.message;
    }
    // Send structured error response
    res.status(statusCode).json({ success: false, message: userMessage });
};


// Controller to get summary analytics data
export const getAnalyticsSummary = async (req, res, next) => {
    try {
        // Model uses default export containing the object
        const summaryData = await AnalyticsModel.getSiteSummary(); // Use correct function name from model
        res.json({
            success: true,
            message: 'Analytics summary retrieved successfully.',
            data: summaryData,
        });
    } catch (error) {
        handleControllerError(res, error, 'Error fetching analytics summary');
    }
};

// Controller to get detailed engagement analytics data (example)
export const getEngagementAnalytics = async (req, res, next) => {
    const { startDate, endDate, groupBy = 'day' } = req.query; // Example params

    const validGroupBy = ['day', 'week', 'month', 'type'];
     if (!validGroupBy.includes(groupBy)) {
         return res.status(400).json({ success: false, message: `Invalid groupBy parameter. Must be one of: ${validGroupBy.join(', ')}` });
     }

    try {
        // Model uses default export containing the object
        const engagementData = await AnalyticsModel.getEngagementDetails({ startDate, endDate, groupBy }); // Pass params if model supports them
        res.json({
            success: true,
            message: 'Engagement analytics retrieved successfully.',
            data: engagementData,
        });
    } catch (error) {
        handleControllerError(res, error, 'Error fetching engagement analytics');
    }
};

// Export controller methods individually or as default object
const analyticsController = {
    getAnalyticsSummary,
    getEngagementAnalytics,
};
export default analyticsController;