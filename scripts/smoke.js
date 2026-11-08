import { config, required } from '@smartjob/shared/config';

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}
async function json(url, { token, body, method = 'GET', expected = 200 } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  ensure(
    response.status === expected,
    `${method} ${new URL(url).pathname}: HTTP ${response.status}; ${data.error?.message || 'sai mã phản hồi'}`,
  );
  return data.data;
}

try {
  const settings = config();
  const gateway = process.env.VITE_API_URL || 'http://localhost:3000/api';
  for (const [name, url] of Object.entries(settings.urls)) {
    const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(5000) });
    ensure(response.ok, `${name} chưa healthy (HTTP ${response.status}).`);
    console.log(`OK health ${name}`);
  }
  const frontend = await fetch(settings.origin[0], { signal: AbortSignal.timeout(5000) });
  ensure(
    frontend.ok && (await frontend.text()).includes('id="root"'),
    'Frontend chưa phục vụ ứng dụng React.',
  );
  console.log('OK frontend phản hồi HTML React');

  const password = required('DEMO_PASSWORD', 8);
  const candidate = await json(`${gateway}/auth/login`, {
    method: 'POST',
    body: { email: required('DEMO_CANDIDATE_EMAIL'), password },
  });
  const recruiter = await json(`${gateway}/auth/login`, {
    method: 'POST',
    body: { email: required('DEMO_RECRUITER_EMAIL'), password },
  });
  ensure(
    candidate.user.role === 'CANDIDATE' && recruiter.user.role === 'RECRUITER',
    'Vai trò hai tài khoản demo không đúng.',
  );
  console.log('OK đăng nhập candidate / recruiter qua Gateway');

  const profile = await json(`${gateway}/users/me`, { token: candidate.token });
  ensure(!('passwordHash' in profile), 'API hồ sơ không được trả passwordHash.');
  const jobs = await json(`${gateway}/jobs?q=Frontend&limit=5`);
  ensure(Array.isArray(jobs.items), 'API tìm kiếm không trả danh sách hợp lệ.');
  console.log(`OK tìm kiếm thật: ${jobs.total} tin khớp Frontend`);
  const recommendations = await json(`${gateway}/recommendations/me?limit=5`, {
    token: candidate.token,
  });
  ensure(
    recommendations.items.every(
      (job, i, items) =>
        job.score >= 0 &&
        job.score <= 100 &&
        Array.isArray(job.reasons) &&
        (!i || items[i - 1].score >= job.score),
    ),
    'Điểm/thứ tự/lý do recommendation không đúng contract.',
  );
  console.log(`OK gợi ý qua HTTP User + Job: ${recommendations.total} công việc`);
  const applications = await json(`${gateway}/applications/me`, { token: candidate.token });
  ensure(Array.isArray(applications.items), 'API lịch sử ứng tuyển sai contract.');
  const mine = await json(`${gateway}/jobs/my-jobs?limit=1`, { token: recruiter.token });
  ensure(
    mine.items.every((job) => job.recruiterId === recruiter.user._id),
    'Danh sách recruiter chứa tin của người khác.',
  );
  if (mine.items.length)
    await json(`${gateway}/applications/job/${mine.items[0]._id}`, { token: recruiter.token });
  console.log('OK lịch sử ứng tuyển / quyền xem ứng viên qua HTTP Job');

  const internal = await fetch(`${new URL(gateway).origin}/internal/jobs`, {
    signal: AbortSignal.timeout(5000),
  });
  ensure(internal.status === 404, 'Gateway không được public /internal.');
  const cors = await fetch(`${gateway}/jobs?limit=1`, {
    headers: { origin: settings.origin[0] },
    signal: AbortSignal.timeout(5000),
  });
  ensure(
    cors.headers.get('access-control-allow-origin') === settings.origin[0],
    'CORS chưa cho phép origin frontend trong .env.',
  );
  console.log('OK Gateway chặn internal và CORS cho frontend');
  console.log(
    'PASS smoke: không tạo/sửa/xóa dữ liệu. CRUD và ứng tuyển được kiểm tra riêng trên database test bằng npm test / test:ui.',
  );
} catch (error) {
  console.error(`FAIL smoke: ${error.message}`);
  console.error(
    'Chạy npm.cmd run check:env, check:db, seed và giữ npm.cmd run dev đang chạy. Tài khoản demo có sẵn giữ nguyên mật khẩu.',
  );
  process.exitCode = 1;
}
