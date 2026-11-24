import { Request, Response } from 'express';
import { pool } from '../db/db';
import { redis } from '../redis/client';

interface ReserveItemInput {
  variantId: string;
  quantity: number;
}

interface ShippingAddressInput {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export async function reserveCheckout(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const { items, shippingAddress, savedAddressId, cartId } = req.body as {
    items: ReserveItemInput[];
    shippingAddress?: ShippingAddressInput;
    savedAddressId?: string;
    cartId?: string;
  };

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, error: 'Items list cannot be empty' });
    return;
  }

  for (const item of items) {
    if (!item.variantId || typeof item.variantId !== 'string') {
      res.status(400).json({ success: false, error: 'Each item must have a valid variantId' });
      return;
    }
    if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      res.status(400).json({ success: false, error: `Invalid quantity for variant ${item.variantId}` });
      return;
    }
  }

  // Consistent sorting by variantId eliminates deadlocks during concurrent multi-item transactions
  const sortedItems = [...items].sort((a, b) => a.variantId.localeCompare(b.variantId));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 0. Auto-release expired reservations older than 15 minutes
    await client.query(`
      WITH expired AS (
        UPDATE orders
        SET status = 'cancelled', updated_at = NOW()
        WHERE status = 'pending' AND created_at < NOW() - INTERVAL '15 minutes'
        RETURNING id
      )
      UPDATE inventory i
      SET reserved = GREATEST(0, i.reserved - totals.qty), updated_at = NOW()
      FROM (
        SELECT oi.variant_id, SUM(oi.quantity)::int AS qty
        FROM order_items oi
        JOIN expired e ON e.id = oi.order_id
        GROUP BY oi.variant_id
      ) totals
      WHERE i.variant_id = totals.variant_id;
    `);

    // 1. Verify stock and acquire row-level locks
    const lockedItems: Array<{
      variantId: string;
      requested: number;
      available: number;
      price: string;
      title: string;
    }> = [];

    for (const item of sortedItems) {
      const lockRes = await client.query(
        `SELECT 
          i.id AS inventory_id,
          i.variant_id,
          i.quantity,
          i.reserved,
          pv.price,
          p.title
        FROM inventory i
        JOIN product_variants pv ON pv.id = i.variant_id
        JOIN products p ON p.id = pv.product_id
        WHERE i.variant_id = $1
        FOR UPDATE OF i;`,
        [item.variantId]
      );

      if (lockRes.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({
          success: false,
          error: 'VARIANT_NOT_FOUND',
          message: `Variant ${item.variantId} does not exist in inventory`,
        });
        return;
      }

      const row = lockRes.rows[0];
      const quantity = parseInt(row.quantity, 10);
      const reserved = parseInt(row.reserved, 10);
      const available = quantity - reserved;

      if (available < item.quantity) {
        await client.query('ROLLBACK');
        res.status(409).json({
          success: false,
          error: 'INSUFFICIENT_STOCK',
          message: `Insufficient stock for "${row.title}". Available: ${available}, requested: ${item.quantity}`,
          variantId: item.variantId,
          title: row.title,
          available,
          requested: item.quantity,
        });
        return;
      }

      lockedItems.push({
        variantId: item.variantId,
        requested: item.quantity,
        available,
        price: row.price,
        title: row.title,
      });
    }

    // 2. Increment reserved count atomically for each variant
    for (const item of lockedItems) {
      await client.query(
        `UPDATE inventory 
         SET reserved = reserved + $1, updated_at = NOW() 
         WHERE variant_id = $2;`,
        [item.requested, item.variantId]
      );
    }

    // 3. Resolve shipping address
    let resolvedAddressId: string | null = null;

    if (savedAddressId) {
      const addrRes = await client.query(
        `SELECT id FROM addresses WHERE id = $1 AND user_id = $2;`,
        [savedAddressId, userId]
      );
      if (addrRes.rows.length > 0) {
        resolvedAddressId = addrRes.rows[0].id;
      }
    } else if (shippingAddress && shippingAddress.addressLine1 && shippingAddress.city && shippingAddress.postalCode && shippingAddress.country) {
      const insertAddr = await client.query(
        `INSERT INTO addresses (user_id, address_line1, address_line2, city, state, postal_code, country)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id;`,
        [
          userId,
          shippingAddress.addressLine1.trim(),
          shippingAddress.addressLine2 ? shippingAddress.addressLine2.trim() : null,
          shippingAddress.city.trim(),
          shippingAddress.state ? shippingAddress.state.trim() : null,
          shippingAddress.postalCode.trim(),
          shippingAddress.country.trim().toUpperCase(),
        ]
      );
      resolvedAddressId = insertAddr.rows[0].id;
    }

    // 4. Calculate total amount
    let totalAmount = 0;
    for (const item of lockedItems) {
      totalAmount += parseFloat(item.price) * item.requested;
    }

    // 5. Create order with status 'pending'
    const orderRes = await client.query(
      `INSERT INTO orders (user_id, status, total_amount, shipping_address_id, created_at, updated_at)
       VALUES ($1, 'pending', $2, $3, NOW(), NOW())
       RETURNING id, status, total_amount, created_at;`,
      [userId, totalAmount.toFixed(2), resolvedAddressId]
    );
    const createdOrder = orderRes.rows[0];

    // 6. Insert order items
    for (const item of lockedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, variant_id, price_at_purchase, quantity)
         VALUES ($1, $2, $3, $4);`,
        [createdOrder.id, item.variantId, item.price, item.requested]
      );
    }

    await client.query('COMMIT');

    // 7. Clear cart session in Redis if provided
    if (cartId) {
      try {
        await redis.del(`cart:${cartId}`);
      } catch (err) {
        console.error('[Checkout] Failed to clear Redis cart:', err);
      }
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    res.status(201).json({
      success: true,
      order: {
        id: createdOrder.id,
        status: createdOrder.status,
        totalAmount: createdOrder.total_amount,
        createdAt: createdOrder.created_at,
        expiresAt,
        itemsCount: lockedItems.reduce((acc, i) => acc + i.requested, 0),
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Checkout] Error executing reservation transaction:', error);
    res.status(500).json({ success: false, error: 'Checkout reservation failed due to a database error' });
  } finally {
    client.release();
  }
}

export async function cancelCheckout(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  const { orderId } = req.params;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (!orderId) {
    res.status(400).json({ success: false, error: 'Order ID is required' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderRes = await client.query(
      `SELECT id, status FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE;`,
      [orderId, userId]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    const order = orderRes.rows[0];
    if (order.status !== 'pending') {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, error: `Cannot cancel order with status ${order.status}` });
      return;
    }

    // Release reserved inventory
    await client.query(
      `UPDATE inventory i
       SET reserved = GREATEST(0, i.reserved - oi.quantity), updated_at = NOW()
       FROM order_items oi
       WHERE oi.order_id = $1 AND oi.variant_id = i.variant_id;`,
      [orderId]
    );

    // Mark order cancelled
    await client.query(
      `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1;`,
      [orderId]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Reservation cancelled and inventory released' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Checkout] Error cancelling reservation:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel reservation' });
  } finally {
    client.release();
  }
}
