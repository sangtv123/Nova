import { signal } from '@nova/signals';

const kanbanColumns = [
  {
    id: 'todo', title: 'To Do', color: '#1677ff',
    cards: [
      { id: 't1', title: 'Design system tokens', desc: 'Define all CSS custom properties', tags: ['Design'], priority: 'High' },
      { id: 't2', title: 'Component playground', desc: 'Build interactive demo page', tags: ['Dev'], priority: 'Medium' },
    ]
  },
  {
    id: 'progress', title: 'In Progress', color: '#fa8c16',
    cards: [
      { id: 'p1', title: 'SCSS architecture', desc: 'Modular partials with mixins', tags: ['Dev', 'CSS'], priority: 'High' },
    ]
  },
  {
    id: 'review', title: 'Review', color: '#722ed1',
    cards: [
      { id: 'r1', title: 'Table component', desc: 'Sortable, filterable data table', tags: ['Dev'], priority: 'Low' },
    ]
  },
  {
    id: 'done', title: 'Done', color: '#52c41a',
    cards: [
      { id: 'd1', title: 'Button component', desc: 'All variants and sizes', tags: ['Done'], priority: 'Low' },
      { id: 'd2', title: 'Form validation', desc: 'Error states and messages', tags: ['Done'], priority: 'Medium' },
    ]
  },
];

const themeColors = [
  { label: 'Primary', key: '--n-primary',   value: '#1677ff' },
  { label: 'Success', key: '--n-success',   value: '#52c41a' },
  { label: 'Warning', key: '--n-warning',   value: '#faad14' },
  { label: 'Error',   key: '--n-error',     value: '#ff4d4f' },
];

const chartData = [
  { label: 'Jan', value: 65 },
  { label: 'Feb', value: 80 },
  { label: 'Mar', value: 45 },
  { label: 'Apr', value: 92 },
  { label: 'May', value: 73 },
  { label: 'Jun', value: 88 },
  { label: 'Jul', value: 60 },
];

