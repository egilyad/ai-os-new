# 09 — DESIGN D: "Research → Debate Workspace"

**Thesis:** Unify the analytical loop — a research question seeds a debate, evidence/crystals feed arguments, and the verdict writes back to Research / Forum / Crystal.

---

## Target user & primary job-to-be-done

- **User:** A knowledge worker investigating a question who wants the debate to be a _method_, not an endpoint.
- **JTBD:** "Start from my question, let agents debate it with evidence, then capture the durable conclusion where I already work (Crystal/Forum/Research)."

---

## VERIFIED baseline (what exists today)

- **Crystal bridge (VERIFIED):** per AGENTS.md Module 2, `crystal-debate-bridge` auto-proposes Knowledge Crystals from debate verdicts. So "verdict → Crystal" already has a producer.
- **Forum bridge (VERIFIED):** per AGENTS.md Module 6, `forum-service` has an event bridge where `debate:verdict:generated` creates a case study and a topic can be escalated to debate (`forum:topic:escalated-to-debate`). Both directions exist.
- **Invocation engine debate mode (VERIFIED):** Room/Step 6 lets a human invoke a debate via `invocationEngine` with `constraints.mode:'debate'` and opens it at `/debate?mode=runtime&sessionId=…`.
- **Missing Research bridge (VERIFIED gap):** there is no dedicated "Research" entity that seeds a debate; the only seed path is the manual `topic` + `selectedAgents` in `DebatePanel.tsx` (lines 330–336). The research loop is currently manual.
- **Session store (VERIFIED):** `src/stores/debate-session-store/` uses Dexie `liveQuery` — the durable debate record already lives in Dexie, ready to be referenced by a Research entity.

---

## Concept description

**OPINION / INFERRED (novel parts):**

1. **Research question as root object.** A `ResearchQuestion` (INFERRED new entity, persisted in Dexie) holds the question, linked evidence (crystals), and the spawned `debateSessionId`. It is the missing "Research" bridge.
2. **Evidence tray.** Crystals (`crystalVault`) are attached as evidence and injected into the debate context — reusing the existing Crystal bridge on the write side and a read-side selector on the workspace.
3. **Debate embed.** The arena (Design A surface) is embedded as a tab, not a separate route, so the question stays in view while the debate runs.
4. **Write-back rail.** On `debate:verdict:generated`, offer one-click "Save as Crystal" (uses existing bridge), "Post to Forum" (existing bridge), and "Close Research Question" — all session-scoped, no new events.
5. **Open session continuity.** Reuse the VERIFIED Room "Open session" pattern (`/debate?mode=runtime&sessionId=…`) to jump from a Research item into the live/past debate.

---

## Key screens

See `designs/09_workspace.svg`. Three-column workspace: left = Research question + evidence/crystal tray; center = embedded debate arena tab; right = write-back rail (Crystal / Forum / Research actions) + verdict summary.

---

## How it uses / extends the existing architecture

- **Reads** Dexie via `debate-session-store` and `crystalVault`/`forumService` selectors.
- **Writes** only through existing bridges (`crystal-debate-bridge`, `forum` event bridge, `invocationEngine`). No new event contracts — `debate:verdict:generated` (825) is the trigger already consumed by those bridges.
- **New entity** `ResearchQuestion` is the only additive persistence; it references (does not duplicate) the debate session.

---

## Strengths / risks / effort

- **Strengths:** Composes proven integrations into a coherent loop; the hardest sink/bidge halves (Crystal, Forum) already exist.
- **Risks:** The "Research" entity is net-new and needs its own lifecycle/UI; the evidence→argument injection path is not yet built (INFERRED gap).
- **Effort:** **L** (new Research entity + workspace shell + evidence injection).
- **Dependencies:** `crystalVault`, `forumService`, `invocationEngine`, `debate-session-store`, `debateLiveStore.ts`.

---

## Distinctiveness vs other concepts

- vs **A/B/C:** D is the only one framing debate as a _step in a larger workflow_ rather than a destination.
- vs **E:** D is E's "workspace tabs" content; E provides the adaptive shell around it.
