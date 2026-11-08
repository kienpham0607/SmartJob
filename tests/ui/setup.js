import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import '@smartjob/shared/config';

async function freePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
export default async function setup() {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const id = `${Date.now()}_${randomBytes(4).toString('hex')}`;
  const dbs = ['users', 'jobs', 'applications'].map((name) => `smartjob_test_ui_${id}_${name}`);
  const ports = await Promise.all(Array.from({ length: 6 }, freePort));
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    JWT_SECRET: randomBytes(48).toString('hex'),
    INTERNAL_SERVICE_TOKEN: randomBytes(48).toString('hex'),
    MONGODB_URI:
      process.env.MONGODB_TEST_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017',
    USER_DB: dbs[0],
    JOB_DB: dbs[1],
    APPLICATION_DB: dbs[2],
    GATEWAY_PORT: String(ports[4]),
    FRONTEND_ORIGIN: `http://127.0.0.1:${ports[5]}`,
    VITE_API_URL: `http://127.0.0.1:${ports[4]}/api`,
  };
  ['USER', 'JOB', 'APPLICATION', 'RECOMMENDATION'].forEach((name, i) => {
    env[`${name}_PORT`] = String(ports[i]);
    env[`${name}_SERVICE_URL`] = `http://127.0.0.1:${ports[i]}`;
  });
  process.env.SMARTJOB_UI_URL = `http://127.0.0.1:${ports[5]}`;
  const children = [];
  let logs = '';
  async function cleanup() {
    await Promise.all(
      children.map(
        (child) =>
          new Promise((resolve) => {
            if (child.exitCode !== null || child.signalCode !== null) return resolve();
            child.once('exit', resolve);
            child.kill();
          }),
      ),
    );
    for (const db of dbs) {
      if (!db.startsWith(`smartjob_test_ui_${id}_`))
        throw new Error('Unsafe test database cleanup');
      const conn = await mongoose
        .createConnection(env.MONGODB_URI, { dbName: db, serverSelectionTimeoutMS: 5000 })
        .asPromise();
      try {
        await conn.dropDatabase();
      } finally {
        await conn.close();
      }
    }
  }
  try {
    const entries = [
      'services/user-service/src/index.js',
      'services/job-service/src/index.js',
      'services/application-service/src/index.js',
      'services/recommendation-service/src/index.js',
      'api-gateway/src/index.js',
    ];
    for (let i = 0; i < 6; i++) {
      const args =
        i === 5
          ? [
              'node_modules/vite/bin/vite.js',
              'frontend',
              '--host',
              '127.0.0.1',
              '--port',
              String(ports[5]),
              '--strictPort',
            ]
          : [entries[i]];
      const child = spawn(process.execPath, args, {
        cwd: root,
        env,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      children.push(child);
      child.stdout.on('data', (chunk) => {
        logs += chunk;
      });
      child.stderr.on('data', (chunk) => {
        logs += chunk;
      });
      let ready = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        if (child.exitCode !== null) throw new Error(`UI test service stopped: ${logs}`);
        try {
          const response = await fetch(`http://127.0.0.1:${ports[i]}${i === 5 ? '/' : '/health'}`, {
            signal: AbortSignal.timeout(500),
          });
          if (response.ok) {
            ready = true;
            break;
          }
        } catch {
          /* Await startup. */
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (!ready) throw new Error(`UI test startup timeout: ${logs}`);
    }
    return cleanup;
  } catch (error) {
    await cleanup();
    throw error;
  }
}
