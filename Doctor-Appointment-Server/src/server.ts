import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { seed } from "./scripts/seed";

async function start(): Promise<void> {
  await connectDB();

  // Auto-provision test accounts on fresh database (idempotent)
  await seed();

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
