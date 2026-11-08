import '@smartjob/shared/config';
const targets = [
  ['Gateway', `http://127.0.0.1:${process.env.GATEWAY_PORT || 3000}`],
  ['User', process.env.USER_SERVICE_URL],
  ['Job', process.env.JOB_SERVICE_URL],
  ['Application', process.env.APPLICATION_SERVICE_URL],
  ['Recommendation', process.env.RECOMMENDATION_SERVICE_URL],
];
const results = await Promise.all(
  targets.map(async ([name, url]) => {
    try {
      const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(5000) });
      const body = await response.json();
      console.log(`${response.ok ? 'OK' : 'FAIL'} ${name} (${url}/health) — ${body.status}`);
      return response.ok;
    } catch (error) {
      console.error(
        `FAIL ${name} (${url}/health) — ${error.cause?.code || error.name}: ${error.message}`,
      );
      return false;
    }
  }),
);
if (results.some((ok) => !ok)) process.exitCode = 1;
