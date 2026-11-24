import { Request, Response } from 'express';
import { pool } from '../db/db';

export async function getOrderById(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (!id) {
    res.status(400).json({ success: false, error: 'Order ID is required' });
    return;
  }

  try {
    const orderRes = await pool.query(
      `SELECT 
        o.id,
        o.user_id,
        o.status,
        o.total_amount,
        o.shipping_address_id,
        o.created_at,
        o.updated_at,
        a.address_line1,
        a.address_line2,
        a.city,
        a.state,
        a.postal_code,
        a.country
      FROM orders o
      LEFT JOIN addresses a ON a.id = o.shipping_address_id
      WHERE o.id = $1 AND o.user_id = $2;`,
      [id, userId]
    );

    if (orderRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    const orderRow = orderRes.rows[0];

    const itemsRes = await pool.query(
      `SELECT 
        oi.id,
        oi.variant_id,
        oi.price_at_purchase,
        oi.quantity,
        pv.sku,
        pv.size,
        pv.color,
        COALESCE(pv.image_url, p.image_url) AS image_url,
        p.title AS product_title
      FROM order_items oi
      JOIN product_variants pv ON pv.id = oi.variant_id
      JOIN products p ON p.id = pv.product_id
      WHERE oi.order_id = $1;`,
      [id]
    );

    res.json({
      success: true,
      order: {
        id: orderRow.id,
        status: orderRow.status,
        totalAmount: orderRow.total_amount,
        createdAt: orderRow.created_at,
        shippingAddress: orderRow.shipping_address_id ? {
          addressLine1: orderRow.address_line1,
          addressLine2: orderRow.address_line2,
          city: orderRow.city,
          state: orderRow.state,
          postalCode: orderRow.postal_code,
          country: orderRow.country,
        } : null,
        items: itemsRes.rows.map(item => ({
          id: item.id,
          variantId: item.variant_id,
          productTitle: item.product_title,
          sku: item.sku,
          size: item.size,
          color: item.color,
          imageUrl: item.image_url,
          priceAtPurchase: item.price_at_purchase,
          quantity: item.quantity,
        })),
      },
    });
  } catch (error) {
    console.error('[Orders] Error fetching order details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order details' });
  }
}

export async function getUserOrders(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const ordersRes = await pool.query(
      `SELECT 
        o.id,
        o.status,
        o.total_amount,
        o.created_at,
        COUNT(oi.id)::int AS items_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC;`,
      [userId]
    );

    res.json({
      success: true,
      orders: ordersRes.rows.map(row => ({
        id: row.id,
        status: row.status,
        totalAmount: row.total_amount,
        createdAt: row.created_at,
        itemsCount: row.items_count,
      })),
    });
  } catch (error) {
    console.error('[Orders] Error fetching user orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user orders' });
  }
}
