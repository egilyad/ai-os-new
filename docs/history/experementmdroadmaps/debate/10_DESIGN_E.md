# 10 — DESIGN E: "Hybrid Debate Experience"

**Thesis:** One adaptive Debate UI with progressive disclosure (Simple → Detailed → Expert) that folds Arena (A), Mission Control (B), Cognitive Timeline (C), and Workspace (D) into a single coherent product.

---

## Target user & primary job-to-be-done

- **User:** Everyone — from a curious first-time observer to a power moderator — without forcing them into one fixed layout.
- **JTBD:** "Give me just enough Debate UI for my task right now, and let me drill deeper (or wider) without switching apps."

---

## VERIFIED baseline (what exists today)

- The fragmentation is VERIFIED: `DebateArena.tsx` already forks into `classic` vs `runtime` modes (lines 10–100) and there are at least eight debate-related panels (`DebateArena`, `DebateReplayPanel`, `ArgumentGraphPanel`, `DebateAnalysisPanel`, `DebateQualityPanel`, `DebateWorkspacePanel`, `DebateStrategyBuilder`, `TournamentPanel`) — a sprawl that argues for one adaptive shell.
- `debateLiveStore.ts` already produces all the telemetry every layer needs (`agentEvents`, `emotions`, `confidence`, aggregates at lines 451–453) — so one store can feed all disclosure levels.
- `debate:*` event vocabulary (event-registry.ts 585–829) and the existing `cognitive:*` schemas (737–776) supply the data for every sub-view.

---

## Concept description

**OPINION / INFERRED (novel parts):**

1. **Progressive disclosure (Simple → Detailed → Expert).** A single mode switch (replacing the brittle `?mode=classic|runtime` fork):
   - _Simple_ = Design A arena only (stance columns + live stream).
   - _Detailed_ = A + Design C cognitive timeline toggle + verdict panel.
   - _Expert_ = Detailed + Design B mission-control console (inject/override/integration rail).
2. **Tab shell for workflows.** Design D's Research→Debate workspace becomes a top-level tab set ("Arena / Timeline / Control / Workspace"), each lazily mounted — mirroring how `DirectorPanel` already decomposes into Configure/Library/Run tabs (VERIFIED pattern in AGENTS.md B5.1).
3. **Unified replay.** One replay engine that reads Dexie (`debate-session-store`) + the cognitive timeline, fixing the VERIFIED `handleReplay` mislabel (DebatePanel.tsx:328–338) and the replay-consensus/verdict gap in one stroke.

---

## Key screens

See `designs/10_hybrid.svg`. A single shell: top = disclosure level switch (Simple/Detailed/Expert) + tab bar (Arena/Timeline/Control/Workspace); center = the active layer; right rail = context-sensitive (empty in Simple, cognitive in Detailed, control in Expert).

---

## How it uses / extends the existing architecture

- **Single consumer** of `useDebateLiveStore` + `debate:*` events; adds the `cognitive:*` join store from Design C as an optional layer.
- **No new events** beyond Design C's proposed `cognitive:*` emissions; relies entirely on existing contracts.
- **Replaces** the `?mode=` fork in `DebateArena.tsx` with an in-app disclosure control, retiring the duplicate classic/runtime split.

---

## Strengths / risks / effort

- **Strengths:** Ends panel sprawl; every other concept (A–D) becomes a _mode_ of E, so it captures the full roadmap value.
- **Risks:** Largest surface area; risks becoming a "kitchen sink" if disclosure tiers aren't disciplined. Requires reconciling the duplicate classic/runtime implementations.
- **Effort:** **L+** (umbrella; built after A–D or in parallel by composing them).
- **Dependencies:** All of A, B, C, D + `DebateArena.tsx` refactor + `debateLiveStore.ts`.

---

## Distinctiveness vs other concepts

- E is the **synthesis**, not a standalone vision. Its distinctiveness is _adaptivity + unification_: it is the only concept that claims "you don't have to choose between A–D."
- It explicitly _consumes_ A (arena), B (control), C (timeline), D (workspace) rather than competing with them.
