import { internalGet } from '@smartjob/shared/http';
export const fetchCandidate = (id) => internalGet('user', `/internal/users/${id}`);
