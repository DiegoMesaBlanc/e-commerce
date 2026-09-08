import request from 'supertest';
import { Category, type CheckoutResponseDTO, type Product } from '@examen-ecommerce/shared';
import type { Order } from '../../domain/entities/order';
import { createApp } from '../http/app';
import type { OrderRepository } from '../repositories/order.repository';
import type { ProductRepository } from '../repositories/product.repository';

const LAPTOP: Product = {
  id: 'product-laptop-pro',
  name: 'Laptop Pro 2024',
  price: 1500,
  category: Category.TECHNOLOGY,
  stock: 5,
};
const SMARTPHONE: Product = {
  id: 'product-smartphone-x100',
  name: 'Smartphone X100',
  price: 500,
  category: Category.TECHNOLOGY,
  stock: 10,
};
const MUG: Product = {
  id: 'product-ceramic-mug',
  name: 'Ceramic Coffee Mug',
  price: 10,
  category: Category.OTHER,
  stock: 0,
};

class InMemoryProductRepository implements ProductRepository {
  private readonly products = new Map<string, Product>();

  constructor(seed: Product[]) {
    for (const product of seed) {
      this.products.set(product.id, product);
    }
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    return ids
      .map((id) => this.products.get(id))
      .filter((product): product is Product => product !== undefined);
  }

  async findAvailable(): Promise<Product[]> {
    return Array.from(this.products.values()).filter((product) => product.stock > 0);
  }

  async updateStock(id: string, quantity: number): Promise<void> {
    const product = this.products.get(id);
    if (product) {
      this.products.set(id, { ...product, stock: product.stock - quantity });
    }
  }
}

class InMemoryOrderRepository implements OrderRepository {
  readonly orders: Order[] = [];

  async save(order: Order): Promise<void> {
    this.orders.push(order);
  }
}

function buildApp(seed: Product[] = [LAPTOP, SMARTPHONE, MUG]) {
  const productRepository = new InMemoryProductRepository(seed);
  const orderRepository = new InMemoryOrderRepository();
  return { productRepository, orderRepository, app: createApp({ productRepository, orderRepository }) };
}

describe('REST API', () => {
  describe('GET /api/products', () => {
    it('returns only products with available stock', async () => {
      const { app } = buildApp();
      const response = await request(app).get('/api/products').expect(200);

      expect(response.body.products).toHaveLength(2);
      expect(response.body.products.map((product: Product) => product.id)).toEqual([
        LAPTOP.id,
        SMARTPHONE.id,
      ]);
    });
  });

  describe('POST /api/checkout', () => {
    it('creates an order with coupon and applies the discount cascade', async () => {
      const { app, orderRepository } = buildApp();
      const response = await request(app)
        .post('/api/checkout')
        .send({
          cartItems: [{ productId: LAPTOP.id, quantity: 1 }, { productId: SMARTPHONE.id, quantity: 1 }],
          couponCode: 'WELCOME2026',
        })
        .expect(201);

      const body = response.body as CheckoutResponseDTO;
      expect(body.orderId).toBeDefined();
      expect(body.originalSubtotal).toBe(2000);
      expect(body.discountBreakdown.categoryDiscount).toBe(200);
      expect(body.discountBreakdown.volumeDiscount).toBe(90);
      expect(body.discountBreakdown.couponDiscount).toBe(256.5);
      expect(body.discountBreakdown.totalSavings).toBe(546.5);
      expect(body.discountBreakdown.effectivePercentage).toBe(27.33);
      expect(body.discountBreakdown.limitReached).toBe(false);
      expect(body.finalTotal).toBe(1453.5);
      expect(orderRepository.orders).toHaveLength(1);
      expect(orderRepository.orders[0]!.couponCode).toBe('WELCOME2026');
    });

    it('creates an order without coupon applying only category and volume discounts', async () => {
      const { app } = buildApp();
      const response = await request(app)
        .post('/api/checkout')
        .send({ cartItems: [{ productId: LAPTOP.id, quantity: 1 }] })
        .expect(201);

      const body = response.body as CheckoutResponseDTO;
      expect(body.originalSubtotal).toBe(1500);
      expect(body.discountBreakdown.categoryDiscount).toBe(150);
      expect(body.discountBreakdown.volumeDiscount).toBe(67.5);
      expect(body.discountBreakdown.couponDiscount).toBe(0);
      expect(body.finalTotal).toBe(1282.5);
    });

    it('aggregates duplicate products and updates stock once', async () => {
      const { app, productRepository } = buildApp();
      const response = await request(app)
        .post('/api/checkout')
        .send({
          cartItems: [
            { productId: LAPTOP.id, quantity: 1 },
            { productId: LAPTOP.id, quantity: 1 },
          ],
        })
        .expect(201);

      const body = response.body as CheckoutResponseDTO;
      expect(body.originalSubtotal).toBe(3000);
      expect(body.finalTotal).toBe(2565);
      expect(await productRepository.findByIds([LAPTOP.id])).toEqual([{ ...LAPTOP, stock: 3 }]);
    });

    it('rejects an empty cart with 400', async () => {
      const { app } = buildApp();
      const response = await request(app).post('/api/checkout').send({}).expect(400);

      expect(response.body).toEqual({ error: 'The cart is empty.' });
    });

    it('rejects an invalid coupon with 400', async () => {
      const { app } = buildApp();
      const response = await request(app)
        .post('/api/checkout')
        .send({ cartItems: [{ productId: LAPTOP.id, quantity: 1 }], couponCode: 'NOT_VALID' })
        .expect(400);

      expect(response.body).toEqual({ error: 'Invalid coupon code "NOT_VALID".' });
    });

    it('rejects a non-positive quantity with 400', async () => {
      const { app } = buildApp();
      const response = await request(app)
        .post('/api/checkout')
        .send({ cartItems: [{ productId: LAPTOP.id, quantity: 0 }] })
        .expect(400);

      expect(response.body.error).toContain('Invalid quantity for product');
    });

    it('rejects an unknown product with 404', async () => {
      const { app } = buildApp();
      const response = await request(app)
        .post('/api/checkout')
        .send({ cartItems: [{ productId: 'product-missing', quantity: 1 }] })
        .expect(404);

      expect(response.body.error).toBe('Product "product-missing" was not found.');
    });

    it('rejects insufficient stock with 400', async () => {
      const { app } = buildApp();
      const response = await request(app)
        .post('/api/checkout')
        .send({ cartItems: [{ productId: LAPTOP.id, quantity: 99 }] })
        .expect(400);

      expect(response.body.error).toContain('Insufficient stock');
    });

    it('returns 500 when the persistence layer fails', async () => {
      const { orderRepository } = buildApp();
      const failRepository: ProductRepository = {
        findByIds: () => Promise.reject(new Error('database down')),
        findAvailable: async () => [],
        updateStock: async () => undefined,
      };
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const failingApp = createApp({ productRepository: failRepository, orderRepository });
      const response = await request(failingApp)
        .post('/api/checkout')
        .send({ cartItems: [{ productId: LAPTOP.id, quantity: 1 }] })
        .expect(500);

      expect(response.body).toEqual({ error: 'Internal server error.' });
      errorSpy.mockRestore();
    });
  });

  it('returns 404 for unknown routes', async () => {
    const { app } = buildApp();
    const response = await request(app).get('/api/nonexistent').expect(404);

    expect(response.body.error).toContain('was not found');
  });
});