import '@smartjob/shared/config';
export const settings = () => ({
  port: Number(process.env.USER_PORT || 3001),
  database: process.env.USER_DB || 'smartjob_users',
});
