export function normalize(value) {
  return typeof value === 'string'
    ? value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
    : '';
}
const tokens = (value) =>
  new Set(
    normalize(value)
      .split(/[^a-z0-9+#.]+/)
      .filter(Boolean),
  );
const nonNegative = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;

export function scoreJob(candidate = {}, job = {}) {
  candidate ??= {};
  job ??= {};
  const owned = new Set(
    (Array.isArray(candidate.skills) ? candidate.skills : []).map(normalize).filter(Boolean),
  );
  const required = [
    ...new Set(
      (Array.isArray(job.requiredSkills) ? job.requiredSkills : []).map(normalize).filter(Boolean),
    ),
  ];
  const matched = required.filter((skill) => owned.has(skill));
  // Missing evidence earns zero; a job that explicitly needs 0 years earns full experience points.
  const skills = required.length ? matched.length / required.length : 0;
  const desired = tokens(candidate.desiredPosition);
  const title = tokens(job.title);
  const position = desired.size
    ? [...desired].filter((word) => title.has(word)).length / desired.size
    : 0;
  const experience =
    nonNegative(candidate.experienceYears) && nonNegative(job.experienceMin)
      ? job.experienceMin === 0
        ? 1
        : Math.min(candidate.experienceYears / job.experienceMin, 1)
      : 0;
  const userLocation = normalize(candidate.location);
  const jobLocation = normalize(job.location);
  const location = userLocation && jobLocation && userLocation === jobLocation ? 1 : 0;
  const breakdown = {
    skills: Math.round(skills * 40),
    position: Math.round(position * 25),
    experience: Math.round(experience * 20),
    location: location * 15,
  };
  const score = Math.max(
    0,
    Math.min(100, Math.round(skills * 40 + position * 25 + experience * 20 + location * 15)),
  );
  const reasons = [];
  if (matched.length)
    reasons.push(
      `Trùng ${matched.length}/${required.length} kỹ năng yêu cầu: ${matched.join(', ')}.`,
    );
  if (position > 0)
    reasons.push(`Vị trí phù hợp ${Math.round(position * 100)}% với mong muốn của bạn.`);
  if (experience === 1) reasons.push('Kinh nghiệm đáp ứng yêu cầu tuyển dụng.');
  else if (experience > 0)
    reasons.push(`Kinh nghiệm đáp ứng ${Math.round(experience * 100)}% yêu cầu.`);
  if (location) reasons.push('Cùng địa điểm làm việc mong muốn.');
  if (!reasons.length)
    reasons.push('Chưa có đủ thông tin phù hợp. Hãy bổ sung hồ sơ để nhận gợi ý tốt hơn.');
  return { ...job, score, breakdown, matchedSkills: matched, reasons };
}
