import { MongoMemoryServer } from 'mongodb-memory-server';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const dbPath = fileURLToPath(new URL('../.local/mongo', import.meta.url));
await mkdir(dbPath, { recursive: true });
// Real mongod, persisted to .local. This is an optional local demo tool, not an in-memory API mock.
const mongo = await MongoMemoryServer.create({
  instance: { port: 27017, dbPath, storageEngine: 'wiredTiger' },
});
console.log(
  `MongoDB demo: ${mongo.getUri()} — giữ terminal này mở. Dữ liệu lưu trong .local/mongo.`,
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, async () => {
    await mongo.stop({ doCleanup: false });
    process.exit(0);
  });
