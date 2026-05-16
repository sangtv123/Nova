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
function patchChildren(el, newEl, signals) {
    let oldChild = el.firstChild;
    let newChild = newEl.firstChild;
    while (oldChild || newChild) {
        if (!oldChild && newChild) {
            el.appendChild(newChild.cloneNode(true));
            newChild = newChild.nextSibling;
        }
        else if (oldChild && !newChild) {
            const nextOld = oldChild.nextSibling;
            el.removeChild(oldChild);
            oldChild = nextOld;
        }
        else if (oldChild && newChild) {
            const nextOld = oldChild.nextSibling;
            const nextNew = newChild.nextSibling;
            if (oldChild.nodeType === 3 && newChild.nodeType === 3) {
                // Text nodes
                if (oldChild.textContent !== newChild.textContent) {
                    oldChild.textContent = newChild.textContent;
                }
            }
            else if (oldChild.nodeType === 1 &&
                newChild.nodeType === 1 &&
                oldChild.tagName === newChild.tagName) {
                // Elements with same tag
                patchAttributes(oldChild, newChild);
                patchChildren(oldChild, newChild, signals);
            }
            else {
                // Different node types, replace entirely
                el.replaceChild(newChild.cloneNode(true), oldChild);
            }
            oldChild = nextOld;
            newChild = nextNew;
        }
    }
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
import { effect } from '@nova/signals';
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
export function createElement(tag, attrs, ...children) {
    if (typeof tag === 'function') {
        const props = attrs || {};
        if (children.length > 0) {
            props.children = children.length === 1 ? children[0] : children;
        }
        return tag(props, children);
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
                if (typeof value === 'function')
                    effect(() => el.setAttribute(key, String(value())));
                else
                    el.setAttribute(key, String(value));
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
                let currentNode;
                if (isHydrating && currentChildCursor) {
                    currentNode = currentChildCursor;
                    currentChildCursor = currentChildCursor.nextSibling;
                }
                else {
                    currentNode = document.createTextNode('');
                    el.appendChild(currentNode);
                }
                effect(() => {
                    const val = child();
                    if (val instanceof Node) {
                        if (currentNode !== val && currentNode.parentNode) {
                            currentNode.parentNode.replaceChild(val, currentNode);
                            currentNode = val;
                        }
                    }
                    else if (Array.isArray(val)) {
                        // Handle arrays (Fragments)
                        const fragment = document.createDocumentFragment();
                        for (const item of val) {
                            if (item instanceof Node)
                                fragment.appendChild(item.cloneNode(true));
                            else
                                fragment.appendChild(document.createTextNode(String(item)));
                        }
                        // Create a placeholder to keep the position for the next update
                        const placeholder = document.createTextNode('');
                        fragment.appendChild(placeholder);
                        if (currentNode.parentNode) {
                            currentNode.parentNode.replaceChild(fragment, currentNode);
                            currentNode = placeholder;
                        }
                    }
                    else {
                        if (currentNode.nodeType === Node.TEXT_NODE) {
                            currentNode.textContent = String(val);
                        }
                        else {
                            const newText = document.createTextNode(String(val));
                            if (currentNode.parentNode) {
                                currentNode.parentNode.replaceChild(newText, currentNode);
                            }
                            currentNode = newText;
                        }
                    }
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