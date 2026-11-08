import '@smartjob/shared/config';
export const settings = () => ({
  port: Number(process.env.APPLICATION_PORT || 3003),
  database: process.env.APPLICATION_DB || 'smartjob_applications',
});
