import type { IPluginRegistry, PluginManifest, RegisteredPlugin } from '../../contracts/plugin';
import { validateManifest } from './plugin-manifest';
import { EVENTS } from '../../events/event-registry';

const KERNEL_VERSION = '4.5.0';

export interface PluginRegistryBus {
    emit(event: string, data: Record<string, unknown>): void;
}

export interface PluginRegistryDeps {
    /** Резолв текущей версии ядра (по умолчанию 4.5.0). */
    kernelVersion?: string;
    /** Опциональный EventBus для событий жизненного цикла плагинов. */
    bus?: PluginRegistryBus;
}

/**
 * PluginRegistry — in-memory реестр плагинов (SPEC_06).
 *
 * Регистрация валидирует манифест и минимальную версию ядра. Активация —
 * только переключение статуса; реальная загрузка (сервисы/панели/инструменты)
 * — следующий слой (PluginHost).
 */
export class PluginRegistry implements IPluginRegistry {
    private plugins = new Map<string, RegisteredPlugin>();
    private kernelVersion: string;
    private bus?: PluginRegistryBus;

    constructor(deps?: PluginRegistryDeps) {
        this.kernelVersion = deps?.kernelVersion ?? KERNEL_VERSION;
        this.bus = deps?.bus;
    }

    private emit(event: string, data: Record<string, unknown>): void {
        this.bus?.emit(event, data);
    }

    async register(manifest: PluginManifest): Promise<boolean> {
        const validation = validateManifest(manifest);
        if (!validation.ok) {
            this.plugins.set(manifest.id, {
                manifest,
                status: 'error',
                error: validation.errors.join('; '),
            });
            this.emit(EVENTS.PLUGIN_LOAD_FAILED, {
                id: manifest.id,
                reason: validation.errors.join('; '),
            });
            return false;
        }
        // Минимальная версия ядра
        const required = manifest.engines.os;
        if (!this.satisfies(required)) {
            this.plugins.set(manifest.id, {
                manifest,
                status: 'error',
                error: `kernel ${this.kernelVersion} does not satisfy engines.os ${required}`,
            });
            this.emit(EVENTS.PLUGIN_LOAD_FAILED, {
                id: manifest.id,
                reason: `kernel ${this.kernelVersion} does not satisfy engines.os ${required}`,
            });
            return false;
        }
        const existing = this.plugins.get(manifest.id);
        const status: RegisteredPlugin['status'] =
            existing?.status === 'active' ? 'active' : 'inactive';
        this.plugins.set(manifest.id, {
            manifest,
            status,
        });
        this.emit(EVENTS.PLUGIN_REGISTERED, { id: manifest.id, status });
        return true;
    }

    async unregister(id: string): Promise<boolean> {
        const removed = this.plugins.delete(id);
        if (removed) this.emit(EVENTS.PLUGIN_UNREGISTERED, { id });
        return removed;
    }

    async activate(id: string): Promise<boolean> {
        const p = this.plugins.get(id);
        if (!p || p.status === 'error') return false;
        p.status = 'active';
        this.plugins.set(id, p);
        this.emit(EVENTS.PLUGIN_ACTIVATED, { id });
        return true;
    }

    async deactivate(id: string): Promise<boolean> {
        const p = this.plugins.get(id);
        if (!p) return false;
        p.status = 'inactive';
        this.plugins.set(id, p);
        this.emit(EVENTS.PLUGIN_DEACTIVATED, { id });
        return true;
    }

    get(id: string): RegisteredPlugin | undefined {
        return this.plugins.get(id);
    }

    list(): RegisteredPlugin[] {
        return [...this.plugins.values()];
    }

    has(id: string): boolean {
        return this.plugins.has(id);
    }

    listActive(): RegisteredPlugin[] {
        return this.list().filter((p) => p.status === 'active');
    }

    /** Инструменты всех активных плагинов (для PluginHost). */
    getTools(): Array<{ name: string; manifestId: string }> {
        return this.listActive().flatMap((p) =>
            (p.manifest.contributes.tools ?? []).map((t) => ({
                name: t.name,
                manifestId: p.manifest.id,
            })),
        );
    }

    /** Экспорт зарегистрированных манифестов (для persist). */
    exportJson(): string {
        return JSON.stringify({ plugins: this.list().map((p) => p.manifest) });
    }

    /** Импорт манифестов (пере-регистрация). Возвращает число успешных. */
    async importJson(json: string): Promise<number> {
        try {
            const data = JSON.parse(json) as { plugins?: PluginManifest[] };
            const manifests = Array.isArray(data.plugins) ? data.plugins : [];
            let ok = 0;
            for (const m of manifests) {
                if (await this.register(m)) ok++;
            }
            return ok;
        } catch {
            return 0;
        }
    }

    private satisfies(required: string): boolean {
        const parse = (v: string) => v.split('.').map((n) => parseInt(n, 10) || 0);
        const r = parse(required);
        const c = parse(this.kernelVersion);
        for (let i = 0; i < 3; i++) {
            if ((c[i] ?? 0) < (r[i] ?? 0)) return false;
            if ((c[i] ?? 0) > (r[i] ?? 0)) return true;
        }
        return true;
    }
}
