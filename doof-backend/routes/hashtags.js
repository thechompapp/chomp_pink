import express from 'express';
import * as hashtagController from '../controllers/hashtagController.js';
// Add validators if you have them
// import { validateGetTopHashtags, handleValidationErrors } from ...

const router = express.Router();

router.get(
    '/top',
    // Add validator middleware here if needed,
    hashtagController.getTopHashtags // Ensure this function exists in your controller
);

export default router;