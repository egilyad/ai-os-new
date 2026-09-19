# 10_PROBLEMS_AND_LIMITATIONS — concrete VERIFIED problems

> Every item below is grounded in source. No fabrication.

## P1 — DevOps specialization is declarative only (VERIFIED)

`agent-profiles.ts:80` lists `CI/CD, Kubernetes, Observability`, but nothing operationalizes them: no CI/CD tool, no cluster access, no observability data source. The only behavior signal is the 1-line `prompt` (`topology-defaults.ts:212`). INFERRED impact: devops answers are generic LLM text about DevOps, not grounded in real systems.

## P2 — Debate persona ignores specialization (VERIFIED)

`persona-selector.ts:251-290` selects a variant by _topic keywords_ + debate _side_; the agent's `specializations` are never consulted. Tomas Berg can be assigned any generic voice. INFERRED:削弱 infra-debate credibility.

## P3 — Builder/Workflow debate hook is DEAD (VERIFIED)

`builder-agent-service.ts:40` maps `debate` node → `debate:start`, an event **no consumer handles** (workflow-service has no dispatch; `builder-agent-service.test.ts:169` even asserts `handlerEvent === 'debate:start'`, cementing the bug). So invoking devops through a Builder `debate` workflow step silently fails to start a debate. VERIFIED by file read + test.

## P4 — `COGNITIVE_DECISION_MADE` is dead (VERIFIED by AGENTS.md + `event-registry.ts:776`)

Devops reasoning decisions are emitted but never consumed/displayed.

## P5 — Agent journal tags are always empty (VERIFIED)

`agent-journal-service.ts:133-146,159-167` record `tags: []` for every devops entry → memory is not queryable by specialization.

## P6 — Debate turns are not memorized (VERIFIED)

`agent-journal-service.ts:174` subscribes only to `debate:runtime:agent:error`; successful devops debate contributions are never journaled.

## P7 — `resolveAgent` model honoring depends on node config (VERIFIED, low risk)

`agent-service.ts:351-353` uses `cfg.model` only if not `auto`/`default`. `normalizeAgentIdentity` (`topology-defaults.ts:105`) overrides `model` to `llama-3.1-8b-instant`, so devops is correctly pinned — but this is fragile: any future code path that reconstructs the node without `normalizeAgentIdentity` would fall back to `auto`.

## P8 — Invocation context ref is hardcoded (VERIFIED)

`phase21-invocation.ts:90,99` set `context.ref = 'Invocation-triggered conversation'` / topic fallback; `RoomPanel` passes `'general'`. The human's task becomes `reason`, never the context ref. Minor loss of topic grounding.

## P9 — No devops group/seeding (VERIFIED)

`agent-service.ts:667` supports groups but no devops group is seeded; multi-agent infra scenarios must be assembled manually.

## P10 — Small model pinned for a "senior" role (VERIFIED/OPINION)

`llama-3.1-8b-instant` (`agent-profiles.ts:79`) is a fast/cheap 8B model; fine for chat, weak for deep K8s/architecture reasoning. Mismatch with the "DevOps Engineer" senior framing.

## P11 — No ops lens exists (VERIFIED)

`lens-library.ts` has 12 lenses (critical, second-order, security, economic, multi-stakeholder, meta-*, optimistic, long-term, meta-meta); **none** are ops/infra-specific. Devops has no lens to apply.
