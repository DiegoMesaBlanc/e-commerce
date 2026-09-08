import mongoose from 'mongoose';
import { Category, OrderStatus, type Product } from '@examen-ecommerce/shared';
import type { Order } from '../../domain/entities/order';
import { connectToDatabase, disconnectFromDatabase } from '../database/connection';
import { config } from '../../config';
import { seedDatabase, SEED_PRODUCTS } from '../database/seed';
import { MongooseOrderRepository } from '../repositories/order.repository';
import { MongooseProductRepository } from '../repositories/product.repository';
import { startServer } from '../http/server';
import type { AppDependencies } from '../http/app';

jest.mock('mongoose', () => {
  const mockModelMethods = {
    find: jest.fn(),
    updateOne: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
    insertMany: jest.fn(),
  };

  return {
    Schema: class Schema {
      constructor(public definition: Record<string, unknown>) {}
    },
    model: jest.fn().mockReturnValue(mockModelMethods),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };
});

const mockedConnect = jest.mocked(mongoose.connect);
const mockedDisconnect = jest.mocked(mongoose.disconnect);

const dependencies: AppDependencies = {
  productRepository: new MongooseProductRepository(),
  orderRepository: new MongooseOrderRepository(),
};

describe('database connection', () => {
  beforeEach(() => {
    mockedConnect.mockClear();
    mockedDisconnect.mockClear();
  });

  it('connects using the default URI when none is provided', async () => {
    await connectToDatabase();
    expect(mockedConnect).toHaveBeenCalledWith(config.database.mongodbUri);
  });

  it('connects using a custom URI', async () => {
    await connectToDatabase('mongodb://localhost:27017/custom');
    expect(mockedConnect).toHaveBeenCalledWith('mongodb://localhost:27017/custom');
  });

  it('disconnects from the database', async () => {
    await disconnectFromDatabase();
    expect(mockedDisconnect).toHaveBeenCalledTimes(1);
  });
});

describe('database seed', () => {
  it('exports 6 seed products with technology examples', () => {
    expect(SEED_PRODUCTS).toHaveLength(6);
    expect(SEED_PRODUCTS.filter((product) => product.category === Category.TECHNOLOGY)).toHaveLength(4);
  });

  it('replaces the whole product catalog', async () => {
    await seedDatabase();
    expect(mongoose.model).toHaveBeenCalledWith('Product', expect.anything());
    expect(mongoose.model).toHaveBeenCalledWith('Order', expect.anything());
    const model = (mongoose.model as jest.Mock).mock.results[0]!.value;
    expect(model.deleteMany).toHaveBeenCalledWith({});
    expect(model.insertMany).toHaveBeenCalledWith(SEED_PRODUCTS);
  });
});

describe('MongooseProductRepository', () => {
  const productModel = (mongoose.model as jest.Mock).mock.results[0]!.value;
  const repository = new MongooseProductRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps documents with an ObjectId to products', async () => {
    const document = {
      _id: { toString: () => 'product-1' },
      name: 'Laptop Pro 2024',
      price: 1500,
      category: Category.TECHNOLOGY,
      stock: 5,
    };
    productModel.find.mockResolvedValue([document]);

    const products = await repository.findByIds(['product-1']);

    expect(productModel.find).toHaveBeenCalledWith({ _id: { $in: ['product-1'] } });
    expect(products).toEqual([
      { id: 'product-1', name: 'Laptop Pro 2024', price: 1500, category: Category.TECHNOLOGY, stock: 5 } satisfies Product,
    ]);
  });

  it('queries only products with available stock', async () => {
    productModel.find.mockResolvedValue([]);

    const products = await repository.findAvailable();

    expect(productModel.find).toHaveBeenCalledWith({ stock: { $gt: 0 } });
    expect(products).toEqual([]);
  });

  it('decrements stock atomically', async () => {
    productModel.updateOne.mockResolvedValue({});

    await repository.updateStock('product-1', 2);

    expect(productModel.updateOne).toHaveBeenCalledWith({ _id: 'product-1' }, { $inc: { stock: -2 } });
  });
});

describe('MongooseOrderRepository', () => {
  const orderModel = (mongoose.model as jest.Mock).mock.results[0]!.value;
  const repository = new MongooseOrderRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists the order', async () => {
    const order: Order = {
      orderId: 'order-1',
      couponCode: 'WELCOME2026',
      items: [],
      originalSubtotal: 0,
      discountBreakdown: {
        categoryDiscount: 0,
        volumeDiscount: 0,
        couponDiscount: 0,
        effectivePercentage: 0,
        totalSavings: 0,
        limitReached: false,
      },
      finalTotal: 0,
      status: OrderStatus.COMPLETED,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    await repository.save(order);

    expect(orderModel.create).toHaveBeenCalledWith(order);
  });
});

describe('startServer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('connects to the database and starts listening', async () => {
    const server = await startServer({
      port: 0,
      mongodbUri: 'mongodb://localhost:27017/test',
      dependencies,
    });

    expect(mockedConnect).toHaveBeenCalledWith('mongodb://localhost:27017/test');

    const address = await new Promise<string | null>((resolve) => {
      let attempts = 0;
      const poll = (): void => {
        const value = server.address();
        if (value) {
          resolve('bound');
        } else if (attempts > 10) {
          resolve(null);
        } else {
          attempts += 1;
          setTimeout(poll, 5);
        }
      };
      poll();
    });

    expect(address).not.toBeNull();
    server.close();
  });
});