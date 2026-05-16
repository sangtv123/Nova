/**
 * Plugin manager
 */
export class PluginManager {
    constructor() {
        this.plugins = [];
        this.hooks = new Map();
    }
    /**
     * Register plugin
     */
    use(plugin) {
        this.plugins.push(plugin);
        // Index plugin by hooks
        for (const hookName of Object.keys(plugin)) {
            if (hookName.startsWith('before') || hookName.startsWith('after') || hookName === 'hmrUpdate') {
                if (!this.hooks.has(hookName)) {
                    this.hooks.set(hookName, []);
                }
                this.hooks.get(hookName).push(plugin);
            }
        }
        return this;
    }
    /**
     * Run hook
     */
    async runHook(name, input, context) {
        const pluginList = this.hooks.get(name) || [];
        for (const plugin of pluginList) {
            const hook = plugin[name];
            if (hook) {
                try {
                    const result = await Promise.resolve(hook.call(plugin, input, context));
                    if (result != null) {
                        input = result;
                    }
                }
                catch (error) {
                    console.error(`Plugin ${plugin.name} hook ${name} failed:`, error);
                }
            }
        }
        return input;
    }
    /**
     * Get all registered plugins
     */
    getPlugins() {
        return this.plugins;
    }
    /**
     * Get plugins sorted by enforcement order
     */
    getSortedPlugins() {
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
export function definePlugin(plugin) {
    return plugin;
}
/**
 * Tailwind CSS plugin for Nova
 */
export const tailwindPlugin = definePlugin({
    name: 'nova-tailwind',
    version: '0.0.1',
    apply: 'pre',
    async transform(code, id) {
        if (!id.endsWith('.css'))
            return null;
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
    afterSSR(html, ctx) {
        const title = ctx.config.title || 'Nova App';
        const description = ctx.config.description || 'Built with Nova';
        return html
            .replace('<head>', `<head>\n  <title>${title}</title>\n  <meta name="description" content="${description}">`)
            .replace('</head>', `  <link rel="canonical" href="${ctx.config.url || ''}">\n</head>`);
    },
});
//# sourceMappingURL=index.js.map