import { signal } from '@nova/signals';
import type { HydrationData } from '@nova/runtime';

/**
 * Island metadata
 */
export interface IslandMetadata {
  id: string;
  name: string;
  props: Record<string, any>;
  hydrationData: string; // Serialized hydration data
}

/**
 * Island registry — maps island IDs to their lazy import factories.
 * Using factories (not pre-imported modules) keeps the initial bundle small;
 * each island chunk is only fetched when it enters the viewport.
 */
const islandRegistry = new Map<
  string,
  {
    /** Dynamic import factory for the island's module */
    factory: () => Promise<any>;
    /** Pre-resolved module if already loaded */
    module?: any;
  }
>();

// ─── Registry ────────────────────────────────────────────────────────────────

/**
 * Register an island component for hydration
 * Can accept a factory (for lazy loading) or a direct component
 */
export function registerIsland(id: string, componentOrFactory: any): void {
  let factory: () => Promise<any>;

  if (typeof componentOrFactory === 'function' && componentOrFactory.length === 0) {
    // Looks like a factory: () => import('./...')
    factory = componentOrFactory;
  } else {
    // Looks like a component: (props) => ...
    // Wrap it in a resolved promise to match the factory interface
    factory = () => Promise.resolve({ default: componentOrFactory });
  }

  islandRegistry.set(id, { factory });
}

/**
 * Get the resolved island module (loads it if not yet loaded).
 */
async function loadIsland(id: string): Promise<any | null> {
  const entry = islandRegistry.get(id);
  if (!entry) return null;
  if (!entry.module) {
    entry.module = await entry.factory();
  }
  return entry.module;
}

// ─── Serialization ───────────────────────────────────────────────────────────

/**
 * Serialize island props for HTML embedding.
 * Functions and Symbols are skipped (not serialisable).
 */
export function serializeProps(props: Record<string, any>): string {
  const serialized: Record<string, any> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined) {
      serialized[key] = null;
    } else if (typeof value === 'function' || typeof value === 'symbol') {
      // Skip non-serialisable values
      continue;
    } else if (value instanceof Date) {
      serialized[key] = { __type: 'Date', value: value.toISOString() };
    } else {
      serialized[key] = value;
    }
  }
  return JSON.stringify(serialized);
}

/**
 * Deserialize island props from HTML attribute.
 */
export function deserializeProps(serialized: string): Record<string, any> {
  const data = JSON.parse(serialized);
  const props: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && (value as any).__type === 'Date') {
      props[key] = new Date((value as any).value);
    } else {
      props[key] = value;
    }
  }
  return props;
}

// ─── Hydration helpers ────────────────────────────────────────────────────────

/**
 * Build a HydrationData object from a DOM element's data attributes.
 * Initialises each signal value with the real `signal()` factory (Fix #7).
 */
function buildHydrationData(el: Element): HydrationData | null {
  const id = el.getAttribute('data-nova-island');
  const raw = el.getAttribute('data-nova-hydration');
  if (!id || !raw) return null;

  let parsed: { props?: Record<string, any>; signals?: Record<string, any> } = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(`[nova/islands] Invalid hydration JSON for island "${id}"`);
    return null;
  }

  // FIX #7: Create real signals instead of plain { value } objects
  const signals: Record<string, any> = {};
  for (const [key, value] of Object.entries(parsed.signals ?? {})) {
    signals[key] = signal(value);
  }

  return {
    id,
    props: parsed.props ?? {},
    signals,
  };
}

/**
 * Hydrate a single island element.
 */
async function hydrateIsland(el: Element): Promise<void> {
  const islandId = el.getAttribute('data-nova-island');
  if (!islandId) return;

  const hydrationData = buildHydrationData(el);
  if (!hydrationData) return;

  const mod = await loadIsland(islandId);
  if (!mod) {
    console.warn(`[nova/islands] Island not registered: "${islandId}". ` +
      `Call registerIsland('${islandId}', () => import('./YourComponent')) first.`);
    return;
  }

  try {
    const hydrateFn = mod.hydrate ?? mod.default;
    if (typeof hydrateFn !== 'function') {
      console.error(`[nova/islands] Island "${islandId}" has no default export or hydrate function.`);
      return;
    }
    const instance = await hydrateFn(hydrationData.props, hydrationData.signals);
    if (instance?.el) {
      el.replaceWith(instance.el);
    }
  } catch (error) {
    console.error(`[nova/islands] Failed to hydrate island "${islandId}":`, error);
  }
}

