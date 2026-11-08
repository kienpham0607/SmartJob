import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEnvironment } from '../packages/shared/src/environment.js';

const input = {
  JWT_SECRET: 'test-signing-secret-'.repeat(3),
  INTERNAL_SERVICE_TOKEN: 'test-internal-token-'.repeat(3),
  MONGODB_URI: 'mongodb://127.0.0.1:27017',
  USER_SERVICE_URL: 'http://127.0.0.1:3001',
  JOB_SERVICE_URL: 'http://127.0.0.1:3002',
  APPLICATION_SERVICE_URL: 'http://127.0.0.1:3003',
  RECOMMENDATION_SERVICE_URL: 'http://127.0.0.1:3004',
};
test('môi trường dùng mặc định đầy đủ và không sửa dữ liệu đầu vào', () => {
  const parsed = parseEnvironment(input);
  assert.equal(parsed.USER_PORT, 3001);
  assert.equal(parsed.GATEWAY_TIMEOUT_MS, 10000);
  assert.deepEqual(parsed.FRONTEND_ORIGIN, ['http://localhost:5173', 'http://127.0.0.1:5173']);
  assert.equal(input.USER_PORT, undefined);
});
test('từ chối URL/port/timeout/JWT/database sai trước khi chạy service', () => {
  for (const patch of [
    { USER_SERVICE_URL: 'http://127.0.0.1:3001/' },
    { FRONTEND_ORIGIN: 'http://localhost:5173/' },
    { GATEWAY_PORT: '3001' },
    { USER_PORT: 'not-a-port' },
    { HTTP_TIMEOUT_MS: 'NaN' },
    { GATEWAY_TIMEOUT_MS: '1' },
    { JWT_EXPIRES_IN: 'invalid-duration' },
    { JOB_DB: 'smartjob_users' },
    { MONGODB_URI: 'http://localhost:27017' },
  ])
    assert.throws(
      () => parseEnvironment({ ...input, ...patch }),
      /Cấu hình môi trường không hợp lệ/,
    );
});
test('thông báo cấu hình không làm lộ giá trị secret sai', () => {
  const secret = 'private-value';
  try {
    parseEnvironment({ ...input, JWT_SECRET: secret });
    assert.fail('Cần từ chối secret quá ngắn');
  } catch (error) {
    assert.match(error.message, /JWT_SECRET/);
    assert.equal(error.message.includes(secret), false);
  }
});
