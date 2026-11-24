import { Router } from 'express';
import { getUserAddresses, createAddress } from '../controllers/address.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, getUserAddresses);
router.post('/', requireAuth, createAddress);

export const addressRoutes = router;