// ─── Mount strategy ───────────────────────────────────────────────────────────

/**
 * Mount strategy options
 */
export type HydrationStrategy =
  | 'eager'        // Hydrate immediately on page load (default for critical islands)
  | 'visible'      // Hydrate when the island enters the viewport (IntersectionObserver)
  | 'idle';        // Hydrate during browser idle time (requestIdleCallback)

/**
 * Mount all islands in the DOM using the optimal hydration strategy.
 *
 * Strategy is read from the `data-nova-strategy` attribute on each island element.
 * Defaults to `'visible'` which is the best trade-off for most pages.
 *
 * @example HTML
 * <div data-nova-island="counter" data-nova-strategy="eager" ...>
 * <div data-nova-island="chart"   data-nova-strategy="visible" ...>
 * <div data-nova-island="footer"  data-nova-strategy="idle" ...>
 */
export async function mountIslands(): Promise<void> {
  if (typeof window === 'undefined') return;

  const markers = Array.from(document.querySelectorAll('[data-nova-island]'));
  if (markers.length === 0) return;

  // Separate by strategy
  const eager: Element[] = [];
  const visible: Element[] = [];
  const idle: Element[] = [];

  for (const el of markers) {
    const strategy = (el.getAttribute('data-nova-strategy') ?? 'visible') as HydrationStrategy;
    if (strategy === 'eager') eager.push(el);
    else if (strategy === 'idle') idle.push(el);
    else visible.push(el); // default: 'visible'
  }

  // 1. Eager — hydrate immediately, in parallel
  if (eager.length > 0) {
    await Promise.all(eager.map(hydrateIsland));
  }

  // 2. Visible — hydrate when the element enters the viewport
  if (visible.length > 0) {
    scheduleVisibleHydration(visible);
  }

  // 3. Idle — hydrate during browser idle time
  if (idle.length > 0) {
    scheduleIdleHydration(idle);
  }
}

/**
 * Use IntersectionObserver to hydrate islands as they scroll into view.
 * `rootMargin: '200px'` starts fetching 200px before the island is visible.
 */
function scheduleVisibleHydration(elements: Element[]): void {
  if (!('IntersectionObserver' in window)) {
    // Fallback: hydrate everything immediately if IO is not supported
    elements.forEach(hydrateIsland);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          hydrateIsland(entry.target);
        }
      }
    },
    {
      // Start loading 200px before the island enters the viewport
      rootMargin: '200px',
    }
  );

  elements.forEach((el) => observer.observe(el));
}

/**
 * Use requestIdleCallback (or setTimeout fallback) to hydrate low-priority islands.
 */
function scheduleIdleHydration(elements: Element[]): void {
  const schedule =
    typeof requestIdleCallback !== 'undefined'
      ? (fn: () => void) => requestIdleCallback(fn, { timeout: 2000 })
      : (fn: () => void) => setTimeout(fn, 200);

  elements.forEach((el) => {
    schedule(() => hydrateIsland(el));
  });
}

// ─── SSR / template helpers ───────────────────────────────────────────────────

/**
 * Extract island metadata from server-rendered HTML comments.
 */
export function extractIslandMetadata(html: string): IslandMetadata[] {
  const islands: IslandMetadata[] = [];
  const islandPattern = /<!--\s*nova-island:\s*({.*?})\s*-->/g;
  let match;
  while ((match = islandPattern.exec(html)) !== null) {
    try {
      islands.push(JSON.parse(match[1]));
    } catch (e) {
      console.error('[nova/islands] Failed to parse island metadata:', e);
    }
  }
  return islands;
}

/**
 * Generate the HTML placeholder that the server embeds for each island.
 * The `strategy` attribute controls client-side hydration timing.
 */
export function generateIslandPlaceholder(
  id: string,
  name: string,
  props: Record<string, any>,
  strategy: HydrationStrategy = 'visible'
): string {
  const hydrationData = serializeProps(props);
  return (
    `<div data-nova-island="${id}" ` +
    `data-nova-strategy="${strategy}" ` +
    `data-nova-name="${name}" ` +
    `data-nova-hydration='${hydrationData}'></div>`
  );
}
