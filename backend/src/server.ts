import express from 'express';
import { productRoutes } from './routes/product.routes';
import { cartRoutes } from './routes/cart.routes';
import { authRoutes } from './routes/auth.routes';
import { checkoutRoutes } from './routes/checkout.routes';
import { orderRoutes } from './routes/order.routes';
import { addressRoutes } from './routes/address.routes';
import { paymentRoutes } from './routes/payment.routes';
import { webhookRoutes } from './routes/webhook.routes';
import { getQueueMetrics } from './queue/order.queue';

const app = express();

// Standard zero-dependency CORS & JSON body parsing with raw byte preservation
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'V Commerce API',
  });
});

// System queue metrics
app.get('/api/system/queue-status', async (req, res) => {
  try {
    const metrics = await getQueueMetrics();
    res.json({ success: true, queue: 'order-processing', metrics });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch queue metrics' });
  }
});

// Domain Routes
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);

export { app };
