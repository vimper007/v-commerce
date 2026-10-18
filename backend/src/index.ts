import 'dotenv/config';
import { app } from "./server";
import { testDbConnection } from "./db/db";
import { drizzle } from 'drizzle-orm/node-postgres';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  // 1. Verify PostgreSQL connection
  await testDbConnection();

  // 2. Start HTTP server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap();

import 'dotenv/config';


const db = drizzle(process.env.DATABASE_URL!);
