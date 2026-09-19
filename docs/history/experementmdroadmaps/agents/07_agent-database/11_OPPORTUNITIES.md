# 11_OPPORTUNITIES — Quick Wins, Medium, Big Ideas

## 5 QUICK WINS (effort: S, risk: low, reuse existing infra)

- **QW-1 — Register a real `sql_executor` tool.** Add a `ToolDefinition` to `ToolService` (or a sandboxed sql.js executor) so `agent-database`'s declared `tools` become functional. _User value:_ agent can actually run/verify SQL. _Reuse:_ `tool-executor.ts` registry, `WorkspacePanel` SQL lang list (`WorkspacePanel.tsx:80`). _Deps:_ sql.js WASM or a DB adapter. _Why now:_ closes the #1 VERIFIED gap (`10_PROBLEMS` #1).
- **QW-2 — Specialization chips on AgentCard.** Render `specializations` from `ResolvedAgent`. _Value:_ honest, informative UI. _Reuse:_ `AgentIdentityView.specializations`, `AgentCard.tsx`. _Effort:_ S. _Risk:_ none.
- **QW-3 — `data_engineer` debate persona.** Add a variant to `persona-selector.ts:3-241` with DB trigger keywords; consult `resolved.specializations`. _Value:_ DB debates become domain-grounded. _Reuse:_ existing selector + `agentService.resolveAgent`. _Effort:_ S. _Risk:_ low (additive).
- **QW-4 — Honest capability hint.** If `tools` lists an unregistered tool, show "unavailable" instead of implying execution. _Value:_ no false expectations. _Reuse:_ `ToolService.getEnabledTools`. _Effort:_ S.
- **QW-5 — "Invoke Priya" shortcut on detail panel.** One-click Room invocation. _Value:_ faster expert access. _Reuse:_ `invocationEngine.invoke`, existing Room navigation. _Effort:_ S.

## 5 MEDIUM (effort: M, risk: medium)

- **M-1 — Data lens for the agent.** Add `lens:data` to `lens-library.ts` and assign `lensIds:['lens:data']` in `normalizeAgentIdentity` for DB agents. _Value:_ perspective transform on DB tasks. _Reuse:_ lens-engine. _Deps:_ lens-library + normalize edit. _Risk:_ low.
- **M-2 — Specialization-tagged memory.** Extend `MemoryEngine` ingest to tag entries with `agentId`+`specialization`. _Value:_ retrievable DB knowledge. _Reuse:_ existing event payload. _Risk:_ retrieval pollution if unscoped — scope by `agentId`.
- **M-3 — TurnProposal `domain` field.** Add optional `domain:'database'` to `contracts/conversation/turn.ts`; orchestrator attaches data lens + specialization constraints. _Value:_ Director scenarios become DB-aware. _Reuse:_ TurnProposal, ConversationOrchestrator. _Risk:_ contract addition, additive.
- **M-4 — DB activity feed in AgentObservabilityTab.** Reuse `LiveActivityStream` filtered by `nodeId`. _Value:_ visible reasoning. _Reuse:_ existing component. _Risk:_ none.
- **M-5 — Schema scratchpad in working-memory.** Keyed `agent-database:<session>` holding last reviewed schema/query. _Value:_ multi-turn continuity. _Reuse:_ `working-memory.ts`. _Risk:_ low.

## 3 BIG IDEAS (effort: L, risk: higher, strategic)

- **B-1 — Verifiable DB agent (sandbox + EXPLAIN).** Give `agent-database` a real, sandboxed SQL runtime (sqlite via sql.js, already referenced at `bootstrap-key-init.ts:80`) so it can run candidate queries, produce EXPLAIN plans, and measure before advising. _Value:_ turns opinion into evidence; unique differentiator. _Reuse:_ sql.js, `tool-executor.ts`, `WorkspacePanel` SQL support. _Deps:_ WASM runtime, security sandbox. _Why now:_ the entire value prop of a "Database Engineer" agent is currently unbacked.
- **B-2 — Specialization-aware Router.** Extend routing so DB-heavy subtasks prefer `agent-database` over generic agents; let `specializations` influence `persona-selector` and router scoring. _Value:_ right expert, automatically. _Reuse:_ router + `resolveAgent`. _Risk:_ routing regressions — gate behind a flag.
- **B-3 — Knowledge/Crystal DB bridge.** High-confidence DB recommendations (from journal/`cognitive:step:completed`) auto-propose Crystals (Module 2) and feed the Knowledge Generator (Module 5). _Value:_ institutionalizes DB expertise. _Reuse:_ existing `debate:verdict → crystal` bridge pattern, `agent-journal-service`. _Risk:_ noise/curation needed.
