import { internalGet } from '@smartjob/shared/http';
export const fetchJob = (id) => internalGet('job', `/internal/jobs/${id}`);
