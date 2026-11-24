import { Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../db/db';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_vcommerce_dev_key';

export async function createPaymentIntent(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  const { orderId } = req.body;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (!orderId) {
    res.status(400).json({ success: false, error: 'Order ID is required' });
    return;
  }

  try {
    const orderRes = await pool.query(
      `SELECT id, total_amount, status, user_id FROM orders WHERE id = $1 AND user_id = $2;`,
      [orderId, userId]
    );

    if (orderRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    const order = orderRes.rows[0];

    if (order.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: `Order is not in pending state (current status: ${order.status})`,
      });
      return;
    }

    const amountInCents = Math.round(parseFloat(order.total_amount) * 100);
    const paymentIntentId = `pi_${order.id.replace(/-/g, '').slice(0, 20)}`;
    const clientSecret = `${paymentIntentId}_secret_${crypto.randomBytes(12).toString('hex')}`;

    res.json({
      success: true,
      paymentIntent: {
        id: paymentIntentId,
        clientSecret,
        amount: amountInCents,
        currency: 'usd',
        orderId: order.id,
      },
    });
  } catch (error) {
    console.error('[Payment] Error creating payment intent:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment intent' });
  }
}

export async function simulatePayment(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  const { orderId } = req.body;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (!orderId) {
    res.status(400).json({ success: false, error: 'Order ID is required' });
    return;
  }

  try {
    const orderRes = await pool.query(
      `SELECT id, total_amount, status FROM orders WHERE id = $1 AND user_id = $2;`,
      [orderId, userId]
    );

    if (orderRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    const order = orderRes.rows[0];
    if (order.status !== 'pending') {
      res.status(400).json({ success: false, error: `Order is already ${order.status}` });
      return;
    }

    // Construct mock Stripe event
    const timestamp = Math.floor(Date.now() / 1000);
    const eventId = `evt_${crypto.randomUUID().replace(/-/g, '')}`;
    const payloadObject = {
      id: eventId,
      object: 'event',
      type: 'payment_intent.succeeded',
      created: timestamp,
      data: {
        object: {
          id: `pi_${orderId.replace(/-/g, '').slice(0, 20)}`,
          amount: Math.round(parseFloat(order.total_amount) * 100),
          currency: 'usd',
          status: 'succeeded',
          metadata: {
            orderId: order.id,
          },
        },
      },
    };

    const payloadString = JSON.stringify(payloadObject);

    // Generate cryptographic signature: t={timestamp},v1={hmac}
    const signature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(`${timestamp}.${payloadString}`)
      .digest('hex');
    const header = `t=${timestamp},v1=${signature}`;

    // Dispatches internally to webhook verification logic via fetch or local endpoint
    const response = await fetch('http://localhost:5000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': header,
      },
      body: payloadString,
    });

    const data = await response.json();
    res.json({ success: response.ok, webhookResult: data });
  } catch (error) {
    console.error('[Payment] Simulation failed:', error);
    res.status(500).json({ success: false, error: 'Payment simulation failed' });
  }
}
