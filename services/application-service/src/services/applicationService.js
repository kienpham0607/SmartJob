import { Application } from '../models/Application.js';
import { fetchJob } from '../clients/jobClient.js';
import { fetchUser } from '../clients/userClient.js';
import { ApiError } from '@smartjob/shared/errors';

export async function apply(candidateId, input) {
  const [job, candidate] = await Promise.all([fetchJob(input.jobId), fetchUser(candidateId)]);
  if (job.status !== 'open') throw new ApiError(409, 'Công việc đã đóng tuyển dụng.', 'JOB_CLOSED');
  if (candidate.role !== 'CANDIDATE')
    throw new ApiError(403, 'Chỉ ứng viên được ứng tuyển.', 'FORBIDDEN');
  return Application.create({
    jobId: input.jobId,
    candidateId,
    coverLetter: input.coverLetter,
    jobSnapshot: { title: job.title, companyName: job.companyName, location: job.location },
    candidateSnapshot: {
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      skills: candidate.skills,
      experienceYears: candidate.experienceYears,
      desiredPosition: candidate.desiredPosition,
      location: candidate.location,
      bio: candidate.bio,
    },
  });
}
async function assertOwnership(jobId, recruiterId) {
  const job = await fetchJob(jobId);
  if (job.recruiterId !== recruiterId)
    throw new ApiError(403, 'Bạn không sở hữu tin tuyển dụng này.', 'NOT_JOB_OWNER');
  return job;
}
async function paged(filter, { page, limit }) {
  const [items, total] = await Promise.all([
    Application.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
export const myApplications = (candidateId, query) => paged({ candidateId }, query);
export async function jobApplications(jobId, recruiterId, query) {
  await assertOwnership(jobId, recruiterId);
  return paged({ jobId }, query);
}
export async function updateStatus(id, recruiterId, status) {
  const application = await Application.findById(id);
  if (!application)
    throw new ApiError(404, 'Không tìm thấy hồ sơ ứng tuyển.', 'APPLICATION_NOT_FOUND');
  await assertOwnership(application.jobId, recruiterId);
  application.status = status;
  return application.save();
}
