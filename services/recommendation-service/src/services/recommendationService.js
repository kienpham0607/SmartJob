import { fetchCandidate } from '../clients/userClient.js';
import { fetchOpenJobs } from '../clients/jobClient.js';
import { scoreJob } from './scoring.js';
import { ApiError } from '@smartjob/shared/errors';
export async function recommend(candidateId, { page, limit }) {
  const [candidate, jobs] = await Promise.all([fetchCandidate(candidateId), fetchOpenJobs()]);
  if (candidate.role !== 'CANDIDATE')
    throw new ApiError(403, 'Tính năng này dành cho ứng viên.', 'FORBIDDEN');
  const scored = jobs
    .map((job) => scoreJob(candidate, job))
    .sort((a, b) => b.score - a.score || String(a._id).localeCompare(String(b._id)));
  return {
    items: scored.slice((page - 1) * limit, page * limit),
    total: scored.length,
    page,
    limit,
    totalPages: Math.ceil(scored.length / limit),
    weights: { skills: 40, position: 25, experience: 20, location: 15 },
  };
}
