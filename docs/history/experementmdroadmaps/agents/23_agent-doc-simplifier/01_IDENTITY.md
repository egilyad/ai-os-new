---
title: Identity Resolution — agent-doc-simplifier
status: VERIFIED
agent_id: agent-doc-simplifier
---

# 01 — IDENTITY: how `agent-doc-simplifier` becomes a runtime identity

## Single source of identity (VERIFIED)

There is exactly ONE identity source: the **topology node**, surfaced through
`IAgentResolver` (implemented by `AgentService`). No second registry exists.
Documented in `src/kernel/services/agent-identity.ts:1-12`.

## Build steps

### 1. Profile → node config at topology load

`normalizeAgentIdentity` (`topology-defaults.ts:91-119`) copies
`AGENT_PROFILES['agent-doc-simplifier']` onto the node config:
`displayName`, `firstName`, `lastName`, `baseRole`, `specializations`,
`avatar`, `provider`, `model` (`topology-defaults.ts:97-106`). `lensIds` is
seeded to `[]` if absent (`topology-defaults.ts:106`).

### 2. Resolver at runtime

`AgentService.resolveAgent(id)` (`agent-service.ts:337-390`) reads the live
topology node and returns a `ResolvedAgent`:

- `id`, `name` (node label "Simplifier Agent"), `role` (baseRole),
- `systemPrompt` from `config.systemPrompt`/`config.prompt`
  (`agent-service.ts:345-350`),
- `model` (only if not `auto`/`default`), `provider` (`agent-service.ts:351-353,387`),
- `avatar` (emoji 💡, color #10b981) (`agent-service.ts:360-368`),
- `specializations: ['Plain Language','Clarity','Restructure']`
  (`agent-service.ts:385`).

### 3. UI-rich view

`resolveAgentIdentity(id)` (`agent-identity.ts:62-144`) wraps the resolved agent
into `AgentIdentityView`:

- falls back gracefully if resolver/lens engine absent (`agent-identity.ts:79-100`),
- resolves `lensNames` from `lensIds` (empty here → `[]`) (`agent-identity.ts:116-124`),
- maps `provider` → `providerName` via `PROVIDER_DISPLAY_NAMES`
  (groq → "Groq") (`agent-identity.ts:126-127`).

## Opacity notes (INFERRED)

- Because `config.model` is `'auto'` in the raw node and only the _profile_
  sets `llama-3.1-8b-instant`, `resolveAgent.model` returns the profile value
  (the `normalizeAgentIdentity` step runs at topology construction, so the live
  node already carries `model: 'llama-3.1-8b-instant'`). If a session ever
  re-reads a node before `normalizeAgentIdentity`, `resolveAgent` would return
  `undefined` model and fall back to the executor's default — OPINION, not
  observed.

## Verification

- `agent-identity.ts:82` calls `resolver.resolveAgent(id)`.
- `AgentCard.tsx:23` calls `resolveAgentIdentity(agent.id)` and renders
  `identity.avatar.emoji` (💡) + `identity.avatar.color` (#10b981)
  (`AgentCard.tsx:56-63`).
