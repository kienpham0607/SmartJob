import { build } from 'vite';
// The root .env configures local backend development. Always compile React in production mode.
process.env.NODE_ENV = 'production';
await build();
