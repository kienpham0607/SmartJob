import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'node:crypto';
import { config } from './config.js';
import { ApiError } from './errors.js';

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) return next(new ApiError(401, 'Vui lòng đăng nhập.', 'UNAUTHORIZED'));
  try {
    const payload = jwt.verify(token, config().jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'smartjob-users',
      audience: 'smartjob',
    });
    if (
      !/^[a-f\d]{24}$/i.test(payload.sub || '') ||
      !['CANDIDATE', 'RECRUITER'].includes(payload.role)
    )
      throw new Error('Invalid identity');
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new ApiError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.', 'UNAUTHORIZED'));
  }
}

export const authorize = (role) => (req, res, next) =>
  req.user?.role === role
    ? next()
    : next(new ApiError(403, 'Bạn không có quyền thực hiện thao tác này.', 'FORBIDDEN'));

export function internalAuth(req, res, next) {
  const actual = Buffer.from(req.headers['x-service-token'] || '');
  const expected = Buffer.from(config().internalToken);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return next(new ApiError(401, 'Xác thực dịch vụ thất bại.', 'SERVICE_UNAUTHORIZED'));
  next();
}

export function signToken(user) {
  return jwt.sign({ role: user.role }, config().jwtSecret, {
    subject: String(user._id),
    algorithm: 'HS256',
    expiresIn: config().jwtExpiresIn,
    issuer: 'smartjob-users',
    audience: 'smartjob',
  });
}
