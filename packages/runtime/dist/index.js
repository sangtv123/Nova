export * from './di';
/**
 * DOM patching - minimal diff updates
 */
export function patch(oldVnode, newVnode, signals) {
    // Direct native DOM patching - no virtual DOM overhead
    if (!oldVnode)
        return newVnode;
    if (!newVnode)
        return null;
    // Update attributes and children
    if (oldVnode.nodeType === newVnode.nodeType) {
        if (oldVnode.nodeType === 1) {
            // Element node
            patchAttributes(oldVnode, newVnode);
            patchChildren(oldVnode, newVnode, signals);
        }
    }
    return newVnode;
}
/**
 * Patch element attributes
 */
function patchAttributes(el, newEl) {
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
function reconcile(parent, oldNodes, newNodes, marker) {
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
function patchChildren(el, newEl, signals) {
    let oldChild = el.firstChild;
    let newChild = newEl.firstChild;
    const oldChildren = [];
    const newChildren = [];
    while (oldChild) {
        oldChildren.push(oldChild);
        oldChild = oldChild.nextSibling;
    }
    while (newChild) {
        newChildren.push(newChild);
        newChild = newChild.nextSibling;
    }
    // Use reconcile for generic child patching too
    reconcile(el, oldChildren, newChildren, null);
}
let isHydrating = false;
let hydrateCursor = null;
/**
 * Hydration - reuse server-rendered HTML and attach interactivity without VDOM
 */
export function hydrate(el, hydrationData, componentFn) {
    const signals = new Map();
    // Initialize signals from hydration data
    if (hydrationData.signals) {
        for (const [key, value] of Object.entries(hydrationData.signals)) {
            // Import signal would be done here
            signals.set(key, { value });
        }
    }
    // Set global hydration context
    isHydrating = true;
    hydrateCursor = el;
    // Execute component to attach effects to existing DOM (no virtual tree creation)
    try {
        componentFn(hydrationData.props, signals);
    }
    finally {
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
export function mountIsland(selector, hydrationData, componentFn) {
    const el = document.querySelector(selector);
    if (!el)
        return null;
    return hydrate(el, hydrationData, componentFn);
}
import { effect, untrack, domEffect } from '@nova/signals';
/**
 * Create element with attributes
 */
export function Fragment(props, children) {
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
const templateCache = new Map();
/**
 * Create a static DOM node from an HTML string, backed by an LRU cache.
 *
 * First call: parses the HTML into a `<template>` element (slow path).
 * Subsequent calls: clones the cached template (fast path — ~10× faster than innerHTML).
 *
 * The cache holds at most `TEMPLATE_CACHE_MAX` entries. Least-recently-used
 * entries are evicted automatically.
 */
export function createTemplate(html) {
    let template = templateCache.get(html);
    if (template) {
        // Cache hit: move to "most recently used" position by re-inserting
        templateCache.delete(html);
        templateCache.set(html, template);
    }
    else {
        // Cache miss: parse HTML and store
        if (templateCache.size >= TEMPLATE_CACHE_MAX) {
            // Evict the LRU entry (first key in Map = oldest insertion)
            const lruKey = templateCache.keys().next().value;
            templateCache.delete(lruKey);
        }
        template = document.createElement('template');
        template.innerHTML = html;
        templateCache.set(html, template);
    }
    return template.content.cloneNode(true).firstChild;
}
/**
 * Manually clear the template cache (useful in tests or after major route changes).
 */
export function clearTemplateCache() {
    templateCache.clear();
}
const delegatedEvents = new Set();
// FIX 4: Events where passive:true is safe (no preventDefault needed)
// Passive listeners skip the browser's "is there a preventDefault?" check → smoother scroll
const PASSIVE_EVENTS = new Set(['scroll', 'touchstart', 'touchmove', 'touchend', 'wheel', 'pointermove']);
function delegateEvent(eventName) {
    if (delegatedEvents.has(eventName) || typeof document === 'undefined')
        return;
    delegatedEvents.add(eventName);
    const passive = PASSIVE_EVENTS.has(eventName);
    document.addEventListener(eventName, (e) => {
        let target = e.target;
        // FIX 4: Walk up to documentElement (not just body) to cover full DOM
        while (target && target !== document.documentElement) {
            const handler = target[`__nova_${eventName}`];
            if (handler) {
                handler(e);
                // e.cancelBubble is set to true by stopPropagation() — standard spec
                if (e.cancelBubble)
                    break;
            }
            target = target.parentElement;
        }
    }, { passive });
}
let activeHooks = null;
/**
 * Run a function when the current component is mounted to the DOM
 */
export function onMount(fn) {
    if (activeHooks)
        activeHooks.onMount.push(fn);
    else if (typeof window !== 'undefined') {
        // If called outside a component but in a browser, run it in the next tick
        setTimeout(fn, 0);
    }
}
/**
 * Run a function when the current component is removed from the DOM
 */
export function onUnmount(fn) {
    if (activeHooks)
        activeHooks.onUnmount.push(fn);
}
export function createElement(tag, attrs, ...children) {
    if (typeof tag === 'function') {
        const hooks = { onMount: [], onUnmount: [] };
        const prevHooks = activeHooks;
        activeHooks = hooks;
        const props = attrs || {};
        if (children.length > 0) {
            props.children = children.length === 1 ? children[0] : children;
        }
        // FIX: Wrap component execution in untrack to prevent parent effects from tracking child signals
        const el = untrack(() => tag(props, children));
        activeHooks = prevHooks;
        // Run mount hooks in the next microtask (after the element is likely in the DOM)
        if (hooks.onMount.length > 0) {
            Promise.resolve().then(() => {
                hooks.onMount.forEach(fn => fn());
            });
        }
        // Register unmount hooks using a custom property on the element
        if (hooks.onUnmount.length > 0 && el instanceof Element) {
            el.__nova_unmount = hooks.onUnmount;
            // We'll use a MutationObserver in the router or main entry to call these
        }
        return el;
    }
    let el; // HTMLElement gives access to .style, .className
    if (isHydrating && hydrateCursor && hydrateCursor.nodeType === 1) {
        el = hydrateCursor;
        hydrateCursor = el.firstChild; // Move cursor to children
    }
    else {
        el = document.createElement(tag);
    }
    if (attrs) {
        for (const [key, value] of Object.entries(attrs)) {
            if (key === 'class') {
                if (typeof value === 'function')
                    effect(() => el.className = value());
                else
                    el.className = value;
            }
            else if (key === 'style') {
                if (typeof value === 'function')
                    effect(() => Object.assign(el.style, value()));
                else if (typeof value === 'object')
                    Object.assign(el.style, value);
            }
            else if (key.startsWith('on')) {
                const event = key.slice(2).toLowerCase();
                // scroll is handled by passive delegation; mouseenter/leave/load/error don't bubble
                const nonDelegated = ['mouseenter', 'mouseleave', 'load', 'error'];
                if (nonDelegated.includes(event)) {
                    el.addEventListener(event, value);
                }
                else {
                    el[`__nova_${event}`] = value;
                    delegateEvent(event);
                }
            }
            else if (value != null) {
                const isFormProperty = ['value', 'checked', 'selected', 'selectedIndex'].includes(key) && ['input', 'textarea', 'select', 'option'].includes(tag);
                const isBooleanAttr = ['disabled', 'checked', 'required', 'readonly', 'hidden', 'multiple'].includes(key);
                if (isFormProperty) {
                    if (typeof value === 'function') {
                        domEffect(() => {
                            const val = value();
                            el[key] = val;
                            // Also sync attribute for CSS selectors like input[checked]
                            if (isBooleanAttr) {
                                if (val)
                                    el.setAttribute(key, '');
                                else
                                    el.removeAttribute(key);
                            }
                        });
                    }
                    else {
                        el[key] = value;
                        if (isBooleanAttr) {
                            if (value)
                                el.setAttribute(key, '');
                            else
                                el.removeAttribute(key);
                        }
                    }
                }
                else {
                    if (typeof value === 'function') {
                        effect(() => {
                            const val = value();
                            if (isBooleanAttr) {
                                if (val)
                                    el.setAttribute(key, '');
                                else
                                    el.removeAttribute(key);
                            }
                            else {
                                if (val === null || val === undefined || val === false)
                                    el.removeAttribute(key);
                                else
                                    el.setAttribute(key, String(val));
                            }
                        });
                    }
                    else {
                        if (isBooleanAttr) {
                            if (value)
                                el.setAttribute(key, '');
                            else
                                el.removeAttribute(key);
                        }
                        else {
                            el.setAttribute(key, String(value));
                        }
                    }
                }
            }
        }
    }
    let currentChildCursor = isHydrating ? hydrateCursor : null;
    // FIX 3: Generator-based flatten — no intermediate array allocation
    // children.flat(Infinity) creates a new array on every createElement call
    function* flatChildren(arr) {
        for (const item of arr) {
            if (Array.isArray(item))
                yield* flatChildren(item);
            else
                yield item;
        }
    }
    for (const child of flatChildren(children)) {
        if (child != null) {
            if (typeof child === 'function') {
                const marker = document.createTextNode('');
                el.appendChild(marker);
                let currentNodes = [];
                effect(() => {
                    let val = child();
                    if (val === null || val === undefined || val === false)
                        val = '';
                    const newNodes = [];
                    if (Array.isArray(val)) {
                        for (const item of val) {
                            if (item instanceof Node)
                                newNodes.push(item);
                            else
                                newNodes.push(document.createTextNode(String(item)));
                        }
                    }
                    else if (val instanceof Node) {
                        newNodes.push(val);
                    }
                    else {
                        newNodes.push(document.createTextNode(String(val)));
                    }
                    if (newNodes.length === 0)
                        newNodes.push(document.createTextNode(''));
                    const parent = marker.parentNode;
                    if (parent) {
                        reconcile(parent, currentNodes, newNodes, marker);
                    }
                    currentNodes = newNodes;
                });
            }
            else if (typeof child === 'string' || typeof child === 'number') {
                if (isHydrating && currentChildCursor) {
                    currentChildCursor = currentChildCursor.nextSibling;
                }
                else {
                    el.appendChild(document.createTextNode(String(child)));
                }
            }
            else if (child instanceof Node) {
                if (isHydrating && currentChildCursor) {
                    currentChildCursor = currentChildCursor.nextSibling;
                }
                else {
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
export function createText(text) {
    return document.createTextNode(text);
}
/**
 * Render an element to the DOM
 */
export function render(element, container) {
    if (!container)
        return;
    container.innerHTML = '';
    if (Array.isArray(element)) {
        for (const el of element) {
            if (el instanceof Node)
                container.appendChild(el);
        }
    }
    else if (element instanceof Node) {
        container.appendChild(element);
    }
} /**
 * JSX Type Definitions
 */
//# sourceMappingURL=index.js.map