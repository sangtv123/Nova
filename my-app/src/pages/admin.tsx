import { router } from '@nova/router';

export function AdminPage() {
  const match = router.getCurrentMatch();
  const config = match?.data?.config;

  return (
    <div class="page admin-page">
      <h2>Admin Dashboard</h2>
      <p>Secure Area - Configuration Loaded:</p>
      <pre>{JSON.stringify(config, null, 2)}</pre>
      <button class="btn secondary" onClick={() => router.navigate('/')}>Go Home</button>
    </div>
  );
}
