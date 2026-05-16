import type { Signal } from '@nova/signals';
export * from './di';

/**
 * Hydration data for islands
 */
export interface HydrationData {
  id: string;
  props: Record<string, any>;
  signals: Record<string, any>;
}

/**
 * Mounted island instance
 */
export interface MountedIsland {
  id: string;
  el: Element;
  signals: Map<string, Signal<any>>;
}

/**
 * DOM patching - minimal diff updates
 */
export function patch(
  oldVnode: Element | null,
  newVnode: Element | null,
  signals: Map<string, Signal<any>>
): Element | null {
  // Direct native DOM patching - no virtual DOM overhead
  if (!oldVnode) return newVnode;
  if (!newVnode) return null;

  // Update attributes and children
  if (oldVnode.nodeType === newVnode.nodeType) {
    if (oldVnode.nodeType === 1) {
      // Element node
      patchAttributes(oldVnode as Element, newVnode as Element);
      patchChildren(oldVnode, newVnode, signals);
    }
  }

  return newVnode;
}

/**
 * Patch element attributes
 */
function patchAttributes(el: Element, newEl: Element): void {
  // Remove old attributes without array allocation
  for (let i = el.attributes.length - 1; i >= 0; i--) {
    const attr = el.attributes[i];
    if (!newEl.hasAttribute(attr.name)) {
      el.removeAttribute(attr.name);
    }
  }

  // Add/update new attributes conditionally to avoid reflows
  for (let i = 0; i < newEl.attributes.length; i++) {
    const attr = newEl.attributes[i];
    if (el.getAttribute(attr.name) !== attr.value) {
      el.setAttribute(attr.name, attr.value);
    }
  }
}

/**
 * Patch child nodes using pointer traversal to avoid GC overhead
 */
/**
 * Reconcile children nodes in a reactive manner.
 * Minimizes DOM movements by checking nextSibling.
 */
function reconcile(
  parent: Node,
  oldNodes: Node[],
  newNodes: Node[],
  marker: Node
): void {
  // 1. Remove nodes that are not in the new list
  const newNodeSet = new Set(newNodes);
  for (const oldNode of oldNodes) {
    if (!newNodeSet.has(oldNode) && oldNode.parentNode === parent) {
      parent.removeChild(oldNode);
    }
  }

  // 2. Insert/move new nodes from right to left
  let cursor = marker;
  for (let i = newNodes.length - 1; i >= 0; i--) {
    const node = newNodes[i];
    if (node.nextSibling !== cursor) {
      parent.insertBefore(node, cursor);
    }
    cursor = node;
  }
}

function patchChildren(
  el: Element,
  newEl: Element,
  signals: Map<string, Signal<any>>
): void {
  let oldChild = el.firstChild;
  let newChild = newEl.firstChild;

  const oldChildren: Node[] = [];
  const newChildren: Node[] = [];

  while (oldChild) {
    oldChildren.push(oldChild);
    oldChild = oldChild.nextSibling;
  }
  while (newChild) {
    newChildren.push(newChild);
    newChild = newChild.nextSibling;
  }

  // Use reconcile for generic child patching too
  reconcile(el, oldChildren, newChildren, null as any);
}

let isHydrating = false;
let hydrateCursor: Node | null = null;

/**
 * Hydration - reuse server-rendered HTML and attach interactivity without VDOM
 */
export function hydrate(
  el: Element,
  hydrationData: HydrationData,
  componentFn: (props: Record<string, any>, signals: Map<string, Signal<any>>) => Element
): MountedIsland {
  const signals = new Map<string, Signal<any>>();

  // Initialize signals from hydration data
  if (hydrationData.signals) {
    for (const [key, value] of Object.entries(hydrationData.signals)) {
      // Import signal would be done here
      signals.set(key, { value } as any);
    }
  }

  // Set global hydration context
  isHydrating = true;
  hydrateCursor = el;

  // Execute component to attach effects to existing DOM (no virtual tree creation)
  try {
    componentFn(hydrationData.props, signals);
  } finally {
    isHydrating = false;
    hydrateCursor = null;
  }

  return {
    id: hydrationData.id,
    el,
    signals,
  };
}

