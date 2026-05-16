/**
 * Plugin hook types
 */
export type HookName = 'beforeCompile' | 'afterCompile' | 'beforeBuild' | 'afterBuild' | 'beforeSSR' | 'afterSSR' | 'resolveId' | 'load' | 'transform' | 'hmrUpdate';
/**
 * Plugin context passed to hooks
 */
export interface PluginContext {
    env: 'dev' | 'prod';
    command: 'serve' | 'build';
    config: Record<string, any>;
    [key: string]: any;
}
/**
 * Plugin hook types
 */
export type BeforeCompileHook = (code: string, id: string, ctx?: PluginContext) => string | null;
export type AfterCompileHook = (code: string, id: string, ctx?: PluginContext) => string | null;
export type TransformHook = (code: string, id: string) => string | null;
export type ResolveIdHook = (id: string) => string | null;
export type LoadHook = (id: string) => string | null;
/**
 * Plugin interface
 */
export interface Plugin {
    name: string;
    version?: string;
    apply?: 'pre' | 'post' | 'normal';
    beforeCompile?: BeforeCompileHook;
    afterCompile?: AfterCompileHook;
    beforeBuild?: (ctx: PluginContext) => void;
    afterBuild?: (ctx: PluginContext) => void;
    beforeSSR?: (html: string, ctx: PluginContext) => string;
    afterSSR?: (html: string, ctx: PluginContext) => string;
    resolveId?: ResolveIdHook;
    load?: LoadHook;
    transform?: TransformHook;
    hmrUpdate?: (moduleId: string, ctx: PluginContext) => void;
}
/**
 * Plugin manager
 */
export declare class PluginManager {
    private plugins;
    private hooks;
    /**
     * Register plugin
     */
    use(plugin: Plugin): this;
    /**
     * Run hook
     */
    runHook<T>(name: HookName, input: T, context?: PluginContext): Promise<T>;
    /**
     * Get all registered plugins
     */
    getPlugins(): Plugin[];
    /**
     * Get plugins sorted by enforcement order
     */
    getSortedPlugins(): Plugin[];
}
/**
 * Create plugin
 */
export declare function definePlugin(plugin: Plugin): Plugin;
/**
 * Built-in plugins
 */
/**
 * Vue plugin for Nova
 */
export declare const vuePlugin: Plugin;
/**
 * CSS module plugin
 */
export declare const cssModulePlugin: Plugin;
/**
 * Auto-import plugin
 */
export declare const autoImportPlugin: Plugin;
//# sourceMappingURL=index.d.ts.map