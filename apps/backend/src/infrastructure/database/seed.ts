import { Category, type Product } from '@examen-ecommerce/shared';
import { connectToDatabase, disconnectFromDatabase } from './connection';
import { ProductModel } from './models/product.model';

export const SEED_PRODUCTS: ReadonlyArray<Product> = [
  { id: 'product-laptop-pro', name: 'Laptop Pro 2024', price: 1500, category: Category.TECHNOLOGY, stock: 5 },
  { id: 'product-smartphone-x100', name: 'Smartphone X100', price: 500, category: Category.TECHNOLOGY, stock: 10 },
  { id: 'product-headphones-nc', name: 'Noise Cancelling Headphones', price: 200, category: Category.TECHNOLOGY, stock: 3 },
  { id: 'product-wireless-mouse', name: 'Wireless Mouse', price: 30, category: Category.TECHNOLOGY, stock: 20 },
  { id: 'product-cotton-tshirt', name: 'Cotton T-Shirt', price: 20, category: Category.OTHER, stock: 30 },
  { id: 'product-ceramic-mug', name: 'Ceramic Coffee Mug', price: 10, category: Category.OTHER, stock: 40 },
];

export async function seedDatabase(): Promise<void> {
  await ProductModel.deleteMany({});
  await ProductModel.insertMany(SEED_PRODUCTS);
}

/* istanbul ignore next */
async function runSeed(): Promise<void> {
  await connectToDatabase();
  await seedDatabase();
  await disconnectFromDatabase();
}

/* istanbul ignore next */
if (require.main === module) {
  runSeed().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}