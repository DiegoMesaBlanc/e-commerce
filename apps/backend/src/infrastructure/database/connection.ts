import mongoose from 'mongoose';

export const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/ecommerce';

export async function connectToDatabase(
  uri: string = process.env.MONGODB_URI ?? DEFAULT_MONGODB_URI,
): Promise<void> {
  await mongoose.connect(uri);
}

export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.disconnect();
}