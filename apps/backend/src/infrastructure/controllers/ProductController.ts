import type { Request, Response } from 'express';
import type { ProductRepository } from '../repositories/product.repository';

export class ProductController {
  constructor(private readonly productRepository: ProductRepository) {}

  async list(_req: Request, res: Response): Promise<void> {
    const products = await this.productRepository.findAvailable();
    res.status(200).json({ products });
  }
}