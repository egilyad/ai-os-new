# CURRENT → FUTURE UI TRANSFORMATION

> For each major UI area: **CURRENT** state (from `../usability/`), the **PROBLEM**, the **DESIGN OPTIONS** considered, the **RECOMMENDED** direction (the Hybrid), and the resulting **FUTURE** UI.

## 1. Navigation / Sidebar

- **CURRENT:** 9 sections, ~177 items, many identical stubs; duplicate `builder` id.
- **PROBLEM:** UX-001 (overwhelm + phantom stubs), UX-006 (dup id), UX-008 (palette invisible).
- **OPTIONS:** (A) flat rail regroup; (B) NOC rail + command; (F) palette-only; (D) launchpad; **Hybrid = B rail + F palette + D launchpad**.
- **RECOMMENDED:** slim grouped rail (deduped) **+** ⌘K palette as primary nav **+** Launchpad grid for honest "Planned" stub listing.
- **FUTURE:** Three entry points; stubs labeled "Planned" and only ranked when searched.

## 2. Home / Landing

- **CURRENT:** generic Dashboard; no onboarding.
- **PROBLEM:** UX-003 (no first-run), intent-not-front.
- **OPTIONS:** (A) calm dashboard; (E) question-centric; **Hybrid = E question home + A onboarding**.
- **RECOMMENDED:** "What do you want to know?" home with command prompt + quick tiles + recent conclusions + 60s tour.
- **FUTURE:** intent-first entry, zero blank-screen confusion.

## 3. Agent UX (AgentsPanel / creation)

- **CURRENT:** agent list; no guided creation.
- **PROBLEM:** UX-011 (no first-agent flow), raw identity.
- **OPTIONS:** (C) library+cards; (F) "create agent" command w/ templates; **Hybrid = F command + C cards**.
- **RECOMMENDED:** `⌘K "create agent"` → template picker; agent cards with role-ring avatars; identity configurable (UX-016).
- **FUTURE:** agents are first-class, named, with avatars and clear creation path.

## 4. Debate UX

- **CURRENT:** DebateArena; empty arena no guidance.
- **PROBLEM:** UX-013 (empty arena), 06-LIVE-2 (no persistent health).
- **OPTIONS:** (B) ops view; (C) canvas; **Hybrid = arena + B monitor + guidance**.
- **RECOMMENDED:** arena with pick-agents/topic/Run guidance; header System Monitor shows live debates; ⌘J scoped strip.
- **FUTURE:** debates are understandable and observable without clutter.

## 5. Room / Invocation UX (RoomPanel)

- **CURRENT:** abstract "Where"/"Mode" pickers; global unscoped feed; raw "no matching policy".
- **PROBLEM:** UX-004 (raw error), UX-005 (abstract), UX-012 (global feed).
- **OPTIONS:** (C) node invocation; (F) command; **Hybrid = C node graph + inspector + F inline recovery**.
- **RECOMMENDED:** invocation as a node graph (You → Agents → Task), inspector shows policy/where/mode resolved; rejection shows inline "Open Policies"; feed scoped per session (⌘J).
- **FUTURE:** invocation is concrete, guided, and recoverable.

## 6. Research UX (ResearchPanel)

- **CURRENT:** 7 backend phases dark in UI.
- **PROBLEM:** UX-010 (phases invisible).
- **OPTIONS:** (A) phase checklist; (E) provenance; **Hybrid = checklist + provenance**.
- **RECOMMENDED:** show all 7 phases with planned/running/done states; surface evidence/citations in provenance chain.
- **FUTURE:** research is transparent end-to-end.

## 7. Forum UX (ForumPanel)

- **CURRENT:** backend has vote/pin/moderate but UI missing it.
- **PROBLEM:** UX-009 (missing controls).
- **RECOMMENDED:** surface vote/pin/moderate UI from existing backend.
- **FUTURE:** forum is fully interactive.

## 8. Knowledge UX (Crystals/Lenses/Junctions/Synthesis)

- **CURRENT:** separate panels; value not connected.
- **PROBLEM:** knowledge not presented as accumulated conclusions.
- **OPTIONS:** (E) knowledge hub; **Hybrid = E Conclusions + provenance**.
- **RECOMMENDED:** a Conclusions view aggregating crystals/research/debates with confidence + provenance chain.
- **FUTURE:** the OS's accumulated intelligence is visible and citable.

## 9. Live Execution (Debate/Conversation/Research)

- **CURRENT:** full-screen realtime; no scoping.
- **PROBLEM:** UX-012 (global feed), 06-LIVE-2 (forced realtime).
- **RECOMMENDED:** ⌘J scoped live strip (default off) + header monitor.
- **FUTURE:** realtime on demand, scoped.

## 10. Settings / Policies

- **CURRENT:** policies hard to reach; rejection dead-ends.
- **PROBLEM:** UX-004.
- **RECOMMENDED:** `⌘K "settings policies"` jumps to editor; inline "Open Policies" from invocation rejection.
- **FUTURE:** policy misconfig is a one-click recovery.

## 11. Empty / Error / Loading states

- **CURRENT:** inconsistent (MemoryPanel good, others blank).
- **PROBLEM:** UX-007.
- **RECOMMENDED:** reusable guided empty-state + inline error-with-action component (A pattern).
- **FUTURE:** every blank/error is actionable.

## 12. Scheduler (SchedulerPanel)

- **CURRENT:** dead "Save" control.
- **PROBLEM:** UX-002.
- **RECOMMENDED:** mark as "preview" / disable with tooltip until backend ready; honest status.
- **FUTURE:** no silent dead controls.

---

**Summary:** the Hybrid keeps the existing engine (CommandPalette, Dexie history, event-bus live) and layers a calmer, intent-first, observable shell over it — fixing UX-001..013 without a rewrite.
