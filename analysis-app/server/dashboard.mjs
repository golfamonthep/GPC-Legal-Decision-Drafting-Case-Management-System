// Counts belong exclusively to the local analysis store, never the registry.
export function dashboardSnapshot(db, now = () => new Date().toISOString()) {
  const totals = db.prepare(`SELECT
    (SELECT COUNT(*) FROM jobs) AS jobs_count,
    (SELECT COUNT(*) FROM documents WHERE json_extract(data, '$.reviewed') IS NOT 1) AS pending_documents,
    (SELECT COUNT(*) FROM revisions) AS saved_revisions,
    (SELECT MAX(updated_at) FROM jobs) AS last_job_update`).get();
  const recent_jobs = db.prepare('SELECT id,title,version,updated_at FROM jobs ORDER BY updated_at DESC,id LIMIT 6').all();
  return {state: totals.jobs_count ? 'ready' : 'empty', ...totals, recent_jobs, fetched_at: now()};
}
