import type { IPluginRegistry, PluginManifest } from '../../contracts/plugin';
import { validateManifest } from './plugin-manifest';
import type { PluginEventHandler, PluginServiceHandler } from './plugin-host';

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
        registerSubscriptions: (manifest: PluginManifest, handler?: PluginEventHandler) => void;
        registerMcpServers: (manifest: PluginManifest) => void;
        registerServices: (
            manifest: PluginManifest,
            handlers?: Record<string, PluginServiceHandler>,
        ) => void;
        unregisterAll: (manifestId: string) => void;
    };
    /**
     * Принцип минимальных привилегий (SPEC §3/§7): при true плагин с
     * инструментами, но без соответствующих permissions (tool:<name> | tool:*)
     * отклоняется.
     */
    enforceToolPermissions?: boolean;
}

function hasToolPermission(manifest: PluginManifest, toolName: string): boolean {
    const perms = manifest.permissions ?? [];
    return perms.includes('tool:*') || perms.includes(`tool:${toolName}`);
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

    private validateToolPermissions(manifest: PluginManifest): boolean {
        for (const t of manifest.contributes.tools ?? []) {
            if (!hasToolPermission(manifest, t.name)) return false;
        }
        return true;
    }

    /**
     * Подключает плагин: валидация → регистрация в реестре → регистрация
     * инструментов и подписок в хосте → активация. Возвращает true при успехе.
     */
    async load(
        manifest: PluginManifest,
        executor?: (name: string, args: Record<string, unknown>) => Promise<string>,
        context?: unknown,
        eventHandler?: PluginEventHandler,
        serviceHandlers?: Record<string, PluginServiceHandler>,
    ): Promise<boolean> {
        const validation = validateManifest(manifest);
        if (!validation.ok) return false;

        if (this.deps.enforceToolPermissions && !this.validateToolPermissions(manifest)) {
            return false;
        }

        const ok = await this.deps.registry.register(manifest);
        if (!ok) return false;

        this.deps.host.registerTools(manifest, executor, context);
        this.deps.host.registerSubscriptions(manifest, eventHandler);
        this.deps.host.registerMcpServers(manifest);
        this.deps.host.registerServices(manifest, serviceHandlers);
        await this.deps.registry.activate(manifest.id);
        return true;
    }

    /**
     * Парсит JSON-строку манифеста и подключает плагин.
     * Возвращает { ok, error? }.
     */
    async loadFromJson(
        json: string,
        executor?: (name: string, args: Record<string, unknown>) => Promise<string>,
        context?: unknown,
        eventHandler?: PluginEventHandler,
        serviceHandlers?: Record<string, PluginServiceHandler>,
    ): Promise<{ ok: boolean; error?: string }> {
        let manifest: PluginManifest;
        try {
            manifest = JSON.parse(json) as PluginManifest;
        } catch {
            return { ok: false, error: 'invalid JSON' };
        }
        const validation = validateManifest(manifest);
        if (!validation.ok) {
            return { ok: false, error: validation.errors.join('; ') };
        }
        const ok = await this.load(manifest, executor, context, eventHandler, serviceHandlers);
        return { ok };
    }

    /** Отключает плагин: снимает инструменты/подписки из хоста и дерегистрирует. */
    async unload(id: string): Promise<boolean> {
        const registered = this.deps.registry.get(id);
        if (!registered) return false;
        this.deps.host.unregisterAll(id);
        return this.deps.registry.unregister(id);
    }

    /** Перезагрузка плагина (снятие + повторная регистрация). */
    async reload(
        manifest: PluginManifest,
        executor?: (name: string, args: Record<string, unknown>) => Promise<string>,
        context?: unknown,
        eventHandler?: PluginEventHandler,
        serviceHandlers?: Record<string, PluginServiceHandler>,
    ): Promise<boolean> {
        await this.unload(manifest.id);
        return this.load(manifest, executor, context, eventHandler, serviceHandlers);
    }
}
