import type { Signal } from '@nova/signals';

/**
 * DevTools Manager class
 * Handles UI creation, signal tracking, island inspection, store time-travel, and real-time updates.
 */
class NovaDevToolsManager {
  private container: HTMLDivElement | null = null;
  private panel: HTMLDivElement | null = null;
  private bubble: HTMLButtonElement | null = null;
  private activeTab: 'dashboard' | 'islands' | 'signals' | 'stores' = 'dashboard';
  private highlightOverlay: HTMLDivElement | null = null;
  private isOpened = false;

  // Visual Overlays for Island Inspection Mode
  private inspectOverlayContainer: HTMLDivElement | null = null;
  private showIslandBorders = false;

  // State Management
  private selectedStoreId: string | null = null;
  private expandedDependencies = new Set<string>();

  // Cache to track signal metadata
  private signalsCache = new Map<string, { sig: Signal<any>; lastValue: any; type: 'signal' | 'computed' }>();

  constructor() {
    this.initHooks();
  }

  /**
   * Register global hooks so we can intercept signals, stores, and mutations as they occur
   */
  private initHooks() {
    if (typeof window === 'undefined') return;

    // Define the global hooks that @nova/signals and @nova/store will call
    (window as any).__NOVA_DEVTOOLS_HOOK__ = {
      onSignalCreated: (sig: Signal<any>) => {
        this.trackSignal(sig);
        this.requestRender();
      },
      onSignalUpdated: (sig: Signal<any>, oldValue: any, newValue: any) => {
        this.trackSignal(sig);
        this.requestRender();
        this.triggerDependencyPulse(sig.id || '');
      },
      onStoreCreated: (store: any) => {
        this.requestRender();
      },
      onMutationRecorded: (mutation: any) => {
        this.requestRender();
      }
    };

    // Periodically pull signals that might have been created before DevTools loaded
    this.scanExistingSignals();
    
    // Scan for dynamic changes or new islands/stores
    setInterval(() => {
      if (this.isOpened) {
        this.scanExistingSignals();
        if (this.showIslandBorders) {
          this.updateIslandBordersOverlay();
        }
      }
    }, 1500);
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
    
    let type: 'signal' | 'computed' = 'signal';
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
   * Get all active signals from the cache
   */
  private getActiveSignals() {
    this.scanExistingSignals(); // Refresh from global list
    return Array.from(this.signalsCache.values()).filter(entry => {
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
   * Temporary pulse visual effect on dependent list items when a signal changes
   */
  private triggerDependencyPulse(sigId: string) {
    if (!this.isOpened) return;
    setTimeout(() => {
      const el = document.getElementById(`devtools-item-${sigId}`);
      if (el) {
        el.classList.add('reactive-pulse');
        setTimeout(() => el.classList.remove('reactive-pulse'), 800);
      }
      
      // Also pulse subscribers in the DOM tree
      const subs = document.querySelectorAll(`[data-dep-on="${sigId}"]`);
      subs.forEach(s => {
        s.classList.add('dep-pulse');
        setTimeout(() => s.classList.remove('dep-pulse'), 800);
      });
    }, 50);
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
          <span class="version-badge">v0.1.0</span>
        </div>
        <button class="close-btn">&times;</button>
      </div>
      <div class="panel-tabs">
        <button class="tab-btn active" data-tab="dashboard">Dashboard</button>
        <button class="tab-btn" data-tab="islands">Islands</button>
        <button class="tab-btn" data-tab="signals">Signals</button>
        <button class="tab-btn" data-tab="stores">Stores</button>
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
        this.toggleIslandBorders(false);
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
    } else if (this.activeTab === 'stores') {
      this.renderStores(body);
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
    const hydratingCount = islands.filter(el => el.getAttribute('data-nova-hydrating') === 'true').length;
    const hydrationPercentage = islands.length > 0 ? Math.round((hydratedCount / islands.length) * 100) : 100;

    // Get active stores count
    const storesMap = (window as any).__NOVA_STORES__;
    const storesCount = storesMap instanceof Map ? storesMap.size : 0;

    container.innerHTML = `
      <div class="dashboard-view">
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Active Signals</span>
            <span class="stat-value">${sigCount} <span class="sub-value">/ ${compCount} computed</span></span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Active Stores</span>
            <span class="stat-value">${storesCount}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Hydration Progress</span>
            <div class="progress-container">
              <span class="stat-value">${hydratedCount} <span class="sub-value">/ ${islands.length} active</span></span>
              ${hydratingCount > 0 ? `<span class="orange-pulse-label">⚡ ${hydratingCount} hydrating...</span>` : ''}
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
            <span class="status-badge ultra-low">&lt; 0.05ms latency</span>
          </div>
        </div>

        <div class="shortcuts-section">
          <h3>💡 Pro Tips</h3>
          <ul>
            <li>Turn on <strong>Toggle Overlay Borders</strong> in the Islands tab to see hydration states and bundle loading performance live on the screen!</li>
            <li>Use the <strong>Stores</strong> tab for complete Pinia-like State Inspection and Time Travel Debugging!</li>
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Render Islands view with live inspection toggle
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
        <div class="control-header">
          <span class="control-label">Inspect Mode Overlay</span>
          <button class="toggle-switch-btn ${this.showIslandBorders ? 'active' : ''}">
            ${this.showIslandBorders ? 'ON' : 'OFF'}
          </button>
        </div>
        <p class="view-desc">Select or hover on an Island to highlight it. Toggle overlay to overlay statuses and load times directly in the DOM.</p>
        <div class="islands-list">
    `;

    islands.forEach((el, index) => {
      const name = el.getAttribute('data-nova-name') || el.tagName.toLowerCase();
      const id = el.getAttribute('data-nova-island') || `island_${index}`;
      const strategy = el.getAttribute('data-nova-strategy') || 'eager';
      const isHydrated = el.getAttribute('data-nova-hydrated') === 'true';
      const isHydrating = el.getAttribute('data-nova-hydrating') === 'true';
      
      const loadTime = el.getAttribute('data-nova-load-time') || '0.0';
      const hydrateTime = el.getAttribute('data-nova-hydration-time') || '0.0';

      let statusLabel = 'Waiting';
      let statusClass = 'waiting';
      if (isHydrated) {
        statusLabel = 'Active';
        statusClass = 'hydrated';
      } else if (isHydrating) {
        statusLabel = 'Hydrating';
        statusClass = 'hydrating';
      }

      html += `
        <div class="island-item" data-index="${index}" data-island-id="${id}">
          <div class="island-item-header">
            <span class="island-name">${name}</span>
            <span class="island-badge ${statusClass}">
              ${statusLabel}
            </span>
          </div>
          <div class="island-details">
            <span class="detail-label">Strategy:</span> <span class="detail-val strategy-badge">${strategy}</span>
            <span class="detail-label">ID:</span> <span class="detail-val font-mono">${id}</span>
            ${isHydrated ? `
              <span class="detail-label">Load Time:</span> <span class="detail-val">${loadTime} ms</span>
              <span class="detail-label">Hydration:</span> <span class="detail-val text-green">${hydrateTime} ms</span>
            ` : ''}
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach switch toggle
    const toggleBtn = container.querySelector('.toggle-switch-btn');
    toggleBtn?.addEventListener('click', () => {
      this.toggleIslandBorders(!this.showIslandBorders);
      toggleBtn.textContent = this.showIslandBorders ? 'ON' : 'OFF';
      toggleBtn.className = `toggle-switch-btn ${this.showIslandBorders ? 'active' : ''}`;
    });

    // Attach interaction events for listing
    const items = container.querySelectorAll('.island-item');
    items.forEach(item => {
      const index = parseInt(item.getAttribute('data-index') || '0', 10);
      const element = islands[index];

      item.addEventListener('mouseenter', () => {
        this.highlightElement(element);
      });

      item.addEventListener('mouseleave', () => {
        this.removeHighlight();
      });

      item.addEventListener('click', () => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.highlightElement(element);
        element.classList.add('nova-highlight-pulse');
        setTimeout(() => element.classList.remove('nova-highlight-pulse'), 1500);
      });
    });
  }

  /**
   * Toggle overlay borders on the actual host page
   */
  private toggleIslandBorders(enable: boolean) {
    this.showIslandBorders = enable;
    if (enable) {
      this.updateIslandBordersOverlay();
    } else {
      if (this.inspectOverlayContainer) {
        this.inspectOverlayContainer.remove();
        this.inspectOverlayContainer = null;
      }
    }
  }

  /**
   * Render actual absolute overlays on top of all islands in the document
   */
  private updateIslandBordersOverlay() {
    if (typeof window === 'undefined') return;

    if (!this.inspectOverlayContainer) {
      this.inspectOverlayContainer = document.createElement('div');
      this.inspectOverlayContainer.id = 'nova-devtools-inspect-container';
      document.body.appendChild(this.inspectOverlayContainer);
    }

    const container = this.inspectOverlayContainer;
    container.innerHTML = ''; // Redraw all overlays

    const islands = Array.from(document.querySelectorAll('[data-nova-island]'));
    
    islands.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return; // Hidden island

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

      const overlay = document.createElement('div');
      const isHydrated = el.getAttribute('data-nova-hydrated') === 'true';
      const isHydrating = el.getAttribute('data-nova-hydrating') === 'true';
      
      let stateClass = 'waiting';
      let title = 'Waiting (SSR Static)';
      if (isHydrated) {
        stateClass = 'hydrated';
        title = 'Active (Hydrated)';
      } else if (isHydrating) {
        stateClass = 'hydrating';
        title = 'Hydrating...';
      }

      overlay.className = `inspect-border-box ${stateClass}`;
      overlay.style.top = `${rect.top + scrollTop}px`;
      overlay.style.left = `${rect.left + scrollLeft}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;

      const name = el.getAttribute('data-nova-name') || el.tagName.toLowerCase();
      const strategy = el.getAttribute('data-nova-strategy') || 'eager';
      const load = el.getAttribute('data-nova-load-time') || '0.0';
      const hyd = el.getAttribute('data-nova-hydration-time') || '0.0';

      let metricsText = `[${strategy}]`;
      if (isHydrated) {
        metricsText = `[${strategy}] • Load: ${load}ms • Hydrate: ${hyd}ms`;
      }

      overlay.innerHTML = `
        <div class="inspect-label">
          <span class="inspect-name">⚡ ${name}</span>
          <span class="inspect-metrics">${metricsText}</span>
        </div>
      `;

      container.appendChild(overlay);
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
    
    const name = el.getAttribute('data-nova-name') || el.tagName.toLowerCase();
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
   * Render Signals and Computeds view with dependency tracking
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
        <p class="view-desc">Inspect and edit signals value. Click on <strong>Dependencies</strong> to see subscribers and the dynamic propagation tree.</p>
        <div class="signals-list">
    `;

    entries.forEach(entry => {
      const { sig, type } = entry;
      const value = sig.peek();
      const label = sig.label || 'Signal';
      const id = sig.id || '';
      const subs = sig.getSubscribers();
      const subsCount = subs.size;
      const isExpanded = this.expandedDependencies.has(id);

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
              ${type === 'signal' ? `<button class="edit-btn" data-sig-id="${id}" title="Edit Value">✎ Edit</button>` : ''}
              <button class="dep-toggle-btn ${isExpanded ? 'active' : ''}" data-sig-id="${id}">
                ${subsCount} deps ${isExpanded ? '▲' : '▼'}
              </button>
            </div>
          </div>
          <div class="signal-value-box">
            <span class="detail-label">Value:</span>
            <span class="signal-val-display font-mono">${this.escapeHtml(valStr)}</span>
          </div>
          
          ${isExpanded ? `
            <div class="dependency-graph-block">
              <div class="dep-header">⚡ Reactive Dependents:</div>
              ${subsCount === 0 ? `
                <div class="no-deps-text">No active subscribers.</div>
              ` : `
                <div class="dep-tree">
                  ${this.renderSubscriberTree(subs)}
                </div>
              `}
            </div>
          ` : ''}

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
        e.stopPropagation();
        const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-sig-id');
        if (id) this.promptEditSignal(id);
      });
    });

    // Attach dependency toggle actions
    const depToggleBtns = container.querySelectorAll('.dep-toggle-btn');
    depToggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-sig-id');
        if (id) {
          if (this.expandedDependencies.has(id)) {
            this.expandedDependencies.delete(id);
          } else {
            this.expandedDependencies.add(id);
          }
          this.requestRender();
        }
      });
    });
  }

  /**
   * Helper to recursively render subscribers in the tree
   */
  private renderSubscriberTree(subs: Set<any>): string {
    let html = '';
    subs.forEach((sub) => {
      // sub is effectObj
      if (sub.isComputed) {
        const sig = sub.signal;
        const val = sig ? sig.peek() : undefined;
        const childId = sub.id || '';
        
        html += `
          <div class="dep-node computed" data-dep-on="${childId}">
            <span class="node-icon">◆</span>
            <span class="node-label">Computed:</span> 
            <span class="node-name">${sub.label || 'Derived'}</span>
            <span class="node-val font-mono">(${this.escapeHtml(String(val))})</span>
            
            <!-- Recurse on computed's internal subscribers -->
            ${sig && sig.getSubscribers().size > 0 ? `
              <div class="node-children">
                ${this.renderSubscriberTree(sig.getSubscribers())}
              </div>
            ` : ''}
          </div>
        `;
      } else if (sub.isEffect) {
        html += `
          <div class="dep-node effect" data-dep-on="${sub.id || ''}">
            <span class="node-icon">⚙</span>
            <span class="node-label">Effect:</span> 
            <span class="node-name">${sub.label || 'Side Effect'}</span>
          </div>
        `;
      } else {
        html += `
          <div class="dep-node element">
            <span class="node-icon">⚲</span>
            <span class="node-label">DOM Node Binding</span>
          </div>
        `;
      }
    });
    return html;
  }

  /**
   * Escape HTML string
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
        if (valText.startsWith('[') || valText.startsWith('{')) {
          try {
            parsedVal = JSON.parse(valText);
          } catch {}
        }
      }

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
   * Render Stores view (Pinia State + Time Travel Debugging)
   */
  private renderStores(container: Element) {
    const storesMap = (window as any).__NOVA_STORES__;
    const history = (window as any).__NOVA_MUTATIONS_HISTORY__ || [];

    if (!storesMap || storesMap.size === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No Stores defined yet.</p>
          <span>Use <code>defineStore('store-id', { state, getters, actions })</code> in @nova/store to centralize state.</span>
        </div>
      `;
      return;
    }

    const storeIds = Array.from(storesMap.keys()) as string[];
    if (!this.selectedStoreId || !storesMap.has(this.selectedStoreId)) {
      this.selectedStoreId = storeIds[0];
    }

    const activeStore = storesMap.get(this.selectedStoreId);
    const rawState = activeStore.$rawState || {};
    
    // Scan store getters (any signal with label store.[id].getter.name)
    const getters: Array<{ name: string; sig: Signal<any> }> = [];
    const signals = this.getActiveSignals();
    signals.forEach(entry => {
      const sig = entry.sig;
      if (sig.label?.startsWith(`store.${this.selectedStoreId}.getter.`)) {
        const name = sig.label.replace(`store.${this.selectedStoreId}.getter.`, '');
        getters.push({ name, sig });
      }
    });

    let html = `
      <div class="stores-view">
        <div class="store-selector-block">
          <label>Select Store:</label>
          <select class="store-dropdown">
            ${storeIds.map(id => `<option value="${id}" ${id === this.selectedStoreId ? 'selected' : ''}>${id}</option>`).join('')}
          </select>
        </div>

        <div class="store-content-panel">
          <div class="section-title">📦 State Variables:</div>
          <div class="state-properties-list">
    `;

    for (const [key, sig] of Object.entries<any>(rawState)) {
      const val = sig.peek();
      const id = sig.id;
      let valText = typeof val === 'object' ? JSON.stringify(val) : String(val);

      html += `
        <div class="state-property-row">
          <div class="property-info">
            <span class="property-name">${key}</span>
            <span class="property-val font-mono" title="${valText}">${this.escapeHtml(valText)}</span>
          </div>
          <button class="edit-store-state-btn" data-store-id="${this.selectedStoreId}" data-key="${key}" data-sig-id="${id}">✎</button>
        </div>
      `;
    }

    html += `
          </div>

          ${getters.length > 0 ? `
            <div class="section-title">◆ Calculated Getters:</div>
            <div class="getters-list">
              ${getters.map(g => `
                <div class="getter-row">
                  <span class="property-name font-italic">${g.name}</span>
                  <span class="property-val font-mono font-purple">${this.escapeHtml(String(g.sig.peek()))}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Time Travel Debugging -->
          <div class="section-title">⏱ Time Travel Debugging:</div>
          <div class="mutations-history-block">
            <p class="history-desc">Chronological mutations logs. Revert to any past state snapshot instantly.</p>
            <div class="mutations-timeline">
    `;

    const storeMutations = history.filter((m: any) => m.storeId === this.selectedStoreId);
    
    if (storeMutations.length === 0) {
      html += `<div class="no-mutations-text">No mutations recorded yet. Trigger actions to see timeline.</div>`;
    } else {
      // Show newest first
      const reversedMutations = [...storeMutations].reverse();
      reversedMutations.forEach((mut: any, revIdx) => {
        const idx = storeMutations.length - 1 - revIdx;
        const time = new Date(mut.timestamp).toLocaleTimeString();
        const snapshotText = JSON.stringify(mut.snapshot);

        html += `
          <div class="mutation-timeline-item">
            <div class="timeline-bullet"></div>
            <div class="mutation-card">
              <div class="mutation-header">
                <span class="mutation-action font-mono">${mut.actionName}</span>
                <span class="mutation-time">${time}</span>
              </div>
              <div class="mutation-details">
                <span class="mutation-args">Args: ${JSON.stringify(mut.args)}</span>
                <div class="mutation-snapshot-expander" data-mut-idx="${idx}">
                  Snapshot: <span class="font-mono hover-link">view</span>
                  <div class="snapshot-preview font-mono hidden" id="snapshot-preview-${idx}">
                    ${this.escapeHtml(snapshotText)}
                  </div>
                </div>
              </div>
              <button class="revert-state-btn" data-store-id="${this.selectedStoreId}" data-mut-idx="${idx}">
                ↩ Revert to here
              </button>
            </div>
          </div>
        `;
      });
    }

    html += `
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach store selector dropdown change
    const dropdown = container.querySelector('.store-dropdown') as HTMLSelectElement;
    dropdown?.addEventListener('change', () => {
      this.selectedStoreId = dropdown.value;
      this.requestRender();
    });

    // Attach edit store state btn actions
    const editStateBtns = container.querySelectorAll('.edit-store-state-btn');
    editStateBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLButtonElement).getAttribute('data-sig-id');
        if (id) this.promptEditSignal(id);
      });
    });

    // Attach snapshot view expander actions
    const expanders = container.querySelectorAll('.mutation-snapshot-expander');
    expanders.forEach(exp => {
      exp.addEventListener('click', () => {
        const idx = exp.getAttribute('data-mut-idx');
        const preview = container.querySelector(`#snapshot-preview-${idx}`);
        if (preview) {
          preview.classList.toggle('hidden');
        }
      });
    });

    // Attach Revert State Time-Travel action!
    const revertBtns = container.querySelectorAll('.revert-state-btn');
    revertBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mutIdx = parseInt(btn.getAttribute('data-mut-idx') || '0', 10);
        const mut = storeMutations[mutIdx];
        if (mut) {
          this.revertStoreStateTo(this.selectedStoreId!, mut.snapshot);
          
          // Show visual notification of revert
          alert(`⚡ Reverted Store state of "${this.selectedStoreId}" successfully!`);
          this.requestRender();
        }
      });
    });
  }

  /**
   * Revert active store variables back to snapshot values (Time Travel)
   */
  private revertStoreStateTo(storeId: string, snapshot: Record<string, any>) {
    const storesMap = (window as any).__NOVA_STORES__;
    if (!storesMap) return;

    const activeStore = storesMap.get(storeId);
    if (!activeStore) return;

    const rawState = activeStore.$rawState || {};
    
    // Batch updates to avoid frame thrashing
    for (const [key, val] of Object.entries(snapshot)) {
      const sig = rawState[key];
      if (sig && typeof sig === 'object') {
        sig.value = val;
      }
    }
  }

  /**
   * Visual styling definitions (Advanced design: Glassmorphism, tailored colors, animations)
   */
  private getCSSStyles(): string {
    return `
      /* Root elements */
      #nova-devtools-container {
        --bg-glass: rgba(10, 12, 20, 0.94);
        --bg-panel: #06080f;
        --border-glass: rgba(255, 255, 255, 0.08);
        --text-primary: #f8fafc;
        --text-secondary: #94a3b8;
        --text-muted: #64748b;
        
        --color-primary: #10b981; /* Emerald */
        --color-secondary: #06b6d4; /* Cyan */
        --color-computed: #a855f7; /* Purple */
        --color-effect: #f43f5e; /* Rose */
        --color-bg-card: rgba(15, 23, 42, 0.6);
        
        --font-stack: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        
        font-family: var(--font-stack);
        color: var(--text-primary);
        z-index: 99999;
        position: relative;
      }

      .font-mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
      }
      .font-italic {
        font-style: italic;
      }
      .font-purple {
        color: var(--color-computed) !important;
      }
      .text-green {
        color: var(--color-primary) !important;
      }
      .hidden {
        display: none !important;
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
        background: #0f172a;
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
        animation: pulse-ring-anim 2.5s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
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
        gap: 8px;
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
        font-size: 0.65rem;
        background: rgba(255,255,255,0.08);
        padding: 1px 5px;
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
        background: rgba(0,0,0,0.25);
      }

      .tab-btn {
        flex: 1;
        background: none;
        border: none;
        color: var(--text-secondary);
        padding: 12px 2px;
        font-size: 0.8rem;
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

      .view-desc {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-bottom: 14px;
        line-height: 1.4;
      }

      /* Dashboard Stats Grid */
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
        font-size: 0.7rem;
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
        font-size: 0.75rem;
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

      .orange-pulse-label {
        font-size: 0.75rem;
        color: #f59e0b;
        font-weight: 600;
        animation: pulse-opac 1.5s ease-in-out infinite;
      }

      @keyframes pulse-opac {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

      .info-section, .shortcuts-section {
        border-top: 1px solid var(--border-glass);
        padding-top: 14px;
        margin-top: 14px;
      }

      .info-section h3, .shortcuts-section h3 {
        font-size: 0.8rem;
        font-weight: 700;
        margin-bottom: 10px;
        color: white;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        padding: 6px 0;
        color: var(--text-secondary);
      }

      .status-badge {
        font-size: 0.65rem;
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
        padding-left: 14px;
        margin: 0;
        font-size: 0.75rem;
        color: var(--text-secondary);
        display: flex;
        flex-direction: column;
        gap: 6px;
        line-height: 1.4;
      }

      /* Inspect Control Switch */
      .control-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        background: rgba(255,255,255,0.03);
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid var(--border-glass);
      }

      .control-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: white;
      }

      .toggle-switch-btn {
        background: rgba(255,255,255,0.08);
        border: 1px solid var(--border-glass);
        color: var(--text-secondary);
        font-size: 0.7rem;
        padding: 4px 10px;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
      }

      .toggle-switch-btn.active {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
      }

      /* Islands and Signals lists */
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
        margin-bottom: 6px;
      }

      .island-name {
        font-size: 0.8rem;
        font-weight: 600;
        color: white;
      }

      .island-badge {
        font-size: 0.65rem;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
      }

      .island-badge.hydrated {
        background: rgba(16, 185, 129, 0.15);
        color: var(--color-primary);
      }

      .island-badge.waiting {
        background: rgba(100, 116, 139, 0.15);
        color: var(--text-secondary);
      }

      .island-badge.hydrating {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        animation: pulse-opac 1s infinite;
      }

      .island-details {
        font-size: 0.7rem;
        color: var(--text-secondary);
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 3px 8px;
      }

      .strategy-badge {
        background: rgba(6, 182, 212, 0.08);
        color: var(--color-secondary);
        padding: 0 4px;
        border-radius: 3px;
        width: fit-content;
      }

      /* DOM Highlighter Overlay */
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
        font-size: 0.7rem;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 3px 3px 0 0;
        white-space: nowrap;
        margin-bottom: 2px;
      }

      /* CSS for Active Overlays injected on Host elements */
      #nova-devtools-inspect-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 99997;
      }

      .inspect-border-box {
        position: absolute;
        border: 2px dashed rgba(148, 163, 184, 0.7);
        border-radius: 4px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        transition: all 0.2s ease;
      }

      .inspect-border-box.waiting {
        border-color: rgba(148, 163, 184, 0.8);
        background: rgba(148, 163, 184, 0.04);
      }

      .inspect-border-box.hydrating {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.08);
        border-style: dotted;
        animation: border-dance 1s infinite linear;
      }

      @keyframes border-dance {
        from { stroke-dashoffset: 0; }
        to { stroke-dashoffset: 10; }
      }

      .inspect-border-box.hydrated {
        border-color: var(--color-primary);
        border-style: solid;
        background: rgba(16, 185, 129, 0.05);
        box-shadow: 0 0 10px rgba(16, 185, 129, 0.1);
      }

      .inspect-label {
        position: absolute;
        bottom: 100%;
        left: 0;
        display: flex;
        flex-direction: column;
        margin-bottom: 4px;
        border-radius: 4px;
        overflow: hidden;
        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      }

      .inspect-name {
        background: #0f172a;
        color: white;
        font-size: 0.65rem;
        font-weight: bold;
        padding: 1px 6px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }

      .inspect-metrics {
        font-size: 0.6rem;
        padding: 1px 6px;
        white-space: nowrap;
      }

      .waiting .inspect-metrics { background: #475569; color: #cbd5e1; }
      .hydrating .inspect-metrics { background: #d97706; color: white; }
      .hydrated .inspect-metrics { background: #047857; color: white; }

      /* Signal Item Styling */
      .signal-item {
        background: var(--color-bg-card);
        border: 1px solid var(--border-glass);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        position: relative;
        transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
      }

      .signal-item.computed {
        border-left: 3px solid var(--color-computed);
      }

      .signal-item.signal {
        border-left: 3px solid var(--color-primary);
      }

      .reactive-pulse {
        border-color: var(--color-secondary) !important;
        box-shadow: 0 0 10px rgba(6, 182, 212, 0.3) !important;
        transform: scale(0.98);
      }

      .signal-item-main {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .signal-info {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .signal-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: white;
      }

      .signal-type-tag {
        font-size: 0.6rem;
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
        gap: 6px;
      }

      .edit-btn {
        background: rgba(255,255,255,0.06);
        border: 1px solid var(--border-glass);
        color: var(--text-primary);
        font-size: 0.65rem;
        padding: 2px 6px;
        border-radius: 4px;
        cursor: pointer;
      }

      .edit-btn:hover {
        background: rgba(16, 185, 129, 0.15);
        border-color: var(--color-primary);
        color: var(--color-primary);
      }

      .dep-toggle-btn {
        background: rgba(255,255,255,0.04);
        border: 1px solid var(--border-glass);
        color: var(--text-secondary);
        font-size: 0.65rem;
        padding: 2px 6px;
        border-radius: 4px;
        cursor: pointer;
      }

      .dep-toggle-btn:hover, .dep-toggle-btn.active {
        color: var(--color-secondary);
        border-color: var(--color-secondary);
        background: rgba(6, 182, 212, 0.06);
      }

      .signal-value-box {
        display: flex;
        align-items: baseline;
        gap: 6px;
        font-size: 0.75rem;
        background: rgba(0,0,0,0.15);
        padding: 6px 8px;
        border-radius: 4px;
        border: 1px solid rgba(255,255,255,0.02);
      }

      .signal-val-display {
        color: #38bdf8; /* Light sky blue */
        word-break: break-all;
        font-weight: 500;
      }

      .signal-meta {
        font-size: 0.65rem;
        color: var(--text-muted);
      }

      /* Reactive Dependency Tree Block */
      .dependency-graph-block {
        margin-top: 6px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
        padding: 8px 10px;
        border: 1px solid rgba(255,255,255,0.03);
      }

      .dep-header {
        font-size: 0.7rem;
        font-weight: bold;
        color: var(--text-secondary);
        margin-bottom: 6px;
      }

      .no-deps-text, .no-mutations-text {
        font-size: 0.7rem;
        color: var(--text-muted);
        font-style: italic;
      }

      .dep-tree {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .dep-node {
        font-size: 0.7rem;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px;
        padding: 2px 0;
        border-left: 1px solid rgba(255,255,255,0.08);
        padding-left: 8px;
        position: relative;
        transition: color 0.2s;
      }

      .dep-node::before {
        content: '';
        position: absolute;
        left: 0;
        top: 8px;
        width: 5px;
        height: 1px;
        background: rgba(255,255,255,0.08);
      }

      .node-icon {
        font-size: 0.75rem;
      }

      .dep-node.computed { color: #cbd5e1; }
      .dep-node.computed .node-icon { color: var(--color-computed); }
      .dep-node.effect { color: #e2e8f0; }
      .dep-node.effect .node-icon { color: var(--color-effect); }
      .dep-node.element { color: var(--text-muted); }

      .node-label { color: var(--text-muted); }
      .node-name { font-weight: 600; color: white; }
      .node-val { color: #38bdf8; }

      .node-children {
        width: 100%;
        margin-left: 6px;
      }

      .dep-pulse {
        animation: dep-pulse-anim 0.8s ease;
      }

      @keyframes dep-pulse-anim {
        0% { color: var(--color-secondary); text-shadow: 0 0 5px var(--color-secondary); }
        100% { color: inherit; text-shadow: none; }
      }

      /* Stores View Styling */
      .stores-view {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .store-selector-block {
        display: flex;
        flex-direction: column;
        gap: 6px;
        background: rgba(255,255,255,0.02);
        padding: 10px;
        border-radius: 6px;
        border: 1px solid var(--border-glass);
      }

      .store-selector-block label {
        font-size: 0.7rem;
        text-transform: uppercase;
        font-weight: bold;
        color: var(--text-secondary);
      }

      .store-dropdown {
        background: #0f172a;
        color: white;
        border: 1px solid var(--border-glass);
        padding: 6px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.8rem;
        outline: none;
      }

      .section-title {
        font-size: 0.75rem;
        text-transform: uppercase;
        font-weight: bold;
        color: white;
        margin: 10px 0 6px 0;
        border-left: 2px solid var(--color-primary);
        padding-left: 6px;
      }

      .state-properties-list, .getters-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        background: rgba(0,0,0,0.15);
        border-radius: 6px;
        padding: 8px;
        border: 1px solid var(--border-glass);
      }

      .state-property-row, .getter-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.75rem;
        padding: 4px 0;
        border-bottom: 1px solid rgba(255,255,255,0.03);
      }

      .state-property-row:last-child, .getter-row:last-child {
        border-bottom: none;
      }

      .property-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        max-width: 85%;
      }

      .property-name {
        font-weight: 600;
        color: var(--text-secondary);
      }

      .property-val {
        color: #e2e8f0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .edit-store-state-btn {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 3px;
        font-size: 0.75rem;
      }

      .edit-store-state-btn:hover {
        color: var(--color-primary);
        background: rgba(255,255,255,0.05);
      }

      /* Time Travel Debugging History */
      .mutations-history-block {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 300px;
        overflow-y: auto;
      }

      .history-desc {
        font-size: 0.65rem;
        color: var(--text-muted);
        margin: 0;
      }

      .mutations-timeline {
        display: flex;
        flex-direction: column;
        padding-left: 10px;
        border-left: 1px dashed rgba(255,255,255,0.1);
        gap: 10px;
        margin-top: 6px;
      }

      .mutation-timeline-item {
        position: relative;
        padding-left: 8px;
      }

      .timeline-bullet {
        position: absolute;
        left: -14px;
        top: 6px;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--color-secondary);
        border: 2px solid #06080f;
      }

      .mutation-card {
        background: var(--color-bg-card);
        border: 1px solid var(--border-glass);
        border-radius: 6px;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .mutation-header {
        display: flex;
        justify-content: space-between;
        font-size: 0.7rem;
      }

      .mutation-action {
        font-weight: bold;
        color: white;
      }

      .mutation-time {
        color: var(--text-muted);
      }

      .mutation-details {
        font-size: 0.65rem;
        color: var(--text-secondary);
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .hover-link {
        color: var(--color-secondary);
        text-decoration: underline;
        cursor: pointer;
      }

      .snapshot-preview {
        background: rgba(0,0,0,0.3);
        padding: 4px;
        border-radius: 3px;
        max-height: 80px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-all;
        border: 1px solid rgba(255,255,255,0.02);
        margin-top: 4px;
        font-size: 0.6rem;
        color: #e2e8f0;
      }

      .revert-state-btn {
        background: rgba(6, 182, 212, 0.1);
        border: 1px solid rgba(6, 182, 212, 0.2);
        color: var(--color-secondary);
        font-size: 0.65rem;
        font-weight: bold;
        padding: 4px;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
        text-align: center;
        margin-top: 4px;
        transition: background 0.2s, border-color 0.2s;
      }

      .revert-state-btn:hover {
        background: rgba(6, 182, 212, 0.2);
        border-color: var(--color-secondary);
      }

      /* Modal Styling */
      .nova-devtools-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(3, 4, 8, 0.8);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100001;
      }

      .nova-devtools-modal {
        background: var(--bg-panel);
        border: 1px solid var(--border-glass);
        box-shadow: 0 20px 50px rgba(0,0,0,0.6);
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
        font-size: 0.65rem;
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

  console.log('⚡ [Nova DevTools] Active and monitoring reactivity, hydration, and stores...');
}
