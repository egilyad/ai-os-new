/**
 * DshService — N.2 (DeepSeek-Harness parity: plugins, presets, trajectory).
 *
 * - Plugin registry (everything-is-a-plugin, kv `dsh-plugins/*`).
 * - 4 presets mapped onto RunQueue toolkits: standard (all), code
 *   (workspace+http+math), minimal (workspace.read+math), creative (all).
 * - Trajectory: append-only per-run event log in kv + replay rendering.
 * - Prefix-cache discipline helper: stable context first, volatile last.
 * - Subagent spawn via CoordinationService delegate; healthCheck summary.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { ICoordinationService } from '../../contracts/interop';
import type { IRunQueueService } from '../../contracts/rivals';
import type { IDshService } from '../../contracts/rivals9';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('DSH');

type Preset = 'standard' | 'code' | 'minimal' | 'creative';

const PRESET_TOOLKITS: Record<Preset, { name: string; prefixes: string[] }> = {
    standard: { name: 'dsh-standard', prefixes: ['workspace.', 'http.', 'math.', 'time.', 'knowledge.', 'mcp.', 'memory.'] },
    code: { name: 'dsh-code', prefixes: ['workspace.', 'http.', 'math.', 'time.'] },
    minimal: { name: 'dsh-minimal', prefixes: ['workspace.read', 'math.'] },
    creative: { name: 'dsh-creative', prefixes: ['workspace.', 'http.', 'math.', 'time.', 'knowledge.'] },
};

interface PluginDoc {
    name: string;
    enabled: boolean;
    capabilities: string[];
}

export class DshService implements IDshService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private queue?: IRunQueueService,
        private coordination?: ICoordinationService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
        // Seed the 4 preset toolkits once (idempotent by name).
        if (this.queue) {
            try {
                const existing = await this.queue.listToolkits();
                const names = new Set(existing.map((t) => t.name));
                for (const preset of Object.keys(PRESET_TOOLKITS) as Preset[]) {
                    const def = PRESET_TOOLKITS[preset]!;
                    if (!names.has(def.name)) {
                        await this.queue.defineToolkit(def.name, def.prefixes);
                    }
                }
            } catch (e) {
                LOGGER.warn('preset seeding failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async registerPlugin(name: string, capabilities: string[] = []): Promise<void> {
        const doc: PluginDoc = {
            name: name.slice(0, 120),
            enabled: true,
            capabilities: capabilities.map((c) => c.slice(0, 80)).slice(0, 20),
        };
        await this.dal.kv.set(`dsh-plugins/${doc.name}`, doc);
        this.events.emit(EVENTS.DSH_PLUGIN, { name: doc.name, enabled: true });
    }

    async setPluginEnabled(name: string, enabled: boolean): Promise<void> {
        const doc = await this.dal.kv.get<PluginDoc>(`dsh-plugins/${name}`);
        if (!doc) throw new Error(`Plugin not found: ${name}`);
        doc.enabled = enabled;
        await this.dal.kv.set(`dsh-plugins/${name}`, doc);
        this.events.emit(EVENTS.DSH_PLUGIN, { name, enabled });
    }

    async listPlugins(): Promise<Array<{ name: string; enabled: boolean; capabilities: string[] }>> {
        const rows = await this.dal.kv.list('dsh-plugins/');
        return rows.map((r) => r.value as PluginDoc);
    }

    async presetTools(preset: Preset): Promise<string[]> {
        return [...PRESET_TOOLKITS[preset].prefixes];
    }

    async appendTrajectory(runId: string, event: string, data: Record<string, unknown> = {}): Promise<void> {
        const key = `trajectory/${runId.slice(0, 120)}`;
        const log = (await this.dal.kv.get<Array<{ event: string; at: number }>>(key)) ?? [];
        log.push({ event: `${event} ${JSON.stringify(data).slice(0, 300)}`, at: Date.now() });
        if (log.length > 500) log.splice(0, log.length - 500);
        await this.dal.kv.set(key, log);
    }

    async trajectory(runId: string): Promise<Array<{ event: string; at: number }>> {
        return (await this.dal.kv.get<Array<{ event: string; at: number }>>(`trajectory/${runId.slice(0, 120)}`)) ?? [];
    }

    /** Prefix-cache discipline: stable blocks first, volatile content last. */
    orderForCache(stable: string[], volatile: string[]): string[] {
        return [...stable, ...volatile];
    }

    async spawnSubagent(goal: string): Promise<string> {
        if (!this.coordination) return `subagent-queued: ${goal.slice(0, 120)} (no coordination)`;
        return this.coordination.spawnSubCrew(goal);
    }

    async healthCheck(): Promise<{ plugins: number; keys: boolean; queue: number }> {
        const plugins = (await this.dal.kv.list('dsh-plugins/')).length;
        const keys = (await this.dal.kv.list('conn/')).length;
        let queue = 0;
        if (this.queue) {
            try {
                queue = (await this.queue.list()).filter((q) => q.status === 'queued').length;
            } catch {
                queue = -1;
            }
        }
        return { plugins, keys: keys > 0, queue };
    }
}
