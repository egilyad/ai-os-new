# 01 — First-Time User Mental Model Test

> Imagined user: "Alex", opens SuperAgents OS for the first time. Knows LLMs/chatbots, NOT multi-agent systems.
> Evidence: VERIFIED from nav registries + panel reads; OPINION for the imagined reactions.

## What Alex sees on first load

A left **sidebar** with 9 collapsible sections (Dashboard, Chat, Debates, Knowledge, Integrations,
Agents, Connections, Diagnostics, Settings), each expanding into a long list of items. The main area
shows whatever the default route is (likely a Dashboard/overview — VERIFIED default route exists per
`routes.tsx`). No onboarding modal, no guided tour, no "Where do I start?" (VERIFIED: `TutorialPanel`
exists but is buried in Knowledge with `experimental` flag and not auto-shown).

## The concept questions Alex asks (and what the UI answers)

| Alex asks                 | What the UI tells them                                                                        | Verdict                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| "What is this?"           | Sidebar mixes "Debate", "Agents", "Crystals", "Quantum Inspiration", "Aquarium"               | **Confusing** — no unifying explanation                                               |
| "What is an Agent?"       | `agents` panel lists agents with roles; but no plain-language definition anywhere             | **Unclear**                                                                           |
| "What is a Debate?"       | `debate` = "Debate Arena"; 30 sub-items (steelman, bayesian-judge…) that are stubs            | **Misleading** — looks like 30 features, all "Coming Soon"                            |
| "What is a Conversation?" | `director` = "Conversation Director" (experimental); empty Run tab until you build a scenario | **Unclear** — jargon ("scenario", "turn", "participant")                              |
| "What is a Room?"         | `room` = "Room" (experimental); form: Agent / Where / Mode / Task                             | **Ambiguous** — "Where: This room / Forum topic / Conversation"? what does that mean? |
| "What is Invocation?"     | Same as Room; the word "invocation" never appears in the UI (it's internal)                   | **Invisible** — users see "Room", not "Invocation"                                    |
| "What is Research?"       | `research-engine` panel: create session, run loop, citations                                  | **Partially clear** but 7 advanced features hidden                                    |
| "How are these related?"  | Nothing explains the relationship (Debate vs Conversation vs Room vs Forum)                   | **No mental model given**                                                             |

## Where Alex should start (OPINION — the UI gives no answer)

A sensible path: **Agents → (add a key) → Chat → Debate → Room → Research**. The UI offers no such
sequencing. The default landing + section order (Dashboard first) does not lead there.

## Places the UI assumes knowledge a new user lacks (VERIFIED/OPINION)

1. **Provider keys prerequisite.** Chat/Debate/Agents all require a configured API key. With zero
   keys, sending a message or starting a debate fails or shows nothing actionable. No first-run
   "Add a provider key" wizard is surfaced (VERIFIED: key management is under Connections → Keys,
   not near onboarding). → **S-ONB-1 (P0)**.
2. **"Experimental" means nothing.** 12+ items flagged `experimental` in registries, but the Sidebar
   renders them identically to stable ones (VERIFIED: `Sidebar.tsx` does not read `item.experimental`).
   Alex cannot tell what's safe to rely on.
3. **Technical IDs leak.** RoomPanel shows `policy: ab12cd34`, `session: conversation/ab12…` behind a
   "Details" toggle (VERIFIED: `RoomPanel.tsx:292-310`) — better than always-on, but still exposes
   internals to casual users.
4. **Cron, topology, junction, crystal, lens** — domain terms with no tooltips/glossary.
5. **"Scenario", "turn", "participant", "objective"** in Director with no inline explanation.

## Recommended first-run experience (UX proposal, not code)

- On first load, show a **start modal**: "SuperAgents OS orchestrates multiple AI agents. Pick a
  starting point: ⚡ Chat with one agent · ⚔️ Run a debate · 🔬 Research a question · 🛡️ Invite an
  expert (Room)." Each jumps to a pre-configured, key-aware flow.
- Surface **"Add a provider key"** as the gating first step with inline success.
- Mark experimental/coming-soon items with a visible badge (see 09/11).

## Confidence

High (VERIFIED nav + panels). The "Alex reactions" are OPINION but grounded in the structural gaps.
