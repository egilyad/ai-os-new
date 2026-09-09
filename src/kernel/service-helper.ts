import { defaultContainer } from './container';
import type { IContainer } from './container';

let _container: IContainer;
const resolved = new Map<string, unknown>();
let boundMethods = new WeakMap<object, Map<string | symbol, unknown>>();
const notFoundCache = new Map<string, number>();
const NOT_FOUND_TTL = 1000;

function ensureContainer(): IContainer {
    if (!_container) _container = defaultContainer;
    return _container;
}

export function lazyService<T extends object>(
    name: string,
    fallbacks?: Record<string, (...args: unknown[]) => unknown>,
): T {
    return new Proxy({} as T, {
        get(_, prop) {
            let instance = resolved.get(name);
            if (!instance) {
                const notFoundAt = notFoundCache.get(name);
                if (!notFoundAt || Date.now() - notFoundAt >= NOT_FOUND_TTL) {
                    try {
                        instance = ensureContainer().getOptional<unknown>(name);
                        if (instance) {
                            // B-06: attribute the locator edge to the factory currently
                            // resolving (if any) so the container graph isn't blind to it.
                            ensureContainer().recordDependencyFromActive(name);
                            resolved.set(name, instance);
                            notFoundCache.delete(name);
                        } else {
                            notFoundCache.set(name, Date.now());
                        }
                    } catch {
                        notFoundCache.set(name, Date.now());
                    }
                }
            }
            if (instance) {
                const val = (instance as Record<string | symbol, unknown>)[prop];
                if (typeof val === 'function') {
                    let cache = boundMethods.get(instance);
                    if (!cache) {
                        cache = new Map();
                        boundMethods.set(instance, cache);
                    }
                    let bound = cache.get(prop);
                    if (!bound) {
                        bound = (val as (...args: unknown[]) => unknown).bind(instance);
                        cache.set(prop, bound);
                    }
                    return bound;
                }
                if (val !== undefined && val !== null) return val;
            }
            if (fallbacks && prop in fallbacks) return fallbacks[prop as string];
            if (typeof prop !== 'symbol' && prop !== 'then' && prop !== 'toJSON') {
                throw new Error(
                    `ServiceNotRegisteredError: ${name} — ${String(prop)} accessed before registration`,
                );
            }
            return undefined;
        },
    });
}

/** Try to access a lazy service property without throwing — returns undefined if not registered. */
export function tryGetServiceProp<T>(lazyService: T, prop: string): unknown {
    try {
        return (lazyService as Record<string, unknown>)[prop];
    } catch {
        return undefined;
    }
}

/** Invalidate cached "not found" for a service — call after container.register(). */
export function invalidateLazyServiceNotFound(name: string): void {
    notFoundCache.delete(name);
}

/** Clear all resolved service caches — call on shutdown to prevent stale refs on restart. */
export function clearResolvedServices(): void {
    resolved.clear();
    notFoundCache.clear();
    boundMethods = new WeakMap();
}

export function getContainer() {
    return ensureContainer();
}
