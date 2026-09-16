/**
 * ModesService — G.2 (Roo-style modes, additive).
 *
 * Built-in modes (architect/code/debug/ask) + custom mode CRUD persisted in
 * the DAL kv store (`modes/*` — no schema change). Each mode maps to a
 * toolkit id; `modeAllows()` gates tools through RunQueueService toolkits.
 * Task checkpoints already exist in the graph runtime — modes reference them.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IRunQueueService } from '../../contracts/rivals';
import type { IModesService } from '../../contracts/rivals2';
import type { ModeDef } from '../../types/rival2-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Modes');

const BUILTIN: Array<{ name: string; systemPrompt: string }> = [
    {
        name: 'architect',
        systemPrompt: 'You are a software architect. Design first: modules, interfaces, risks. No code — produce a plan with file list.',
    },
    {
        name: 'code',
        systemPrompt: 'You are a senior engineer. Implement precisely what was planned. Small diffs, tested assumptions.',
    },
    {
        name: 'debug',
        systemPrompt: 'You are a debugger. Reproduce first, form hypotheses, bisect. Report root cause + minimal fix.',
    },
    {
        name: 'ask',
        systemPrompt: 'You answer questions about the codebase. Read before answering. Say when unsure.',
    },
];

export class ModesService implements IModesService {
    private currentId: string | null = null;

    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private queue?: IRunQueueService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Modes', 'init', {});
        for (const b of BUILTIN) {
            const existing = await this.dal.kv.get<ModeDef>(`modes/${b.name}`);
            if (!existing) {
                await this.dal.kv.set<ModeDef>(`modes/${b.name}`, {
                    id: `mode-${b.name}`,
                    name: b.name,
                    systemPrompt: b.systemPrompt,
                    custom: false,
                    createdAt: Date.now(),
                });
            }
        }
        if (!this.currentId) this.currentId = 'mode-code';
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async listModes(): Promise<ModeDef[]> {
        const rows = await this.dal.kv.list('modes/');
        return rows
            .map((r) => r.value as ModeDef)
            .sort((a, b) => Number(a.custom) - Number(b.custom) || a.name.localeCompare(b.name));
    }

    async defineMode(name: string, systemPrompt: string, toolkitId?: string): Promise<ModeDef> {
        const mode: ModeDef = {
            id: genId('mode'),
            name: name.slice(0, 80),
            systemPrompt: systemPrompt.slice(0, 4000),
            toolkitId,
            custom: true,
            createdAt: Date.now(),
        };
        await this.dal.kv.set<ModeDef>(`modes/custom:${mode.id}`, mode);
        return mode;
    }

    async switchMode(modeId: string): Promise<ModeDef> {
        const mode = await this.find(modeId);
        if (!mode) throw new Error(`Mode not found: ${modeId}`);
        this.currentId = mode.id;
        this.events.emit(EVENTS.MODES_SWITCHED, { modeId: mode.id, name: mode.name });
        return mode;
    }

    async currentMode(): Promise<ModeDef | null> {
        if (!this.currentId) return null;
        return this.find(this.currentId);
    }

    async modeAllows(modeId: string, tool: string): Promise<boolean> {
        const mode = await this.find(modeId);
        if (!mode) throw new Error(`Mode not found: ${modeId}`);
        if (!mode.toolkitId || !this.queue) return true;
        return this.queue.toolkitAllows(mode.toolkitId, tool);
    }

    private async find(id: string): Promise<ModeDef | null> {
        const direct = await this.dal.kv.get<ModeDef>(`modes/${id}`);
        if (direct) return direct;
        const rows = await this.dal.kv.list('modes/');
        const found = rows.map((r) => r.value as ModeDef).find((m) => m.id === id || m.name === id);
        return found ?? null;
    }
}
