# 15_DO_NOT_BUILD_YET — Gaps, Non-Fabrications & Recommendations

**Status:** OPINION/RESEARCH. What should NOT be assumed or built for `agent-doc-checker`.

## Do NOT assume these (they are NOT in the code)

1. **No dedicated service/class.** There is no `doc-checker-service.ts`, no `IDocChecker` contract, no agent-specific logic. It is a topology node + curated profile only. Do not build agent-specific logic unless required.
2. **No runtime link to `ConsistencyChecker` service.** Despite the node prompt saying "run the ConsistencyChecker service" (topology-defaults.ts:450) and the service listing `'Consistency Checker'` as a role (consistency-checker.ts:351), there is **no code path** connecting them. Do not assume doc-checker auto-runs doc-consistency checks.
3. **No tools.** Node config `tools:[]` (topology-defaults.ts:452). doc-checker cannot call the consistency service or any tool unless `tools` are added. Do not assume tool access.
4. **No debate-specific persona.** `persona-selector.ts` has no doc-checker variant; it gets a generic persona by topic. Do not assume a "consistency persona" in debates beyond its node system prompt.
5. **No cognitive events from debate.** Debate emits none (AGENTS.md). doc-checker stats accrue only via ConversationCore/Director. Do not expect debate turns to populate its `AgentService` stats.
6. **No lenses.** `lensIds:[]`. Do not assume lens-based augmentation.
7. **No scheduled/special module role.** No research/knowledge/crystal/forum/workflow/scheduler coupling. Treat as generic node.
8. **Provider caveat (OPINION).** Node `provider:'nvidia'`, `model:'meta/llama-3.3-70b-instruct'` is pinned, but `ChatExecutionEngine` sends `provider:'auto'` (conversation-execution-engine.ts:72). If `nvidia` lacks that model, auto-routing may pick another provider — the _model_ pin still applies but the _provider_ is not forced. Confirm nvidia model availability before relying on it.

## Open questions / verify before building

- **phase20 resolver injection (05):** confirm whether production `ChatExecutionEngine` receives the `agentResolver`. If not, doc-checker loses its persona/system-prompt in Director turns. This is the highest-value verification gap.
- **Policy gating:** the default Room policy allows any human-selected registered agent; doc-checker is reachable but unconstrained. If doc-checker should be restricted (e.g. read-only doc tasks), a policy is needed — none exists.
- **Stats fidelity:** doc-checker's `AgentService` stats depend on `COGNITIVE_STEP_COMPLETED` carrying `nodeId:'agent-doc-checker'`. Verify the orchestrator emits with the correct nodeId (not a session/participant id).

## Recommendations (if work begins)

- To make the persona↔service link real: either (a) give doc-checker a tool binding to `consistencyChecker`, or (b) have the service resolve and dispatch doc-checker as a real participant. Both are NEW work, not existing behavior.
- Keep doc-checker as a generic resolvable node; avoid agent-specific singletons.

## Confidence

- All "do not assume" items: VERIFIED against the cited source (Grep + reads).
- phase20 gap: flagged OPINION/INFERRED in 05; recommended as the primary verification step.
