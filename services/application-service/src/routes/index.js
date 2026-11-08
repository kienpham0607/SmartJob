import { Router } from 'express';
import { authenticate, authorize } from '@smartjob/shared/auth';
import { validate, validateId, pagination } from '@smartjob/shared/validation';
import { applicationSchema, statusSchema } from '../middlewares/validation.js';
import * as c from '../controllers/applicationController.js';
export const routes = Router();
routes.use('/api/applications', authenticate);
routes.post('/api/applications', authorize('CANDIDATE'), validate(applicationSchema), c.apply);
routes.get('/api/applications/me', authorize('CANDIDATE'), validate(pagination, 'query'), c.mine);
routes.get(
  '/api/applications/job/:jobId',
  authorize('RECRUITER'),
  validateId('jobId'),
  validate(pagination, 'query'),
  c.forJob,
);
routes.patch(
  '/api/applications/:id/status',
  authorize('RECRUITER'),
  validateId(),
  validate(statusSchema),
  c.status,
);
