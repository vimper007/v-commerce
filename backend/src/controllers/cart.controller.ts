import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { redis } from '../redis/client';
import { db } from '../db/db';
import { productVariants, products, inventory } from '../db/schema';

export interface CartItem {
  variantId: string;
  productId: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  color?: string | null;
  size?: string | null;
  imageUrl?: string | null;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  updatedAt: string;
}

const CART_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 Days TTL

function calculateCartTotals(items: CartItem[]): { subtotal: number; itemCount: number } {
  let subtotal = 0;
  let itemCount = 0;
  for (const item of items) {
    subtotal += item.price * item.quantity;
    itemCount += item.quantity;
  }
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    itemCount,
  };
}

async function getCartFromRedis(cartId: string): Promise<Cart> {
  const data = await redis.get(`cart:${cartId}`);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // Fallback if corrupted
    }
  }
  return {
    id: cartId,
    items: [],
    subtotal: 0,
    itemCount: 0,
    updatedAt: new Date().toISOString(),
  };
}

async function saveCartToRedis(cart: Cart): Promise<void> {
  const { subtotal, itemCount } = calculateCartTotals(cart.items);
  cart.subtotal = subtotal;
  cart.itemCount = itemCount;
  cart.updatedAt = new Date().toISOString();

  await redis.set(`cart:${cart.id}`, JSON.stringify(cart), 'EX', CART_TTL_SECONDS);
}

export async function getCart(req: Request, res: Response): Promise<void> {
  try {
    const cartId = (req.headers['x-cart-id'] as string) || (req.query.cartId as string) || randomUUID();
    const cart = await getCartFromRedis(cartId);

    // Enrich existing items with images if missing
    let updated = false;
    for (const item of cart.items) {
      if (!item.imageUrl) {
        const [v] = await db
          .select({
            varImg: productVariants.imageUrl,
            prodImg: products.imageUrl,
          })
          .from(productVariants)
          .innerJoin(products, eq(productVariants.productId, products.id))
          .where(eq(productVariants.id, item.variantId))
          .limit(1);
        if (v) {
          item.imageUrl = v.varImg || v.prodImg || null;
          updated = true;
        }
      }
    }
    if (updated) {
      await saveCartToRedis(cart);
    }

    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve cart' });
  }
}

export async function addItemToCart(req: Request, res: Response): Promise<void> {
  try {
    const { variantId, quantity = 1 } = req.body;
    let cartId = req.body.cartId || (req.headers['x-cart-id'] as string);

    if (!variantId) {
      res.status(400).json({ success: false, error: 'variantId is required' });
      return;
    }

    if (!cartId) {
      cartId = randomUUID();
    }

    // 1. Verify variant and product details from database
    const [variantData] = await db
      .select({
        variantId: productVariants.id,
        productId: productVariants.productId,
        sku: productVariants.sku,
        price: productVariants.price,
        color: productVariants.color,
        size: productVariants.size,
        imageUrl: productVariants.imageUrl,
        productImageUrl: products.imageUrl,
        title: products.title,
        stock: inventory.quantity,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(inventory, eq(productVariants.id, inventory.variantId))
      .where(eq(productVariants.id, variantId))
      .limit(1);

    if (!variantData) {
      res.status(404).json({ success: false, error: 'Product variant not found' });
      return;
    }

    const availableStock = variantData.stock ?? 0;
    if (availableStock <= 0) {
      res.status(400).json({ success: false, error: 'Variant is out of stock' });
      return;
    }

    // 2. Fetch existing cart from Redis
    const cart = await getCartFromRedis(cartId);
    const existingIndex = cart.items.findIndex((item) => item.variantId === variantId);

    const priceNum = parseFloat(variantData.price);
    const resolvedImageUrl = variantData.imageUrl || variantData.productImageUrl || null;

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + Number(quantity);
      cart.items[existingIndex].quantity = Math.min(newQty, availableStock);
      if (!cart.items[existingIndex].imageUrl && resolvedImageUrl) {
        cart.items[existingIndex].imageUrl = resolvedImageUrl;
      }
    } else {
      cart.items.push({
        variantId: variantData.variantId,
        productId: variantData.productId,
        title: variantData.title,
        sku: variantData.sku,
        price: priceNum,
        quantity: Math.min(Number(quantity), availableStock),
        color: variantData.color,
        size: variantData.size,
        imageUrl: resolvedImageUrl,
      });
    }

    // 3. Save to Redis with 7-Day TTL
    await saveCartToRedis(cart);

    res.json({
      success: true,
      cartId,
      data: cart,
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ success: false, error: 'Failed to update cart' });
  }
}

export async function updateCartItem(req: Request<{ variantId: string }>, res: Response): Promise<void> {
  try {
    const { variantId } = req.params;
    const { cartId, quantity } = req.body;

    if (!cartId || !variantId || quantity === undefined) {
      res.status(400).json({ success: false, error: 'cartId, variantId, and quantity are required' });
      return;
    }

    const cart = await getCartFromRedis(cartId);
    const itemIndex = cart.items.findIndex((i) => i.variantId === variantId);

    if (itemIndex === -1) {
      res.status(404).json({ success: false, error: 'Item not found in cart' });
      return;
    }

    if (Number(quantity) <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = Number(quantity);
    }

    await saveCartToRedis(cart);
    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ success: false, error: 'Failed to update item quantity' });
  }
}

export async function removeCartItem(req: Request<{ variantId: string }>, res: Response): Promise<void> {
  try {
    const { variantId } = req.params;
    const cartId = (req.headers['x-cart-id'] as string) || (req.query.cartId as string) || req.body.cartId;

    if (!cartId || !variantId) {
      res.status(400).json({ success: false, error: 'cartId and variantId are required' });
      return;
    }

    const cart = await getCartFromRedis(cartId);
    cart.items = cart.items.filter((item) => item.variantId !== variantId);

    await saveCartToRedis(cart);
    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ success: false, error: 'Failed to remove item' });
  }
}
