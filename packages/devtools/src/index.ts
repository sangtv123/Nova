import type { Signal } from '@nova/signals';

/**
 * DevTools Manager class
 * Handles UI creation, signal tracking, island inspection, and real-time updates.
 */
class NovaDevToolsManager {
  private container: HTMLDivElement | null = null;
  private panel: HTMLDivElement | null = null;
  private bubble: HTMLButtonElement | null = null;
  private activeTab: 'dashboard' | 'islands' | 'signals' = 'dashboard';
  private highlightOverlay: HTMLDivElement | null = null;
  private isOpened = false;

  // Cache to track signal metadata
  private signalsCache = new Map<string, { sig: Signal<any>; lastValue: any; type: 'signal' | 'computed' }>();

  constructor() {
    this.initHooks();
  }

  /**
   * Register global hooks so we can intercept signals as they are created or updated
   */
  private initHooks() {
    if (typeof window === 'undefined') return;

    // Define the global hooks that @nova/signals will call
    (window as any).__NOVA_DEVTOOLS_HOOK__ = {
      onSignalCreated: (sig: Signal<any>) => {
        this.trackSignal(sig);
        this.requestRender();
      },
      onSignalUpdated: (sig: Signal<any>, oldValue: any, newValue: any) => {
        this.trackSignal(sig);
        this.requestRender();
      }
    };

    // Periodically pull signals that might have been created before DevTools loaded
    this.scanExistingSignals();
  }

  /**
   * Scan window.__NOVA_SIGNALS__ for signals registered before devtools initialized
   */
  private scanExistingSignals() {
    if (typeof window === 'undefined') return;
    const globalSignals = (window as any).__NOVA_SIGNALS__;
    if (globalSignals instanceof Set) {
      for (const ref of globalSignals) {
        const sig = ref.deref();
        if (sig) {
          this.trackSignal(sig);
        }
      }
    }
  }

  /**
   * Cache signal reference and determine if it is a computed or standard signal
   */
  private trackSignal(sig: Signal<any>) {
    if (!sig || !sig.id) return;
    
    // Check if the signal is writeable. Computed signals throw an error when set.
    let type: 'signal' | 'computed' = 'signal';
    
    // Check if setter throws or if there is no setter property descriptor
    // In our signals package, computed throws on set: "Cannot set value of computed signal"
    // So we can inspect if it's computed by keying off the error behavior or name
    if (sig.id.startsWith('comp_')) {
      type = 'computed';
    }

    this.signalsCache.set(sig.id, {
      sig,
      lastValue: sig.peek(),
      type
    });
  }

  /**
   * Get all active signals from the cache, filtering out any that may have been garbage collected
   */
  private getActiveSignals() {
    this.scanExistingSignals(); // Refresh from global list
    return Array.from(this.signalsCache.values()).filter(entry => {
      // Basic check to see if the signal is still valid
      return entry.sig && typeof entry.sig.peek === 'function';
    });
  }

  /**
   * Trigger a redraw of the active devtools view
   */
  private requestRender() {
    if (this.isOpened && this.panel) {
      this.renderPanelContent();
    }
  }

