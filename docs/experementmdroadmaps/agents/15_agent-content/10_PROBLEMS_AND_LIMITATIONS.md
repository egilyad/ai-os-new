# 10 — PROBLEMS AND LIMITATIONS (concrete, VERIFIED)

> Only verified problems with file:line evidence. No fabrication.

## P1 — Model is pinned, so no failover (VERIFIED)

`normalizeAgentIdentity` overwrites `node.config.model` with the curated `profile.model` (`openrouter/meta-llama/llama-3.3-70b-instruct`) — topology-defaults.ts:105. Because the model is **explicit** (not `'auto'`), `agent-content` cannot benefit from provider/key failover or model routing. If openrouter llama-3.3-70b is down, out of credits, or 402, `agent-content` **fails the turn** instead of rerouting. Compare: nodes left as `'auto'` (e.g., agent-devops) get routing. _Evidence: agent-profiles.ts:169; topology-defaults.ts:105; debate-llm-caller failover logic applies to `'auto'`/routed models._

## P2 — Curated avatar not shown by the main Avatar component (VERIFIED)

`AgentAvatar.getAgentAvatar` derives a glyph from an id hash and **never reads `AGENT_PROFILES` or `node.config.avatar`** — AgentAvatar.tsx:47-54. The 📝 #f59e0b is only used by identity-aware consumers that pass `emoji/color` from `resolveAgentIdentity` (agent-identity.ts:102-114 ← topology-defaults.ts:103). So Lena's avatar is inconsistent across the UI. _Evidence: AgentAvatar.tsx:47; agent-identity.ts:102-114; topology-defaults.ts:103._

## P3 — `COGNITIVE_DECISION_MADE` is dead (VERIFIED)

Emitted at cognitive-service.ts:414, defined at event-registry.ts:776, **zero subscribers** (grep: only definition + emit). Content decisions cannot be surfaced. _Evidence: event-registry.ts:776; cognitive-service.ts:414; grep no `onSafe(COGNITIVE_DECISION_MADE)`._

## P4 — No agent-scoped memory recall (VERIFIED)

`MemoryEngine` stores `source: nodeId` (memory-engine.ts:188) but retrieves globally; there is no `getByAgent` path, so `agent-content` has no continuity as "Lena." _Evidence: memory-engine.ts:181-200; no agent-filtered retrieval method found._

## P5 — Specializations are metadata-only (VERIFIED)

`Editorial / SEO / Messaging` (agent-profiles.ts:170) are consumed only by `prompt-audit-service.ts:23` (grouping) and the Invocation directory's `specializations` field. **Nothing branches runtime behavior on them.** _Evidence: agent-profiles.ts:170; prompt-audit-service.ts:23; agent-service.ts:385 (passed through, not branched)._

## P6 — No content lens exists (VERIFIED)

The lens library has 11 lenses, none content/SEO (lens-library.ts). `agent-content` has `lensIds:[]`. So it never receives a content perspective transform. _Evidence: lens-library.ts (full file, 11 entries); topology-defaults.ts:106._

## P7 — No content-specific debate persona (VERIFIED)

`PersonaSelector` has 10 topic-keyword personas, none editorial/SEO/messaging (persona-selector.ts:3-241). In a debate, `agent-content` gets a deterministic generic variant. _Evidence: persona-selector.ts:3-241._

## P8 — No content tooling beyond generic web search (VERIFIED)

`node.config.tools = SEARCH_TOOLS` (topology-defaults.ts:326) — generic web search. There is no SEO analyzer, readability scorer, plagiarism checker, or CMS/publish tool wired to this agent. _Evidence: topology-defaults.ts:326._

## P9 — Single-shot, no draft/review loop (VERIFIED/INFERRED)

Each invocation is one LLM call per turn (orchestration-service.ts:414 emits one `COGNITIVE_STEP_COMPLETED`). There is no built-in multi-pass "draft → critique → revise" for content; it must be hand-assembled as a Director scenario. _Evidence: orchestration-service.ts:414; conversation-orchestrator turn model._

## P10 — Grouped but uncoordinated in the default pipeline (VERIFIED)

In the default topology, `agent-content`, `agent-creative`, `agent-designer`, `agent-ux` are parallel fan-out branches merged by the aggregator (topology-defaults.ts:480,531-532). There is **no role coordination** among them — they each independently answer the routed task. _Evidence: topology-defaults.ts:480,518-538._

## Non-problems (explicitly NOT broken)

- Stats/analytics work (agent-service.ts:184).
- Identity resolution works where components use it (agent-identity.ts).
- Invocation + Debate + Director participation all function (phase21-invocation.ts; debate-agent-executor.ts; agent-service.ts:337).
