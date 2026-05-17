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
        <p class="build-info" style="font-size: 0.8rem; opacity: 0.6; margin-top: 0.5rem;">
          v__APP_VERSION__ | Built at: __BUILD_TIME__
        </p>
      </footer>
    </div>
  );
}
