# 06 — INVOCATION ROLE: `agent-ethics` (Room / Invocation Engine)

## Current (VERIFIED)

- **Human invocation only** (by design — D6: agents never self-invoke; AGENTS.md Invocation Engine). A user opens the Room panel, picks "Elena Marchetti — Ethics Officer" from the agent `<select>` populated by `agentService.getAgents()`, chooses Where (room/forum/conversation), Mode (chat/debate/scenario), and types a Task. (`RoomPanel`, AGENTS.md Step 6 rework.)
- The request becomes an `InvocationRequest` with `target: { agentId: 'agent-ethics' }`, `context`, `constraints.mode`. (VERIFIED — `invocation.ts:14,21`)
- `InvocationEngineService.invoke` → `requested` → policy evaluation → `accepted` → `AgentResolverDirectory.resolveAgents` → `agentService.resolveAgent` → `executing` → `ConversationCore` (chat) / `debateService` / `conversationDirectorService` (scenario) → `done`. (VERIFIED — `invocation-engine-service.ts:77,158`; `phase21-invocation.ts`)
- **Policy**: the seeded "Manual Room Chat (human-selected agent)" policy matches `source: 'human-mention'`, `mode:'chat'`, and allows **any registered human-selected agent** (does not pin Elena). `resolveAgents` rejects unknown ids. (VERIFIED — AGENTS.md Step 6 manual policy; `invocation-engine-service.ts:158`)
- Generic guard: no `debate:`/`forum:` events fire during a pure chat invocation; `INVOCATION_*` + `conversation:*` do. (VERIFIED — RoomPanel E2E, AGENTS.md Step 6 E2E closure)

## Context / Mode guidance (OPINION)

- **Best context**: `conversation` (a focused ethics-review chat) or `room` (live Q&A). `debate` suits adversarial ethics scrutiny; `director-scenario` suits a structured review (see 05).
- **Recommended default mode**: `chat` for ad-hoc "is this ethical?"; `director-scenario` for a repeatable review with a structured verdict.

## Policy opportunity (INFERRED)

- A dedicated **"Ethics Review" policy** (`match: { source:'human-mention', expertise:['Ethical Reasoning','Policy','Bias Audit'] }`, `actions.target:{ agentId:'agent-ethics' }, mode:'chat'`) would let a user type `@ethics`/select "Review ethically" and auto-route to Elena with a pre-set instruction template — without changing the engine (policy model already supports `match.expertise`, `invocation.ts:58`).

## Scenario (INFERRED)

User invokes Elena from a Forum topic about a controversial deployment → `context: { type:'forum-topic', ref }`, `mode:'chat'` → she returns an ethical-risk note that the user posts back to the Forum as an announcement (reusing the existing `forum:topic:escalated-to-debate` / announcement bridge pattern, AGENTS.md Module 6).
