# 06 — INVOCATION ROLE

> VERIFIED unless marked.

## CURRENT (VERIFIED)

- `agent-po` is invocable **by a human** from `RoomPanel` (`components/RoomPanel/RoomPanel.tsx`). The panel lists agents via `agentService.getAgents()` (resolved through `AgentResolverDirectory`, `phase21-invocation.ts:43-58`) and the human picks `agent-po` by name.
- On submit, `invocationEngine.invoke(req)` runs: `requested → accepted → executing → done|rejected` (`invocation-engine-service.ts`). Target resolved from `req.target` (human pick), **not** from policy `actions.target` (`phase21-invocation.ts:115-124`, AGENTS.md Step 6 notes).
- Default policy `Manual Room Chat (human-selected agent)` matches `source:'human-mention'` only (`phase21-invocation.ts:125-139`) — gates the _type_ of call, lets the human pick **any registered agent**. `resolveAgents` rejects unknown ids (`invocation-engine-service.ts:167-173`).
- Execution delegate hands off: `mode:'debate'` → `DebateSyncManager.startDebate`; `chat`/`director-scenario` → `ScenarioRepository.create` + `ConversationDirectorService.loadScenario`+`run` (`phase21-invocation.ts:61-110`).
- Context/mode from RoomPanel pickers: Where (`conversation`/`forum`/`debate`), Mode (`chat`/`debate`/`scenario`), Task → `reason` (`AGENTS.md` Step 6 human-facing rework).

## What reaches `agent-po`

- `context.type` + `context.ref` (e.g. `'general'`), `constraints.mode`, and the human's task text. The PO's specializations are **not** transmitted as instruction — only the agent's system prompt carries PO identity.

## POTENTIAL (OPINION)

- **Policy-based auto-invocation of PO** for "scope/backlog" topics (currently `allowAgentInitiatedInvocation:false`, `phase21-invocation.ts:137`). A policy matching `expertise:['Prioritization','Vision']` could auto-route scope questions to `agent-po` — but D6 (AGENTS.md) says authority = human; agents never self-invoke. So this stays human-triggered.
- **Open session** already navigates to `/director?session=` or `/debate?sessionId=` for `sessionRef` (`AGENTS.md` Step 6 History). Works for PO invocations.

## RECOMMENDED (OPINION)

Add a RoomPanel "task template" for PO (Backlog grooming / Vision / Prioritization) that pre-fills the `reason` with a structured prompt leveraging its specializations — purely UI, reuses existing invocation path, no engine change.
