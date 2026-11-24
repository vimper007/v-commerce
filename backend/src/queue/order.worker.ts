import { Worker, Job } from 'bullmq';
import { createBullConnection } from '../redis/client';
import { OrderConfirmationPayload } from './order.queue';

const connection = createBullConnection();

export const orderWorker = new Worker<OrderConfirmationPayload>(
  'order-processing',
  async (job: Job<OrderConfirmationPayload>) => {
    const { orderId, customerEmail, totalAmount, items } = job.data;
    console.log(`[BullMQ Worker] Processing job ${job.id} (Order: ${orderId})`);

    // Simulate async receipt generation and notifications
    const invoiceNumber = `INV-${new Date().getFullYear()}-${orderId.slice(0, 8).toUpperCase()}`;

    // Execution trace
    console.log(
      `[BullMQ Worker] Generated Invoice ${invoiceNumber} for ${customerEmail}. Items: ${items.length}, Total: $${totalAmount}`
    );

    return {
      success: true,
      orderId,
      invoiceNumber,
      customerEmail,
      itemsCount: items.length,
      processedAt: new Date().toISOString(),
    };
  },
  {
    connection,
    concurrency: 5,
  }
);

orderWorker.on('completed', (job: Job) => {
  console.log(`[BullMQ Worker] Job ${job.id} completed successfully`);
});

orderWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err);
});
