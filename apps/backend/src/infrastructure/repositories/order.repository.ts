import type { Order } from '../../domain/entities/order';
import { OrderModel } from '../database/models/order.model';

export interface OrderRepository {
  save(order: Order): Promise<void>;
}

export class MongooseOrderRepository implements OrderRepository {
  async save(order: Order): Promise<void> {
    await OrderModel.create(order);
  }
}