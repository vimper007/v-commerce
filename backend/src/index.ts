import 'dotenv/config';
import { app } from "./server";
import { testDbConnection } from "./db/db";
import { testRedisConnection } from "./redis/client";
import { runMigrations } from "./db/migrate";
import "./queue/order.worker"; // Boot BullMQ background worker

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await testDbConnection();
  await testRedisConnection();
  await runMigrations();

  app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

bootstrap();



