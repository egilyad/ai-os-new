# 09_UI_UX — Current Agent UI & Agent-specific UX Improvements

## CURRENT agent UI surfaces (where `agent-ux` appears)

**[VERIFIED]** (component list, `src/components/AgentsPanel/` + usages):

- **AgentsPanel** — `AgentCard.tsx` shows name, role, `identity.specializations` (User Research · Usability · Interviews), avatar 🔍/`#06b6d4`, provider/model (`groq · llama-3.1-8b-instant`), stats (calls/success/latency/errors), pause/resume. `AgentDetailPanel`, `AgentIdentityEditor`, `AgentWizard`, `AgentAvatar` (`AgentAvatar.tsx:47`).
- **DebateAnalytics** — agent stats in debates.
- **DashboardPanel / AgentLiveBoard** — live activity.
- **AgentComparisonPanel** — side-by-side agent comparison.
- **ForumPanel / AuthorBadge** — agent provenance.
- **DirectorPanel / AgentIdentityChip** — participant chip.
- **DebateRuntimePanel / AgentControlPanel** — per-agent control.
- **RoomPanel** — human agent picker (lists `agent-ux` by name+role).

## Agent-specific UX problems (current)

1. **Identity is cosmetic.** The only `agent-ux`-specific UI is the avatar + specializations string. Nothing communicates _what_ a UX review produces or _how_ to trigger one. **[OPINION]**
2. **No "what can this agent do" affordance.** A user opening `agent-ux` sees stats but no one-click "Run UX review" or "Interview synthesis" action. **[OPINION]**
3. **No scenario template.** DirectorPanel has a generic scenario editor; there is no curated UX-review template surfaced for `agent-ux`. **[OPINION]**
4. **Debate role invisible.** In a debate, `agent-ux` shows no "user-advocate / usability critic" badge — it looks identical to any analyst. **[OPINION]**

## Agent-specific UX improvements (recommendations, reuse existing components)

| #   | Improvement                                                                                                                                                | Reuses                                         | Effort |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------ |
| U1  | Add a **"Run UX Review"** quick action on `AgentCard`/`AgentDetailPanel` that opens DirectorPanel pre-loaded with a UX-review scenario                     | `ScenarioEditor`, `scenario-repository.create` | Low    |
| U2  | Show `agent-ux` **specializations as clickable chips** that pre-fill an Invocation request (RoomPanel)                                                     | `RoomPanel` picker                             | Low    |
| U3  | **Debate badge**: when `agent-ux` is assigned the `ux_researcher` persona (see 04), render a "User Advocate" tag in `DebateRuntimePanel/AgentControlPanel` | existing badge components                      | Low    |
| U4  | **Capability tab** already exists (`AgentCapabilitiesTab.tsx`) — populate it with UX-specific capabilities once they exist (21-23 in `02_CAPABILITIES.md`) | `AgentCapabilitiesTab`                         | Low    |
| U5  | **Memory/insight view**: a read-only panel listing UX findings written to memory (see 08)                                                                  | `AgentHistoryTab` / `memory-repository`        | Medium |

**[OPINION]** these are UI-only and should sit on top of the capability work in `11/13`; do U1-U3 first (quick wins, zero backend change).
