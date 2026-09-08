/* istanbul ignore file */
import { config } from './config';
import { connectToDatabase } from './infrastructure/database/connection';
import { seedDatabase } from './infrastructure/database/seed';
import { startServer } from './infrastructure/http/server';
import { MongooseOrderRepository } from './infrastructure/repositories/order.repository';
import { MongooseProductRepository } from './infrastructure/repositories/product.repository';

async function bootstrap(): Promise<void> {
  await connectToDatabase(config.database.mongodbUri);
  await seedDatabase();
  await startServer({
    port: config.server.port,
    mongodbUri: config.database.mongodbUri,
    dependencies: {
      productRepository: new MongooseProductRepository(),
      orderRepository: new MongooseOrderRepository(),
    },
  });
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});