# 11 — DEBATE LIVE DESIGN (Progressive Disclosure)

> RESEARCH-ONLY. Read-only design document. No source modified.
> Subsystem: Debate (runtime). Audience: UI/UX + debate-runtime owners.
> Citation convention: `file:line` + label `VERIFIED` (confirmed by Read/Grep on source) / `INFERRED` (reasonable from evidence) / `OPINION` (novel proposal).

---

## 0. Goal

Define a **progressive-disclosure** live-debate UI with three tiers:

- **Simple** — one big live feed + consensus bar. For first-time / casual users.
- **Detailed** — per-agent columns, streaming text, emotion/confidence, quality meters. For analysts watching a running debate.
- **Expert** — inject/override, strategy switch, integration launch, raw event log. For operators / researchers.

Each tier states **what the user sees** and **which events / store fields feed it**. Every claim is grounded in the live store (`src/stores/debateLiveStore.ts`) and the event registry (`src/kernel/events/event-registry.ts`).

---

## 1. What already exists (VERIFIED)

The live store is a Zustand store that subscribes to ~12 `debate:runtime:*` events via `eventBus.onSafe` (`debateLiveStore.ts:154-444`). It is **transient** — comment at `debateLiveStore.ts:446` explicitly states "no persist needed (... data is live-only)". Caps: `MAX_AGENT_EVENTS=500`, `MAX_ROUND_EVENTS=200`, `MAX_EMOTIONS=200` (`debateLiveStore.ts:11-13`).

Subscribed events and the state they drive:

| Event (event-registry name)                         | Store field                                                      | Line                         |
| --------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------- |
| `DEBATE_AGENT_CHUNK` (`debate:runtime:agent:chunk`) | `streamingContent` Map                                           | `debateLiveStore.ts:155-172` |
| `DEBATE_AGENT_THINKING`                             | `agentEvents`, `currentThinking`, `emotions`, `agentCountdowns`  | `:173-208`                   |
| `DEBATE_AGENT_RESPONDED`                            | `agentEvents`, `currentThinking`, `streamingContent`, `emotions` | `:209-245`                   |
| `DEBATE_AGENT_ERROR`                                | `agentEvents`, `emotions`                                        | `:246-278`                   |
| `DEBATE_AGENT_TIMEOUT`                              | `agentEvents`, `emotions`                                        | `:279-311`                   |
| `DEBATE_AGENT_FALLBACK`                             | `agentEvents`, `emotions`                                        | `:312-347`                   |
| `DEBATE_ROUND_STARTED`                              | `roundEvents`                                                    | `:348-363`                   |
| `DEBATE_ROUND_ENDED`                                | `roundEvents`                                                    | `:364-371`                   |
| `DEBATE_MEMORY_CLAIM`                               | `memoryBubbles`                                                  | `:372-389`                   |
| `DEBATE_CONSENSUS_REACHED`                          | `judgeWeights` (pro/con/neutral)                                 | `:390-403`                   |
| `DEBATE_QUALITY_TECHNIQUE_APPLIED`                  | `agentQualityActivations`, `recentQualityEvents`                 | `:405-425`                   |
| `DEBATE_QUALITY_IMPACT_COMPUTED`                    | `recentQualityEvents`                                            | `:426-443`                   |

Emotion derivation is deterministic (`debateLiveStore.ts:126-151`): `thinking→curiosity`, `responded→confidence` (or `triumph` if prior error/timeout), `error→anger`, `timeout→fear`, `fallback→surprise`.

Consensus bar data is computed from `DEBATE_CONSENSUS_REACHED` payload (`agreements`/`conflicts`) into `judgeWeights.pro/con/neutral` (`debateLiveStore.ts:396-402`).

**Key consequence:** All three tiers below are _pure projections_ of this already-populated store. No new event, no new table is required for Simple/Detailed. Expert tier touches overrides (existing Dexie `debateOverrides`) and the existing integration bridges.

---

## 2. Tier 1 — SIMPLE

**User sees:** a single scrolling feed of what is happening + a consensus bar at top.

