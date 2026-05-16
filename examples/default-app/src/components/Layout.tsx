import { Header } from './Header';

export function Layout({ children }: { children: any }) {
  return (
    <div class="app-layout">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>

      <Header />
      <main class="main-content">
        {children}
      </main>
      
      <footer class="footer">
        <p>Powered by Nova Framework 🚀</p>
      </footer>
    </div>
  );
}
