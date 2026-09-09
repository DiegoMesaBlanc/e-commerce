import { Router } from 'express';
import type { ProductController } from '../controllers/ProductController';
import { asyncHandler } from '../middleware/async-handler';

export function productsRouter(controller: ProductController): Router {
  const router = Router();
  router.get('/', asyncHandler((req, res) => controller.list(req, res)));
  return router;
}