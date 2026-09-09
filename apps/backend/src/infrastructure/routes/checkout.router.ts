import { Router } from 'express';
import type { CheckoutController } from '../controllers/CheckoutController';
import { asyncHandler } from '../middleware/async-handler';

export function checkoutRouter(controller: CheckoutController): Router {
  const router = Router();
  router.post('/preview', asyncHandler((req, res) => controller.preview(req, res)));
  router.post('/', asyncHandler((req, res) => controller.checkout(req, res)));
  return router;
}