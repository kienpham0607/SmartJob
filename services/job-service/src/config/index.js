import '@smartjob/shared/config';
export const settings = () => ({
  port: Number(process.env.JOB_PORT || 3002),
  database: process.env.JOB_DB || 'smartjob_jobs',
});
