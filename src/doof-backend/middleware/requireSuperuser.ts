// src/doof-backend/middleware/requireSuperuser.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js'; // Corrected import path

const requireSuperuser = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.account_type !== 'superuser') {
        res.status(403).json({ error: 'Forbidden: Superuser access required.' });
        return; // Important to stop execution
    }
    next();
};

export default requireSuperuser;