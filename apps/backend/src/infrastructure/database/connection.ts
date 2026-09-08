import mongoose from 'mongoose';
import { config } from '../../config';

export async function connectToDatabase(uri: string = config.database.mongodbUri): Promise<void> {
  await mongoose.connect(uri);
}

export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.disconnect();
}