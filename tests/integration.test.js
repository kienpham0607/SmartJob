import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { createServer as createHttpServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import '@smartjob/shared/config';

const root = fileURLToPath(new URL('../', import.meta.url));
const runId = `${Date.now()}_${randomBytes(4).toString('hex')}`;
const databases = ['users', 'jobs', 'applications'].map((name) => `smartjob_test_${runId}_${name}`);
const processes = new Map();
let env, base, candidate, recruiter, otherRecruiter, otherCandidate, job, application;
const jobInput = {
  title: 'Frontend Developer',
  companyName: 'SmartJob Labs',
  description: 'Phát triển sản phẩm React và Node.js.',
  location: 'Hà Nội',
  salaryMin: 15000000,
  salaryMax: 25000000,
  requiredSkills: ['React', 'Node.js'],
  experienceMin: 2,
  jobType: 'FULL_TIME',
  status: 'open',
};
const password = `Test-${randomBytes(16).toString('hex')}!`;

async function freePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
async function request(path, { method = 'GET', token, body } = {}, url = base) {
  const response = await fetch(`${url}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(10000),
  });
  const result = response.status === 204 ? null : await response.json();
  return { status: response.status, data: result?.data, error: result?.error };
}
async function launch(name, entry, port) {
  let logs = '';
  const child = spawn(process.execPath, [entry], {
    cwd: root,
    env,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => {
    logs += chunk;
  });
  child.stderr.on('data', (chunk) => {
    logs += chunk;
  });
  processes.set(name, child);
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`${name} stopped: ${logs}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`, {
        signal: AbortSignal.timeout(500),
      });
      if (response.ok) return;
    } catch {
      /* Startup may still be connecting to MongoDB. */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`${name} startup timeout: ${logs}`);
}
async function stop(name) {
  const child = processes.get(name);
  processes.delete(name);
  if (child && child.exitCode === null && child.signalCode === null)
    await new Promise((resolve) => {
      child.once('exit', resolve);
      child.kill();
    });
}
async function register(role, email) {
  const response = await request('/api/auth/register', {
    method: 'POST',
    body: { name: role, email, password, role },
  });
  assert.equal(response.status, 201, JSON.stringify(response));
  assert.ok(response.data.token);
  assert.equal(response.data.user.passwordHash, undefined);
  return response.data;
}

describe(
  'SOA: 5 tiến trình độc lập, MongoDB riêng, gọi HTTP thật qua gateway',
  { concurrency: false },
  () => {
    before(
      async () => {
        const ports = await Promise.all(Array.from({ length: 5 }, freePort));
        env = {
          ...process.env,
          NODE_ENV: 'test',
          JWT_SECRET: randomBytes(48).toString('hex'),
          INTERNAL_SERVICE_TOKEN: randomBytes(48).toString('hex'),
          HTTP_TIMEOUT_MS: '1000',
          GATEWAY_TIMEOUT_MS: '1500',
          FRONTEND_ORIGIN: 'http://localhost:5173,http://127.0.0.1:5173',
          MONGODB_URI:
            process.env.MONGODB_TEST_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017',
          USER_DB: databases[0],
          JOB_DB: databases[1],
          APPLICATION_DB: databases[2],
        };
        ['USER', 'JOB', 'APPLICATION', 'RECOMMENDATION'].forEach((name, i) => {
          env[`${name}_PORT`] = String(ports[i]);
          env[`${name}_SERVICE_URL`] = `http://127.0.0.1:${ports[i]}`;
        });
        env.GATEWAY_PORT = String(ports[4]);
        base = `http://127.0.0.1:${ports[4]}`;
        await launch('user', 'services/user-service/src/index.js', ports[0]);
        await launch('job', 'services/job-service/src/index.js', ports[1]);
        await launch('application', 'services/application-service/src/index.js', ports[2]);
        await launch('recommendation', 'services/recommendation-service/src/index.js', ports[3]);
        await launch('gateway', 'api-gateway/src/index.js', ports[4]);
      },
      { timeout: 30000 },
    );

    after(async () => {
      await Promise.all([...processes.keys()].map(stop));
      // Cleanup only the three randomly generated databases belonging to THIS test run.
      for (const name of databases) {
        assert.ok(name.startsWith(`smartjob_test_${runId}_`));
        const connection = await mongoose
          .createConnection(env.MONGODB_URI, { dbName: name, serverSelectionTimeoutMS: 5000 })
          .asPromise();
        try {
          await connection.dropDatabase();
        } finally {
          await connection.close();
        }
      }
    });

    test('đăng ký hai vai trò, unique email, đăng nhập đúng/sai, token có hạn', async () => {
      candidate = await register('CANDIDATE', 'candidate@test.local');
      recruiter = await register('RECRUITER', 'recruiter@test.local');
      otherRecruiter = await register('RECRUITER', 'other-recruiter@test.local');
      otherCandidate = await register('CANDIDATE', 'other-candidate@test.local');
      assert.equal(
        (
          await request('/api/auth/register', {
            method: 'POST',
            body: { name: 'Duplicate', email: 'CANDIDATE@test.local', password, role: 'CANDIDATE' },
          })
        ).status,
        409,
      );
      const login = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'candidate@test.local', password },
      });
      assert.equal(login.status, 200);
      assert.equal(login.data.user.passwordHash, undefined);
      const claims = JSON.parse(Buffer.from(login.data.token.split('.')[1], 'base64url'));
      assert.ok(claims.exp > claims.iat);
      assert.equal(
        (
          await request('/api/auth/login', {
            method: 'POST',
            body: { email: 'candidate@test.local', password: 'wrongpassword' },
          })
        ).status,
        401,
      );
      assert.equal(
        (
          await request('/api/auth/register', {
            method: 'POST',
            body: { name: '', email: 'wrong', password: '123', role: 'ADMIN' },
          })
        ).status,
        400,
      );
    });
    test('JWT và phân quyền được kiểm tra tại backend', async () => {
      assert.equal((await request('/api/users/me')).status, 401);
      assert.equal((await request('/api/users/me', { token: 'forged' })).status, 401);
      const expiredToken = jwt.sign({ role: 'CANDIDATE' }, env.JWT_SECRET, {
        subject: candidate.user._id,
        expiresIn: -10,
        issuer: 'smartjob-users',
        audience: 'smartjob',
      });
      assert.equal((await request('/api/users/me', { token: expiredToken })).status, 401);
      assert.equal(
        (await request('/api/jobs', { method: 'POST', token: candidate.token, body: jobInput }))
          .status,
        403,
      );
      assert.equal(
        (await request('/api/recommendations/me', { token: recruiter.token })).status,
        403,
      );
      assert.equal(
        (
          await request('/api/users/me', {
            method: 'PUT',
            token: candidate.token,
            body: { role: 'RECRUITER' },
          })
        ).status,
        400,
      );
    });
    test('cập nhật hồ sơ và CRUD công việc, tìm kiếm/lọc/phân trang', async () => {
      const profile = await request('/api/users/me', {
        method: 'PUT',
        token: candidate.token,
        body: {
          skills: ['React', 'Node.js'],
          experienceYears: 2,
          desiredPosition: 'Frontend Developer',
          location: 'Hà Nội',
        },
      });
      assert.equal(profile.status, 200);
      assert.equal(profile.data.passwordHash, undefined);
      const created = await request('/api/jobs', {
        method: 'POST',
        token: recruiter.token,
        body: jobInput,
      });
      assert.equal(created.status, 201, JSON.stringify(created));
      job = created.data;
      assert.equal(job.recruiterId, recruiter.user._id);
      const list = await request(
        '/api/jobs?q=Frontend&skill=react&location=H%C3%A0&salaryMin=20000000&page=1&limit=1',
      );
      assert.equal(list.status, 200);
      assert.equal(list.data.total, 1);
      assert.equal(list.data.items.length, 1);
      assert.equal((await request('/api/jobs/my-jobs', { token: recruiter.token })).data.total, 1);
      assert.equal((await request(`/api/jobs/${job._id}`)).data.title, jobInput.title);
      assert.equal(
        (
          await request(`/api/jobs/${job._id}`, {
            method: 'PUT',
            token: recruiter.token,
            body: { ...jobInput, description: 'Mô tả đã cập nhật' },
          })
        ).status,
        200,
      );
      assert.equal((await request('/api/jobs?page=-1')).status, 400);
      assert.equal((await request('/api/jobs/not-an-id')).status, 400);
      assert.equal(
        (
          await request('/api/jobs', {
            method: 'POST',
            token: recruiter.token,
            body: { ...jobInput, salaryMax: 1 },
          })
        ).status,
        400,
      );
    });
    test('từ chối khoảng lương tìm kiếm đảo ngược', async () => {
      const response = await request('/api/jobs?salaryMin=30000000&salaryMax=10000000');
      assert.equal(response.status, 400);
      assert.equal(response.error.code, 'VALIDATION_ERROR');
    });
    test('chỉ chủ tin được sửa, xóa; không tin recruiterId từ client', async () => {
      assert.equal(
        (
          await request(`/api/jobs/${job._id}`, {
            method: 'PUT',
            token: otherRecruiter.token,
            body: jobInput,
          })
        ).status,
        403,
      );
      assert.equal(
        (await request(`/api/jobs/${job._id}`, { method: 'DELETE', token: otherRecruiter.token }))
          .status,
        403,
      );
      assert.equal(
        (
          await request('/api/jobs', {
            method: 'POST',
            token: recruiter.token,
            body: { ...jobInput, recruiterId: otherRecruiter.user._id },
          })
        ).status,
        400,
      );
    });
    test('recommendation lấy profile/job bằng HTTP và trả 100%', async () => {
      const response = await request('/api/recommendations/me', { token: candidate.token });
      assert.equal(response.status, 200, JSON.stringify(response));
      assert.equal(response.data.items[0]._id, job._id);
      assert.equal(response.data.items[0].score, 100);
      assert.ok(response.data.items[0].reasons.length > 0);
    });
    test('recommendation lấy hết các trang nguồn trước khi xếp hạng', async () => {
      const ids = [];
      try {
        for (let i = 0; i < 51; i++) {
          const response = await request('/api/jobs', {
            method: 'POST',
            token: recruiter.token,
            body: {
              ...jobInput,
              title: `Data Engineer ${i}`,
              requiredSkills: ['python'],
              experienceMin: 10,
              location: 'Huế',
            },
          });
          assert.equal(response.status, 201);
          ids.push(response.data._id);
        }
        const recommended = await request('/api/recommendations/me?limit=1', {
          token: candidate.token,
        });
        assert.equal(recommended.status, 200);
        assert.equal(recommended.data.total, 52);
        assert.equal(recommended.data.items[0]._id, job._id);
        assert.equal(recommended.data.items[0].score, 100);
      } finally {
        for (const id of ids)
          await request(`/api/jobs/${id}`, { method: 'DELETE', token: recruiter.token });
      }
    });
    test('ứng tuyển: kiểm tra job, chặn giả danh và chặn trùng đồng thời', async () => {
      assert.equal(
        (
          await request('/api/applications', {
            method: 'POST',
            token: candidate.token,
            body: { jobId: job._id, candidateId: otherCandidate.user._id },
          })
        ).status,
        400,
      );
      const responses = await Promise.all(
        [1, 2].map(() =>
          request('/api/applications', {
            method: 'POST',
            token: candidate.token,
            body: { jobId: job._id, coverLetter: 'Tôi muốn ứng tuyển.' },
          }),
        ),
      );
      assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
      application = responses.find((r) => r.status === 201).data;
      assert.equal(application.candidateId, candidate.user._id);
      assert.equal(
        (await request('/api/applications/me', { token: candidate.token })).data.total,
        1,
      );
      assert.equal(
        (await request('/api/applications/me', { token: otherCandidate.token })).data.total,
        0,
      );
      assert.equal(
        (
          await request('/api/applications', {
            method: 'POST',
            token: candidate.token,
            body: { jobId: '000000000000000000000000' },
          })
        ).status,
        404,
      );
    });
    test('quyền xem ứng viên và cập nhật trạng thái thuộc chủ tin', async () => {
      assert.equal(
        (await request(`/api/applications/job/${job._id}`, { token: candidate.token })).status,
        403,
      );
      assert.equal(
        (await request(`/api/applications/job/${job._id}`, { token: otherRecruiter.token })).status,
        403,
      );
      const list = await request(`/api/applications/job/${job._id}`, { token: recruiter.token });
      assert.equal(list.data.items[0].candidateSnapshot.email, candidate.user.email);
      assert.equal(
        (
          await request(`/api/applications/${application._id}/status`, {
            method: 'PATCH',
            token: otherRecruiter.token,
            body: { status: 'accepted' },
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await request(`/api/applications/${application._id}/status`, {
            method: 'PATCH',
            token: recruiter.token,
            body: { status: 'reviewing' },
          })
        ).data.status,
        'reviewing',
      );
      assert.equal(
        (
          await request(`/api/applications/${application._id}/status`, {
            method: 'PATCH',
            token: recruiter.token,
            body: { status: 'invalid' },
          })
        ).status,
        400,
      );
    });
    test('đóng/mở/xóa tin và không ứng tuyển tin đã đóng', async () => {
      assert.equal(
        (
          await request(`/api/jobs/${job._id}`, {
            method: 'PUT',
            token: recruiter.token,
            body: { ...jobInput, status: 'closed' },
          })
        ).status,
        200,
      );
      assert.equal((await request('/api/jobs')).data.total, 0);
      assert.equal(
        (await request('/api/recommendations/me', { token: candidate.token })).data.total,
        0,
      );
      assert.equal(
        (
          await request('/api/applications', {
            method: 'POST',
            token: otherCandidate.token,
            body: { jobId: job._id },
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await request(`/api/jobs/${job._id}`, {
            method: 'PUT',
            token: recruiter.token,
            body: jobInput,
          })
        ).status,
        200,
      );
      const extra = await request('/api/jobs', {
        method: 'POST',
        token: recruiter.token,
        body: jobInput,
      });
      assert.equal(
        (await request(`/api/jobs/${extra.data._id}`, { method: 'DELETE', token: recruiter.token }))
          .status,
        204,
      );
      assert.equal((await request(`/api/jobs/${extra.data._id}`)).status, 404);
    });
    test('gateway không public /internal, service yêu cầu khóa nội bộ', async () => {
      assert.equal((await request(`/internal/users/${candidate.user._id}`)).status, 404);
      assert.equal((await request(`/api/users/internal/users/${candidate.user._id}`)).status, 404);
      assert.equal(
        (await request(`/internal/users/${candidate.user._id}`, {}, env.USER_SERVICE_URL)).status,
        401,
      );
      assert.equal((await request('/internal/jobs', {}, env.JOB_SERVICE_URL)).status, 401);
      const internalResponse = await fetch(
        `${env.USER_SERVICE_URL}/internal/users/${candidate.user._id}`,
        { headers: { 'x-service-token': env.INTERNAL_SERVICE_TOKEN } },
      );
      assert.equal(internalResponse.status, 200);
      assert.equal((await internalResponse.json()).data.passwordHash, undefined);
    });
    test('CORS theo allowlist, JSON lỗi và nội dung quá lớn có mã HTTP rõ ràng', async () => {
      const allowed = await fetch(`${base}/api/jobs`, {
        headers: { origin: 'http://localhost:5173' },
      });
      assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
      const blocked = await fetch(`${base}/api/jobs`, {
        headers: { origin: 'https://untrusted.example' },
      });
      assert.equal(blocked.headers.get('access-control-allow-origin'), null);
      const invalid = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{',
      });
      assert.equal(invalid.status, 400);
      assert.equal((await invalid.json()).error.code, 'INVALID_JSON');
      const large = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: 'a'.repeat(110000) }),
      });
      assert.equal(large.status, 413);
    });
    test('service phụ thuộc ngừng: trả 503 và máy chủ tiếp tục phản hồi', async () => {
      await stop('job');
      const result = await request('/api/recommendations/me', { token: candidate.token });
      assert.equal(result.status, 503);
      assert.equal(result.error.code, 'DEPENDENCY_UNAVAILABLE');
      assert.ok(result.error.message.includes('job'));
      assert.equal(
        (
          await request('/api/applications', {
            method: 'POST',
            token: otherCandidate.token,
            body: { jobId: job._id },
          })
        ).status,
        503,
      );
      assert.equal((await request('/api/jobs')).status, 503);
      assert.equal((await request('/health')).status, 200);
      // A real HTTP server that accepts requests but never replies exercises the timeout path.
      const unresponsive = createHttpServer(() => {});
      await new Promise((resolve) =>
        unresponsive.listen(Number(new URL(env.JOB_SERVICE_URL).port), '127.0.0.1', resolve),
      );
      try {
        assert.equal((await request('/api/jobs')).status, 504);
        const timedOut = await request('/api/recommendations/me', { token: candidate.token });
        assert.equal(timedOut.status, 503);
        assert.equal(timedOut.error.code, 'DEPENDENCY_UNAVAILABLE');
      } finally {
        unresponsive.closeAllConnections();
        await new Promise((resolve) => unresponsive.close(resolve));
      }
      await stop('user');
      assert.equal(
        (await request('/api/recommendations/me', { token: candidate.token })).status,
        503,
      );
    });
  },
);
