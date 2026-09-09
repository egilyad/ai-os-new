# 15_DO_NOT_BUILD_YET — ideas to AVOID for `agent-devops`

> Guardrails. The architecture (AGENTS.md) forbids per-agent code and 25 mini-frameworks. These are explicitly deferred/rejected.

## DNB-1 — A dedicated `DevOpsAgent` class / service

- Why avoid: AGENTS.md is explicit — "Agents are topology NODES; behavior is SHARED infra, not per-agent code." A bespoke class duplicates `AgentService` and breaks the resolver contract (`agent-service.ts:71`). The curated profile + node config already carry identity.
- Instead: configure, don't subclass.

## DNB-2 — A new "DevOps event bus" or `devops:*` event family

- Why avoid: the system has one `EventBus` (`src/kernel/event-bus.ts`) and shared event namespaces (`event-registry.ts`). A parallel bus fragments the cognitive/debate/conversation streams and breaks `useInvocationStore`/`DirectorStore` consumers.
- Instead: reuse `conversation:*` / `invocation:*` / `debate:*` as today.

## DNB-3 — A separate "Runbook DB" microservice

- Why avoid: Dexie KV + `AgentJournalService` + `crystalVault` already cover persistence. A 26th storage system violates the "contracts at boundaries / no new adapters" rule and the P2.19 schema-versioning discipline.
- Instead: new Dexie table or tagged KV namespace inside the existing schema (see `08`).

## DNB-4 — Per-agent UI framework / DevOpsPanel monolith

- Why avoid: AGENTS.md B5.3 scope discipline warns against monoliths; the pattern is decomposed panels (`DirectorPanel/RunTab`, `RoomPanel`). A giant DevOps console would mirror the anti-pattern already rejected for Director.
- Instead: small decomposed components reusing `AgentDetailPanel`, `AgentIdentityChip`, `RoomPanel`.

## DNB-5 — Auto-invoking devops on every infra keyword

- Why avoid: Invocation Engine D6/D7 = authority is human; agents never self-invoke. Auto-spawning devops on keywords bypasses policy gating (`phase21-invocation.ts:125-144`) and risks noise/loops.
- Instead: expertise-matched _seating_ in debates (M4) is fine; autonomous invocation needs explicit policy + human authority.

## DNB-6 — Hard-coding real kubectl/CI credentials into the agent

- Why avoid: `ToolService`/`SandboxService`/`MCPService` exist for safe, sandboxed execution (`phase4-agents-roles.ts`). Embedding credentials in the node config or a new adapter bypasses the security model (and `agent-security`/`agent-risk` governance).
- Instead: route through `MCPService`/sandbox with policy approval.

## DNB-7 — A "DevOps LLM prompt library" as a new module

- Why avoid: the node `prompt` (`topology-defaults.ts:212`) + `lens-engine` + persona injection already compose behavior. A separate prompt-DB duplicates `lens-library`/`role-service`.
- Instead: extend `lens-library` (ops lens) and persona keywords.

## DNB-8 — 25 parallel agent-roadmap implementations

- Why avoid: this research is ONE of 25. Building each agent as an island wastes the shared-infra advantage and risks 25 divergent mini-frameworks.
- Instead: apply Roadmap B's primitives once; let all agents inherit.

## Summary

If it introduces a new bus, a new agent class, a new storage service, or autonomous invocation without policy — **do not build yet**. Enrich `agent-devops` through configuration + the existing `AgentService` / `InvocationEngine` / `lens-engine` / `crystalVault` seams only.