**Feed source:** `agentEvents` (status + agentId + optional content/error) plus `roundEvents` (round started/ended markers). Content is capped at 2000 chars per event (`debateLiveStore.ts:221`), and `agentEvents[].content` is explicitly _not_ rendered in `DebateLivePanel` per the code comment at `:217-220` — only array length / status is used. For Simple tier we DO render the (truncated) content as a plain log.

**Consensus bar:** `judgeWeights` (`pro`/`con`/`neutral`) — `debateLiveStore.ts:85,396-402`.

```
┌─────────────────────────────────────────────────────────┐
│  Debate: "Should we migrate to Rust?"        [Round 2]   │
│  Consensus: ▓▓▓ pro 4 ▓▓ con 2 ░ neutral 4   (live)      │
├─────────────────────────────────────────────────────────┤
│  ● Round 2 started                                       │
│  ◐ Agent-7 thinking…                                     │
│  ✔ Agent-3 responded (pro)                               │
│  ✔ Agent-7 responded (con)                               │
│  ✖ Agent-2 error: 402 Payment Required                  │
│  ● Round 2 ended                                         │
│  ◐ Agent-9 thinking…                                     │
└─────────────────────────────────────────────────────────┘
```

- Status glyphs map from `DebateAgentEvent.status` (`thinking|responded|error|timeout|fallback`) — `debateLiveStore.ts:50-60`.
- Round markers from `roundEvents[].status` (`started|ended`) — `:62-67`.

**Effort:** VERIFIED available today; Simple tier is essentially a read of `agentEvents` + `roundEvents` + `judgeWeights`. No new code beyond a layout component.

---

## 3. Tier 2 — DETAILED

**User sees:** one column per participant, live streaming text, an emotion/confidence chip per agent, and a quality-impact meter.

**Data, all VERIFIED present in store:**

- **Per-agent columns:** group `agentEvents` by `agentId` (`:50-60`). Key per column by `agentId`.
- **Streaming text:** `streamingContent: Map<"session:agent", string>` (`:73,155-172`), capped at 10240 chars (`:168`). Keyed by `${sessionId}:${agentId}`.
- **Thinking indicator:** `currentThinking: Map` (`:72,183-189`); presence = "thinking".
- **Emotion/confidence chip:** `emotions: Map<"session:agent", DebateEmotion>` (`:74,113-151`).
- **Countdown:** `agentCountdowns: Map` (`:75,195-199`), ticked every 1s (`:465-488`).
- **Quality meters:** `recentQualityEvents[]` (`:89-93,419-442`) and `agentQualityActivations: Map` (`:88,414-418`). The `DEBATE_QUALITY_TECHNIQUE_APPLIED` event carries `techniqueId`/`eventType`/`agentId` (event-registry `:1207-1217`).
- **Memory bubbles:** `memoryBubbles: Map` (`:77-84,372-389`) — claim + similarity + relation (`supports|refutes|extends|contradicts`).
- **Round/consensus:** same as Simple.

```
┌── Agent-3 ─────┐ ┌── Agent-7 ─────┐ ┌── Agent-9 ─────┐
│ 😊 confidence  │ │ 😠 anger       │ │ 🤔 curiosity   │
│ ⏱ 12s left     │ │ ⏱ —           │ │ ⏱ 21s left     │
│ ▸ "The borrow  │ │ ▸ (error 402)  │ │ ◐ thinking…    │
│   checker pre…"│ │               │ │                │
│ 🔧 quality ×3  │ │               │ │                │
└────────────────┘ └───────────────┘ └────────────────┘
   memory: "safety" supports 0.85

Quality impact (session): technique.applied ×N  FINAL_IMPACT @ts
```

- Per-agent `quality ×3` = `agentQualityActivations.get("session:agent")` (`:414-418`).
- One live feed column (left rail) may still show `roundEvents` markers.

**Effort:** layout/heuristic only; all fields exist. OPINION: column ordering by `agentCountdowns.secondsLeft` ascending to surface the most-at-risk agent first.

---

## 4. Tier 3 — EXPERT

