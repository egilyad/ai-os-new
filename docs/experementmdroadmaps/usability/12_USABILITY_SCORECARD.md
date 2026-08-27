# 12 — Usability Scorecard

> 1–10 scale (10 = excellent). Evidence cited per score. All ratings from a **first-time-user** perspective.

| Dimension                  | Score   | Evidence                                                                                                                                                                           |
| -------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Discoverability**        | 4       | CommandPalette is excellent but invisible (11-DISC-3); ~30 stubs pollute discovery (DISC-1); no promoted onboarding (DISC-2).                                                      |
| **Clarity**                | 4       | RoomPanel "Where/Mode" abstract (05-B, 07-FORM-2); raw `no matching enabled policy` (10-ERR-2); stub "coming soon" with empty ModuleInfo (09-C1, 03-TierC).                        |
| **Navigation**             | 5       | Sidebar comprehensive but 9 sections/~177 items overwhelm; duplicate `builder` (08-IA-2); no "start here" (08-IA-3). CommandPalette rescues power users.                           |
| **Consistency**            | 4       | Real vs stub rendered identically (09-C1); empty states vary (09-C2); hardcoded "Вы" (09-C3); terminology drift (09-C4).                                                           |
| **Learnability**           | 4       | Rich panels (Agents, Chat, Director) but no guided first-run; cognitive load high; concepts (invocation/scenario/workflow) undefined in-UI.                                        |
| **Task completion**        | 5       | Mature flows work (Chat, Director run, Workflow history). But Scheduler is a dead form (07-FORM-1); Forum lacks vote/pin/moderate (03-TierB); Research 6–7 phases dark (03-TierB). |
| **Feedback**               | 6       | Dashboard live terminal, Director turn log, Memory error alert are good. Gaps: global vs scoped feeds (06-LIVE-1); stubs give no actionable feedback.                              |
| **Error recovery**         | 4       | Scheduler silent no-op (10-ERR-1); raw engine errors (10-ERR-2); stubs dead-end (10-ERR-3); partial research failures invisible (10-ERR-4).                                        |
| **Realtime comprehension** | 6       | Multiple live surfaces (Dashboard, Agents, Director) but scattered (06-LIVE-2); Debate empty arena no guidance (06-LIVE-3); Room feed unscoped (06-LIVE-1).                        |
| **AI/agent comprehension** | 5       | AgentsPanel gives strong agent model (5-A); but "invoke" hidden, identity inconsistent, no "first agent" guide (05-S-AGENT-1/2/3).                                                 |
| **Information hierarchy**  | 4       | Fake debate depth (08-IA-1); overlapping orchestration concepts (08-IA-4); leaky section boundaries (08-IA-5).                                                                     |
| **Overall**                | **4.5** | A powerful but intimidating product: excellent internals, weak first-run UX, trust-eroding phantom features, inconsistent empty/error states.                                      |

## Interpretation

The product is **engineer-friendly and expert-capable** but **not newcomer-safe**. The single highest-leverage fix is removing/labeling phantom features and adding a first-run onboarding — both low-cost, high-trust wins. Detail in 13/14.
