import { Queue } from 'bullmq';
import { createBullConnection } from '../redis/client';

export interface OrderConfirmationPayload {
  orderId: string;
  userId?: string | null;
  customerEmail: string;
  totalAmount: string;
  items: Array<{
    variantId?: string | null;
    productTitle: string;
    sku: string;
    quantity: number;
    priceAtPurchase: string;
  }>;
  shippingAddress: {
    addressLine1: string;
    city: string;
    state?: string | null;
    postalCode: string;
    country: string;
  } | null;
}

const connection = createBullConnection();

export const orderQueue = new Queue<OrderConfirmationPayload>('order-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      count: 100, // Retain last 100 completed jobs for audit
    },
    removeOnFail: {
      count: 500, // Retain failed jobs for dead-letter diagnostics
    },
  },
});

export async function enqueueOrderConfirmation(payload: OrderConfirmationPayload): Promise<string> {
  const job = await orderQueue.add('send-order-confirmation', payload, {
    jobId: `confirm-${payload.orderId}`,
  });
  console.log(`[BullMQ] Enqueued order confirmation job ${job.id} for order ${payload.orderId}`);
  return job.id as string;
}

export async function getQueueMetrics() {
  const [waiting, active, completed, failed] = await Promise.all([
    orderQueue.getWaitingCount(),
    orderQueue.getActiveCount(),
    orderQueue.getCompletedCount(),
    orderQueue.getFailedCount(),
  ]);
  return { waiting, active, completed, failed };
}
