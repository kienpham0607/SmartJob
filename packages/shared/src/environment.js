import { z } from 'zod';

const httpOrigin = z.string().refine((value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && value === url.origin;
  } catch {
    return false;
  }
}, 'Cần origin http(s) đầy đủ, không có path hoặc dấu / ở cuối.');
const integer = (fallback, max) => z.coerce.number().int().min(1).max(max).default(fallback);
const database = (name) =>
  z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,63}$/, 'Tên database chỉ dùng chữ, số, _ hoặc -, tối đa 63 ký tự.')
    .default(name);

const schema = z
  .object({
    JWT_SECRET: z
      .string()
      .min(32, 'Cần ít nhất 32 ký tự; chạy npm.cmd run setup nếu chưa có .env.'),
    INTERNAL_SERVICE_TOKEN: z.string().min(32, 'Cần ít nhất 32 ký tự.'),
    JWT_EXPIRES_IN: z
      .string()
      .regex(/^[1-9]\d*(ms|s|m|h|d|w|y)$/, 'Dùng thời hạn dương có đơn vị, ví dụ 30m hoặc 8h.')
      .default('8h'),
    MONGODB_URI: z
      .string()
      .regex(/^mongodb(?:\+srv)?:\/\/\S+$/, 'Cần URI mongodb:// hoặc mongodb+srv:// hợp lệ.'),
    FRONTEND_ORIGIN: z
      .string()
      .default('http://localhost:5173,http://127.0.0.1:5173')
      .transform((value) => [...new Set(value.split(',').map((origin) => origin.trim()))])
      .pipe(z.array(httpOrigin).min(1)),
    USER_SERVICE_URL: httpOrigin,
    JOB_SERVICE_URL: httpOrigin,
    APPLICATION_SERVICE_URL: httpOrigin,
    RECOMMENDATION_SERVICE_URL: httpOrigin,
    GATEWAY_PORT: integer(3000, 65535),
    USER_PORT: integer(3001, 65535),
    JOB_PORT: integer(3002, 65535),
    APPLICATION_PORT: integer(3003, 65535),
    RECOMMENDATION_PORT: integer(3004, 65535),
    HTTP_TIMEOUT_MS: integer(5000, 300000),
    GATEWAY_TIMEOUT_MS: integer(10000, 600000),
    USER_DB: database('smartjob_users'),
    JOB_DB: database('smartjob_jobs'),
    APPLICATION_DB: database('smartjob_applications'),
  })
  .superRefine((env, ctx) => {
    const ports = [
      'GATEWAY_PORT',
      'USER_PORT',
      'JOB_PORT',
      'APPLICATION_PORT',
      'RECOMMENDATION_PORT',
    ];
    if (new Set(ports.map((key) => env[key])).size !== ports.length)
      ctx.addIssue({
        code: 'custom',
        path: ['GATEWAY_PORT'],
        message: 'Các port backend cần khác nhau khi chạy stack local.',
      });
    if (new Set([env.USER_DB, env.JOB_DB, env.APPLICATION_DB]).size !== 3)
      ctx.addIssue({
        code: 'custom',
        path: ['USER_DB'],
        message: 'Ba service cần ba database logic khác nhau.',
      });
    if (env.GATEWAY_TIMEOUT_MS <= env.HTTP_TIMEOUT_MS)
      ctx.addIssue({
        code: 'custom',
        path: ['GATEWAY_TIMEOUT_MS'],
        message:
          'Timeout gateway cần lớn hơn HTTP_TIMEOUT_MS để service có thời gian trả lỗi phụ thuộc.',
      });
  });

export function parseEnvironment(env) {
  const result = schema.safeParse(env);
  if (!result.success) {
    // Report field names and validation messages, never environment values or secrets.
    throw new Error(
      `Cấu hình môi trường không hợp lệ:\n${result.error.issues.map((issue) => `- ${issue.path.join('.')}: ${issue.message}`).join('\n')}`,
    );
  }
  return result.data;
}
