import { z } from 'zod';
function event<N extends string, S extends z.ZodType>(name: N, schema: S) {
    return { name, schema } as const;
}
export const EVENT_REGISTRY_GROUP_9 = {

    // ── Python Runtime (roadmapp.md §P7) ──
    PYTHON_RUN_STARTED: event(
        'python:run:started',
        z.object({ projectId: z.string(), runId: z.string(), command: z.string() }),
    ),
    PYTHON_RUN_COMPLETED: event(
        'python:run:completed',
        z.object({
            projectId: z.string(),
            runId: z.string(),
            exitCode: z.number().nullable(),
            durationMs: z.number(),
        }),
    ),
    PYTHON_REQUIREMENT_ADDED: event(
        'python:requirement:added',
        z.object({ projectId: z.string(), requirement: z.string() }),
    ),

    // ── Artifacts (roadmapp.md §P11) ──
    ARTIFACT_CREATED: event(
        'artifact:created',
        z.object({
            projectId: z.string(),
            artifactId: z.string(),
            type: z.string(),
            name: z.string(),
        }),
    ),
    ARTIFACT_BUILD_COMPLETED: event(
        'artifact:build:completed',
        z.object({
            projectId: z.string(),
            artifactId: z.string(),
            success: z.boolean(),
            durationMs: z.number(),
        }),
    ),
    SNAPSHOT_CREATED: event(
        'snapshot:created',
        z.object({ projectId: z.string(), snapshotId: z.string(), fileCount: z.number() }),
    ),
    PROJECT_EXPORTED: event(
        'project:exported',
        z.object({ projectId: z.string(), fileCount: z.number() }),
    ),
    PROJECT_IMPORTED: event(
        'project:imported',
        z.object({ projectId: z.string(), fileCount: z.number() }),
    ),

    // ── Templates (roadmapp.md §P12) ──
    TEMPLATE_APPLIED: event(
        'template:applied',
        z.object({ projectId: z.string(), templateId: z.string(), fileCount: z.number() }),
    ),

    // ── Debate Integration (roadmapp.md §P13) ──
    PROJECT_DEBATE_STARTED: event(
        'project:debate:started',
        z.object({
            projectId: z.string(),
            debateId: z.string(),
            decision: z.string(),
            trigger: z.string(),
        }),
    ),
    PROJECT_DEBATE_VERDICT: event(
        'project:debate:verdict',
        z.object({ projectId: z.string(), debateId: z.string(), confidence: z.number() }),
    ),

    // ── Advanced Autonomy (roadmapp.md §P14) ──
    AUTONOMY_GOAL_CREATED: event(
        'autonomy:goal:created',
        z.object({ projectId: z.string(), goalId: z.string(), description: z.string() }),
    ),
    AUTONOMY_PHASE_ADVANCED: event(
        'autonomy:phase:advanced',
        z.object({ goalId: z.string(), fromPhase: z.string(), toPhase: z.string() }),
    ),
    AUTONOMY_TASK_COMPLETED: event(
        'autonomy:task:completed',
        z.object({ goalId: z.string(), taskId: z.string(), result: z.string() }),
    ),
    AUTONOMY_GOAL_COMPLETED: event(
        'autonomy:goal:completed',
        z.object({ goalId: z.string(), projectId: z.string(), durationMs: z.number() }),
    ),
    AUTONOMY_GOAL_FAILED: event(
        'autonomy:goal:failed',
        z.object({ goalId: z.string(), projectId: z.string(), reason: z.string() }),
    ),

    // ── Project Observability (roadmapp.md §P8) ──
    PROJECT_ACTIVITY_LOGGED: event(
        'project:activity:logged',
        z.object({ projectId: z.string(), type: z.string(), agentId: z.string() }),
    ),
    PROJECT_ERROR_LOGGED: event(
        'project:error:logged',
        z.object({
            projectId: z.string(),
            source: z.string(),
            severity: z.string(),
            message: z.string(),
        }),
    ),

    // ── Agent Channels (mIRC-like) ──
    CHANNEL_CREATED: event(
        'channel:created',
        z.object({ channelId: z.string(), name: z.string() }),
    ),
    CHANNEL_MESSAGE: event(
        'channel:message',
        z.object({
            channelId: z.string(),
            messageId: z.string(),
            authorId: z.string(),
            kind: z.string(),
            content: z.string(),
            mentions: z.array(z.string()).optional(),
        }),
    ),
    CHANNEL_AGENT_JOINED: event(
        'channel:agent:joined',
        z.object({ channelId: z.string(), agentId: z.string(), displayName: z.string() }),
    ),
    CHANNEL_AGENT_LEFT: event(
        'channel:agent:left',
        z.object({ channelId: z.string(), agentId: z.string() }),
    ),
    CHANNEL_ARCHIVED: event('channel:archived', z.object({ channelId: z.string() })),

    // ── Plugins (SPEC_06) ──
    PLUGIN_REGISTERED: event('plugin:registered', z.object({ id: z.string(), status: z.string() })),
    PLUGIN_UNREGISTERED: event('plugin:unregistered', z.object({ id: z.string() })),
    PLUGIN_ACTIVATED: event('plugin:activated', z.object({ id: z.string() })),
    PLUGIN_DEACTIVATED: event('plugin:deactivated', z.object({ id: z.string() })),
    PLUGIN_LOAD_FAILED: event(
        'plugin:load:failed',
        z.object({ id: z.string(), reason: z.string() }),
    ),
} as const;