# 15_DO_NOT_BUILD_YET — Ideas to AVOID for `agent-data`

> Guardrail file. The brief explicitly warns against 25 mini-frameworks. These are tempting but should be deferred/avoided. Each: why not now.

## 1. A dedicated "DataScientistService"

- Avoid. `agent-data` needs no bespoke service — AgentService, debate-api, director, invocation, memory, and lens-engine already cover every behavior. A new service would fork the 25-agent uniformity and violate "contracts at boundaries / no new facades" (AGENTS.md). All wins are achievable via glue + data.

## 2. Per-agent database tables / Dexie stores

- Avoid. `memory-orchestrator` already provides 7 typed stores queryable by `agentId`. Creating `agent-data-memory` table duplicates existing infra and multiplies schema migrations (we are already at v20).

## 3. A custom groq/llama adapter just for Sam

- Avoid. The groq adapter + `LLMHttpClient` already honor `node.config.model/provider` (debate-api.ts:315-319). A bespoke adapter fragments the 7-provider adapter layer and breaks timeout/failover hardening done in P2.

## 4. An agent-specific EventBus or event namespace

- Avoid. EventBus is a singleton shared kernel primitive (AGENTS.md: "all communication through EventBus"). A `agent-data:*` bus duplicates the architecture and breaks the generic `conversation:*`/`invocation:*` guards proven in B6.1.

## 5. A separate "Data Scientist UI panel" only for Sam

- Avoid. `AgentsPanel` already renders any agent generically. A Sam-only panel is the textbook 25-mini-frameworks trap. Build generic capability UI (memory tab, lens badge, activity timeline) that every agent inherits.

## 6. Specialization-driven debate _routing_ that bypasses the router

- Avoid (for now). Letting `specializations` directly pick debate participants would bypass the existing `PersonaSelector` + router `data_flow` edge and create a second routing path. Fold specialization into `PersonaSelector`/`AgentResolverDirectory` instead (Roadmap A T2.1 / B1).

## 7. Auto-invoking Sam on every statistical claim (without policy gate)

- Avoid. D6 (authority = human) and D3 (managed call chains) require policy-gated invocation. Unbounded auto-invocation risks debate spam and violates the Invocation Engine's intent-first lifecycle (requested→accepted→executing→done).

## 8. A "Research" subsystem bolted onto Sam

- Avoid. No `src/kernel` research module exists; building one just for the Data Scientist duplicates Debate/ConversationCore/Knowledge-Generator. Route research-style tasks through existing Knowledge Generator (phase17) + Crystal (phase14).

## 9. Hard-coding Sam into workflows/builder flows

- Avoid. Builder workflows are user-defined DAGs; baking `agent-data` in removes user agency and couples the builder to one persona. Let workflows reference agents by role/capability, resolved at runtime.

## 10. Editing `AGENT_PROFILES` at runtime as a "live config"

- Avoid. `AGENT_PROFILES` is build-time (imported only by `topology-defaults.ts`). A runtime editor should mutate the topology node (`agentService.updateAgent`), not the frozen profile object, or changes won't persist past rebuild.

**Principle:** Every "Sam-only" feature in this folder can and should be expressed as _generic capability + Sam-specific data_. If an idea needs new kernel services, new tables, new buses, or new agent-only UI, it belongs in DO_NOT_BUILD_YET.
