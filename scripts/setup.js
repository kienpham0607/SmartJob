import { readFile, writeFile, access } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
const target = new URL('../.env', import.meta.url);
try {
  await access(target);
  console.log('.env đã tồn tại, giữ nguyên cấu hình.');
} catch {
  let env = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
  env = env
    .replace(/^JWT_SECRET=$/m, `JWT_SECRET=${randomBytes(48).toString('hex')}`)
    .replace(
      /^INTERNAL_SERVICE_TOKEN=$/m,
      `INTERNAL_SERVICE_TOKEN=${randomBytes(48).toString('hex')}`,
    )
    .replace(/^DEMO_PASSWORD=$/m, `DEMO_PASSWORD=${randomBytes(12).toString('base64url')}!`);
  await writeFile(target, env, { flag: 'wx' });
  console.log(
    'Đã tạo .env với khóa ngẫu nhiên. Xem DEMO_PASSWORD trong .env để đăng nhập sau khi seed.',
  );
}