  /**
   * Initialize and mount the DevTools floating panel in the DOM
   */
  public mount() {
    if (typeof window === 'undefined' || this.container) return;

    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'nova-devtools-container';
    
    // Inject styles
    const style = document.createElement('style');
    style.textContent = this.getCSSStyles();
    this.container.appendChild(style);

    // Create Highlight Overlay
    this.highlightOverlay = document.createElement('div');
    this.highlightOverlay.className = 'nova-island-highlighter';
    this.container.appendChild(this.highlightOverlay);

    // Create Floating Bubble
    this.bubble = document.createElement('button');
    this.bubble.className = 'nova-devtools-bubble';
    this.bubble.setAttribute('aria-label', 'Open Nova DevTools');
    this.bubble.innerHTML = `
      <svg viewBox="0 0 100 100" class="nova-logo-svg">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="8" />
        <path d="M50 20 L75 55 L45 55 L70 80 L30 45 L55 45 Z" fill="currentColor" />
      </svg>
      <span class="pulse-ring"></span>
    `;
    this.bubble.addEventListener('click', () => this.togglePanel());
    this.container.appendChild(this.bubble);

    // Create Side Panel (Initially closed)
    this.panel = document.createElement('div');
    this.panel.className = 'nova-devtools-panel';
    this.panel.innerHTML = `
      <div class="panel-header">
        <div class="header-logo">
          <svg viewBox="0 0 100 100" class="logo-icon">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="8" />
            <path d="M50 20 L75 55 L45 55 L70 80 L30 45 L55 45 Z" fill="currentColor" />
          </svg>
          <span>Nova DevTools</span>
          <span class="version-badge">v0.0.1</span>
        </div>
        <button class="close-btn">&times;</button>
      </div>
      <div class="panel-tabs">
        <button class="tab-btn active" data-tab="dashboard">Dashboard</button>
        <button class="tab-btn" data-tab="islands">Islands</button>
        <button class="tab-btn" data-tab="signals">Signals</button>
      </div>
      <div class="panel-body"></div>
    `;

    // Close button event
    this.panel.querySelector('.close-btn')?.addEventListener('click', () => this.togglePanel(false));

    // Tab buttons event
    const tabBtns = this.panel.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLButtonElement;
        tabBtns.forEach(b => b.classList.remove('active'));
        target.classList.add('active');
        this.activeTab = target.getAttribute('data-tab') as any;
        this.renderPanelContent();
      });
    });

    this.container.appendChild(this.panel);
    document.body.appendChild(this.container);

    // Initial render of panel
    this.renderPanelContent();
  }

  /**
   * Toggle between opened and closed states of the side panel
   */
  public togglePanel(forceState?: boolean) {
    this.isOpened = forceState !== undefined ? forceState : !this.isOpened;
    
    if (this.panel && this.bubble) {
      if (this.isOpened) {
        this.panel.classList.add('opened');
        this.bubble.classList.add('active');
        this.renderPanelContent();
      } else {
        this.panel.classList.remove('opened');
        this.bubble.classList.remove('active');
        this.removeHighlight();
      }
    }
  }

  /**
   * Render active tab's view content into the side panel
   */
  private renderPanelContent() {
    if (!this.panel) return;
    const body = this.panel.querySelector('.panel-body');
    if (!body) return;

    if (this.activeTab === 'dashboard') {
      this.renderDashboard(body);
    } else if (this.activeTab === 'islands') {
      this.renderIslands(body);
    } else if (this.activeTab === 'signals') {
      this.renderSignals(body);
    }
  }

  /**
   * Render Dashboard view
   */
  private renderDashboard(container: Element) {
    const signals = this.getActiveSignals();
    const sigCount = signals.filter(s => s.type === 'signal').length;
    const compCount = signals.filter(s => s.type === 'computed').length;
    
    const islands = Array.from(document.querySelectorAll('[data-nova-island]'));
    const hydratedCount = islands.filter(el => el.getAttribute('data-nova-hydrated') === 'true').length;
    const hydrationPercentage = islands.length > 0 ? Math.round((hydratedCount / islands.length) * 100) : 100;

    container.innerHTML = `
      <div class="dashboard-view">
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Active Signals</span>
            <span class="stat-value">${sigCount} <span class="sub-value">/ ${compCount} computed</span></span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Total Islands</span>
            <span class="stat-value">${islands.length}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Hydration Progress</span>
            <div class="progress-container">
              <span class="stat-value">${hydratedCount} <span class="sub-value">/ ${islands.length}</span></span>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${hydrationPercentage}%"></div>
              </div>
              <span class="percentage-label">${hydrationPercentage}% Hydrated</span>
            </div>
          </div>
        </div>

        <div class="info-section">
          <h3>⚡ Fine-Grained Core Status</h3>
          <div class="info-row">
            <span>DOM Reconciliation Engine</span>
            <span class="status-badge active">Direct DOM Patching</span>
          </div>
          <div class="info-row">
            <span>Scheduler Status</span>
            <span class="status-badge active">Microtask Batching</span>
          </div>
          <div class="info-row">
            <span>Reactivity overhead</span>
            <span class="status-badge ultra-low">&lt; 0.1ms latency</span>
          </div>
        </div>

        <div class="shortcuts-section">
          <h3>💡 Pro Tips</h3>
          <ul>
            <li>Islands can be hydrated on <strong>visible</strong>, <strong>idle</strong>, or <strong>eager</strong> schedules.</li>
            <li>Signals provide zero-overhead direct DOM bindings. Hover on Islands tab to locate them visually!</li>
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Render Islands view with hover-highlighting
   */
  private renderIslands(container: Element) {
    const islands = Array.from(document.querySelectorAll('[data-nova-island]'));
    
    if (islands.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No Islands found on this page.</p>
          <span>Use <code>&lt;Component data-nova-strategy="visible" /&gt;</code> to create interactive islands.</span>
        </div>
      `;
      return;
    }

    let html = `
      <div class="islands-view">
        <p class="view-desc">Select or hover on an Island to highlight it on your web page.</p>
        <div class="islands-list">
    `;

    islands.forEach((el, index) => {
      const name = el.getAttribute('data-nova-name') || 'Anonymous Island';
      const id = el.getAttribute('data-nova-island') || `island_${index}`;
      const strategy = el.getAttribute('data-nova-strategy') || 'visible';
      const isHydrated = el.getAttribute('data-nova-hydrated') === 'true';

      html += `
        <div class="island-item" data-index="${index}" data-island-id="${id}">
          <div class="island-item-header">
            <span class="island-name">${name}</span>
            <span class="island-badge ${isHydrated ? 'hydrated' : 'waiting'}">
              ${isHydrated ? 'Hydrated' : 'Waiting'}
            </span>
          </div>
          <div class="island-details">
            <span class="detail-label">Strategy:</span> <span class="detail-val">${strategy}</span>
            <span class="detail-label">ID:</span> <span class="detail-val font-mono">${id}</span>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach interaction events
    const items = container.querySelectorAll('.island-item');
    items.forEach(item => {
      const index = parseInt(item.getAttribute('data-index') || '0', 10);
      const element = islands[index];

      // Highlight on hover
      item.addEventListener('mouseenter', () => {
        this.highlightElement(element);
      });

      // Clear highlight on leave
      item.addEventListener('mouseleave', () => {
        this.removeHighlight();
      });

      // Scroll into view on click
      item.addEventListener('click', () => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.highlightElement(element);
        
        // Brief pulse effect on element
        element.classList.add('nova-highlight-pulse');
        setTimeout(() => element.classList.remove('nova-highlight-pulse'), 1500);
      });
    });
  }

  /**
   * Draw overlay over target DOM element to highlight it
   */
  private highlightElement(el: Element) {
    if (!this.highlightOverlay) return;
    
    const rect = el.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    const padding = 6;
    this.highlightOverlay.style.top = `${rect.top + scrollTop - padding}px`;
    this.highlightOverlay.style.left = `${rect.left + scrollLeft - padding}px`;
    this.highlightOverlay.style.width = `${rect.width + padding * 2}px`;
    this.highlightOverlay.style.height = `${rect.height + padding * 2}px`;
    
    const name = el.getAttribute('data-nova-name') || 'Island';
    this.highlightOverlay.setAttribute('data-label', `${name} (${Math.round(rect.width)}x${Math.round(rect.height)}px)`);
    this.highlightOverlay.classList.add('visible');
  }

  /**
   * Hide the DOM highlighter overlay
   */
  private removeHighlight() {
    if (this.highlightOverlay) {
      this.highlightOverlay.classList.remove('visible');
    }
  }

  /**
   * Render Signals and Computeds view with edit functionality
   */
  private renderSignals(container: Element) {
    const entries = this.getActiveSignals();

    if (entries.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No active Signals registered.</p>
          <span>Use <code>const count = signal(0, 'my-count')</code> to track state.</span>
        </div>
      `;
      return;
    }

    let html = `
      <div class="signals-view">
        <p class="view-desc">Inspect and edit signals value. Updates propagate directly to native DOM nodes.</p>
        <div class="signals-list">
    `;

    entries.forEach(entry => {
      const { sig, type } = entry;
      const value = sig.peek();
      const label = sig.label || 'Signal';
      const id = sig.id;
      const subsCount = sig.getSubscribers().size;

      // Format preview value safely
      let valStr = '';
      if (typeof value === 'object') {
        try {
          valStr = JSON.stringify(value);
        } catch {
          valStr = 'Object';
        }
      } else {
        valStr = String(value);
      }

      html += `
        <div class="signal-item ${type}" id="devtools-item-${id}">
          <div class="signal-item-main">
            <div class="signal-info">
              <span class="signal-label">${label}</span>
              <span class="signal-type-tag ${type}">${type}</span>
            </div>
            <div class="signal-actions">
              ${type === 'signal' ? `<button class="edit-btn" data-sig-id="${id}" title="Edit Signal Value">✎ Edit</button>` : ''}
              <span class="subscribers-count" title="Dependent Subscribers">${subsCount} deps</span>
            </div>
          </div>
          <div class="signal-value-box">
            <span class="detail-label">Value:</span>
            <span class="signal-val-display font-mono">${this.escapeHtml(valStr)}</span>
          </div>
          <div class="signal-meta">
            ID: <span class="font-mono">${id}</span>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach edit actions
    const editBtns = container.querySelectorAll('.edit-btn');
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-sig-id');
        if (id) this.promptEditSignal(id);
      });
    });
  }

  /**
   * Escape HTML string to prevent injection in devtools display
   */
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Open an inline prompt/dialog to edit the signal value safely
   */
  private promptEditSignal(sigId: string) {
    const entry = this.signalsCache.get(sigId);
    if (!entry || entry.type !== 'signal') return;

    const sig = entry.sig;
    const currentVal = sig.peek();
    
    // Create a beautiful prompt dialog overlay
    const modal = document.createElement('div');
    modal.className = 'nova-devtools-modal-overlay';
    modal.innerHTML = `
      <div class="nova-devtools-modal">
        <h3>Edit Signal Value</h3>
        <p class="modal-meta">Signal Label: <strong>${sig.label || 'Signal'}</strong> (${sig.id})</p>
        <div class="input-container">
          <label>New Value:</label>
          <input type="text" class="modal-input" value="${this.escapeHtml(String(currentVal))}" />
          <span class="input-hint">Values are parsed automatically (e.g. true, false, numbers, or standard text)</span>
        </div>
        <div class="modal-actions">
          <button class="modal-btn cancel">Cancel</button>
          <button class="modal-btn save">Apply Change</button>
        </div>
      </div>
    `;

    const input = modal.querySelector('.modal-input') as HTMLInputElement;
    modal.querySelector('.cancel')?.addEventListener('click', () => modal.remove());
    
    const applyValue = () => {
      const valText = input.value.trim();
      let parsedVal: any = valText;

      // Type parser auto-detection
      if (valText.toLowerCase() === 'true') parsedVal = true;
      else if (valText.toLowerCase() === 'false') parsedVal = false;
      else if (valText.toLowerCase() === 'null') parsedVal = null;
      else if (valText.toLowerCase() === 'undefined') parsedVal = undefined;
      else if (!isNaN(Number(valText)) && valText !== '') parsedVal = Number(valText);
      else {
        // Try parsing JSON if it starts with [ or {
        if (valText.startsWith('[') || valText.startsWith('{')) {
          try {
            parsedVal = JSON.parse(valText);
          } catch {
            // Treat as text if JSON parsing fails
          }
        }
      }

      // Mutate the signal! This instantly propagates updates across the framework
      sig.value = parsedVal;
      modal.remove();
      this.requestRender();
    };

    modal.querySelector('.save')?.addEventListener('click', applyValue);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyValue();
      if (e.key === 'Escape') modal.remove();
    });

    document.body.appendChild(modal);
    input.focus();
    input.select();
  }

  /**
   * Visual styling definitions
   */
  private getCSSStyles(): string {
    return `
      /* Root elements */
      #nova-devtools-container {
        --bg-glass: rgba(15, 17, 26, 0.95);
        --bg-panel: #0d0f17;
        --border-glass: rgba(255, 255, 255, 0.08);
        --text-primary: #f8fafc;
        --text-secondary: #94a3b8;
        --text-muted: #64748b;
        --color-primary: #10b981; /* Emerald */
        --color-secondary: #06b6d4; /* Cyan */
        --color-computed: #8b5cf6; /* Violet */
        --color-bg-card: rgba(30, 41, 59, 0.5);
        --font-stack: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        
        font-family: var(--font-stack);
        color: var(--text-primary);
        z-index: 99999;
        position: relative;
      }

      .font-mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
      }

      /* Float Bubble */
      .nova-devtools-bubble {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
        border: none;
        box-shadow: 0 8px 30px rgba(16, 185, 129, 0.4);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        z-index: 100000;
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
      }

      .nova-devtools-bubble:hover {
        transform: scale(1.1);
        box-shadow: 0 10px 35px rgba(16, 185, 129, 0.6);
      }

      .nova-devtools-bubble.active {
        transform: scale(0.9) rotate(90deg);
        background: #1e293b;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
        color: var(--text-secondary);
        border: 1px solid var(--border-glass);
      }

      .nova-logo-svg {
        width: 28px;
        height: 28px;
        animation: spin-slow 20s linear infinite;
      }

      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      /* Pulse Ring */
      .pulse-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 2px solid var(--color-primary);
        animation: pulse-ring-anim 2s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
        opacity: 0;
        pointer-events: none;
      }

      @keyframes pulse-ring-anim {
        0% { transform: scale(0.95); opacity: 0.5; }
        80%, 100% { transform: scale(1.5); opacity: 0; }
      }

      /* Side Panel */
      .nova-devtools-panel {
        position: fixed;
        top: 0;
        right: -360px;
        width: 340px;
        height: 100vh;
        background: var(--bg-glass);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border-left: 1px solid var(--border-glass);
        box-shadow: -10px 0 40px rgba(0, 0, 0, 0.6);
        transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
        z-index: 99999;
      }

      .nova-devtools-panel.opened {
        right: 0;
      }

      /* Header styling */
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid var(--border-glass);
      }

      .header-logo {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 700;
        font-size: 1.05rem;
        letter-spacing: -0.025em;
        background: linear-gradient(120deg, #fff 40%, var(--text-secondary));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .logo-icon {
        width: 22px;
        height: 22px;
        color: var(--color-primary);
      }

      .version-badge {
        font-size: 0.7rem;
        background: rgba(255,255,255,0.08);
        padding: 2px 6px;
        border-radius: 4px;
        color: var(--text-muted);
        font-weight: 500;
        -webkit-text-fill-color: var(--text-muted);
      }

      .close-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 1.5rem;
        cursor: pointer;
        line-height: 1;
        transition: color 0.2s;
      }

      .close-btn:hover {
        color: white;
      }

      /* Navigation Tabs */
      .panel-tabs {
        display: flex;
        border-bottom: 1px solid var(--border-glass);
        background: rgba(0,0,0,0.2);
      }

      .tab-btn {
        flex: 1;
        background: none;
        border: none;
        color: var(--text-secondary);
        padding: 12px 6px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: color 0.2s, background 0.2s;
        border-bottom: 2px solid transparent;
      }

      .tab-btn:hover {
        color: white;
        background: rgba(255,255,255,0.02);
      }

      .tab-btn.active {
        color: var(--color-primary);
        border-bottom-color: var(--color-primary);
        background: rgba(16, 185, 129, 0.05);
      }

      /* Panel Body scroll area */
      .panel-body {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }

      /* Common Views structure */
      .view-desc {
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-bottom: 16px;
        line-height: 1.4;
      }

      /* Dashboard View Styling */
      .stats-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 20px;
      }

      .stat-card {
        background: var(--color-bg-card);
        border: 1px solid var(--border-glass);
        border-radius: 8px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .stat-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .stat-value {
        font-size: 1.35rem;
        font-weight: 700;
      }

      .sub-value {
        font-size: 0.8rem;
        color: var(--text-muted);
        font-weight: 400;
      }

      .progress-container {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 4px;
      }

      .progress-bar-bg {
        width: 100%;
        height: 6px;
        background: rgba(255,255,255,0.08);
        border-radius: 3px;
        overflow: hidden;
      }

      .progress-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
        border-radius: 3px;
        transition: width 0.3s ease;
      }

      .percentage-label {
        font-size: 0.75rem;
        color: var(--color-primary);
        font-weight: 600;
      }

      /* Info and shortcuts section */
      .info-section, .shortcuts-section {
        border-top: 1px solid var(--border-glass);
        padding-top: 16px;
        margin-top: 16px;
      }

      .info-section h3, .shortcuts-section h3 {
        font-size: 0.85rem;
        font-weight: 700;
        margin-bottom: 12px;
        color: white;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        padding: 6px 0;
        color: var(--text-secondary);
      }

      .status-badge {
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
      }

      .status-badge.active {
        background: rgba(16, 185, 129, 0.15);
        color: var(--color-primary);
      }

      .status-badge.ultra-low {
        background: rgba(6, 182, 212, 0.15);
        color: var(--color-secondary);
      }

      .shortcuts-section ul {
        padding-left: 16px;
        margin: 0;
        font-size: 0.8rem;
        color: var(--text-secondary);
        display: flex;
        flex-direction: column;
        gap: 8px;
        line-height: 1.4;
      }

      .shortcuts-section li strong {
        color: white;
      }

      /* Islands View lists */
      .islands-list, .signals-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .island-item {
        background: var(--color-bg-card);
        border: 1px solid var(--border-glass);
        border-radius: 8px;
        padding: 12px;
        cursor: pointer;
        transition: border-color 0.2s, background-color 0.2s;
      }

      .island-item:hover {
        border-color: rgba(6, 182, 212, 0.4);
        background: rgba(30, 41, 59, 0.7);
      }

      .island-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .island-name {
        font-size: 0.85rem;
        font-weight: 600;
        color: white;
      }

      .island-badge {
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
      }

      .island-badge.hydrated {
        background: rgba(16, 185, 129, 0.15);
        color: var(--color-primary);
      }

      .island-badge.waiting {
        background: rgba(234, 179, 8, 0.12);
        color: #eab308;
      }

      .island-details {
        font-size: 0.75rem;
        color: var(--text-secondary);
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 4px 8px;
      }

      .detail-label {
        color: var(--text-muted);
      }

      .detail-val {
        color: var(--text-primary);
      }

      /* DOM Highlighter Overlay overlay */
      .nova-island-highlighter {
        position: absolute;
        pointer-events: none;
        border: 2px dashed var(--color-secondary);
        background: rgba(6, 182, 212, 0.08);
        box-shadow: 0 0 15px rgba(6, 182, 212, 0.2);
        transition: top 0.15s, left 0.15s, width 0.15s, height 0.15s;
        opacity: 0;
        z-index: 99998;
        border-radius: 4px;
        box-sizing: border-box;
      }

      .nova-island-highlighter.visible {
        opacity: 1;
      }

      .nova-island-highlighter::after {
        content: attr(data-label);
        position: absolute;
        bottom: 100%;
        left: 0;
        background: var(--color-secondary);
        color: white;
        font-size: 0.75rem;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 3px 3px 0 0;
        white-space: nowrap;
        margin-bottom: 2px;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
      }

      /* Signal Item Styling */
      .signal-item {
        background: var(--color-bg-card);
        border: 1px solid var(--border-glass);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .signal-item.computed {
        border-left: 3px solid var(--color-computed);
      }

      .signal-item.signal {
        border-left: 3px solid var(--color-primary);
      }

      .signal-item-main {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .signal-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .signal-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: white;
      }

      .signal-type-tag {
        font-size: 0.65rem;
        padding: 1px 4px;
        border-radius: 3px;
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 0.05em;
      }

      .signal-type-tag.signal {
        background: rgba(16, 185, 129, 0.1);
        color: var(--color-primary);
      }

      .signal-type-tag.computed {
        background: rgba(139, 92, 246, 0.12);
        color: var(--color-computed);
      }

      .signal-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .edit-btn {
        background: rgba(255,255,255,0.06);
        border: 1px solid var(--border-glass);
        color: var(--text-primary);
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s, border-color 0.2s;
      }

      .edit-btn:hover {
        background: rgba(16, 185, 129, 0.15);
        border-color: var(--color-primary);
        color: var(--color-primary);
      }

      .subscribers-count {
        font-size: 0.7rem;
        color: var(--text-muted);
      }

      .signal-value-box {
        display: flex;
        align-items: baseline;
        gap: 6px;
        font-size: 0.8rem;
        background: rgba(0,0,0,0.15);
        padding: 6px 8px;
        border-radius: 4px;
        border: 1px solid rgba(255,255,255,0.02);
      }

      .signal-val-display {
        color: #38bdf8; /* Light sky blue for values */
        word-break: break-all;
        font-weight: 500;
      }

      .signal-meta {
        font-size: 0.7rem;
        color: var(--text-muted);
      }

      /* Modal Styling */
      .nova-devtools-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(8, 10, 16, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100001;
      }

      .nova-devtools-modal {
        background: var(--bg-panel);
        border: 1px solid var(--border-glass);
        box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        border-radius: 12px;
        width: 90%;
        max-width: 400px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        animation: scale-up 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes scale-up {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }

      .nova-devtools-modal h3 {
        margin: 0;
        font-size: 1.05rem;
        color: white;
        font-weight: 700;
      }

      .modal-meta {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .input-container {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .input-container label {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-secondary);
      }

      .modal-input {
        background: rgba(0,0,0,0.25);
        border: 1px solid var(--border-glass);
        border-radius: 6px;
        padding: 8px 12px;
        color: white;
        font-family: var(--font-stack);
        font-size: 0.9rem;
        transition: border-color 0.2s, box-shadow 0.2s;
      }

      .modal-input:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
      }

      .input-hint {
        font-size: 0.7rem;
        color: var(--text-muted);
        line-height: 1.3;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 6px;
      }

      .modal-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: background 0.2s;
      }

      .modal-btn.cancel {
        background: rgba(255,255,255,0.06);
        color: var(--text-primary);
      }

      .modal-btn.cancel:hover {
        background: rgba(255,255,255,0.1);
      }

      .modal-btn.save {
        background: var(--color-primary);
        color: white;
      }

      .modal-btn.save:hover {
        background: #059669;
      }

      /* Empty View elements */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 40px 20px;
        color: var(--text-muted);
        gap: 8px;
      }

      .empty-state p {
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .empty-state span {
        font-size: 0.75rem;
        line-height: 1.4;
      }

      .empty-state code {
        background: rgba(255,255,255,0.04);
        padding: 2px 4px;
        border-radius: 3px;
        font-family: ui-monospace, monospace;
      }
    `;
  }
}

// Instantiate manager globally
let manager: NovaDevToolsManager | null = null;

/**
 * Initialize Nova DevTools panel
 */
export function initDevTools() {
  if (typeof window === 'undefined') return;

  // Ensure singleton instance
  if ((window as any).__NOVA_DEVTOOLS_INSTANTIATED__) return;
  (window as any).__NOVA_DEVTOOLS_INSTANTIATED__ = true;

  // Instantiate and mount
  manager = new NovaDevToolsManager();
  
  // Wait for document to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => manager?.mount());
  } else {
    manager.mount();
  }

  console.log('⚡ [Nova DevTools] Active and monitoring reactivity...');
}
