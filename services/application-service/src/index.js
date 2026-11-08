import { createApp } from './app.js';
import { settings } from './config/index.js';
import { startService } from '@smartjob/shared/server';
startService(createApp(), settings()).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
