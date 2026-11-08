import { z, text, skills, pagination } from '@smartjob/shared/validation';
export const jobSchema = z
  .object({
    title: text(150),
    description: text(15000),
    companyName: text(150),
    location: text(150),
    salaryMin: z.number().min(0).max(1e10),
    salaryMax: z.number().min(0).max(1e10),
    requiredSkills: skills,
    experienceMin: z.number().min(0).max(60),
    jobType: z.enum(['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT']),
    status: z.enum(['open', 'closed']).default('open'),
  })
  .strict()
  .refine((d) => d.salaryMax >= d.salaryMin, {
    path: ['salaryMax'],
    message: 'Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.',
  });
export const searchSchema = pagination
  .extend({
    q: z.string().trim().max(150).optional(),
    location: z.string().trim().max(150).optional(),
    skill: z.string().trim().max(60).optional(),
    salaryMin: z.coerce.number().min(0).max(1e10).optional(),
    salaryMax: z.coerce.number().min(0).max(1e10).optional(),
  })
  .refine(
    (input) =>
      input.salaryMin === undefined ||
      input.salaryMax === undefined ||
      input.salaryMax >= input.salaryMin,
    {
      path: ['salaryMax'],
      message: 'Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.',
    },
  );
