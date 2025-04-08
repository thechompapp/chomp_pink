// src/doof-backend/middleware/requireSuperuser.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth'; // Import extended request type

const requireSuperuser = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (req.user?.account_type !== 'superuser') {
        res.status(403).json({ error: 'Forbidden: Superuser access required.' });
        return; // Important to stop execution
    }
    next();
};

export default requireSuperuser;