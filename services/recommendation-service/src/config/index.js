import '@smartjob/shared/config';
export const settings = () => ({ port: Number(process.env.RECOMMENDATION_PORT || 3004) });
