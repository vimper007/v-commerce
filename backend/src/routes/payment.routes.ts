import { Router } from 'express';
import { createPaymentIntent, simulatePayment } from '../controllers/payment.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/intent', requireAuth, createPaymentIntent);
router.post('/simulate', requireAuth, simulatePayment);

export const paymentRoutes = router;
