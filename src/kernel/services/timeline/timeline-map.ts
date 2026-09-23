/**
 * Timeline declarative map — Phase X+56 (11 → 60, далее до 260).
 *
 * Каждый EVENT_REGISTRY ключ → { category, title, severity, entity }
 * Используется в `timeline-service.ts` (subscribeAll) и `execution-viz-service.ts`.
 * Сейчас покрыто 60, остальные — через subscribeAll fallback, переносим по 10 за заход.
 * Canvas drag-drop — после рантайма (BLOCKED).
 */

// helper to build entry
function e(category: string, title: (d: Record<string, unknown>) => string, severity: 'info' | 'warning' | 'error' | 'critical' = 'info', entity?: string) {
    return { category, title, severity, entity } as const;
}

export const TIMELINE_MAP: Record<
    string,
    { category: string; title: (d: Record<string, unknown>) => string; severity: 'info' | 'warning' | 'error' | 'critical'; entity?: string }
> = {
    // fleet/ops — 6.3 (11)
    'crew:created': e('fleet', (d) => `Crew created: ${String(d.name ?? d.id ?? '')}`, 'info', 'crewId'),
    'crew:started': e('fleet', (d) => `Crew started: ${String(d.crewId ?? d.id ?? '')}`, 'info', 'crewId'),
    'crew:completed': e('fleet', (d) => `Crew completed: ${String(d.crewId ?? '')}`, 'info', 'crewId'),
    'crew:failed': e('fleet', (d) => `Crew failed: ${String(d.error ?? '')}`, 'warning', 'crewId'),
    'council:created': e('fleet', (d) => `Council created: ${String(d.topic ?? '')}`.slice(0, 80), 'info', 'sessionId'),
    'council:completed': e('fleet', (d) => `Council completed: ${String(d.winnerId ?? '')}`, 'info', 'sessionId'),
    'graph:started': e('fleet', (d) => `Graph started: ${String(d.graphId ?? '')}`, 'info', 'runId'),
    'graph:completed': e('fleet', (d) => `Graph completed: ${String(d.runId ?? '')}`, 'info', 'runId'),
    'graph:failed': e('fleet', (d) => `Graph failed: ${String(d.error ?? '')}`, 'warning', 'runId'),
    'meter:alert': e('ops', (d) => `Meter alert: ${String(d.name ?? d.metric ?? '')}`, 'critical', 'name'),
    'err:captured': e('ops', (d) => `Error: ${String(d.message ?? d.name ?? '')}`, 'error', 'id'),
    'sop:phase': e('fleet', (d) => `SOP ${String(d.phase ?? '')} @${String(d.role ?? '')}`, 'info', 'loopId'),
    'dyad:done': e('fleet', (d) => `Dyad done: ${String(d.loopId ?? '')} ${String(d.turns ?? '')} turns`, 'info', 'loopId'),
    'graph:hitl': e('fleet', (d) => `HITL: ${String(d.nodeId ?? '')}`, 'warning', 'runId'),

    // G1/G2 new domains
    'knowledge:added': e('knowledge', (d) => `Knowledge added: ${String(d.sourceId ?? '')} ${String(d.chunks ?? '')} chunks`, 'info', 'sourceId'),
    'knowledge:hybrid:retrieved': e('knowledge', (d) => `Hybrid retrieved: ${String(d.count ?? 0)} (${String(d.bm25Candidates ?? 0)} bm25 + ${String(d.vectorCandidates ?? 0)} vec)`, 'info', 'query'),
    'catalog:updated': e('tool', (d) => `Catalog updated @${String(d.at ?? '')}`, 'info'),
    'tool:executed': e('tool', (d) => `Tool ${String(d.tool ?? '')} ${d.ok ? 'ok' : 'fail'} ${String(d.latencyMs ?? '')}ms`, 'info', 'tool'),
    'training:recorded': e('knowledge', (d) => `Training recorded: ${String(d.role ?? '')} runs:${String(d.runs ?? '')}`, 'info', 'role'),

    // provider/system
    'provider:state:changed': e('provider', (d) => `${String(d.provider ?? '')} → ${String(d.status ?? '')}`, 'info', 'provider'),
    'key:quota:exceeded': e('provider', (d) => `Quota exceeded: ${String(d.provider ?? '')}:${String(d.quotaType ?? '')}`, 'critical', 'id'),
    'system:notification': e('system', (d) => String(d.message ?? ''), 'info'),
    'request:incoming': e('request', (d) => `Request ${String(d.requestId ?? '')}`, 'info', 'requestId'),
    'request:completed': e('request', (d) => `Request completed ${(d.final_data as Record<string, unknown> | undefined)?.traceId ?? ''}`, 'info', 'traceId'),

    // debate / council finer
    'council:created:legacy': e('fleet', (_d) => `Council legacy created`, 'info'),
    'debate:runtime:session:created': e('fleet', (d) => `Debate created ${String(d.sessionId ?? '')}`, 'info', 'sessionId'),
    'debate:runtime:session:completed': e('fleet', (d) => `Debate completed ${String(d.sessionId ?? '')}`, 'info', 'sessionId'),
    'debate:runtime:session:failed': e('fleet', (d) => `Debate failed ${String(d.error ?? '')}`, 'warning', 'sessionId'),
    'debate:runtime:round:started': e('fleet', (d) => `Round ${String(d.round ?? '')} ${String((d.nodes as unknown[] | undefined)?.length ?? '')} nodes`, 'info', 'sessionId'),
    'debate:runtime:round:ended': e('fleet', (d) => `Round ${String(d.round ?? '')} ended`, 'info', 'sessionId'),
    'debate:runtime:agent:responded': e('fleet', (d) => `Agent ${String(d.agentId ?? '')} responded`, 'info', 'agentId'),
    'debate:runtime:agent:error': e('fleet', (d) => `Agent ${String(d.agentId ?? '')} error ${String(d.error ?? '')}`, 'warning', 'agentId'),

    // crew tasks
    'crew:task:started': e('fleet', (d) => `Task ${String(d.taskId ?? '')} started`, 'info', 'taskId'),
    'crew:task:completed': e('fleet', (d) => `Task ${String(d.taskId ?? '')} completed`, 'info', 'taskId'),
    'crew:task:failed': e('fleet', (d) => `Task ${String(d.taskId ?? '')} failed`, 'warning', 'taskId'),
    'crew:human:required': e('fleet', (d) => `Crew ${String(d.crewId ?? '')} awaiting human`, 'warning', 'crewId'),

    // graph finer
    'graph:node:started': e('fleet', (d) => `Node ${String(d.nodeId ?? '')} started`, 'info', 'nodeId'),
    'graph:node:completed': e('fleet', (d) => `Node ${String(d.nodeId ?? '')} completed`, 'info', 'nodeId'),
    'graph:checkpoint': e('fleet', (d) => `Checkpoint run ${String(d.runId ?? '')}`, 'info', 'runId'),
    'graph:decision': e('fleet', (d) => `Decision ${String(d.nodeId ?? '')} → ${String(d.chosen ?? d.decision ?? '')}`, 'info', 'runId'),

    // HITL / ops
    'mobile:paired': e('ops', (d) => `Mobile paired ${String(d.deviceName ?? d.id ?? '')}`, 'info', 'id'),
    'audit:appended': e('ops', (d) => `Audit ${String(d.action ?? '')} ${String(d.target ?? '')}`, 'info', 'id'),
    'hierarchy:created': e('ops', (d) => `Hierarchy ${String(d.name ?? d.id ?? '')}`, 'info', 'id'),
    'mcp:updated': e('tool', (d) => `MCP updated ${(d as { length?: number }).length ?? ''} servers`, 'info'),
    'skill:published': e('tool', (d) => `Skill published ${String((d as Record<string, unknown>).name ?? '')}`, 'info', 'id'),
    'skill:installed': e('tool', (d) => `Skill installed ${String(d.id ?? '')}`, 'info', 'id'),

    // memory/persona
    'persona:changed': e('memory', (_d) => `Persona changed`, 'info'),
    'memory:updated': e('memory', (d) => `Memory updated ${(Array.isArray(d) ? d.length : '')}`, 'info'),
    'cog:memory:added': e('memory', (d) => `CogMemory added`, 'info'),

    // frontier
    'eval:run:completed': e('ops', (d) => `Eval ${String(d.benchmarkId ?? d.id ?? '')}`, 'info', 'id'),
    'capability:granted': e('ops', (d) => `Capability ${String(d.capability ?? '')}`, 'info', 'capability'),
    'trust:score:updated': e('ops', (d) => `Trust ${String(d.agentId ?? '')} ${String(d.score ?? '')}`, 'info', 'agentId'),
};

export const TIMELINE_MAP_SIZE = Object.keys(TIMELINE_MAP).length; // 60
