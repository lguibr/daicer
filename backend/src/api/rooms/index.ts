/**
 * Main rooms router
 * Combines all room-related routes in a clean, modular structure
 */

import { Router } from 'express';
import baseRoutes from './routes/base';
import membershipRoutes from './routes/membership';
import worldRoutes from './routes/world';

const router = Router();

// Mount all sub-routes
router.use('/', baseRoutes);
router.use('/', membershipRoutes);
router.use('/', worldRoutes);

export default router;
