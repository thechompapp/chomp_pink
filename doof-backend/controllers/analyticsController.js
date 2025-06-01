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
        const summaryData = await AnalyticsModel.getSummary(); // Use correct function name from model
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
    const { startDate, endDate, engagementType } = req.query;

    try {
        // Model uses default export containing the object
        const engagementData = await AnalyticsModel.getEngagement({ startDate, endDate, engagementType });
        res.json({
            success: true,
            message: 'Engagement analytics retrieved successfully.',
            data: engagementData,
        });
    } catch (error) {
        handleControllerError(res, error, 'Error fetching engagement analytics');
    }
};

// Controller to get search-specific analytics data
export const getSearchAnalytics = async (req, res, next) => {
    const { startDate, endDate } = req.query;

    try {
        const searchData = await AnalyticsModel.getSearchAnalytics({ startDate, endDate });
        res.json({
            success: true,
            message: 'Search analytics retrieved successfully.',
            data: searchData,
        });
    } catch (error) {
        handleControllerError(res, error, 'Error fetching search analytics');
    }
};

// Export controller methods individually or as default object
const analyticsController = {
    getAnalyticsSummary,
    getEngagementAnalytics,
    getSearchAnalytics,
};
export default analyticsController;