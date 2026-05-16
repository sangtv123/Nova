import { router } from '@nova/router';

export function Header() {
  return (
    <header class="app-header">
      <div class="logo-container" onClick={() => router.navigate('/')}>
        <h1 class="logo">Nova</h1>
      </div>
      <nav class="nav-links">
        <a href="/" onClick={(e) => { e.preventDefault(); router.navigate('/'); }}>Home</a>
        <a href="/about" onClick={(e) => { e.preventDefault(); router.navigate('/about'); }}>About</a>
      </nav>
    </header>
  );
}