/**
 * Mount island component
 */
export function mountIsland(
  selector: string,
  hydrationData: HydrationData,
  componentFn: (props: Record<string, any>, signals: Map<string, Signal<any>>) => Element
): MountedIsland | null {
  const el = document.querySelector(selector);
  if (!el) return null;

  return hydrate(el as Element, hydrationData, componentFn);
}

import { effect, untrack, domEffect } from '@nova/signals';

/**
 * Create element with attributes
 */
export function Fragment(props: any, children: any[]) {
  return children;
}

// ─── LRU Template Cache ─────────────────────────────────────────────────────
//
// Problem: templateCache is a plain Map with no eviction policy.
// In apps that generate many unique template strings (e.g. dynamic CSS-in-JS,
// large item lists with unique attributes), this becomes an unbounded memory leak.
//
// Solution: Simple LRU via Map insertion order.
// Map.keys() returns keys in insertion order, so the FIRST key is always the
// least-recently-used entry. When we hit the limit, we delete the oldest key.
// On cache hit, we re-insert to move it to the "most recent" position.

/** Maximum number of parsed <template> elements to keep in memory */
const TEMPLATE_CACHE_MAX = 500;

const templateCache = new Map<string, HTMLTemplateElement>();

/**
 * Create a static DOM node from an HTML string, backed by an LRU cache.
 *
 * First call: parses the HTML into a `<template>` element (slow path).
 * Subsequent calls: clones the cached template (fast path — ~10× faster than innerHTML).
 *
 * The cache holds at most `TEMPLATE_CACHE_MAX` entries. Least-recently-used
 * entries are evicted automatically.
 */
export function createTemplate(html: string): Element {
  let template = templateCache.get(html);

  if (template) {
    // Cache hit: move to "most recently used" position by re-inserting
    templateCache.delete(html);
    templateCache.set(html, template);
  } else {
    // Cache miss: parse HTML and store
    if (templateCache.size >= TEMPLATE_CACHE_MAX) {
      // Evict the LRU entry (first key in Map = oldest insertion)
      const lruKey = templateCache.keys().next().value as string;
      templateCache.delete(lruKey);
    }
    template = document.createElement('template');
    template.innerHTML = html;
    templateCache.set(html, template);
  }

  return template.content.cloneNode(true).firstChild as Element;
}

/**
 * Manually clear the template cache (useful in tests or after major route changes).
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}

const delegatedEvents = new Set<string>();

// FIX 4: Events where passive:true is safe (no preventDefault needed)
// Passive listeners skip the browser's "is there a preventDefault?" check → smoother scroll
const PASSIVE_EVENTS = new Set(['scroll', 'touchstart', 'touchmove', 'touchend', 'wheel', 'pointermove']);

function delegateEvent(eventName: string) {
  if (delegatedEvents.has(eventName) || typeof document === 'undefined') return;
  delegatedEvents.add(eventName);
  const passive = PASSIVE_EVENTS.has(eventName);
  document.addEventListener(
    eventName,
    (e) => {
      let target = e.target as Element | null;
      // FIX 4: Walk up to documentElement (not just body) to cover full DOM
      while (target && target !== document.documentElement) {
        const handler = (target as any)[`__nova_${eventName}`];
        if (handler) {
          handler(e);
          // e.cancelBubble is set to true by stopPropagation() — standard spec
          if (e.cancelBubble) break;
        }
        target = target.parentElement;
      }
    },
    { passive }
  );
}

let activeHooks: { onMount: Function[], onUnmount: Function[], disposals: Function[] } | null = null;

/**
 * Run a function when the current component is mounted to the DOM
 */
