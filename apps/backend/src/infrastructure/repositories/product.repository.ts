import type { Product } from '@examen-ecommerce/shared';
import { ProductModel } from '../database/models/product.model';

export interface ProductRepository {
  findByIds(ids: string[]): Promise<Product[]>;
  findAvailable(): Promise<Product[]>;
  updateStock(id: string, quantity: number): Promise<void>;
}

export class MongooseProductRepository implements ProductRepository {
  async findByIds(ids: string[]): Promise<Product[]> {
    const documents = await ProductModel.find({ _id: { $in: ids } });
    return documents.map((document) => this.toProduct(document));
  }

  async findAvailable(): Promise<Product[]> {
    const documents = await ProductModel.find({ stock: { $gt: 0 } });
    return documents.map((document) => this.toProduct(document));
  }

  async updateStock(id: string, quantity: number): Promise<void> {
    await ProductModel.updateOne({ _id: id }, { $inc: { stock: -quantity } });
  }

  private toProduct(document: any): Product {
    return {
      id: document._id.toString(),
      name: document.name,
      price: document.price,
      category: document.category,
      stock: document.stock,
    };
  }
}