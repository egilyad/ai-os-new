# 06 — INVOCATION ROLE: `agent-architect` (human invocation)

## CURRENT (VERIFIED)

- Reachable from **RoomPanel** through the Invocation Engine (`phase21-invocation.ts`).
- `AgentResolverDirectory` (:44) wraps `agentService.getAgents()`/`resolveAgent` → the architect appears in the RoomPanel agent picker (verified by `room-invocation-e2e.integration.test.tsx:247-282` invoking `system-architect` through the real engine).
- Default production policy **"Manual Room Chat (human-selected agent)"** (`phase21-invocation.ts:125-144`) matches `source: 'human-mention'` only and lets the human pick ANY registered agent. `policy.actions.target` is a placeholder and is **not** used for resolution (matches() gates only on `match.source`/`event`/`expertise`) — [per AGENTS.md, VERIFIED in code comment :112-124].
- Invocation → `InvocationExecutionDelegate.start` (:61): `chat`/`director-scenario` → `ConversationDirector`; `debate` → `DebateSyncManager.startDebate`. The architect becomes a participant in the target subsystem.
- Lifecycle events: `INVOCATION_REQUESTED → ACCEPTED → EXECUTING → DONE|REJECTED` (5 `invocation:*` events). History persists (`invocationRepository.list()`) and "Open session" navigates to `/director` or `/debate` [per AGENTS.md].

## CONTEXT / MODE

- **Where (context.type):** `💬 This room` / `📋 Forum topic` / `🗨️ Conversation` (RoomPanel maps to `context.type`, ref `'general'`).
- **Mode (constraints.mode):** `💬 Chat` / `⚔️ Debate` / `🎬 Scenario`.
- **Task (reason):** free-text → `reason` field.

## POLICY (recommendation, not yet built)

- A dedicated **"Architecture review (human-selected agent)"** policy could match `source:'human-mention'` AND `context` containing architecture keywords, auto-attaching the `architecture` lens and routing to `agent-architect`. This reuses the existing source-only gating; no engine change required (see 11/13).

## Scenario

Human opens Room → picks "System Architect" → Where "This room" → Mode "Chat" → Task "Evaluate whether our current event bus will scale to 10k agents" → Invocation Engine accepts, spawns a ConversationCore chat as `agent-architect`, live `conversation:*` output streams to the Room feed, session persists, "Open session" reopens the transcript.
