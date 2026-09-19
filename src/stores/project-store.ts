/**
 * Project Zustand store — observer over project:* events + service calls.
 *
 * Pure consumer of project:* events from EventBus; never writes projects directly.
 */
import { create } from 'zustand';
import { eventBus, EVENTS } from '../kernel/events/event-bus';
import type {
    ProjectId,
    ProjectTask,
    ProjectRun,
    ProjectFile,
    ProjectAgentAssignment,
} from '../kernel/types/project-types';
import { projectManagerService } from '../kernel/instances/services-extras';

// ── State ──

export interface ProjectView {
    id: ProjectId;
    name: string;
    description: string;
    type: string;
    status: string;
    agentIds: string[];
    createdAt: number;
    updatedAt: number;
}

export interface ProjectStoreState {
    projects: Map<ProjectId, ProjectView>;
    order: ProjectId[];
    tasks: Map<string, ProjectTask>;
    runs: Map<string, ProjectRun>;
    files: Map<string, ProjectFile[]>;
    assignments: Map<ProjectId, ProjectAgentAssignment[]>;
    selectedProjectId: ProjectId | null;
    loading: boolean;
    error: string | null;

    // ── Actions ──
    loadProjects: () => Promise<void>;
    select: (id: ProjectId | null) => void;
    refresh: () => Promise<void>;
    clear: () => void;
}

let _subscribed = false;
let _unsubs: Array<() => void> = [];

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
    projects: new Map(),
    order: [],
    tasks: new Map(),
    runs: new Map(),
    files: new Map(),
    assignments: new Map(),
    selectedProjectId: null,
    loading: false,
    error: null,

    loadProjects: async () => {
        set({ loading: true, error: null });
        try {
            // lazyService proxy is the instance itself — not callable
            const list = await projectManagerService.list();
            const projects = new Map<ProjectId, ProjectView>();
            const order: ProjectId[] = [];
            for (const p of list) {
                projects.set(p.id, {
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    type: p.type,
                    status: p.status,
                    agentIds: p.agentIds,
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt,
                });
                order.push(p.id);
            }
            set({ projects, order, loading: false });
        } catch (e) {
            set({ error: String(e), loading: false });
        }
    },

    select: (id) => set({ selectedProjectId: id }),

    refresh: async () => {
        const state = get();
        if (state.loading) return;
        await state.loadProjects();
    },

    clear: () =>
        set({
            projects: new Map(),
            order: [],
            tasks: new Map(),
            runs: new Map(),
            files: new Map(),
            assignments: new Map(),
            selectedProjectId: null,
            loading: false,
            error: null,
        }),
}));

// ── Event subscriptions (lazy) ──

export function ensureSubscribed(): void {
    if (_subscribed) return;
    _subscribed = true;

    const store = useProjectStore.getState();
    const reload = () => store.refresh?.();

    // Listen for project:* events and reload
    _unsubs.push(
        eventBus.onSafe(EVENTS.PROJECT_CREATED, reload),
        eventBus.onSafe(EVENTS.PROJECT_UPDATED, reload),
        eventBus.onSafe(EVENTS.PROJECT_DELETED, reload),
        eventBus.onSafe(EVENTS.PROJECT_AGENT_ASSIGNED, reload),
        eventBus.onSafe(EVENTS.PROJECT_AGENT_REMOVED, reload),
    );
}

export function destroy(): void {
    for (const unsub of _unsubs) unsub();
    _unsubs = [];
    _subscribed = false;
    useProjectStore.getState().clear();
}
