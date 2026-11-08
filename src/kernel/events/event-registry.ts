import { z } from 'zod';
import {
    ApiKeySchema,
    SystemStateSchema,
    ChatResponseSchema,
    MemoryEntrySchema,
    CognitiveSkillSchema,
    RoleSchema,
    ToolDefinitionSchema,
    MCPServerConfigSchema,
    BudgetStateSnapshotSchema,
    PolicyViolationSchema,
    CognitiveDecisionSchema,
    OptimizationSuggestionSchema,
    AdapterMessageSchema,
} from '../types/schema-types';

import { EVENT_REGISTRY_GROUP_1 } from './registry-groups/event-registry-group-1-session-binding';
import { EVENT_REGISTRY_GROUP_2 } from './registry-groups/event-registry-group-2-persona-events';
import { EVENT_REGISTRY_GROUP_3 } from './registry-groups/event-registry-group-3-provider-catalog-personality';
import { EVENT_REGISTRY_GROUP_4 } from './registry-groups/event-registry-group-4-debate-extras';
import { EVENT_REGISTRY_GROUP_5 } from './registry-groups/event-registry-group-5-conversation-core-lifecycle-generic-inde';
import { EVENT_REGISTRY_GROUP_6 } from './registry-groups/event-registry-group-6-trust-ecosystem-phase-c-waves-10-11';
import { EVENT_REGISTRY_GROUP_7 } from './registry-groups/event-registry-group-7-rival-parity-6-phase-k-sixth-10';
import { EVENT_REGISTRY_GROUP_8 } from './registry-groups/event-registry-group-8-deploy-bundle-phase-57-g4';
import { EVENT_REGISTRY_GROUP_9 } from './registry-groups/event-registry-group-9-python-runtime-roadmapp-md-p7';

export const EVENT_REGISTRY = {
    ...EVENT_REGISTRY_GROUP_1,
    ...EVENT_REGISTRY_GROUP_2,
    ...EVENT_REGISTRY_GROUP_3,
    ...EVENT_REGISTRY_GROUP_4,
    ...EVENT_REGISTRY_GROUP_5,
    ...EVENT_REGISTRY_GROUP_6,
    ...EVENT_REGISTRY_GROUP_7,
    ...EVENT_REGISTRY_GROUP_8,
    ...EVENT_REGISTRY_GROUP_9,
} as const;

type Registry = typeof EVENT_REGISTRY;

// ── Derived: EVENTS (runtime string constants) ────────────────────────────
type EventsType = { [K in keyof Registry]: Registry[K]['name'] & string };

function buildEvents(): EventsType {
    const result: Record<string, string> = {};
    for (const key of Object.keys(EVENT_REGISTRY) as Array<keyof Registry>) {
        result[key as string] = EVENT_REGISTRY[key].name;
    }
    Object.freeze(result);
    return result as unknown as EventsType;
}

export const EVENTS: EventsType = buildEvents();

// ── Derived: EventMap (type-level: event name → payload type) ─────────────
export type EventMap = {
    [K in keyof Registry as Registry[K]['name']]: z.infer<Registry[K]['schema']>;
} & { '*': { event: string; data: Record<string, unknown> } };

// ── Derived: EventValidators (runtime Zod schema lookup) ──────────────────
type EventValidatorsType = Record<string, z.ZodType<unknown>>;

function buildValidators(): EventValidatorsType {
    const result: EventValidatorsType = {};
    for (const key of Object.keys(EVENT_REGISTRY) as Array<keyof Registry>) {
        const entry = EVENT_REGISTRY[key];
        result[entry.name] = entry.schema;
    }
    return result;
}

export const EventValidators: EventValidatorsType = buildValidators();
