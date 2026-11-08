import { z } from 'zod';
export { z };
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Mã tài nguyên không hợp lệ.');
export const text = (max) => z.string().trim().min(1, 'Không được bỏ trống.').max(max);
export const skills = z
  .array(text(60))
  .max(40)
  .transform((items) => [...new Set(items.map((s) => s.toLowerCase()))]);
export const pagination = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
export function validate(schema, key = 'body') {
  return (req, res, next) => {
    try {
      req.validated = schema.parse(req[key]);
      next();
    } catch (error) {
      next(error);
    }
  };
}
export function validateId(param = 'id') {
  return (req, res, next) => {
    try {
      objectId.parse(req.params[param]);
      next();
    } catch (error) {
      next(error);
    }
  };
}
export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
