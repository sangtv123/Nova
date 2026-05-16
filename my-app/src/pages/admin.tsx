import { router } from '@nova/router';

export function AdminPage() {
  const match = router.getCurrentMatch();
  const config = match?.data?.config;

  // Guard against unresolved or missing config
  if (!config) {
    return (
      <div class="page admin-page">
        <h2>Admin Dashboard</h2>
        <p class="text-muted">Loading configuration…</p>
      </div>
    );
  }

  return (
    <div class="page admin-page">
      <h2>Admin Dashboard</h2>
      <p>Secure Area — Configuration Loaded:</p>
      <pre class="config-output">{JSON.stringify(config, null, 2)}</pre>
      <button class="btn secondary" onClick={() => router.navigate('/')}>
        Go Home
      </button>
    </div>
  );
}
