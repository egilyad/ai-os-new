# 09_UI_UX — how the user currently sees `agent-network`

> Current representation is generic (card/avatar/role). Agent-specific UX is minimal.

## Current UI surface (VERIFIED)

- **Avatar:** `🌐` `#06b6d4` via `resolveAgentIdentity` (canonical from node config) or `AgentAvatar.getAgentAvatar` deterministic fallback (`AgentAvatar.tsx:47`). Shown in `AgentsPanel`, `AgentCard`, `AgentDetailPanel`, `AgentIdentityEditor`, `AgentWizard`.
- **Card:** name "Nadia Volkov", role "Network Engineer", status from `AgentService` lifecycle (`agent-service.ts:588`). Used in Debate Analytics, Dashboard `AgentLiveBoard`, Director `AgentIdentityChip`, Forum `AuthorBadge`, Debate `AgentControlPanel` (AGENTS.md).
- **RoomPanel:** appears in the agent `<select>` as "Nadia Volkov — Network Engineer" (`RoomPanel.tsx:89-95,181-185`). After invocation, a card shows avatar initial, where, optional task quote, status badge, Open-session button.
- **AgentDetailPanel / AgentIdentityEditor:** editable identity (name/role/avatar/prompt/model). These edit the _topology node_, so changes persist to the active topology.
- **No network-specific panel, chart, or activity timeline.** Her stats exist (`agent-service.ts:288-304`) but there is no dedicated Nadia dashboard.

## Pain points (INFERRED)

1. **Specialization invisible in UI** — the card shows role but not `TCP/IP / SDN / Latency Optimization` (specializations exist in data, `agent-profiles.ts:30`, but `AgentCard` likely shows role only). A specialization chip would signal expertise at a glance.
2. **No per-agent activity/history** — the Agent Journal records her steps (`agent-journal-service.ts`) but no panel renders `listByAgent('agent-network')`.
3. **No "expertise" affordance in RoomPanel** — the dropdown lists all agents equally; a human must know Nadia is the network expert.
4. **Debate side hidden** — when added to a debate, the user picks a side; nothing suggests the networking-appropriate stance.
5. **No memory/context indicator** — user can't tell she's "cold" (no seeded memory).

## Agent-specific UX improvement proposals (OPINION, reuse-only)

1. **Specialization chips** on `AgentCard` (read `specializations` from `resolveAgentIdentity`, already available at `agent-identity.ts:35`). Tiny, high-value.
2. **Per-agent Journal tab** in `AgentDetailPanel` — call `agentJournalService.listByAgent('agent-network')` + `getAgentStats`. Reuses existing service, no new backend.
3. **"Expert" badge + expertise filter** in RoomPanel agent select — group/sort agents by `specializations` match to the task text (reuse `invocation-engine-service.ts:171` expertise resolution to pre-select).
4. **Suggested debate side** hint in Debate participant picker when the topic contains networking terms (reuse `specializations` + a keyword check).
5. **"What Nadia knows" memory preview** — if 08 seeding is done, show a small semantic-memory snippet in `AgentDetailPanel`.

## What NOT to build (see 15)

- No separate "Network Engineer Studio" SPA. Fold improvements into existing `AgentsPanel` / `AgentDetailPanel` / `RoomPanel` / `DebatePanel`.

## Bottom line

The user sees Nadia as a generic agent card with a globe avatar. The data to make her _recognizably the network expert_ (specializations, journal, memory) already exists; it is just not surfaced.