**User sees:** Detailed view + control rail (inject/override, strategy switch, launch integration) + collapsible raw event log.

### 4.1 Inject / Override (VERIFIED substrate)

The Dexie `debateOverrides` table already exists (`session-manager-service.ts:492-499` `addOverride(sessionId, type, payload)` → `overrideRepo.put`). The live store has `clearSession`/`clearAll` (`:510-559`) for teardown. Override _application_ during a running session is an Expert control that writes an override row and the runtime honors it — substrate present; wiring is OPINION.

### 4.2 Strategy switch (OPINION)

INFERRED: topology/strategy (e.g. `round_robin`, `roundtable`) is chosen at start (`phase21-invocation.ts:83` hardcodes `round_robin` for invocation-triggered debates). An Expert "strategy switch" mid-debate is a novel control; no live event currently carries a mid-session strategy change. Mark OPINION.

### 4.3 Integration launch (VERIFIED bridges)

From a live debate the user can push results to downstream subsystems — these bridges already fire on `DEBATE_VERDICT_GENERATED`:

- **Crystal:** `crystal-debate-bridge.ts:27-81` (propose+validate at confidence ≥0.55).
- **Forum case-study:** `phase18-forum.ts:47-64` (post to `case-study` topic).
- **Invocation sessionRef:** `phase21-invocation.ts:75-87` (debate mode → `startDebate`, returns `ref: session.id`).
  Expert tier surfaces buttons that _trigger/observe_ these already-wired paths.

### 4.4 Raw event log (VERIFIED events)

All 12 `debate:runtime:*` events in §1 are emitted on `eventBus`. An Expert "raw log" simply subscribes to `EVENTS.DEBATE_*` and pretty-prints payloads. No new event needed (event-registry `:538-671`).

```
[EXPERT RAIL]                         [RAW EVENT LOG]
Inject ▸ Override ▸ Strategy ▸ Launch
 ├─ to Crystal   (bridge: crystal-debate-bridge.ts:27)
 ├─ to Forum     (bridge: phase18-forum.ts:47)
 └─ to Invocation(ref) (phase21-invocation.ts:75)

12:01:03.221 DEBATE_AGENT_THINKING   {agentId:A7}
12:01:03.880 DEBATE_AGENT_RESPONDED  {agentId:A7,len:1820}
12:01:04.010 DEBATE_CONSENSUS_REACHED{agreements:4,conflicts:2}
```

---

## 5. Simple-tier fix: the mislabeled "Replay" button (VERIFIED)

`DebatePanel.tsx:328` defines `handleReplay`, and `:337` does `queueMicrotask(() => handleStart())`. `handleStart` (`:221`) **starts a brand-new debate** — it does not replay. So the button labeled "Replay" actually re-runs a fresh debate.

**Recommendation (OPINION, Simple-tier fix):** relabel the button to "Run again / New debate" and add a distinct "Open Replay" entry that navigates to `DebateReplayPanel`. This is a copy/UX change only; no runtime change. See `13_DEBATE_REPLAY.md` for the real replay path.

---

## 6. Tier summary table

| Tier     | Feeds                                                                                                                 | New code                 | Status                               |
| -------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------ |
| Simple   | `agentEvents`, `roundEvents`, `judgeWeights`                                                                          | layout only              | VERIFIED-available                   |
| Detailed | +`streamingContent`, `emotions`, `agentCountdowns`, `memoryBubbles`, `recentQualityEvents`, `agentQualityActivations` | layout/heuristics        | VERIFIED-available                   |
| Expert   | +`debateOverrides` (inject), bridges (launch), raw `DEBATE_*` log                                                     | control wiring (OPINION) | substrate VERIFIED; controls OPINION |

## 7. Open questions

- Does any panel currently consume `agentAddressing` (`debateLiveStore.ts:76,560-567`)? It is populated but its renderer is unverified → INFERRED unused in live UI.
- `judgeWeights.neutral` formula (`10 - agreements - conflicts`, `:400`) assumes a fixed scale of 10 → OPINION: confirm with debate-runtime owner.
