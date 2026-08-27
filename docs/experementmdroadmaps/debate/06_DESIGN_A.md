# 06 — DESIGN A: "Debate Arena"

**Thesis:** Polish the existing real-time debating surface into a first-class, stance-aware argument battlefield without re-architecting the runtime.

---

## Target user & primary job-to-be-done

- **User:** A participant or observer watching/running an agent debate.
- **JTBD:** "Let me watch the debate unfold live, understand who is arguing what, and see who is winning — in real time, without clutter."

---

## VERIFIED baseline (what exists today)

- `src/components/DebateArena.tsx` is the top container. It switches between two modes via the `?mode=runtime` query param (line 15: `searchParams.get('mode') === 'runtime' ? 'runtime' : 'classic'`) and renders either `<DebatePanel />` (classic) or `<DebateRuntimePanel />` (runtime) at line 100. Both modes share a purple (`#a78bfa`) active-tab accent.
- `src/components/DebatePanel/DebatePanel.tsx` is the classic composer + live view. It owns `topic`, `selectedAgents`, `session`, and a `handleReplay` (lines 328–338) that — contrary to its label — **re-runs the debate** (`setTopic` + `setSelectedAgents` + `handleStart`) rather than replaying a recorded timeline. This is a VERIFIED mislabel.
- `src/stores/debateLiveStore.ts` is the transient live store. It consumes ~12 `DEBATE_*` runtime events and maintains `agentEvents: DebateAgentEvent[]` (status `thinking | responded | error | timeout | fallback`), an `emotions: Map<string, DebateEmotion>`, and a computed `confidence` per agent. It caps retained events at `MAX_AGENT_EVENTS = 500` (line 11) and truncates event `content` to 2000 chars (line 217) — content is "not rendered anywhere" per the source comment, so today the live stream is effectively token/status-only.
- `src/kernel/events/event-registry.ts` emits low-level stream events `debate:runtime:agent:thinking` (596), `debate:runtime:agent:chunk` (600), `debate:runtime:agent:responded` (604), `debate:runtime:agent:error` (608), plus round + consensus events (`debate:runtime:consensus:reached` carries `confidence/agreements/conflicts`, line 625) and the domain-level `debate:verdict:generated` (825) and `debate:consensus` (with optional `synthesis`, line 793).

---

## Concept description

**OPINION / INFERRED (novel parts):**

1. **Stance columns.** Replace the single stacked feed with two (or N) vertical lanes, one per participant stance. In classic mode participants are already selected (`selectedAgents`), so lanes are derived directly. This is a pure _presentation_ change — no new events.
2. **Live token streaming.** Today `debate:runtime:agent:chunk` exists (line 600, payload `{ chunk }`) but `debateLiveStore` caps content and never renders it. Design A simply _renders_ the chunks as they arrive (streaming text), then swaps to the final `responded` content. This closes a VERIFIED latent capability gap.
3. **Emotion & confidence meters.** `debateLiveStore.emotions` and per-agent `confidence` are already computed (lines 24–40, 392). Design A surfaces them as inline bars per lane. Again: render what the store already produces.
4. **Round & consensus HUD.** Use `debate:runtime:round:started/ended` and `debate:runtime:consensus:reached` to show a round counter and a live consensus/conflict gauge driven by existing payloads (`agreements`/`conflicts`/`confidence`).

---

## Key screens

See `designs/06_arena.svg`. The mockup shows:

- A title bar ("Debate Arena · classic").
- Two stance columns (PRO / CON) with agent name, confidence bar, and emotion dot.
- A live streaming transcript area showing partial tokens (emerald "LIVE" indicator) for the currently-`thinking` agent.
- A consensus/conflict gauge bottom strip driven by `debate:runtime:consensus:reached`.

---

## How it uses / extends the existing architecture

- **No new events.** Every widget reads `useDebateLiveStore` selectors (`agentEvents`, `emotions`, `confidence`) or subscribes to existing `DEBATE_*` events through the core bus — exactly the same intake `debateLiveStore.ts` already implements (lines 179–343).
- **Fixes `handleReplay`** by separating "Re-run" (current behavior) from a true "Replay" that reads the Dexie-persisted session + local timeline. Replay is scoped as a later additive (see risk).
- **Rendering-only win:** unlocks `debate:runtime:agent:chunk` which is currently ingested but discarded.

---

## Strengths / risks / effort

- **Strengths:** Lowest-risk upgrade; reuses 100% of the verified live pipeline; instantly makes the existing chunk/emotion data visible.
- **Risks:** Classic vs runtime duplication — the two modes already diverge (`DebatePanel` vs `DebateRuntimePanel`). Design A must converge them or risk double maintenance. The `content` cap at 2000 chars (line 217) will clip long streaming arguments; raising it costs memory.
- **Effort:** **M** (mostly UI + unblocking chunk rendering; the replay honesty fix is small but politically sensitive given the mislabel).
- **Dependencies:** `debateLiveStore.ts` (must expose chunk/text buffers), `DebateArena.tsx` mode switch.

---

## Distinctiveness vs other concepts

- vs **B (Mission Control):** A is participant-facing observability; B is moderator command. A has no inject/override controls.
- vs **C (Cognitive Timeline):** A shows _what_ was said live; C shows _why_. A does not interleave reasoning steps.
- vs **D (Research→Debate Workspace):** A is a single debate, not the research loop.
- vs **E (Hybrid):** A is one of E's simplified modes; E adopts A's arena as its "Simple" layer.
