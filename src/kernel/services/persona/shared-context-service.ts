/**
 * SharedContextService — Wave 4.3 (GUMMY-OS-inspired, local-first).
 *
 * Team shared context (notes/files/credential refs/history/decisions) scoped
 * to a crew, council, graph run or room + Goals (team + agent levels).
 *
 * Security rule: `credential_ref` entries store a REFERENCE NAME ONLY —
 * the service refuses bodies that look like secrets.
 */
import type { IEventBus } from '../../types/interfaces';
import type { PersonaRepository } from '../../dal/persona-repository';
import type { ISharedContextService } from '../../contracts/persona';
import type {
    ContextEntry,
    ContextEntryKind,
    Goal,
    GoalStatus,
    SharedContext,
} from '../../types/persona-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('SharedContext');

function now(): number {
    return Date.now();
}

const SECRET_HINT = /(sk-|api[_-]?key\s*[:=]|password\s*[:=]|bearer\s+[a-z0-9]|-----begin)/i;

export class SharedContextService implements ISharedContextService {
    constructor(
        private repo: PersonaRepository,
        private events: IEventBus,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('SharedContext', 'init', {});
    }

    async destroy(): Promise<void> {
        // no background work
    }

    async createContext(input: {
        name: string;
        scope: SharedContext['scope'];
        memberIds?: string[];
    }): Promise<SharedContext> {
        const t = now();
        const ctx: SharedContext = {
            id: genId('sctx'),
            name: input.name,
            scope: { ...input.scope },
            memberIds: input.memberIds ? [...input.memberIds] : [],
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putContext(ctx);
        this.events.emit(EVENTS.CONTEXT_CREATED, {
            contextId: ctx.id,
            scopeKind: ctx.scope.kind,
            scopeRef: ctx.scope.ref,
        });
        return ctx;
    }

    async getContext(id: string): Promise<SharedContext | null> {
        return this.repo.getContext(id);
    }

    async listContexts(scopeRef?: string): Promise<SharedContext[]> {
        const all = await this.repo.listContexts();
        if (!scopeRef) return all;
        return all.filter((c) => c.scope.ref === scopeRef || c.id === scopeRef);
    }

    async addEntry(
        contextId: string,
        kind: ContextEntryKind,
        body: string,
        opts: { title?: string; ref?: string; authorId?: string } = {},
    ): Promise<ContextEntry> {
        const ctx = await this.require(contextId);
        if (kind === 'credential_ref' && SECRET_HINT.test(body)) {
            throw new Error('credential_ref must store a reference name only — body looks like a secret');
        }
        const entry: ContextEntry = {
            id: genId('cent'),
            contextId,
            kind,
            title: opts.title,
            body: body.slice(0, 8000),
            ref: opts.ref,
            authorId: opts.authorId,
            createdAt: now(),
        };
        await this.repo.putEntry(entry);
        ctx.updatedAt = now();
        await this.repo.putContext(ctx);
        this.events.emit(EVENTS.CONTEXT_SHARED, { contextId, kind });
        return entry;
    }

    async listEntries(contextId: string): Promise<ContextEntry[]> {
        await this.require(contextId);
        return this.repo.listEntries(contextId);
    }

    async shareWith(contextId: string, memberId: string): Promise<SharedContext> {
        const ctx = await this.require(contextId);
        if (!ctx.memberIds.includes(memberId)) ctx.memberIds.push(memberId);
        ctx.updatedAt = now();
        await this.repo.putContext(ctx);
        this.events.emit(EVENTS.CONTEXT_SHARED, { contextId, kind: 'member' });
        return ctx;
    }

    async createGoal(input: {
        ownerId: string;
        title: string;
        level?: Goal['level'];
        description?: string;
        contextId?: string;
    }): Promise<Goal> {
        const t = now();
        const goal: Goal = {
            id: genId('goal'),
            contextId: input.contextId,
            ownerId: input.ownerId,
            level: input.level ?? 'team',
            title: input.title,
            description: input.description,
            status: 'active',
            progress: 0,
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putGoal(goal);
        this.events.emit(EVENTS.GOAL_CREATED, {
            goalId: goal.id,
            ownerId: goal.ownerId,
            level: goal.level,
        });
        return goal;
    }

    async updateProgress(goalId: string, progress: number): Promise<Goal> {
        const goal = await this.requireGoal(goalId);
        goal.progress = Math.max(0, Math.min(100, progress));
        if (goal.progress >= 100 && goal.status === 'active') {
            goal.status = 'achieved';
            this.events.emit(EVENTS.GOAL_COMPLETED, { goalId, ownerId: goal.ownerId });
        } else {
            this.events.emit(EVENTS.GOAL_PROGRESS, { goalId, progress: goal.progress });
        }
        goal.updatedAt = now();
        await this.repo.putGoal(goal);
        return goal;
    }

    async setGoalStatus(goalId: string, status: GoalStatus): Promise<Goal> {
        const goal = await this.requireGoal(goalId);
        goal.status = status;
        goal.updatedAt = now();
        await this.repo.putGoal(goal);
        if (status === 'achieved') {
            this.events.emit(EVENTS.GOAL_COMPLETED, { goalId, ownerId: goal.ownerId });
        }
        return goal;
    }

    async listGoals(ownerId?: string): Promise<Goal[]> {
        const all = await this.repo.listGoals();
        if (!ownerId) return all;
        return all.filter((g) => g.ownerId === ownerId);
    }

    private async require(id: string): Promise<SharedContext> {
        const ctx = await this.repo.getContext(id);
        if (!ctx) throw new Error(`Shared context not found: ${id}`);
        return ctx;
    }

    private async requireGoal(id: string): Promise<Goal> {
        const g = await this.repo.getGoal(id);
        if (!g) throw new Error(`Goal not found: ${id}`);
        return g;
    }
}
