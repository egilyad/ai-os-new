# 09_UI_UX — current agent UI & devops-specific UX

> VERIFIED: `AgentsPanel/*`, `AgentAvatar.tsx`, `AgentIdentityChip.tsx`, `RoomPanel.tsx`, `AgentLiveBoard.tsx`, `DirectorPanel/RunTab.tsx`, `DebateRuntimePanel/AgentControlPanel.tsx`.

## Current agent UI surfaces (VERIFIED)

- **AgentsPanel**: grid of `AgentCard` (⚙️ Tomas Berg, DevOps Engineer), opens `AgentDetailPanel`; `AgentIdentityEditor`/`AgentWizard` for editing node config; `AgentAvatar` renders identity.
- **AgentIdentityChip** (`DirectorPanel/AgentIdentityChip.tsx:18`): shows emoji+name; `showDetails` reveals id/role/specializations — the only place devops specializations are visible.
- **AgentLiveBoard** (`DashboardPanel/AgentLiveBoard.tsx:63`): live lifecycle + call stats per agent.
- **RoomPanel** (`RoomPanel.tsx`): agent picker lists `Tomas Berg — DevOps Engineer`; human invokes.
- **DebateRuntimePanel/AgentControlPanel** (`DebateRuntimePanel/AgentControlPanel.tsx:69`): restart/inject controls per debate participant.
- **Director RunTab** (`DirectorPanel/RunTab.tsx`): shows devops identity chip for turns.

## What the user can SEE about devops today (VERIFIED)

- Name, emoji, role, model (in identity chip), live call count/latency (AgentLiveBoard), current lifecycle.
- In debate: a participant card, restart/inject buttons.
- In Room: a selectable option + invocation history card (with `Open session`).

## What is HIDDEN (VERIFIED/INFERRED)

- **Specializations** only in `AgentIdentityChip` details (UI-HIDDEN by default).
- **Journal** of past devops work — no UI consumes `AgentJournalService.listByAgent('agent-devops')`.
- **Cognitive decisions** — `COGNITIVE_DECISION_MADE` never displayed.
- **Runbook/incident memory** — does not exist.
- **Debate persona actually assigned** — the `PersonaSelector` variant is not shown; user cannot tell devops spoke as "Technologist" vs generic.

## Agent-specific UX improvements (OPINION, reuse-only)

1. **DevOps detail panel tab** — a sub-view of `AgentDetailPanel` showing: specializations, recent journal (`listByAgent`), stats, and a "Trigger incident post-mortem" / "Design CI pipeline" quick action that pre-fills a Room invocation.
2. **Specialization chips** on the `AgentCard` (move them out of the hidden details).
3. **Persona badge in debate cards** — show the assigned `PersonaSelector` variant so debates are transparent.
4. **Memory/runbook strip** — when devops memory exists (see `08`), show last N runbooks/incidents on the detail panel.
5. **Quick-win invocation presets** — "Runbook review", "K8s upgrade plan", "Incident timeline" buttons that call `invocationEngine.invoke` with a prebuilt `reason`/`context`.

All reuse existing components (`AgentDetailPanel`, `AgentIdentityChip`, `RoomPanel`, `AgentJournalService`, `invocationEngine`).
