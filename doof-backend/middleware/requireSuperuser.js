// Filename: /root/doof-backend/middleware/requireSuperuser.js
/* Updated: Ensure ESM export syntax */

const requireSuperuser = (req, res, next) => {
    // Assumes authMiddleware (requireAuth) has already run and set req.user
    if (!req.user || req.user.account_type !== 'superuser') {
        // Log unauthorized access attempt
        console.warn(`[requireSuperuser] Forbidden access attempt by user ID: ${req.user?.id || 'N/A'} (Type: ${req.user?.account_type}) for path: ${req.originalUrl}`);
        return res.status(403).json({ success: false, message: 'Forbidden: Administrator access required.' });
    }
    // User is authenticated and is a superuser, proceed
    next();
};

// Ensure it uses export default
export default requireSuperuser;