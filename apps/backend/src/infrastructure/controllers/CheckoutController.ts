import type { Request, Response } from 'express';
import type { CheckoutRequestDTO } from '@examen-ecommerce/shared';
import type { CheckoutService } from '../../application/services/checkout.service';

export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  async checkout(req: Request, res: Response): Promise<void> {
    const dto = req.body as CheckoutRequestDTO;
    const result = await this.checkoutService.execute(dto);
    res.status(201).json(result);
  }

  async preview(req: Request, res: Response): Promise<void> {
    const dto = req.body as CheckoutRequestDTO;
    const result = await this.checkoutService.preview(dto);
    res.status(200).json(result);
  }
}