import { signal, effect, domEffect, untrack } from '@nova/signals';
import { createElement, Fragment, onMount } from '@nova/runtime';
import { Dropdown } from './Dropdown';

export interface TabPaneProps {
  key: string;
  title: any;
  disabled?: boolean;
  closable?: boolean;
  icon?: any;
  lazy?: boolean;
  destroyInactive?: boolean;
  children?: any;
  content?: any; // Alternative for data-driven
}

// Declarative Marker
export function TabPane(props: TabPaneProps) {
  const el = document.createElement('div');
  el.style.display = 'none';
  el.className = 'n-tab-pane-marker';
  (el as any).__nova_tab_props = props;
  return el;
}

export interface TabsProps {
  activeKey?: string | (() => string);
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
  onEdit?: (action: 'add' | 'remove', key?: string) => void;
  type?: 'line' | 'card' | 'editable-card';
  position?: 'top' | 'right' | 'bottom' | 'left';
  animated?: boolean;
  lazy?: boolean;
  destroyInactive?: boolean;
  tabBarExtraContent?: any;
  class?: string;
  style?: any;
  items?: TabPaneProps[] | (() => TabPaneProps[]);
  children?: any;
}

export function Tabs(props: TabsProps) {
  const type = props.type || 'line';
  const position = props.position || 'top';
  const isAnimated = props.animated !== false && type === 'line';
  
  // State
  const internalKey = signal(props.defaultActiveKey || '');
  
  const getActiveKey = () => {
    if (typeof props.activeKey === 'function') return props.activeKey();
    if (props.activeKey !== undefined) return props.activeKey;
    return internalKey.value;
  };

  const handleTabClick = (key: string, disabled?: boolean) => {
    if (disabled) return;
    if (props.activeKey === undefined) {
      internalKey.value = key;
    }
    if (props.onChange) props.onChange(key);
  };

  const handleEdit = (e: MouseEvent, action: 'add' | 'remove', key?: string) => {
    e.stopPropagation();
    if (props.onEdit) props.onEdit(action, key);
  };

  // Keyboard Navigation
  const handleKeyDown = (e: KeyboardEvent, panes: TabPaneProps[]) => {
    const activeIdx = panes.findIndex(p => p.key === getActiveKey());
    if (activeIdx === -1) return;
    
    let nextIdx = activeIdx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIdx = (activeIdx + 1) % panes.length;
      while(panes[nextIdx].disabled && nextIdx !== activeIdx) {
        nextIdx = (nextIdx + 1) % panes.length;
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIdx = (activeIdx - 1 + panes.length) % panes.length;
      while(panes[nextIdx].disabled && nextIdx !== activeIdx) {
        nextIdx = (nextIdx - 1 + panes.length) % panes.length;
      }
    }
    
    if (nextIdx !== activeIdx) {
      handleTabClick(panes[nextIdx].key, panes[nextIdx].disabled);
      // Focus the new tab
      const el = headerRefs.get(panes[nextIdx].key);
      if (el) el.focus();
    }
  };

  // Items processing
  const getPanes = (): TabPaneProps[] => {
    let resolved: TabPaneProps[] = [];
    if (typeof props.items === 'function') {
      resolved = props.items();
    } else if (props.items) {
      resolved = props.items;
    } else if (props.children) {
      const flat = Array.isArray(props.children) ? props.children : [props.children];
      for (const child of flat) {
        if (child && child.__nova_tab_props) {
          resolved.push(child.__nova_tab_props);
        }
      }
    }
    return resolved;
  };

  // Set default active key on mount if none
  onMount(() => {
    const panes = getPanes();
    if (!getActiveKey() && panes.length > 0) {
      const firstActive = panes.find(p => !p.disabled);
      if (firstActive) handleTabClick(firstActive.key);
    }
    updateInkBar();
  });

  const headerRefs = new Map<string, HTMLElement>();
  const inkBarStyle = signal({ width: '0px', height: '0px', transform: 'translate(0px, 0px)', opacity: '0' });
  let navListRef: HTMLElement | null = null;

  const updateInkBar = () => {
    if (type !== 'line') return;
    const key = getActiveKey();
    const el = headerRefs.get(key);
    if (el) {
      if (position === 'left' || position === 'right') {
        inkBarStyle.value = { 
          width: '2px', height: `${el.offsetHeight}px`, 
          transform: `translate(0px, ${el.offsetTop}px)`,
          opacity: '1'
        };
      } else {
        inkBarStyle.value = { 
          width: `${el.offsetWidth}px`, height: '2px', 
          transform: `translate(${el.offsetLeft}px, 0px)`,
          opacity: '1'
        };
      }
      
      // Auto scroll header into view
      if (navListRef) {
        const scrollLeft = el.offsetLeft - navListRef.offsetWidth / 2 + el.offsetWidth / 2;
        navListRef.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  };

  domEffect(() => {
    getActiveKey(); // trigger dependency
    getPanes();     // trigger dependency
    setTimeout(updateInkBar, 10);
  });

  // Track rendered tabs for lazy loading
  const renderedPanes = new Set<string>();

  return (
    <div class={() => `n-tabs n-tabs-${position} n-tabs-${type}${props.class ? ` ${props.class}` : ''}`} style={props.style}>
      
      {/* ── Header ── */}
      <div class="n-tabs-nav-wrap">
        <div class="n-tabs-nav-list" ref={(el: any) => navListRef = el} onKeyDown={(e: KeyboardEvent) => handleKeyDown(e, getPanes())}>
          {() => {
            headerRefs.clear();
            const panes = getPanes();
            return panes.map(pane => {
              const isActive = getActiveKey() === pane.key;
              return (
                <div
                  ref={(el: any) => { if (el) headerRefs.set(pane.key, el); }}
                  class={`n-tabs-tab${isActive ? ' n-tabs-tab-active' : ''}${pane.disabled ? ' n-tabs-tab-disabled' : ''}`}
                  onClick={() => handleTabClick(pane.key, pane.disabled)}
                  tabIndex={pane.disabled ? -1 : (isActive ? 0 : -1)}
                  role="tab"
                  aria-selected={isActive}
                >
                  {pane.icon && <span class="n-tabs-tab-icon">{pane.icon}</span>}
                  <span class="n-tabs-tab-title">{pane.title}</span>
                  {(pane.closable || type === 'editable-card') && !pane.disabled && (
                    <span class="n-tabs-tab-remove" onClick={(e: MouseEvent) => handleEdit(e, 'remove', pane.key)}>✕</span>
                  )}
                </div>
              );
            });
          }}
          
          {type === 'editable-card' && (
            <div class="n-tabs-tab n-tabs-tab-add" onClick={(e: MouseEvent) => handleEdit(e, 'add')}>
              <span>＋</span>
            </div>
          )}

          {isAnimated && (
            <div class="n-tabs-ink-bar" style={() => inkBarStyle.value} />
          )}
        </div>
        
        {props.tabBarExtraContent && (
          <div class="n-tabs-extra-content">
            {props.tabBarExtraContent}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div class="n-tabs-content-wrap">
        {() => {
          const active = getActiveKey();
          const panes = getPanes();
          const isLazy = props.lazy !== false;
          const destroyInactive = props.destroyInactive === true;
          
          return panes.map(pane => {
            const isActive = active === pane.key;
            
            if (isActive) renderedPanes.add(pane.key);
            else if (destroyInactive) renderedPanes.delete(pane.key);
            
            const shouldRender = !isLazy || isActive || renderedPanes.has(pane.key);
            
            if (!shouldRender) return null;
            
            return (
              <div
                class={`n-tabs-tabpane${isActive ? ' n-tabs-tabpane-active' : ''}`}
                style={{ display: isActive ? 'block' : 'none' }}
                role="tabpanel"
              >
                {pane.content || pane.children}
              </div>
            );
          });
        }}
      </div>
    </div>
  );
}
