import { createApp } from './app.js';
import { startService } from '@smartjob/shared/server';
import '@smartjob/shared/config';
startService(createApp(), { port: Number(process.env.GATEWAY_PORT || 3000) }).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
