# 10_DOC_CLUSTER — `agent-doc-historian`

The Documentation cluster of 5 agents and shared infra.

## VERIFIED

- The 5 doc agents are seeded nodes in `topology-defaults.ts`:
  - `agent-doc-architect` (`:222-231`) — Bianca Conti, 🏛️ `#a855f7`, openrouter, `['Information Architecture','Taxonomy','Standards']`
  - `agent-doc-auditor` (`:232-241`) — Felix Moreau, 🔍 `#ec4899`, nvidia, `['Compliance','Review','Accuracy']`
  - `agent-doc-simplifier` (`:242-251`) — Maya Lindholm, 💡 `#10b981`, groq, `['Plain Language','Clarity','Restructure']`
  - `agent-doc-historian` (`:252-261`) — Oscar Vilhelm, 📚 `#6366f1`, openrouter, `['Changelog','Context','Lineage']`
  - `agent-doc-checker` (`:262-271`) — Iris Tanaka, 🎯 `#ef4444`, nvidia, `['Consistency','Cross-Reference','Validation']`
- All 5 are wired `router → agent → aggregator` (`:487-568`) with identical topology shape (`temperature`, `tools:[]`, `model:'auto'`, roleName = baseRole).
- They share NO cross-wiring: grep for any doc-agent id outside `agent-profiles.ts`/`topology-defaults.ts` → **no hits**. No service, pipeline, or store routes between them (e.g. historian does not feed checker, architect does not brief historian).

## INFERRED

- The cluster is a _conceptual_ grouping by `baseRole` prefix "Documentation" only. Behaviorally they are 5 independent workforce nodes that happen to be dispatched by the same semantic router.
- `agent-doc-checker`'s prompt (`:450`) references running a "ConsistencyChecker service" — implying a tool exists; the historian's prompt (`:438`) references no tool (`tools: []`).

## OPINION

- The historian is the only cluster member whose specializations (Lineage/Changelog) imply _temporal_ reasoning across versions. The cluster has no orchestration that chains architect→writer→historian→checker into a documentation pipeline; building that is a future item (see 15_DO_NOT_BUILD_YET).