export function onMount(fn: Function): void {
  if (activeHooks) activeHooks.onMount.push(fn);
  else if (typeof window !== 'undefined') {
    // If called outside a component but in a browser, run it in the next tick
    setTimeout(fn, 0);
  }
}

/**
 * Run a function when the current component is removed from the DOM
 */
export function onUnmount(fn: Function): void {
  if (activeHooks) activeHooks.onUnmount.push(fn);
}

// ─── Unmount & Cleanup Observer ───────────────────────────────────────────────

/**
 * Trigger unmount hooks and signal disposals for a node and all its children.
 * This is the core of Nova's memory safety.
 */
function cleanupNode(node: Node): void {
  if (node.nodeType !== 1) return; // Only process elements
  
  const el = node as any;

  // 1. Run onUnmount hooks
  if (el.__nova_unmount) {
    el.__nova_unmount.forEach((fn: Function) => fn());
    delete el.__nova_unmount;
  }

  // 2. Dispose reactive effects (prevent signal leaks)
  if (el.__nova_disposals) {
    el.__nova_disposals.forEach((fn: Function) => fn());
    delete el.__nova_disposals;
  }

  // 3. Recursive cleanup for children
  let child = node.firstChild;
  while (child) {
    cleanupNode(child);
    child = child.nextSibling;
  }
}

let observerStarted = false;

/**
 * Starts a global MutationObserver to handle automatic component cleanup.
 * Every time an element is removed from the DOM, Nova will:
 * - Call its onUnmount hooks
 * - Dispose of all reactive effects associated with it
 */
export function startUnmountObserver(): void {
  if (observerStarted || typeof document === 'undefined') return;
  observerStarted = true;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.removedNodes.forEach(cleanupNode);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Auto-start on client load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startUnmountObserver);
  } else {
    startUnmountObserver();
  }
}

