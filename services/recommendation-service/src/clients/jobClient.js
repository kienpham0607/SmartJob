import { internalGet } from '@smartjob/shared/http';
export async function fetchOpenJobs() {
  const items = [];
  let page = 1;
  // Walk all pages: recommendations must not silently consider just the first page.
  while (true) {
    const result = await internalGet('job', '/internal/jobs', { page, limit: 50 });
    items.push(...result.items);
    if (page >= result.totalPages) return items;
    page += 1;
  }
}
