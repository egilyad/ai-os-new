# 11_OPPORTUNITIES — prioritized opportunities for `agent-devops`

Each item: ID, Description, User value, Technical reuse, Effort, Risk, Dependencies, Existing infra, Why now.

## 5 QUICK WINS (Low effort, high value, reuse-only)

**Q1 — Tag journal entries with specializations**

- Desc: In `agent-journal-service.ts:133-167`, set `tags: resolved.specializations` (from `agentService.resolveAgent`) for devops steps.
- User value: searchable ops memory ("show all Kubernetes work by Tomas Berg").
- Reuse: `agent-journal-service.ts`, `agentService.resolveAgent` (`agent-service.ts:337`).
- Effort: S (1 file). Risk: Low. Deps: none. Infra: existing journal KV. Why now: trivial, unlocks memory UX.

**Q2 — Specialization chips on AgentCard**

- Desc: surface `specializations` from `agent-profiles.ts:80` on `AgentsPanel/AgentCard` (today hidden in identity details).
- User value: users see devops expertise at a glance.
- Reuse: `AgentCard`, `resolveAgentIdentity` (`agent-identity.ts`). Effort: S. Risk: Low. Deps: none. Infra: identity resolver. Why now: cheap credibility win.

**Q3 — Room invocation presets for devops**

- Desc: add "Runbook review / K8s upgrade plan / Incident timeline" buttons in `RoomPanel` that pre-fill `invocationEngine.invoke` (`RoomPanel.tsx:84`).
- User value: one-click expert devops tasks.
- Reuse: `invocationEngine`, `phase21-invocation.ts`. Effort: S-M. Risk: Low. Deps: none. Infra: Invocation Engine. Why now: Room is the new human entry point.

**Q4 — Debate persona badge**

- Desc: show the `PersonaSelector` variant name on debate participant cards (`DebateRuntimePanel`).
- User value: transparency on which voice devops spoke with.
- Reuse: `persona-selector.ts`, debate UI. Effort: S. Risk: Low. Deps: none. Infra: existing events. Why now: exposes P2.

**Q5 — Resurrect cognitive decision display**

- Desc: consume `COGNITIVE_DECISION_MADE` (`event-registry.ts:776`) in cognitive timeline for devops.
- User value: see devops reasoning.
- Reuse: existing event + Trace UI. Effort: S-M. Risk: Low. Deps: none. Infra: cognitive stream. Why now: event already exists, just unshown.

## 5 MEDIUM (New domain bridge, moderate effort)

**M1 — Specialization-aware debate persona**

- Desc: extend `PersonaSelector.selectForTopic` (`persona-selector.ts:251`) to bias variants by agent `specializations`.
- User value: devops speaks as an ops expert, not generic.
- Reuse: `agentService.resolveAgent` specializations. Effort: M. Risk: Med (may shift other agents' personas). Deps: persona-selector contract. Infra: debate runtime. Why now: fixes P2 core weakness.

**M2 — DevOps ops lens**

- Desc: add `lens:operations` to `lens-library.ts` (reuse 12-lens pattern) and suggest it for devops turns.
- User value: structured infra reasoning.
- Reuse: `lens-engine`, `lens-library.ts`. Effort: M. Risk: Low. Deps: lens-engine. Infra: Lenses module. Why now: no ops lens exists (P11).

**M3 — Devops-scoped runbook/incident memory**

- Desc: new Dexie table (or tagged KV) capturing devops ConversationCore outputs; read back into system prompt via `resolveAgent` enrichment.
- User value: continuity across incidents.
- Reuse: Dexie KV, `AgentJournalService`, `crystalVault`. Effort: M-L. Risk: Med (prompt bloat). Deps: memory schema. Infra: Dexie + memory stores. Why now: enables P1 grounding.

**M4 — Expertise-matched debate seating**

- Desc: when debate topic hits infra/CI/deploy keywords, seat `agent-devops`(+`agent-security`/`agent-architect`) preferentially.
- User value: debates anchored by real experts.
- Reuse: debate meta-agent controller, `PersonaSelector`. Effort: M. Risk: Med. Deps: debate participant selection. Infra: Debate runtime. Why now: leverages seeded experts.

**M5 — AgentLiveBoard cognitive tab for devops**

- Desc: show `COGNITIVE_STEP_ACTIVE/COMPLETED` + stats for `agent-devops` live.
- User value: live "Tomas Berg is thinking" + latency.
- Reuse: `AgentService.getStats`, cognitive events. Effort: M. Risk: Low. Deps: none. Infra: AgentLiveBoard. Why now: display-only.

## 3 BIG IDEAS (Strategic)

**B1 — Real DevOps tool bridge**

- Desc: connect `CODER_TOOLS` (`topology-defaults.ts:7`) to actual CI/CD + kubectl/observability adapters behind a sandbox; devops executes real pipeline checks.
- User value: Tomas Berg becomes an operative SRE, not a chat bot.
- Reuse: `ToolService`, `SandboxService`, `MCPService` (`phase4-agents-roles.ts`). Effort: L. Risk: High (security, sandbox). Deps: tool executor + adapters. Infra: tool/sandbox/MCP. Why now: the only path to operationalize P1.

**B2 — Incident post-mortem autonomous workflow**

- Desc: a Builder/ConversationCore scenario template "Incident → timeline → root cause → runbook Crystal" with devops as lead, bridging Debate+Synthesis+Crystal.
- User value: turns incidents into durable knowledge.
- Reuse: Builder (`builder-agent-service.ts` after P3 fix), Director, CrystalVault, Synthesis. Effort: L. Risk: Med. Deps: P3 fix, M3. Infra: all cognitive modules. Why now: cross-module showcase.

**B3 — DevOps "expertise graph" across agents**

- Desc: index all 25 agents' specializations; route infra questions to devops+security+architect automatically via Invocation Engine policies.
- User value: questions always reach the right expert cluster.
- Reuse: `InvocationEngineService`, `AgentResolverDirectory` (`phase21-invocation.ts:43`). Effort: L. Risk: Med. Deps: policy model. Infra: Invocation Engine. Why now: scales the 25-agent workforce intelligently.
