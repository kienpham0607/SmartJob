import mongoose from 'mongoose';
import { config } from '@smartjob/shared/config';
try {
  await mongoose.connect(config().mongoUri, {
    dbName: process.env.USER_DB,
    serverSelectionTimeoutMS: 5000,
  });
  const result = await mongoose.connection.db.admin().ping();
  console.log(`MongoDB ping: ${result.ok === 1 ? 'OK' : 'FAILED'}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
