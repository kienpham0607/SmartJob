import { createBaseApp, finishApp } from '@smartjob/shared/server';
import { routes } from './routes/index.js';
export function createApp() {
  const app = createBaseApp('application-service', true);
  app.use(routes);
  return finishApp(app);
}