export function createElement(
  tag: string | Function,
  attrs?: Record<string, any> | null,
  ...children: any[]
): Element | Element[] {
  if (typeof tag === 'function') {
    const hooks: { onMount: Function[], onUnmount: Function[], disposals: Function[] } = { 
      onMount: [], 
      onUnmount: [],
      disposals: []
    };
    const prevHooks = activeHooks;
    activeHooks = hooks;
    
    const props = attrs || {};
    if (children.length > 0) {
      props.children = children.length === 1 ? children[0] : children;
    }
    
    const el = untrack(() => (tag as Function)(props, children));
    
    activeHooks = prevHooks;

    if (hooks.onMount.length > 0) {
      Promise.resolve().then(() => {
        hooks.onMount.forEach(fn => fn());
      });
    }

    if (el instanceof Element) {
      if (hooks.onUnmount.length > 0) (el as any).__nova_unmount = hooks.onUnmount;
      if (hooks.disposals.length > 0) (el as any).__nova_disposals = hooks.disposals;
    }
    
    return el;
  }

  let el: HTMLElement;

  if (isHydrating && hydrateCursor && hydrateCursor.nodeType === 1) {
    el = hydrateCursor as HTMLElement;
    hydrateCursor = el.firstChild; 
  } else {
    el = document.createElement(tag as string);
  }

  const elDisposals: Function[] = [];

  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'class') {
        if (typeof value === 'function') elDisposals.push(effect(() => el.className = value()));
        else el.className = value;
      } else if (key === 'style') {
        if (typeof value === 'function') elDisposals.push(effect(() => Object.assign(el.style, value())));
        else if (typeof value === 'object') Object.assign(el.style, value);
      } else if (key.startsWith('on')) {
        const event = key.slice(2).toLowerCase();
        const nonDelegated = ['mouseenter', 'mouseleave', 'load', 'error'];
        if (nonDelegated.includes(event)) {
          el.addEventListener(event, value);
        } else {
          (el as any)[`__nova_${event}`] = value;
          delegateEvent(event);
        }
      } else if (value != null) {
        const isFormProperty = ['value', 'checked', 'selected', 'selectedIndex'].includes(key) && ['input', 'textarea', 'select', 'option'].includes(tag as string);
        const isBooleanAttr = ['disabled', 'checked', 'required', 'readonly', 'hidden', 'multiple'].includes(key);

        if (isFormProperty) {
          if (typeof value === 'function') {
            elDisposals.push(domEffect(() => {
              const val = value();
              (el as any)[key] = val;
              if (isBooleanAttr) {
                if (val) el.setAttribute(key, '');
                else el.removeAttribute(key);
              }
            }));
          } else {
            (el as any)[key] = value;
            if (isBooleanAttr) {
              if (value) el.setAttribute(key, '');
              else el.removeAttribute(key);
            }
          }
        } else {
          if (typeof value === 'function') {
            elDisposals.push(effect(() => {
              const val = value();
              if (isBooleanAttr) {
                if (val) el.setAttribute(key, '');
                else el.removeAttribute(key);
              } else {
                if (val === null || val === undefined || val === false) el.removeAttribute(key);
                else el.setAttribute(key, String(val));
              }
            }));
          } else {
            if (isBooleanAttr) {
              if (value) el.setAttribute(key, '');
              else el.removeAttribute(key);
            } else {
              el.setAttribute(key, String(value));
            }
          }
        }
      }
    }
  }

  if (elDisposals.length > 0) {
    (el as any).__nova_disposals = ((el as any).__nova_disposals || []).concat(elDisposals);
  }

  function* flatChildren(arr: any[]): Generator<any> {
    for (const item of arr) {
      if (Array.isArray(item)) yield* flatChildren(item);
      else yield item;
    }
  }

  for (const child of flatChildren(children)) {
    if (child != null) {
      if (typeof child === 'function') {
        const marker = document.createTextNode('');
        el.appendChild(marker);
        let currentNodes: Node[] = [];

        const dispose = effect(() => {
          let val = child();
          if (val === null || val === undefined || val === false) val = '';

          const newNodes: Node[] = [];
          if (Array.isArray(val)) {
            for (const item of val) {
              if (item instanceof Node) newNodes.push(item);
              else newNodes.push(document.createTextNode(String(item)));
            }
          } else if (val instanceof Node) {
            newNodes.push(val);
          } else {
            newNodes.push(document.createTextNode(String(val)));
          }

          if (newNodes.length === 0) newNodes.push(document.createTextNode(''));

          const parent = marker.parentNode;
          if (parent) {
            reconcile(parent, currentNodes, newNodes, marker);
          }
          currentNodes = newNodes;
        });
        
        elDisposals.push(dispose);
      } else if (typeof child === 'string' || typeof child === 'number') {
        if (isHydrating && hydrateCursor) {
          hydrateCursor = hydrateCursor.nextSibling;
        } else {
          el.appendChild(document.createTextNode(String(child)));
        }
      } else if (child instanceof Node) {
        if (isHydrating && hydrateCursor) {
          hydrateCursor = hydrateCursor.nextSibling;
        } else {
          el.appendChild(child);
        }
      }
    }
  }

  if (isHydrating && el.nextSibling) {
    hydrateCursor = el.nextSibling;
  }

  return el;
}

/**
 * Text node creation
 */
export function createText(text: string): Text {
  return document.createTextNode(text);
}

/**
 * Render an element to the DOM
 */
export function render(element: Element | Element[], container: Element | null): void {
  if (!container) return;

  container.innerHTML = '';

  if (Array.isArray(element)) {
    for (const el of element) {
      if (el instanceof Node) container.appendChild(el);
    }
  } else if (element instanceof Node) {
    container.appendChild(element);
  }
}/**
 * JSX Type Definitions
 */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    interface Element extends HTMLElement {}
    interface ElementAttributesProperty {
      props: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }
  }
}
