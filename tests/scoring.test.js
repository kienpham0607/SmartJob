import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreJob, normalize } from '../services/recommendation-service/src/services/scoring.js';
test('chuẩn hóa tiếng Việt, chữ hoa và khoảng trắng', () => {
  assert.equal(normalize('  ĐÀ   NẴNG '), 'da nang');
  assert.equal(normalize(null), '');
});
test('đủ bốn yếu tố đạt 100 điểm', () => {
  const result = scoreJob(
    {
      skills: [' React ', 'NODE.JS'],
      desiredPosition: 'Frontend Developer',
      experienceYears: 2,
      location: 'Hà Nội',
    },
    {
      requiredSkills: ['react', 'node.js'],
      title: 'Senior Frontend Developer',
      experienceMin: 2,
      location: 'HA NOI',
    },
  );
  assert.equal(result.score, 100);
  assert.deepEqual(result.breakdown, { skills: 40, position: 25, experience: 20, location: 15 });
  assert.equal(result.reasons.length, 4);
});
test('khớp một phần và trọng số 40/25/20/15', () => {
  const result = scoreJob(
    {
      skills: ['react'],
      desiredPosition: 'Frontend Developer',
      experienceYears: 1,
      location: 'Huế',
    },
    {
      requiredSkills: ['react', 'node'],
      title: 'Frontend Engineer',
      experienceMin: 2,
      location: 'Hà Nội',
    },
  );
  assert.equal(result.score, 43);
});
test('dữ liệu thiếu, trùng và không hợp lệ không tạo NaN hoặc điểm ngoài 0–100', () => {
  assert.equal(scoreJob().score, 0);
  assert.equal(scoreJob(null, null).score, 0);
  assert.equal(scoreJob({ experienceYears: NaN }, { experienceMin: -2 }).score, 0);
  assert.equal(
    scoreJob(
      { skills: ['REACT', 'react'], experienceYears: 100 },
      { requiredSkills: ['react', 'React'], experienceMin: 0 },
    ).score,
    60,
  );
  for (let years = 0; years < 100; years++) {
    const { score } = scoreJob({ experienceYears: years }, { experienceMin: years / 2 });
    assert.ok(Number.isFinite(score) && score >= 0 && score <= 100);
  }
});
