// @ts-ignore
import { navItems, activeKey, isDark, navigate, toggleTheme, sidebarOpen } from '../nova-ui/store.ts';

export function NovaUIShell({ children }: { children: any }) {
  return (
    <div class="nova-ui-app" data-theme={() => isDark.value ? 'dark' : 'light'}>
      {/* Mobile overlay */}
      {() => sidebarOpen.value && (
        <div
          style="position:fixed;inset:0;z-index:99;background:rgba(0,0,0,0.4)"
          onClick={() => { sidebarOpen.value = false; }}
        />
      )}

      {/* Sidebar */}
      <aside class={() => `nova-ui-sidebar${sidebarOpen.value ? ' nova-ui-sidebar--open' : ''}`}>
        <div class="nova-ui-sidebar-logo">
          <h1>Nova UI</h1>
          <span>v1.0</span>
        </div>

        <div class="nova-ui-sidebar-search">
          <div class="n-input-wrapper" style="background:var(--n-bg-hover);border-color:transparent">
            <span class="n-input-prefix">🔍</span>
            <input class="n-input" placeholder="Search components..." style="height:32px" />
          </div>
        </div>

        <nav class="nova-ui-sidebar-nav">
          {navItems.map((section: any) => (
            <div class="nova-ui-sidebar-section">
              <div class="nova-ui-sidebar-section-title">{section.section}</div>
              {section.items.map((item: any) => (
                <div
                  class={() => `nova-ui-sidebar-item${activeKey.value === item.key ? ' nova-ui-sidebar-item--active' : ''}`}
                  onClick={() => navigate(item.key)}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {(item as any).badge && <span class="badge">{(item as any).badge}</span>}
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div class="nova-ui-sidebar-footer">
          <span>© 2026 Nova UI</span>
          <button class="n-btn n-btn--text" onClick={toggleTheme}>
            {() => isDark.value ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div class="nova-ui-main">
        <header class="nova-ui-topbar">
          <button
            class="n-btn n-btn--text"
            style="display:none;@media(max-width:768px){display:flex}"
            onClick={() => { sidebarOpen.value = !sidebarOpen.value; }}
          >☰</button>
          <div class="nova-ui-topbar-breadcrumb">
            <nav class="n-breadcrumb">
              <span class="n-breadcrumb-item"><a>Nova UI</a><span class="n-breadcrumb-separator">/</span></span>
              <span class="n-breadcrumb-item">{() => activeKey.value}</span>
            </nav>
          </div>
          <div class="nova-ui-topbar-actions">
            <button class="theme-toggle" onClick={toggleTheme}>{() => isDark.value ? '☀️' : '🌙'}</button>
            <a href="https://github.com" class="n-btn" style="display:inline-flex;align-items:center;gap:6px">
              ⭐ GitHub
            </a>
          </div>
        </header>

        <main style="flex:1;overflow-y:auto">
          {children}
        </main>
      </div>
    </div>
  );
}
