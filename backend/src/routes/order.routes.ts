import { Router } from 'express';
import { getOrderById, getUserOrders } from '../controllers/order.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, getUserOrders);
router.get('/:id', requireAuth, getOrderById);

export const orderRoutes = router;
