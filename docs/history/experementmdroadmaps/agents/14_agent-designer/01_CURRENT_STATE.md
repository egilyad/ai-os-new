# 01_CURRENT_STATE — What `agent-designer` ACTUALLY does now

> Honest assessment. `agent-designer` is a **topology node**, not an autonomous actor. Its
> behavior is 100% shared infrastructure. VERIFIED / INFERRED / OPINION.

## The core truth (VERIFIED)

`agent-designer` is one of 25 seeded `ISNode` agents (`agent-profiles.ts:152`). It has **no
agent-specific code path anywhere** — the only repo references are: identity (`agent-profiles.ts`,
`topology-defaults.ts:307`), graph edges (`:479`, `:531`), and a prompt-audit grouping
(`prompt-audit-service.ts:22`). There is no `designer-*` service, no design controller, no
design-specific event.

## What it does when "run"

1. **Topology mount:** `normalizeAgentIdentity` writes the curated profile onto the node
   (`topology-defaults.ts:91-119`). Model becomes `groq/llama-3.3-70b-versatile`, temperature `0.5`,
   system prompt = the generic product-designer text (`topology-defaults.ts:312`).
2. **As a debate participant:** `debate-agent-executor` calls the LLM with the node's prompt
   (`debate-agent-executor.ts:45-72`). `persona-selector` may layer a generic persona variant on
   top (cautious_scientist, diplomat, critic, etc. — `persona-selector.ts:3-241`) — **none are
   design/UX/accessibility specific**.
3. **As a ConversationCore/Director turn:** `resolveAgent` returns id/name/model/provider; the
   `ChatExecutor` speaks the node prompt (`agent-service.ts:337-390`).
4. **Via Invocation Room:** human selects it; `InvocationEngineService` resolves it through
   `AgentResolverDirectory` (wraps `agentService`) and hands off to ConversationCore or Debate
   (`phase21-invocation.ts:43-110`).

## What its "identity" is actually used for

- **UI display only:** `AgentCard` renders `specializations.join(' · ')` (`AgentCard.tsx:68-78`)
  and provider/model. `resolveAgentIdentity` surfaces specializations/lensNames to Director/Debate chips.
- **Prompt audit only:** the `'Creative'` group label (`prompt-audit-service.ts:22`).
- **Stats:** `COGNITIVE_STEP_COMPLETED` increments its call/token/latency counters
  (`agent-service.ts:184-210`).

## What its "identity" is NOT used for

- **VERIFIED:** `specializations` and `baseRole` are referenced **0 times** in `debate-runtime`
  (grep: no matches). They never shape a debate persona, a system prompt, or a lens.
- **VERIFIED:** no `lensIds` are ever assigned (`topology-defaults.ts:106` only defaults to `[]`);
  `LENS_LIBRARY` contains no design/UX/accessibility lens (grep of `lens-library.ts`: no match for
  design|ux|user|prototyp|visual|accessib).
- **VERIFIED:** `tools: []` on the node — "Prototyping" specialization has no corresponding tool.

## Net current state

`agent-designer` is a **cosmetically-branded generic agent**: a pretty avatar, a label, and three
specializations that are displayed but never exercised. It is a real working LLM participant, but
its "design" nature is purely skin-deep. OPINION: this is the correct baseline for a seeded
workforce agent; the opportunity is to make the specializations _do_ something.
