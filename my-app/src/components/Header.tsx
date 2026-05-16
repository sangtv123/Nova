export function Header() {
  return (
    <header class="app-header">
      <div class="logo-container" n-router="/">
        <h1 class="logo">Nova</h1>
      </div>
      <nav class="nav-links">
        <a n-router="/">Home</a>
        <a n-router="/about">About</a>
        <a n-router="/admin">Admin</a>
      </nav>
    </header>
  );
}
