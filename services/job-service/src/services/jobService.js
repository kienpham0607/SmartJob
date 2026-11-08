import { Job } from '../models/Job.js';
import { ApiError } from '@smartjob/shared/errors';
import { escapeRegex } from '@smartjob/shared/validation';

export async function getJob(id) {
  const job = await Job.findById(id);
  if (!job) throw new ApiError(404, 'Không tìm thấy công việc.', 'JOB_NOT_FOUND');
  return job;
}
export async function ownedJob(id, recruiterId) {
  const job = await getJob(id);
  if (job.recruiterId !== recruiterId)
    throw new ApiError(403, 'Bạn không sở hữu tin tuyển dụng này.', 'NOT_JOB_OWNER');
  return job;
}
export async function listJobs(input, recruiterId) {
  const { page, limit, q, location, skill, salaryMin, salaryMax } = input;
  const filter = recruiterId ? { recruiterId } : { status: 'open' };
  if (q)
    filter.$or = ['title', 'companyName', 'description'].map((key) => ({
      [key]: new RegExp(escapeRegex(q), 'i'),
    }));
  if (location) filter.location = new RegExp(escapeRegex(location), 'i');
  if (skill) filter.requiredSkills = new RegExp(`^${escapeRegex(skill)}$`, 'i');
  // Salary filters select overlapping salary intervals, in VND per month.
  if (salaryMin !== undefined) filter.salaryMax = { $gte: salaryMin };
  if (salaryMax !== undefined) filter.salaryMin = { $lte: salaryMax };
  const [items, total] = await Promise.all([
    Job.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
export const createJob = (input, recruiterId) => Job.create({ ...input, recruiterId });
export async function updateJob(id, recruiterId, input) {
  const job = await ownedJob(id, recruiterId);
  Object.assign(job, input);
  return job.save();
}
export async function deleteJob(id, recruiterId) {
  const job = await ownedJob(id, recruiterId);
  await job.deleteOne();
}
export const openJobs = ({ page, limit }) => listJobs({ page, limit });
