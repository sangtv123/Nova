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
export declare function patch(oldVnode: Element | null, newVnode: Element | null, signals: Map<string, Signal<any>>): Element | null;
/**
 * Hydration - reuse server-rendered HTML and attach interactivity without VDOM
 */
export declare function hydrate(el: Element, hydrationData: HydrationData, componentFn: (props: Record<string, any>, signals: Map<string, Signal<any>>) => Element): MountedIsland;
/**
 * Mount island component
 */
export declare function mountIsland(selector: string, hydrationData: HydrationData, componentFn: (props: Record<string, any>, signals: Map<string, Signal<any>>) => Element): MountedIsland | null;
/**
 * Create element with attributes
 */
export declare function Fragment(props: any, children: any[]): any[];
/**
 * Create a static DOM node from an HTML string, backed by an LRU cache.
 *
 * First call: parses the HTML into a `<template>` element (slow path).
 * Subsequent calls: clones the cached template (fast path — ~10× faster than innerHTML).
 *
 * The cache holds at most `TEMPLATE_CACHE_MAX` entries. Least-recently-used
 * entries are evicted automatically.
 */
export declare function createTemplate(html: string): Element;
/**
 * Manually clear the template cache (useful in tests or after major route changes).
 */
export declare function clearTemplateCache(): void;
/**
 * Run a function when the current component is mounted to the DOM
 */
export declare function onMount(fn: Function): void;
/**
 * Run a function when the current component is removed from the DOM
 */
export declare function onUnmount(fn: Function): void;
/**
 * Alias for onUnmount - run cleanup when component is destroyed
 */
export declare function onCleanup(fn: Function): void;
/**
 * Run a function after the Island has been fully hydrated on the client
 */
export declare function onHydrated(fn: Function): void;
/**
 * Starts a global MutationObserver to handle automatic component cleanup.
 * Every time an element is removed from the DOM, Nova will:
 * - Call its onUnmount hooks
 * - Dispose of all reactive effects associated with it
 */
export declare function startUnmountObserver(): void;
export declare function createElement(tag: string | Function, attrs?: Record<string, any> | null, ...children: any[]): Element | Element[];
/**
 * Text node creation
 */
export declare function createText(text: string): Text;
/**
 * Render an element to the DOM
 */
export declare function render(element: Element | Element[], container: Element | null): void;
/**
 * JSX Type Definitions
 */
declare global {
    namespace JSX {
        interface IntrinsicElements {
            [elemName: string]: any;
        }
        interface Element extends HTMLElement {
        }
        interface ElementAttributesProperty {
            props: {};
        }
        interface ElementChildrenAttribute {
            children: {};
        }
    }
}
//# sourceMappingURL=index.d.ts.map