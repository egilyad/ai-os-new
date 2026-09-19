# 07 — DESIGN B: "Debate Mission Control"

**Thesis:** A moderator's cockpit that treats a running debate as a controllable system — live agent grid, global consensus gauge, inject/override, quality monitor, and one-click integration launches.

---

## Target user & primary job-to-be-done

- **User:** A human moderator / operator running high-stakes or multi-agent debates (tournaments, research debates).
- **JTBD:** "Give me command over the debate — see every agent's health at a glance, steer it when it stalls, and push outcomes into Crystal/Forum without leaving the screen."

---

## VERIFIED baseline (what exists today)

- `src/components/DebatePanel/DebatePanel.tsx` already supports an _inject_ action — `handleReplay` is the mislabel (328–338); the same file exposes an injection path (`setActionLoading`, `t('debate.error_inject')`, lines 314–324), confirming inject exists but is fragile / error-prone.
- `src/stores/debateLiveStore.ts` tracks per-agent `status` (`thinking | responded | error | timeout | fallback`, line 53) and aggregates counts of `error`/`timeout`/`fallback` (lines 451–453) — a built-in health signal waiting to be surfaced as a grid.
- The same store computes `confidence` per agent (line 392) and holds `emotions` — these become the per-agent telemetry tiles.
- `debate:runtime:consensus:reached` (event-registry.ts:625) carries `confidence/agreements/conflicts` — the seed for a global consensus gauge.
- Integrations that already exist and can be "launched" from the cockpit: **Crystal bridge** (auto-proposes crystals from verdicts — per AGENTS.md Module 2), **Forum case-study** bridge (Module 6), and the **Invocation engine debate mode** (Room/Step 6). These are VERIFIED downstream sinks.

**Motivation gap (VERIFIED):** `AgentControlPanel` sliders mutate the _global_ agent registry (per AGENTS.md "AgentControlPanel sliders mutate global registry"). Mission Control must scope any parameter override to the _session_, never the global registry.

---

## Concept description

**OPINION / INFERRED (novel parts):**

1. **Agent status grid.** A tile per participant showing live status dot, confidence bar, emotion, and error/timeout/fallback count — directly from `debateLiveStore` aggregates (lines 451–453).
2. **Global consensus gauge.** Single radial gauge from `debate:runtime:consensus:reached.confidence`, with agreement/conflict split. Opens the question (INFERRED) of a moderator "nudge" when confidence stalls.
3. **Inject / override console.** A controlled input to inject a moderator statement or override the next proposer. This reuses the existing inject path (DebatePanel.tsx:314–324) but makes it first-class and _session-scoped_, fixing the global-registry mutation trap.
4. **Quality monitor.** Reuse `DebateQualityPanel.tsx` (VERIFIED existing panel) as an embedded mini-view rather than a separate route.
5. **Integration launch rail.** Buttons that call the existing Crystal / Forum / Invocation sinks, passing the current `sessionId` + `verdict`.

---

## Key screens

See `designs/07_mission_control.svg`. Layout: left = agent status grid (tiles with status/emotion/confidence); center = consensus gauge + live mini-arena; right = inject/override console + integration launch rail; bottom = quality strip.

---

## How it uses / extends the existing architecture

- **Reads** `useDebateLiveStore` (status/emotions/confidence + aggregates) and subscribes to `debate:runtime:consensus:reached`.
- **Writes** only via the existing inject API and existing integration services (`crystalVault`, `forumService`, `invocationEngine`) — no new event contracts required.
- **Session-scoped parameters:** any "override" must be passed as runtime config, explicitly NOT written back to the global agent registry (closing the AgentControlPanel gap).

---

## Strengths / risks / effort

- **Strengths:** Centralizes the already-fragmented moderator affordances (inject, quality, integrations) into one surface; leverages heavy existing telemetry.
- **Risks:** "Override next proposer" implies an orchestration hook that may not exist in the Debate runtime — INFERRED; needs verification of the director/orchestrator override API. Scope creep into the runtime.
- **Effort:** **L** (integration rail + session-scoped override + consensus-stall logic).
- **Dependencies:** `debateLiveStore.ts`, `DebateQualityPanel.tsx`, Crystal/Forum/Invocation services, Debate orchestrator override seam.

---

## Distinctiveness vs other concepts

- vs **A (Arena):** B adds control + command; A is passive observation.
- vs **C (Cognitive Timeline):** B is about _steering_, not _explaining reasoning_.
- vs **D (Workspace):** B is operational; D is the analytical research loop.
- vs **E (Hybrid):** B becomes E's "Expert" control layer.
