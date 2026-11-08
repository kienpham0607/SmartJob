import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import '@smartjob/shared/config';

const root = fileURLToPath(new URL('../', import.meta.url));
function run(entry, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [entry], {
      cwd: root,
      env: { ...process.env, ...extraEnv },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '',
      errors = '';
    child.stdout.on('data', (chunk) => {
      output += chunk;
    });
    child.stderr.on('data', (chunk) => {
      errors += chunk;
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code !== 0) return reject(new Error(errors || `Seed thất bại: ${entry}`));
      try {
        resolve(JSON.parse(output.trim()));
      } catch {
        reject(new Error('Seed trả dữ liệu không hợp lệ.'));
      }
    });
  });
}
try {
  // Each service seeds ONLY its own database; the root passes the recruiter's ID as a contract.
  const users = await run('services/user-service/src/seed.js');
  const jobs = await run('services/job-service/src/seed.js', {
    SEED_RECRUITER_ID: users.RECRUITER.id,
  });
  console.log(
    `Ứng viên: ${users.CANDIDATE.email} (${users.CANDIDATE.created ? 'mới tạo' : 'giữ nguyên'})`,
  );
  console.log(
    `Nhà tuyển dụng: ${users.RECRUITER.email} (${users.RECRUITER.created ? 'mới tạo' : 'giữ nguyên'})`,
  );
  console.log(
    `Tin tuyển dụng: ${jobs.created} mới tạo, ${jobs.existing} đã có. Không xóa hoặc ghi đè dữ liệu.`,
  );
  console.log(
    'Mật khẩu tài khoản mới: xem DEMO_PASSWORD trong .env. Tài khoản có sẵn giữ nguyên mật khẩu.',
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
