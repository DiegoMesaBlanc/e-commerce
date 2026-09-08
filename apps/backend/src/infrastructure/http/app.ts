import express, { type Express } from 'express';
import cors from 'cors';
import { CheckoutService } from '../../application/services/checkout.service';
import type { OrderRepository } from '../repositories/order.repository';
import type { ProductRepository } from '../repositories/product.repository';
import { CheckoutController } from '../controllers/CheckoutController';
import { ProductController } from '../controllers/ProductController';
import { checkoutRouter } from '../routes/checkout.router';
import { productsRouter } from '../routes/products.router';
import { errorHandler, notFoundHandler } from '../middleware/error-handler';

export interface AppDependencies {
  productRepository: ProductRepository;
  orderRepository: OrderRepository;
}

export function createApp(dependencies: AppDependencies): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const productController = new ProductController(dependencies.productRepository);
  const checkoutController = new CheckoutController(
    new CheckoutService(dependencies.productRepository, dependencies.orderRepository),
  );

  app.use('/api/products', productsRouter(productController));
  app.use('/api/checkout', checkoutRouter(checkoutController));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}