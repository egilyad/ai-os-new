import type { IPluginRegistry, PluginManifest } from '../../contracts/plugin';
import { validateManifest } from './plugin-manifest';

export interface PluginLoaderDeps {
    registry: IPluginRegistry;
    /** Хост, в который подключаются инструменты плагина. */
    host: {
        registerTools: (
            manifest: PluginManifest,
            executor?: (name: string, args: Record<string, unknown>) => Promise<string>,
            context?: unknown,
        ) => void;
        unregisterTools: (manifestId: string) => void;
    };
}

/**
 * PluginLoader — загрузчик плагинов (SPEC_06 §4).
 *
 * Читает манифест, валидирует его (plugin-manifest), регистрирует в реестре и
 * подключает инструменты в PluginHost. Активация/деактивация проксируются в
 * реестр и синхронизируют инструменты хоста.
 */
export class PluginLoader {
    private deps: PluginLoaderDeps;

    constructor(deps: PluginLoaderDeps) {
        this.deps = deps;
    }

    /**
     * Подключает плагин: валидация → регистрация в реестре → регистрация
     * инструментов в хосте → активация. Возвращает true при успехе.
     */
    async load(
        manifest: PluginManifest,
        executor?: (name: string, args: Record<string, unknown>) => Promise<string>,
        context?: unknown,
    ): Promise<boolean> {
        const validation = validateManifest(manifest);
        if (!validation.ok) return false;

        const ok = await this.deps.registry.register(manifest);
        if (!ok) return false;

        this.deps.host.registerTools(manifest, executor, context);
        await this.deps.registry.activate(manifest.id);
        return true;
    }

    /** Отключает плагин: снимает инструменты из хоста и дерегистрирует. */
    async unload(id: string): Promise<boolean> {
        const registered = this.deps.registry.get(id);
        if (!registered) return false;
        this.deps.host.unregisterTools(id);
        return this.deps.registry.unregister(id);
    }

    /** Перезагрузка плагина (снятие + повторная регистрация). */
    async reload(
        manifest: PluginManifest,
        executor?: (name: string, args: Record<string, unknown>) => Promise<string>,
        context?: unknown,
    ): Promise<boolean> {
        await this.unload(manifest.id);
        return this.load(manifest, executor, context);
    }
}