export function AdvancedPage() {
  const cmdOpen = signal(false);
  const cmdQuery = signal('');
  const selectedCmd = signal(0);

  const cmds = [
    { icon: '🔲', label: 'Button', group: 'Components' },
    { icon: '📊', label: 'Table',  group: 'Components' },
    { icon: '🃏', label: 'Card',   group: 'Components' },
    { icon: '🌙', label: 'Toggle Dark Mode', group: 'Actions', shortcut: 'D' },
    { icon: '🔍', label: 'Search Components', group: 'Actions', shortcut: 'F' },
    { icon: '📋', label: 'Copy Component Code', group: 'Actions' },
  ];

  const colors = themeColors.map(c => ({ ...c, current: signal(c.value) }));
  const maxVal = Math.max(...chartData.map(d => d.value));

  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Advanced</h1>
      <p class="nova-ui-page-desc">Command Palette, Kanban Board, Theme Builder, Charts, Dashboard Widgets, Data Grid.</p>

      {/* Command Palette */}
      <div class="nova-section">
        <h2 class="nova-section-title">Command Palette</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--center">
            <button class="n-btn n-btn--primary" onClick={() => { cmdOpen.value = true; }}>
              Open Command Palette <kbd style="margin-left:var(--n-xs);background:rgba(255,255,255,.2);border-radius:4px;padding:2px 6px;font-size:11px">⌘K</kbd>
            </button>
          </div>
        </div>
      </div>

      {() => cmdOpen.value && (
        <div class="n-modal-mask" onClick={(e: Event) => { if (e.target === e.currentTarget) cmdOpen.value = false; }}>
          <div class="n-command-palette" onClick={(e: Event) => e.stopPropagation()}>
            <div class="n-command-palette-search">
              <span class="icon">🔍</span>
              <input
                autofocus
                placeholder="Search commands..."
                value={() => cmdQuery.value}
                onInput={(e: Event) => { cmdQuery.value = (e.target as HTMLInputElement).value; }}
                onKeyDown={(e: KeyboardEvent) => {
                  if (e.key === 'Escape') cmdOpen.value = false;
                  if (e.key === 'ArrowDown') selectedCmd.value = Math.min(cmds.length - 1, selectedCmd.value + 1);
                  if (e.key === 'ArrowUp') selectedCmd.value = Math.max(0, selectedCmd.value - 1);
                }}
              />
              <kbd>ESC</kbd>
            </div>
            <div class="n-command-palette-results">
              <div class="n-command-palette-group-heading">Components</div>
              {cmds.filter(c => c.group === 'Components').map((c, i) => {
                const idx = i;
                return (
                  <div class={() => `n-command-palette-item${selectedCmd.value === idx ? ' n-command-palette-item--selected' : ''}`}>
                    <span class="n-command-palette-item-icon">{c.icon}</span>
                    <span class="n-command-palette-item-label">{c.label}</span>
                  </div>
                );
              })}
              <div class="n-command-palette-group-heading">Actions</div>
              {cmds.filter(c => c.group === 'Actions').map(c => (
                <div class="n-command-palette-item">
                  <span class="n-command-palette-item-icon">{c.icon}</span>
                  <span class="n-command-palette-item-label">{c.label}</span>
                  {c.shortcut && <span class="n-command-palette-item-shortcut"><kbd>{c.shortcut}</kbd></span>}
                </div>
              ))}
            </div>
            <div class="n-command-palette-footer">
              <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
              <span><kbd>↵</kbd> Select</span>
              <span><kbd>ESC</kbd> Close</span>
            </div>
          </div>
        </div>
      )}

      {/* Theme Builder */}
      <div class="nova-section">
        <h2 class="nova-section-title">Theme Builder</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="padding:0;width:100%">
            <div class="n-theme-builder" style="width:100%">
              <div class="n-theme-builder-header">
                <h3>🎨 Theme Customizer</h3>
                <button class="n-btn n-btn--sm">Reset to Default</button>
              </div>
              <div class="n-theme-builder-body">
                <div class="n-theme-builder-panel">
                  <div class="n-theme-builder-section-title">Color Tokens</div>
                  {colors.map(c => (
                    <div class="n-theme-builder-row">
                      <span class="n-theme-builder-label">{c.label}</span>
                      <div style="display:flex;align-items:center;gap:8px">
                        <input
                          type="color"
                          class="n-theme-builder-color-input"
                          value={() => c.current.value}
                          onInput={(e: Event) => {
                            c.current.value = (e.target as HTMLInputElement).value;
                            document.documentElement.style.setProperty(c.key, c.current.value);
                          }}
                        />
                        <span style="font-size:var(--n-fs-xs);font-family:var(--n-font-mono);color:var(--n-text-3)">{() => c.current.value}</span>
                      </div>
                    </div>
                  ))}
                  <div class="n-theme-builder-section-title" style="margin-top:var(--n-lg)">Border Radius</div>
                  {[['Sm','--n-border-r-sm'],['Md','--n-border-r'],['Lg','--n-border-r-lg']].map(([l,k]) => (
                    <div class="n-theme-builder-row">
                      <span class="n-theme-builder-label">{l}</span>
                      <input type="range" min="0" max="20" value="6" style="width:80px"
                        onInput={(e: Event) => {
                          document.documentElement.style.setProperty(k, `${(e.target as HTMLInputElement).value}px`);
                        }} />
                    </div>
                  ))}
                </div>
                <div class="n-theme-builder-preview">
                  <div style="display:flex;gap:var(--n-sm);flex-wrap:wrap;margin-bottom:var(--n-lg)">
                    <button class="n-btn n-btn--primary">Primary</button>
                    <button class="n-btn">Default</button>
                    <button class="n-btn n-btn--danger">Danger</button>
                    <span class="n-tag n-tag--primary">Tag</span>
                    <span class="n-badge-standalone">5</span>
                  </div>
                  <div class="n-alert n-alert--success" style="margin-bottom:var(--n-md)">
                    <span class="n-alert-icon">✅</span>
                    <div class="n-alert-content"><span class="n-alert-message">Theme applied live!</span></div>
                  </div>
                  <div class="n-input-wrapper" style="width:100%">
                    <span class="n-input-prefix">🎨</span>
                    <input class="n-input" placeholder="Input preview..." />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div class="nova-section">
        <h2 class="nova-section-title">Charts</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%">
            <div style="width:100%">
              <div style="font-weight:600;margin-bottom:var(--n-md);color:var(--n-text-1)">Monthly Performance</div>
              {/* Bar Chart */}
              <div style="display:flex;align-items:flex-end;gap:var(--n-sm);height:160px;padding-bottom:var(--n-xl);position:relative">
                {chartData.map(d => {
                  const val = d.value;
                  const lbl = d.label;
                  return (
                    <div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:4px">
                      <span style={`font-size:10px;color:var(--n-text-3)`}>{val}</span>
                      <div style={`flex:1;width:100%;background:var(--n-primary);border-radius:var(--n-border-r-xs) var(--n-border-r-xs) 0 0;height:${(val/maxVal)*120}px;max-height:120px;min-height:4px;transition:all .3s;position:relative`}
                        onMouseEnter={(e: MouseEvent) => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.2)'; }}
                        onMouseLeave={(e: MouseEvent) => { (e.currentTarget as HTMLElement).style.filter = ''; }}>
                      </div>
                      <span style="font-size:11px;color:var(--n-text-3)">{lbl}</span>
                    </div>
                  );
                })}
              </div>
              {/* Mini sparkline */}
              <div style="margin-top:var(--n-lg);display:flex;gap:var(--n-lg)">
                {[['Users','12,847','↑ 12%','success'],['Revenue','$94,210','↑ 8%','success'],['Bounce','34.2%','↓ 3%','error'],['Sessions','48K','↑ 5%','success']].map(([l,v,t,s]) => (
                  <div class="n-statistic" style="flex:1">
                    <div class="n-statistic-title">{l}</div>
                    <div class="n-statistic-content"><span class="n-statistic-value" style="font-size:1.5rem">{v}</span></div>
                    <div class={`n-widget-trend n-widget-trend--${s === 'success' ? 'up' : 'down'}`}>{t}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div class="nova-section">
        <h2 class="nova-section-title">Kanban Board</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview" style="padding:var(--n-lg);width:100%;overflow-x:auto">
            <div class="n-kanban" style="min-width:max-content">
              {kanbanColumns.map(col => (
                <div class="n-kanban-column">
                  <div class="n-kanban-column-header">
                    <span style={`color:${col.color};font-weight:700`}>{col.title}</span>
                    <span class="n-kanban-column-count">{col.cards.length}</span>
                  </div>
                  {col.cards.map(card => (
                    <div class="n-kanban-card">
                      <div class="n-kanban-card-title">{card.title}</div>
                      <div class="n-kanban-card-desc">{card.desc}</div>
                      <div class="n-kanban-card-meta">
                        <div style="display:flex;gap:4px">
                          {card.tags.map(t => <span class="n-tag" style="font-size:10px;padding:1px 6px">{t}</span>)}
                        </div>
                        <span class={`n-tag n-tag--${card.priority === 'High' ? 'error' : card.priority === 'Medium' ? 'warning' : 'success'}`} style="font-size:10px">
                          {card.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div class="n-kanban-column-footer">
                    <button>+ Add Card</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <div class="nova-section">
        <h2 class="nova-section-title">Dashboard Widgets</h2>
        <div class="n-dashboard-grid n-dashboard-grid--4">
          {[
            { title:'Total Users',    value:'12,847', trend:'↑ 12%', dir:'up',   icon:'👥' },
            { title:'Revenue',        value:'$94.2K', trend:'↑ 8%',  dir:'up',   icon:'💰' },
            { title:'Bounce Rate',    value:'34.2%',  trend:'↓ 3%',  dir:'down', icon:'📉' },
            { title:'Active Sessions',value:'2,341',  trend:'↑ 5%',  dir:'up',   icon:'🌐' },
          ].map(w => (
            <div class="n-widget">
              <div class="n-widget-header">
                <span class="n-widget-title">{w.title}</span>
                <span style="font-size:24px">{w.icon}</span>
              </div>
              <div class="n-widget-value">{w.value}</div>
              <div class={`n-widget-trend n-widget-trend--${w.dir}`}>{w.trend} vs last month</div>
              <div class="n-widget-mini-bars">
                {[40,65,45,80,55,90,70].map((h, i) => (
                  <span style={`height:${h}%;background:${w.dir === 'up' ? 'var(--n-primary)' : 'var(--n-error)'};opacity:${0.3 + i * 0.1}`}></span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
