# 09_UI_UX — Current agent UI & `agent-security`-specific UX improvements

> VERIFIED component inventory + OPINION improvements.

## Current UI surfaces (VERIFIED)

- **AgentsPanel** (`AgentsPanelView.tsx`): grid of `AgentCard` (`AgentsPanelView.tsx:344`), click → `AgentDetailPanel` (`:374`), `AgentWizard` for creation (`:394`).
- **AgentCard** (`AgentCard.tsx`): generic card showing avatar + name + role.
- **AgentDetailPanel** (`AgentDetailPanel.tsx`) tabs:
  - `AgentConfigTab` — edit prompt/model/role.
  - `AgentObservabilityTab` — stats (calls/tokens/cost).
  - `AgentInfraTab` — lifecycle/infra.
  - `AgentHandoffsTab` — handoff config.
  - `AgentCapabilitiesTab` — available tools.
- **AgentAvatar** (`AgentAvatar.tsx:47,68-120`): renders 🛡️ `#10b981` for `agent-security` (from resolved identity).
- **Director**: `AgentIdentityChip` (`DirectorPanel/AgentIdentityChip.tsx:18`) in `RunTab` + `ParticipantsField`.
- **Debate**: `resolveAgentIdentity` used in `DebateChat`, `DebateAnalytics`, `VotePanelSection`, `HistoryItem`, `CausalAnalysisSection` to show "Yara Haddad".
- **RoomPanel**: agent `<select>` from `agentService.getAgents()` (human picks `agent-security`).
- **Forum/AuthorBadge**, **Dashboard/AgentLiveBoard**, **AgentComparisonPanel**: generic rendering.

## Agent-specific UX gaps (OPINION / INFERRED)

1. **No security-specific badge or "domain" tag.** `agent-security` looks identical to any other agent card. A small "🔒 Security" / domain chip would aid discovery. (Reuse `lens:security` tag or `specializations`.)
2. **Specializations not shown as actionable.** `agent.identity.specializations` exist (`agent-identity.ts:135`) but the card/detail does not let the user click "Threat Modeling" to prefill a task. (See 11 QW-3.)
3. **Debate persona mismatch invisible.** User adds `agent-security` expecting a security lens, but gets a generic `legal_expert`/`critic` persona (`persona-selector.ts`). No UI hint that the security voice is unfocused.
4. **No "security console" view.** Findings from runs are scattered across journal/stats/debate; there is no consolidated security report per agent.
5. **Invocation template absent.** RoomPanel offers free-text task only; no "Threat model this / Audit this code / Zero-trust review" quick actions for `agent-security`.

## Proposed agent-specific UX (ties to 11/13)

- **SEC-UX-1 (QW):** Domain chip + specializations chips on `AgentCard`/`AgentDetailPanel` (reuse existing `specializations` field).
- **SEC-UX-2 (QW):** In RoomPanel, when `agent-security` (or `domain:security`) is selected, show 3 quick-task templates that set `reason` + a `security_task` hint.
- **SEC-UX-3 (Medium):** "Security findings" tab in `AgentDetailPanel` rendering structured findings from the journal (needs 08 SEC-MEM-1).
- **SEC-UX-4 (Medium):** Debate participant config: allow choosing a security persona (`security_reviewer`/`red_team`) when the agent is `domain:security` (needs 04 persona work).
