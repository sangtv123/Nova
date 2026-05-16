/**
 * Plugin hook types
 */
export type HookName =
  | 'beforeCompile'
  | 'afterCompile'
  | 'beforeBuild'
  | 'afterBuild'
  | 'beforeSSR'
  | 'afterSSR'
  | 'resolveId'
  | 'load'
  | 'transform'
  | 'hmrUpdate';

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

  // Hooks
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
export class PluginManager {
  private plugins: Plugin[] = [];
  private hooks = new Map<HookName, Plugin[]>();

  /**
   * Register plugin
   */
  use(plugin: Plugin): this {
    this.plugins.push(plugin);

    // Index plugin by hooks
    for (const hookName of Object.keys(plugin) as HookName[]) {
      if (hookName.startsWith('before') || hookName.startsWith('after') || hookName === 'hmrUpdate') {
        if (!this.hooks.has(hookName)) {
          this.hooks.set(hookName, []);
        }
        this.hooks.get(hookName)!.push(plugin);
      }
    }

    return this;
  }

  /**
   * Run hook
   */
  async runHook<T>(
    name: HookName,
    input: T,
    context?: PluginContext
  ): Promise<T> {
    const pluginList = this.hooks.get(name) || [];

    for (const plugin of pluginList) {
      const hook = (plugin as any)[name];
      if (hook) {
        try {
          const result = await Promise.resolve(hook.call(plugin, input, context));
          if (result != null) {
            input = result;
          }
        } catch (error) {
          console.error(`Plugin ${plugin.name} hook ${name} failed:`, error);
        }
      }
    }

    return input;
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return this.plugins;
  }

  /**
   * Get plugins sorted by enforcement order
   */
  getSortedPlugins(): Plugin[] {
    return [...this.plugins].sort((a, b) => {
      const orderMap = { pre: -1, normal: 0, post: 1 };
      const aOrder = orderMap[a.apply || 'normal'];
      const bOrder = orderMap[b.apply || 'normal'];
      return aOrder - bOrder;
    });
  }
}

/**
 * Create plugin
 */
export function definePlugin(plugin: Plugin): Plugin {
  return plugin;
}

/**
 * Built-in plugins
 */

/**
 * Vue plugin for Nova
 */
export const vuePlugin = definePlugin({
  name: 'nova-vue',
  version: '0.0.1',
  apply: 'pre',

  transform(code: string, id: string): string | null {
    if (!id.endsWith('.vue')) return null;

    // Transform .vue files to Nova components
    return `/* Transformed Vue component: ${id} */\n${code}`;
  },
});

/**
 * CSS module plugin
 */
export const cssModulePlugin = definePlugin({
  name: 'nova-css-modules',
  version: '0.0.1',

  resolveId(id: string): string | null {
    if (id.endsWith('.module.css')) {
      return id;
    }
    return null;
  },

  load(id: string): string | null {
    if (!id.endsWith('.module.css')) return null;

    // Load CSS as module
    return `export default {};`;
  },
});

/**
 * Auto-import plugin
 */
export const autoImportPlugin = definePlugin({
  name: 'nova-auto-import',
  version: '0.0.1',

  beforeCompile(code: string, id: string): string | null {
    // Auto-import common Nova utilities
    if (!code.includes('import')) {
      return `import { signal, computed, effect } from '@nova/signals';\n${code}`;
    }
    return null;
  },
});
