import { Router } from 'express';
import { authenticate, authorize, internalAuth } from '@smartjob/shared/auth';
import { validate, validateId, pagination } from '@smartjob/shared/validation';
import { jobSchema, searchSchema } from '../middlewares/validation.js';
import * as c from '../controllers/jobController.js';
export const routes = Router();
const recruiter = [authenticate, authorize('RECRUITER')];
// Static routes must precede /:id.
routes.get('/api/jobs/my-jobs', ...recruiter, validate(searchSchema, 'query'), c.mine);
routes.get('/api/jobs', validate(searchSchema, 'query'), c.list);
routes.get('/api/jobs/:id', validateId(), c.get);
routes.post('/api/jobs', ...recruiter, validate(jobSchema), c.create);
routes.put('/api/jobs/:id', ...recruiter, validateId(), validate(jobSchema), c.update);
routes.delete('/api/jobs/:id', ...recruiter, validateId(), c.remove);
routes.get('/internal/jobs', internalAuth, validate(pagination, 'query'), c.internalList);
routes.get('/internal/jobs/:id', internalAuth, validateId(), c.get);
