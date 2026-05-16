/**
 * Simple Dependency Injection System for Nova
 * Inspired by Angular's DI
 */
const container = new Map();
/**
 * Provide a value or class instance to the DI container
 */
export function provide(token, value) {
    container.set(token, value);
}
/**
 * Inject a dependency from the DI container
 */
export function inject(token) {
    if (!container.has(token)) {
        // Auto-instantiate if it's a class
        if (typeof token === 'function' && /^\s*class\s+/.test(token.toString())) {
            const instance = new token();
            container.set(token, instance);
            return instance;
        }
        throw new Error(`[Nova DI] No provider found for: ${token.name || token}`);
    }
    return container.get(token);
}
/**
 * Service decorator (conceptual)
 */
export function Service() {
    return function (constructor) {
        // Mark as injectable
    };
}
//# sourceMappingURL=di.js.map