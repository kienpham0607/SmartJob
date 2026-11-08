import { z, objectId } from '@smartjob/shared/validation';
export const applicationSchema = z
  .object({ jobId: objectId, coverLetter: z.string().trim().max(5000).default('') })
  .strict();
export const statusSchema = z
  .object({ status: z.enum(['pending', 'reviewing', 'accepted', 'rejected']) })
  .strict();
