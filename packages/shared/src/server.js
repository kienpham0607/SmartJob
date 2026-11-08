import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { config } from './config.js';
import { ApiError, errorHandler } from './errors.js';

export function createBaseApp(name, database = false) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config().origin, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
  app.use(express.json({ limit: '100kb' }));
  app.get('/health', (req, res) => {
    const healthy = !database || mongoose.connection.readyState === 1;
    res.status(healthy ? 200 : 503).json({
      service: name,
      status: healthy ? 'ok' : 'unavailable',
      ...(database ? { database: mongoose.connection.name } : {}),
    });
  });
  return app;
}

export function finishApp(app) {
  app.use((req, res, next) => next(new ApiError(404, 'Không tìm thấy đường dẫn.', 'NOT_FOUND')));
  app.use(errorHandler);
  return app;
}

export async function startService(app, { port, database }) {
  if (database) {
    await mongoose.connect(config().mongoUri, { dbName: database, serverSelectionTimeoutMS: 5000 });
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  }
  // Local mặc định loopback; Docker Compose đặt LISTEN_HOST=0.0.0.0 để service gọi nhau qua network.
  const host = process.env.LISTEN_HOST || '127.0.0.1';
  const server = app.listen(port, host, () =>
    console.log(`SmartJob: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`),
  );
  server.on('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
    mongoose.disconnect();
  });
  let closing = false;
  async function shutdown() {
    if (closing) return;
    closing = true;
    const timer = setTimeout(() => process.exit(1), 10000).unref();
    server.close(async () => {
      await mongoose.disconnect();
      clearTimeout(timer);
      process.exit(0);
    });
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  return server;
}
