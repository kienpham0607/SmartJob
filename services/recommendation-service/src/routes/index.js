import { Router } from 'express';
import { authenticate, authorize } from '@smartjob/shared/auth';
import { validate, pagination } from '@smartjob/shared/validation';
import { mine } from '../controllers/recommendationController.js';
export const routes = Router();
routes.get(
  '/api/recommendations/me',
  authenticate,
  authorize('CANDIDATE'),
  validate(pagination, 'query'),
  mine,
);
