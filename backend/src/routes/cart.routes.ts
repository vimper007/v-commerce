import { Router } from 'express';
import {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
} from '../controllers/cart.controller';

const router = Router();

router.get('/', getCart);
router.post('/items', addItemToCart);
router.patch('/items/:variantId', updateCartItem);
router.delete('/items/:variantId', removeCartItem);

export { router as cartRoutes };
