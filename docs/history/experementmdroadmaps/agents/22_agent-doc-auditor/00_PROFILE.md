# 00_PROFILE — `agent-doc-auditor` Identity

**VERIFIED.** This is the canonical, curated identity of Felix Moreau, the Documentation Auditor.

## Curated profile (`src/kernel/state/agent-profiles.ts:232-241`)

```
'agent-doc-auditor': {
    firstName: 'Felix',
    lastName: 'Moreau',
    displayName: 'Felix Moreau',
    baseRole: 'Documentation Auditor',
    avatar: { emoji: '🔍', color: '#ec4899' },
    provider: 'nvidia',
    model: 'meta/llama-3.3-70b-instruct',
    specializations: ['Compliance', 'Review', 'Accuracy'],
},
```

- **Node id:** `agent-doc-auditor` — this id IS the system agent (the topology node id). `src/kernel/state/agent-profiles.ts:21` defines `AGENT_PROFILES` keyed by node id.
- **Persona:** Felix Moreau, "Documentation Auditor", 🔍 pink `#ec4899`.
- **Provider/model (curated):** `nvidia` / `meta/llama-3.3-70b-instruct`.
- **Specializations:** Compliance, Review, Accuracy.

## Topology node (raw, pre-normalization) — `src/kernel/state/topology-defaults.ts:408-419`

The raw topology node is _weaker_ than the curated profile; it carries only:

```
roleName: 'Documentation Auditor',
prompt: 'You are a documentation auditor. Your only job is to find errors,
         inconsistencies, and contradictions in documentation. You cross-check
         every claim against the actual code structure. You have the authority
         to reject any statement that does not match the system. You are critical
         and precise.',
temperature: 0.05,
tools: [],
model: 'auto',
```

Note: the node's own `model: 'auto'` and empty `tools`. The rich identity above is injected by normalization.

## Effective identity after normalization — `src/kernel/state/topology-defaults.ts:91-119`

`normalizeAgentIdentity()` merges `AGENT_PROFILES[node.id]` over the node config:

- `next.displayName`, `next.firstName`, `next.lastName`, `next.baseRole`, `next.specializations`, `next.avatar`, **`next.provider`**, **`next.model`** are overwritten from the profile (`:98-105`).
- So the _effective_ provider/model resolved at runtime is **`nvidia` / `meta/llama-3.3-70b-instruct`** (NOT `'auto'`).
- `next.lensIds` defaults to `[]` (`:106`) because the doc-auditor profile has no `lensIds` field → **the agent carries zero lenses** (see `09_LENSES.md`).

## Resolved at runtime — `src/kernel/services/agent-service.ts:337-390` (`resolveAgent`)

`resolveAgent('agent-doc-auditor')` returns `ResolvedAgent`:

- `id` = `agent-doc-auditor`, `name` = node label `"Auditor Agent"`, `role` = `"Documentation Auditor"`.
- `systemPrompt` = the auditor prompt (from `cfg.prompt`, since no `cfg.systemPrompt`).
- `model` = `meta/llama-3.3-70b-instruct` (profile wins over `'auto'`), `provider` = `nvidia`.
- `baseRole` = `"Documentation Auditor"`, `specializations` = `['Compliance','Review','Accuracy']`.
- `lensIds` = `[]`, `avatar` = `{ emoji:'🔍', color:'#ec4899' }`.

## OPINION

Felix is a "critical reviewer" archetype: very low `temperature: 0.05` (near-deterministic, strict), no tools (cannot fetch/edit code itself — it only cross-checks claims against structure), and a prompt that explicitly grants _rejection authority_. The curated `nvidia/meta-llama-3.3-70b-instruct` pin (vs the node's `auto`) is a deliberate choice to keep the auditor on a strong, consistent model.

## INFERRED

The `tools: []` + "reject any statement that does not match the system" prompt implies doc-auditor is meant to _judge_, not _act_ — consistent with being consumed by Debate/Conversation/Director/Invocation as a participant, never as an autonomous executor with side effects.
