/**
 * Simple Dependency Injection System for Nova
 * Inspired by Angular's DI
 */
/**
 * Provide a value or class instance to the DI container
 */
export declare function provide<T>(token: any, value: T): void;
/**
 * Inject a dependency from the DI container
 */
export declare function inject<T>(token: any): T;
/**
 * Service decorator (conceptual)
 */
export declare function Service(): (constructor: Function) => void;
//# sourceMappingURL=di.d.ts.map