# 30 — FORUM IN ONE YEAR (FUTURE CONCEPT)

> Not fantasy. Built strictly from **current foundations** verified in source. Shows
> CURRENT → EXISTING CAPABILITIES → INTEGRATIONS → UX → FUTURE. No new engines
> (see `25_DO_NOT_BUILD_YET.md`).

---

## CURRENT (verified, today)

- `ForumService` (`forum-service.ts:37`): topics, threaded posts, votes, pins,
  moderation, consensus, subscriptions — **all implemented, mostly unsurfaced**.
- `ForumRepository` (`forum-repository.ts:4-8`): 4 Dexie tables, filters + sort.
- UI (`ForumPanel` + 6 subcomponents): list/thread/moderation/heatmap, but **no
  vote/pin/subscribe/search UI**; `consensus` badge shown but inert.
- Bridges (`phase18-forum.ts`): debate verdict → case-study, crystal → announcement,
  forum-question → knowledge generator — **already firing**.
- Invocation (`phase21-invocation.ts:61-109`): forum context → chat/director/debate
  handoff; `getConsensus` `contested` is a natural debate trigger (currently dormant).
- `agentProvenance` (`forum-types.ts:27-33`) records trace/model/cost but UI shows only tokens.

## EXISTING CAPABILITIES (reused, not built)

- Cognitive modules: Lenses, Crystal Vault, Junction, Synthesis, Knowledge Generator,
  Forum, Builder (`AGENTS.md` Modules 1–7).
- Invocation Engine (intent lifecycle D1–D7), Conversation Director, Debate.
- Event bus: `FORUM_*` (`event-registry.ts:1392-1410`), `conversation:*`, `cognitive:*`,
  `debate:verdict:generated`.

## INTEGRATIONS (wired or trivially wireable)

- Forum ↔ Debate: via Invocation `mode:'debate'` (`phase21-invocation.ts:75`).
- Forum ↔ Crystal/Knowledge: via `phase18-forum.ts` bridges + `crystalVault`.
- Forum ↔ Agents: via Invocation `mode:'chat'` + `agentProvenance`.
- Forum ↔ Memory: prompt-augmentation in the Invocation delegate (B2.1).
- Forum ↔ Realtime: `FORUM_POST_ADDED`/`FORUM_POST_VOTED` on `IEventBus`.

---

## UX IN ONE YEAR (the experience)

**Mission:** _"The Forum is where humans and agents think out loud, disagree productively,
and turn the result into durable, cited knowledge."_

### A human's day

1. **Opens Forum** → searches a topic instantly (A0.1), sees consensus health badges
   (A1.1), pinned community threads (A0.3).
2. **Asks a question** → an invited expert agent answers in-thread with a provenance
   card (B0.1/B0.2): model, trace, cost. A "Generated knowledge" card shows the
   Knowledge Generator already spun up from the question pattern (C2.1, `phase18-forum.ts:82`).
3. **Disagreement** → consensus turns `contested` (verified `forum-service.ts:300`);
   one click escalates to a real Debate via Invocation (B1.1). The debate verdict posts
   back as a case-study linked to the thread (B1.2).
4. **Resolution** → high-confidence consensus auto-proposes a Crystal (C3.1); the user
   crystallizes it. The crystal links back to the thread (C4.1).
5. **Returns later** → subscribed threads ping via alerts (A3.2); realtime posts append
   live (A3.1).

### Agent collaboration

- Agents are **invited, not spontaneous** (D6 authority = human; `INVOCATION_ENGINE.md`).
- Policy-gated expert auto-answers possible but flood-controlled (`enforceFloodBudget`
  `forum-service.ts:312`).
- Each agent post expands to its Cognitive Stream trace (B4.2) — explainable AI.

### Debate linkage

- Forum is the **soft on-ramp** to Debate; Debate is the **hard validator** for contested
  threads. No duplicate escalation subsystem (`25_DO_NOT_BUILD_YET.md` (b)) — Invocation
  is the sole handoff.

### Knowledge flow

- Discussion → Evidence (C0.1) → Debate (C1.1) → Consensus → Crystal (C3.1) →
  future discussions seeded by crystals (C2.2). A bidirectional Topic↔Crystal link graph
  (C4.1) makes the Forum the navigable front-door to the knowledge base.

### Cognitive visibility

- Every agent contribution is traceable to `cognitive:*` events; human users can expand
  "why the agent said this" (B4.2) — closing the consumer-side gap noted in
  `22_DEBATE_DO_NOT_BUILD_YET.md` (d).

### Moderation

- Human-in-loop moderation (hide/warn/remove already wired, `TopicView.tsx:51-63`);
  optional agent triage suggestions (B3.1); role-gate added only when multi-user risk
  appears (`25_DO_NOT_BUILD_YET.md` (h)).

### UI

- Single panel: left = search/filters/pinned/heatmap; center = thread with consensus
  badge + agent provenance + knowledge card; right = moderation queue + generated
  knowledge + "invite agent" / "escalate to debate" actions. Realtime, subscribable,
  mobile-comfortable.

---

## Why this is reachable (not fantasy)

Every bullet above maps to a **verified existing capability** or a **UI-glue task** in
roadmaps A/B/C. No item requires a new engine, new bus, or new Dexie schema beyond the
additive Topic↔Crystal link (C4.1, v18+ migration discipline per `AGENTS.md`). The
one-year target is the union of Roadmaps A (Phase 0–4) + B (Phase 0–4) + C (Phase 0–4),
sequenced in `31_FORUM_MASTER_ROADMAP.md`.

_Labels: VERIFIED = source Read/Grep; OPINION/INFERRED = forward projection from verified
foundations._
