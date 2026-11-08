import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { parseEnvironment } from './environment.js';

// Resolve from this file so every workspace loads the same root .env.
dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });

export function required(name, minLength = 1) {
  const value = process.env[name];
  if (!value || value.length < minLength)
    throw new Error(`Biến môi trường ${name} cần ít nhất ${minLength} ký tự. Chạy npm run setup.`);
  return value;
}

export function config() {
  const env = parseEnvironment(process.env);
  return {
    jwtSecret: env.JWT_SECRET,
    internalToken: env.INTERNAL_SERVICE_TOKEN,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    mongoUri: env.MONGODB_URI,
    origin: env.FRONTEND_ORIGIN,
    timeout: env.HTTP_TIMEOUT_MS,
    gatewayTimeout: env.GATEWAY_TIMEOUT_MS,
    urls: {
      user: env.USER_SERVICE_URL,
      job: env.JOB_SERVICE_URL,
      application: env.APPLICATION_SERVICE_URL,
      recommendation: env.RECOMMENDATION_SERVICE_URL,
    },
  };
}
