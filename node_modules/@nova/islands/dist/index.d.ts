/**
 * Island metadata
 */
export interface IslandMetadata {
    id: string;
    name: string;
    props: Record<string, any>;
    hydrationData: string;
}
/**
 * Register an island component for hydration
 * Can accept a factory (for lazy loading) or a direct component
 */
export declare function registerIsland(id: string, componentOrFactory: any): void;
/**
 * Serialize island props for HTML embedding.
 * Functions and Symbols are skipped (not serialisable).
 */
export declare function serializeProps(props: Record<string, any>): string;
/**
 * Deserialize island props from HTML attribute.
 */
export declare function deserializeProps(serialized: string): Record<string, any>;
/**
 * Mount strategy options
 */
export type HydrationStrategy = 'eager' | 'visible' | 'idle';
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
export declare function mountIslands(): Promise<void>;
/**
 * Extract island metadata from server-rendered HTML comments.
 */
export declare function extractIslandMetadata(html: string): IslandMetadata[];
/**
 * Generate the HTML placeholder that the server embeds for each island.
 * The `strategy` attribute controls client-side hydration timing.
 */
export declare function generateIslandPlaceholder(id: string, name: string, props: Record<string, any>, strategy?: HydrationStrategy): string;
//# sourceMappingURL=index.d.ts.map