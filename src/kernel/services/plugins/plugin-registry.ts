import type {
    IPluginRegistry,
    PluginManifest,
    RegisteredPlugin,
} from '../../contracts/plugin';
import { validateManifest } from './plugin-manifest';

const KERNEL_VERSION = '4.5.0';

export interface PluginRegistryDeps {
    /** Резолв текущей версии ядра (по умолчанию 4.5.0). */
    kernelVersion?: string;
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

    constructor(deps?: PluginRegistryDeps) {
        this.kernelVersion = deps?.kernelVersion ?? KERNEL_VERSION;
    }

    async register(manifest: PluginManifest): Promise<boolean> {
        const validation = validateManifest(manifest);
        if (!validation.ok) {
            this.plugins.set(manifest.id, {
                manifest,
                status: 'error',
                error: validation.errors.join('; '),
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
            return false;
        }
        const existing = this.plugins.get(manifest.id);
        this.plugins.set(manifest.id, {
            manifest,
            status: existing?.status === 'active' ? 'active' : 'inactive',
        });
        return true;
    }

    async unregister(id: string): Promise<boolean> {
        return this.plugins.delete(id);
    }

    async activate(id: string): Promise<boolean> {
        const p = this.plugins.get(id);
        if (!p || p.status === 'error') return false;
        p.status = 'active';
        this.plugins.set(id, p);
        return true;
    }

    async deactivate(id: string): Promise<boolean> {
        const p = this.plugins.get(id);
        if (!p) return false;
        p.status = 'inactive';
        this.plugins.set(id, p);
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
