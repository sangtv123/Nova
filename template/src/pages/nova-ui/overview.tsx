export function OverviewPage() {
  const features = [
    { icon: '⚡', title: 'Signal-Driven', desc: 'Fine-grained reactivity — only what changes re-renders.' },
    { icon: '🎨', title: '50+ Components', desc: 'Every component you need, NG-ZORRO style architecture.' },
    { icon: '🌙', title: 'Dark Mode', desc: 'First-class dark mode with CSS custom properties.' },
    { icon: '📦', title: 'SCSS Architecture', desc: 'Modular partials with tokens, mixins, and components.' },
    { icon: '♿', title: 'Accessible', desc: 'WAI-ARIA compliant with keyboard navigation support.' },
    { icon: '🔧', title: 'Themeable', desc: 'Customize every token to match your brand.' },
  ];

  const stats = [
    { value: '50+', label: 'Components' },
    { value: '6',   label: 'Categories' },
    { value: '100%', label: 'TypeScript' },
    { value: '0',   label: 'Dependencies' },
  ];

  return (
    <div class="nova-ui-page">
      <div style="text-align:center;padding:var(--n-4xl) 0 var(--n-3xl)">
        <div style="font-size:80px;margin-bottom:var(--n-lg)">🌊</div>
        <h1 class="nova-ui-page-title">Nova UI</h1>
        <p class="nova-ui-page-desc">
          An enterprise-class UI component library built on Nova Framework,<br />
          inspired by NG-ZORRO with signals-based reactivity.
        </p>
        <div style="display:flex;justify-content:center;gap:var(--n-md);flex-wrap:wrap">
          <button class="n-btn n-btn--primary n-btn--lg">Get Started</button>
          <button class="n-btn n-btn--lg">View Components</button>
          <button class="n-btn n-btn--dashed n-btn--lg">GitHub ↗</button>
        </div>
      </div>

      {/* Stats */}
      <div class="n-dashboard-grid n-dashboard-grid--4" style="margin-bottom:var(--n-4xl)">
        {stats.map(s => (
          <div class="n-widget" style="text-align:center">
            <div class="n-statistic-value" style="font-size:2.5rem;color:var(--n-primary)">{s.value}</div>
            <div class="n-statistic-title">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Feature Grid */}
      <div class="nova-section">
        <h2 class="nova-section-title">Why Nova UI?</h2>
        <div class="n-dashboard-grid n-dashboard-grid--3">
          {features.map(f => (
            <div class="n-card">
              <div class="n-card-body">
                <div style="font-size:2rem;margin-bottom:var(--n-md)">{f.icon}</div>
                <h3 style="margin:0 0 var(--n-xs);font-size:var(--n-fs-lg)">{f.title}</h3>
                <p style="margin:0;color:var(--n-text-2)">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Start */}
      <div class="nova-section">
        <h2 class="nova-section-title">Quick Start</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-code">
            <pre><code>{`// Import Nova UI styles in index.html
<link rel="stylesheet" href="/src/nova-ui/index.scss">

// Use components in TSX
export function MyPage() {
  return (
    <div>
      <button class="n-btn n-btn--primary">Click Me</button>
      <div class="n-alert n-alert--success">
        <span class="n-alert-message">Nova UI is ready! 🎉</span>
      </div>
    </div>
  );
}`}</code></pre>
          </div>
        </div>
      </div>
    </div>
  );
}
