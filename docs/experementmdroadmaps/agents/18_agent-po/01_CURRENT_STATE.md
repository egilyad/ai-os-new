# 01 — CURRENT STATE: what `agent-po` ACTUALLY does now

> Honest assessment of behavior under the **shared-infra** model. (VERIFIED unless marked INFERRED/OPINION.)

## The central truth (VERIFIED)

`agent-po` has **no unique runtime behavior**. It is one of 25 seeded topology nodes (`topology-defaults.ts:357`) carrying a curated profile (`agent-profiles.ts:192-201`). Everything it "does" is inherited from shared services:

- It is instantiated as a topology `agent` node with a system prompt (`topology-defaults.ts:362`).
- It is resolved as a participant by `AgentService.resolveAgent` → returns `{ systemPrompt, model, specializations, avatar, … }` (`agent-service.ts:337-389`).
- It is rendered in the UI via `resolveAgentIdentity` (`agent-identity.ts:62-143`), which pulls the curated name/emoji/specializations and merges with the topology node.
- It is selected as a debate/conversation/invocation participant like any other node.

## What it does when it "speaks" (VERIFIED)

In **ConversationCore / Director / Chat** the only PO-specific signal is the system prompt:

> "You are a product owner. Define requirements, prioritize the backlog by business value, and make scope trade-off decisions. Keep the team focused on delivering user value." (`topology-defaults.ts:362`)

In **Debate** (`debate-llm-prompt-context.ts:871-889`), a `dynamic-persona` feature flag may inject a _generic_ persona variant chosen by the agent's **debate role** (`pro`/`con`/`neutral`) and the **topic keywords** — NOT by `agent-po`'s specializations. See `02`/`04`.

## Model/provider (VERIFIED)

`provider: 'groq'`, `model: 'llama-3.3-70b-versatile'` in `AGENT_PROFILES`. But the topology node sets `config.model: 'auto'` (`topology-defaults.ts:365`), and `resolveAgent` returns the model **only if it is not `'auto'`/`'default'`** (`agent-service.ts:351-353`). **INFERRED:** at runtime the groq model pin in `AGENT_PROFILES` is effectively **not passed through** to the executor because the topology node overrides `model: 'auto'` and `resolveAgent` drops `'auto'`. The agent therefore runs on whatever the router/provider-resolver assigns — the curated groq pin is cosmetic in the current wiring. (VERIFIED behavior of `resolveAgent` at `agent-service.ts:351-353`; OPINION: this is a real bug/mismatch worth flagging.)

## Stats / observability (VERIFIED)

`AgentService` tracks per-node `AgentStats` (calls, tokens, latency, errors, cost) keyed by id, fed from `COGNITIVE_STEP_COMPLETED` (`agent-service.ts:184`). `agent-po` is indistinguishable in this machinery from any other node.

## Lifecycle / health (VERIFIED)

`AgentService` lifecycle states, `autoSpawnConfig`, `agent-health-monitor` (`agent-health-monitor.ts:66` subscribes `COGNITIVE_STEP_COMPLETED`) apply uniformly. No PO-specific tuning.

## Cognitive event participation (VERIFIED)

`agent-po` does **not** emit cognitive events itself. It is a _subject_ of `COGNITIVE_STEP_COMPLETED` (nodeId = `agent-po`) when it executes a step (`orchestration-service.ts:414`, `cognitive-service.ts:229`, `trace-service.ts:200`). `COGNITIVE_DECISION_MADE` is emitted by `cognitive-service.ts:414` (dead-at-consumer per AGENTS.md) — generic, not PO-scoped.

## Memory (VERIFIED)

`agent-journal-service.ts` writes `JournalEntry` records keyed by `agentId` from `COGNITIVE_STEP_COMPLETED` (`agent-journal-service.ts:150`). So `agent-po` accrues journal entries, but there is no PO-specific memory or continuity layer.

## Bottom line

Today `agent-po` is a **named prompt + avatar**. Its specializations (`Backlog`, `Vision`, `Prioritization`) and product-owner identity are **display-only metadata** — they do not drive selection, persona, routing, or any behavior (VERIFIED by absence of any `agent-po`-specific code path).
