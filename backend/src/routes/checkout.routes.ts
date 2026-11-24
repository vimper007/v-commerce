import { Router } from 'express';
import { reserveCheckout, cancelCheckout } from '../controllers/checkout.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Protected reservation endpoints
router.post('/reserve', requireAuth, reserveCheckout);
router.post('/cancel/:orderId', requireAuth, cancelCheckout);

export const checkoutRoutes = router;
