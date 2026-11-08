import { internalGet } from '@smartjob/shared/http';
export const fetchUser = (id) => internalGet('user', `/internal/users/${id}`);
