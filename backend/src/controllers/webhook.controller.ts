import { Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../db/db';
import { enqueueOrderConfirmation } from '../queue/order.queue';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_vcommerce_dev_key';

function verifyStripeSignature(rawPayload: string | Buffer, header: string | undefined): boolean {
  if (!header) return false;

  const parts = header.split(',');
  let timestamp: string | null = null;
  let signature: string | null = null;

  for (const part of parts) {
    const [key, val] = part.split('=');
    if (key === 't') timestamp = val;
    if (key === 'v1') signature = val;
  }

  if (!timestamp || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${rawPayload.toString()}`)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
}

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const sigHeader = req.headers['stripe-signature'] as string | undefined;

  // Use preserved raw buffer if available to maintain cryptographic byte exactness
  const rawBody = (req as any).rawBody
    ? (req as any).rawBody.toString('utf8')
    : Buffer.isBuffer(req.body)
    ? req.body.toString('utf8')
    : typeof req.body === 'string'
    ? req.body
    : JSON.stringify(req.body);

  const isValid = verifyStripeSignature(rawBody, sigHeader);
  if (!isValid) {
    console.warn('[Webhook] Invalid Stripe cryptographic signature rejected');
    res.status(400).json({ error: 'Invalid webhook signature' });
    return;
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    res.status(400).json({ error: 'Malformed JSON payload' });
    return;
  }

  const eventId = event.id;
  const eventType = event.type;

  // 1. Idempotency Check: Prevent duplicate event processing
  const existingEvent = await pool.query(`SELECT id FROM webhook_events WHERE id = $1;`, [eventId]);
  if (existingEvent.rows.length > 0) {
    console.log(`[Webhook] Duplicate event ${eventId} ignored (idempotent response)`);
    res.status(200).json({ received: true, duplicate: true });
    return;
  }

  if (eventType === 'payment_intent.succeeded' || eventType === 'checkout.session.completed') {
    const paymentIntent = event.data?.object;
    const orderId = paymentIntent?.metadata?.orderId || paymentIntent?.orderId;

    if (!orderId) {
      console.warn(`[Webhook] Event ${eventId} missing orderId in metadata`);
      res.status(400).json({ error: 'Missing orderId in payment metadata' });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 2. Lock order row
      const orderRes = await client.query(
        `SELECT id, status, total_amount, user_id, shipping_address_id FROM orders WHERE id = $1 FOR UPDATE;`,
        [orderId]
      );

      if (orderRes.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      const order = orderRes.rows[0];

      if (order.status === 'paid') {
        // Record event idempotency and commit
        await client.query(
          `INSERT INTO webhook_events (id, type, status, payload) VALUES ($1, $2, 'duplicate', $3);`,
          [eventId, eventType, rawBody]
        );
        await client.query('COMMIT');
        res.status(200).json({ received: true, alreadyPaid: true });
        return;
      }

      // 3. Finalize inventory: Deduct permanently from quantity and clear reserved count
      await client.query(
        `UPDATE inventory i
         SET quantity = i.quantity - oi.quantity,
             reserved = GREATEST(0, i.reserved - oi.quantity),
             updated_at = NOW()
         FROM order_items oi
         WHERE oi.order_id = $1 AND oi.variant_id = i.variant_id;`,
        [orderId]
      );

      // 4. Transition order status to 'paid'
      await client.query(`UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1;`, [orderId]);

      // 5. Insert webhook event record for idempotency audit
      await client.query(
        `INSERT INTO webhook_events (id, type, status, payload) VALUES ($1, $2, 'processed', $3);`,
        [eventId, eventType, rawBody]
      );

      // 6. Retrieve data for background BullMQ worker
      const userRes = order.user_id
        ? await client.query(`SELECT email FROM users WHERE id = $1;`, [order.user_id])
        : { rows: [] };
      const customerEmail = userRes.rows[0]?.email || 'customer@vcommerce.local';

      const itemsRes = await client.query(
        `SELECT oi.variant_id, oi.price_at_purchase, oi.quantity, pv.sku, p.title AS product_title
         FROM order_items oi
         JOIN product_variants pv ON pv.id = oi.variant_id
         JOIN products p ON p.id = pv.product_id
         WHERE oi.order_id = $1;`,
        [orderId]
      );

      const addressRes = order.shipping_address_id
        ? await client.query(
            `SELECT address_line1, city, state, postal_code, country FROM addresses WHERE id = $1;`,
            [order.shipping_address_id]
          )
        : { rows: [] };
      const shippingAddress = addressRes.rows[0]
        ? {
            addressLine1: addressRes.rows[0].address_line1,
            city: addressRes.rows[0].city,
            state: addressRes.rows[0].state,
            postalCode: addressRes.rows[0].postal_code,
            country: addressRes.rows[0].country,
          }
        : null;

      await client.query('COMMIT');

      // 7. Enqueue BullMQ asynchronous order confirmation job (outside transactional lock)
      try {
        await enqueueOrderConfirmation({
          orderId: order.id,
          userId: order.user_id,
          customerEmail,
          totalAmount: order.total_amount,
          items: itemsRes.rows.map((i) => ({
            variantId: i.variant_id,
            productTitle: i.product_title,
            sku: i.sku,
            quantity: i.quantity,
            priceAtPurchase: i.price_at_purchase,
          })),
          shippingAddress,
        });
      } catch (queueErr) {
        console.error('[Webhook] Failed to enqueue BullMQ job:', queueErr);
      }

      console.log(`[Webhook] Order ${orderId} marked PAID. Inventory finalized.`);
      res.status(200).json({ received: true, orderId, status: 'paid' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[Webhook] Error processing payment webhook:', err);
      res.status(500).json({ error: 'Webhook processing failed' });
    } finally {
      client.release();
    }
  } else {
    // Other event types acknowledge without processing
    await pool.query(
      `INSERT INTO webhook_events (id, type, status, payload) VALUES ($1, $2, 'ignored', $3) ON CONFLICT (id) DO NOTHING;`,
      [eventId, eventType, rawBody]
    );
    res.status(200).json({ received: true, ignored: true });
  }
}
