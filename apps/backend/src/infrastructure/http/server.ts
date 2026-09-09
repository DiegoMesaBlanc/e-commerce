import type { Server } from 'node:http';
import { connectToDatabase } from '../database/connection';
import { config } from '../../config';
import { createApp, type AppDependencies } from './app';

export interface StartServerOptions {
  port?: number;
  mongodbUri?: string;
  dependencies: AppDependencies;
}

export async function startServer(options: StartServerOptions): Promise<Server> {
  await connectToDatabase(options.mongodbUri ?? config.database.mongodbUri);
  const app = createApp(options.dependencies);
  return app.listen(options.port ?? config.server.port, () => {
    console.log(`Server listening on http://localhost:${options.port ?? config.server.port}`);
  });
}