/* src/doof-backend/middleware/requireSuperuser.js */

const requireSuperuser = (req, res, next) => {
    // Assumes authMiddleware has already run and potentially set req.user
    if (!req.user || req.user.account_type !== 'superuser') {
        return res.status(403).json({ error: 'Forbidden: Administrator access required.' });
    }
    next();
};

export default requireSuperuser;