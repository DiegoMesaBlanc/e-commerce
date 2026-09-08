import type { Server } from 'node:http';
import { connectToDatabase } from '../database/connection';
import { createApp, type AppDependencies } from './app';

export interface StartServerOptions {
  port: number;
  mongodbUri: string;
  dependencies: AppDependencies;
}

export async function startServer(options: StartServerOptions): Promise<Server> {
  await connectToDatabase(options.mongodbUri);
  const app = createApp(options.dependencies);
  return app.listen(options.port, () => {
    console.log(`Server listening on http://localhost:${options.port}`);
  });
}