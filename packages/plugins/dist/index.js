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
 * Built-in plugins
 */
/**
 * Vue plugin for Nova
 */
export const vuePlugin = definePlugin({
    name: 'nova-vue',
    version: '0.0.1',
    apply: 'pre',
    transform(code, id) {
        if (!id.endsWith('.vue'))
            return null;
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
    resolveId(id) {
        if (id.endsWith('.module.css')) {
            return id;
        }
        return null;
    },
    load(id) {
        if (!id.endsWith('.module.css'))
            return null;
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
    beforeCompile(code, id) {
        // Auto-import common Nova utilities
        if (!code.includes('import')) {
            return `import { signal, computed, effect } from '@nova/signals';\n${code}`;
        }
        return null;
    },
});
//# sourceMappingURL=index.js.map