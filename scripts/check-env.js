import { readFile } from 'node:fs/promises';
import dotenv from 'dotenv';
import '@smartjob/shared/config';
import { parseEnvironment } from '@smartjob/shared/environment';

try {
  const env = parseEnvironment(process.env);
  const template = dotenv.parse(
    await readFile(new URL('../.env.example', import.meta.url), 'utf8'),
  );
  const absent = Object.keys(template).filter((key) => !(key in process.env));
  for (const key of absent) {
    if (key in env) console.log(`INFO ${key}: dùng mặc định từ cấu hình.`);
  }
  // Keep this default identical to frontend/src/lib/api.js.
  const frontendUrl = process.env.VITE_API_URL || 'http://localhost:3000/api';
  const parsed = new URL(frontendUrl);
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.pathname !== '/api' ||
    parsed.search ||
    parsed.hash ||
    parsed.username ||
    parsed.password
  )
    throw new Error(
      'VITE_API_URL cần URL http(s) của gateway và path /api, ví dụ http://localhost:3000/api.',
    );
  console.log('OK môi trường: secrets đủ độ dài, URL/origin/port/timeout/database hợp lệ.');
  console.log(`Frontend gọi Gateway: ${parsed.origin}/api`);
  console.log(
    'OK bí mật chỉ được kiểm tra, không in giá trị. MongoDB và API được kiểm tra bằng check:db / health / smoke.',
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
