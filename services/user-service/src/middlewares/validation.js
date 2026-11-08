import { z, text, skills } from '@smartjob/shared/validation';
export const registerSchema = z
  .object({
    name: text(100),
    email: z.string().trim().email().max(254).toLowerCase(),
    password: z
      .string()
      .min(8, 'Mật khẩu cần ít nhất 8 ký tự.')
      .refine((s) => Buffer.byteLength(s, 'utf8') <= 72, 'Mật khẩu tối đa 72 byte.'),
    role: z.enum(['CANDIDATE', 'RECRUITER']).default('CANDIDATE'),
  })
  .strict();
export const loginSchema = registerSchema.pick({ email: true, password: true });
export const profileSchema = z
  .object({
    name: text(100).optional(),
    skills: skills.optional(),
    experienceYears: z.number().min(0).max(60).optional(),
    desiredPosition: z.string().trim().max(150).optional(),
    location: z.string().trim().max(150).optional(),
    companyName: z.string().trim().max(150).optional(),
    phone: z.string().trim().max(30).optional(),
    bio: z.string().trim().max(3000).optional(),
  })
  .strict();
