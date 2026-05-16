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
export type BeforeCompileHook = (code: string, id: string, ctx?: PluginContext) => Promise<string | null> | string | null;
export type AfterCompileHook = (code: string, id: string, ctx?: PluginContext) => Promise<string | null> | string | null;
export type TransformHook = (code: string, id: string) => Promise<string | null> | string | null;
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
 * Tailwind CSS plugin for Nova
 */
export const tailwindPlugin = definePlugin({
  name: 'nova-tailwind',
  version: '0.0.1',
  apply: 'pre',

  async transform(code: string, id: string): Promise<string | null> {
    if (!id.endsWith('.css')) return null;

    // In a real implementation, this would call tailwindcss.process()
    console.log(`[nova-tailwind] Processing ${id}...`);
    return `/* Tailwind processed */\n${code}`;
  },
});

/**
 * SEO optimization plugin
 */
export const seoPlugin = definePlugin({
  name: 'nova-seo',
  version: '0.0.1',

  afterSSR(html: string, ctx: PluginContext): string {
    const title = ctx.config.title || 'Nova App';
    const description = ctx.config.description || 'Built with Nova';

    return html
      .replace('<head>', `<head>\n  <title>${title}</title>\n  <meta name="description" content="${description}">`)
      .replace('</head>', `  <link rel="canonical" href="${ctx.config.url || ''}">\n</head>`);
  },
});
