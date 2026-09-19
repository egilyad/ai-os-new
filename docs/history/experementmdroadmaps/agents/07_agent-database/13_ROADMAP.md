# 13_ROADMAP — Phased plan (Realize the Verifiable DB Agent)

Each phase: task, existing code/service, proposed UI, deps, effort, risk, expected result.

## Phase 0 — Honesty & visibility (S)

- **Task:** Surface `specializations` as chips (QW-2); show "tool unavailable" hint when `tools` lists unregistered ids (QW-4); remove dead `model:'auto'` literal confusion by documenting normalize override.
- **Existing:** `AgentCard.tsx`, `AgentIdentityView.specializations` (`agent-identity.ts:135`), `ToolService.getEnabledTools`.
- **UI:** `AgentCard` + `AgentCapabilitiesTab`.
- **Deps:** none. **Effort:** S. **Risk:** none.
- **Result:** Users see Priya's real scope and limits.

## Phase 1 — Real SQL tool (M)

- **Task:** Register `sql_executor` (sandboxed sql.js) in `ToolService`; bind to node `tools`.
- **Existing:** `tool-executor.ts:174` registry, `bootstrap-key-init.ts:80` sql.js seam, `WorkspacePanel.tsx:80` SQL langs.
- **UI:** Room task box gains SQL input; AgentCapabilitiesTab shows "SQL sandbox: on".
- **Deps:** sql.js WASM. **Effort:** M. **Risk:** medium (sandbox/security).
- **Result:** Agent can run/verify queries — closes VERIFIED gap #1.

## Phase 2 — DB persona + lens + memory tags (M)

- **Task:** Add `data_engineer` persona (`persona-selector.ts`); add `lens:data` (`lens-library.ts`) + assign `lensIds` in `normalizeAgentIdentity`; tag memory with `agentId`+`specialization` (`memory-engine.ts:181`).
- **Existing:** persona-selector, lens-engine, MemoryEngine, normalizeAgentIdentity.
- **UI:** Debate framing improves automatically; AgentObservabilityTab shows lens tag.
- **Deps:** none new. **Effort:** M. **Risk:** low.
- **Result:** Domain-grounded debate + retrievable DB memory.

## Phase 3 — Director DB-awareness + conversation sandbox (M)

- **Task:** Add `domain:'database'` to `TurnProposal` (`contracts/conversation/turn.ts`); orchestrator attaches data lens + passes specializations as constraints.
- **Existing:** `conversation-director-service.ts`, `ConversationOrchestrator`, `TurnProposal`.
- **UI:** Room "Invoke Priya" shortcut (QW-5); Director scenarios can specify DB domain.
- **Deps:** Phase 1 tool. **Effort:** M. **Risk:** low (additive contract).
- **Result:** Deterministic, tool-backed DB conversations.

## Phase 4 — Knowledge bridge + specialization router (L)

- **Task:** Auto-propose high-confidence DB recommendations as Crystals (B-3, reuse `debate:verdict→crystal` bridge); extend router to prefer `agent-database` for DB subtasks (B-2).
- **Existing:** Crystal Vault bridge, router, `resolveAgent`.
- **UI:** Crystal proposals appear; routing prefers Priya for data_flow.
- **Deps:** Phases 1-3. **Effort:** L. **Risk:** medium (routing regressions → flag-gated).
- **Result:** Self-improving, automatically-routed DB expertise.
