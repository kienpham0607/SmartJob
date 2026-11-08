import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, internalAuth } from '@smartjob/shared/auth';
import { validate, validateId } from '@smartjob/shared/validation';
import { registerSchema, loginSchema, profileSchema } from '../middlewares/validation.js';
import * as controller from '../controllers/userController.js';
export const routes = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 80,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Quá nhiều lần thử. Vui lòng thử lại sau.' } },
});
routes.post('/api/auth/register', authLimiter, validate(registerSchema), controller.register);
routes.post('/api/auth/login', authLimiter, validate(loginSchema), controller.login);
routes.get('/api/users/me', authenticate, controller.me);
routes.put('/api/users/me', authenticate, validate(profileSchema), controller.update);
routes.get('/internal/users/:id', internalAuth, validateId(), controller.internalProfile);
