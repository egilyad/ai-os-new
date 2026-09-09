# DESIGN E — KNOWLEDGE / INTELLIGENCE HUB

> Focus the entire UX around knowledge production. Mental model: a research lab / intelligence analyst workbench — questions, evidence, agents, debates, conclusions, provenance, knowledge graph.
> Every change maps to an identified usability problem from `../usability/`.

## 1. Design philosophy

Everything starts from a **question** and ends in a **conclusion with provenance**. Agents and debates are _means_ to produce knowledge, not the center. Solves: concept overload (Where/Mode), hidden research phases, scattered knowledge modules (Lenses/Crystals/Forum), low comprehension of "what did we learn."

## 2. Target user mental model

"I ask a question, assemble evidence with agents and debates, and get a cited conclusion I can trust."

## 3. Navigation structure

**CURRENT:** 9 sections / 177 items, Knowledge a grab-bag.
**→ PROPOSED:** Left rail: _Questions, Evidence (research/citations), Debates, Agents, Graph, Library_. Stubs under "Planned" (UX-001). `builder` deduped. The hub lead is "Questions."
**→ WHY:** Reframes the product around outcomes (knowledge), hiding machinery.

## 4. Dashboard concept — "Questions & Conclusions"

**CURRENT:** Generic Dashboard.
**→ PROPOSED:** A feed of **open questions** and **recent conclusions** (each with provenance chips: which agents/debates produced it). "Ask a question" is the primary CTA (first-run tour, UX-003).
**→ WHY:** Gives the product a clear purpose a newcomer understands.

## 5. Agent UX

**→ PROPOSED:** Agents appear as **contributors** to questions/conclusions, not a separate heavy table. "Ask agent to help with this question" → plain outcome (UX-005). Specialist picker shows role. Empty → invite agent (UX-011). Identity configurable (UX-016).
**→ WHY:** Agents contextualized by contribution.

## 6. Debate UX

**→ PROPOSED:** A debate is a **method to resolve a question**; launched from a question with "Debate this." Arena shows which question it serves. Empty guidance (UX-013).
**→ WHY:** Debate has a visible purpose.

## 7. Conversation UX

**→ PROPOSED:** Chat threads attach to questions as evidence.

## 8. Research UX

**→ PROPOSED:** Research = evidence gathering for a question; **phase rail** (7 phases, planned states) + citations + knowledge-graph synthesis (UX-010). Provenance captured per claim.
**→ WHY:** Research framed as evidence production.

## 9. Room / Invocation UX

**→ PROPOSED:** "Ask an agent" = contribute to a question; pick agent → plain outcome (UX-005); rejection modal with deep link (UX-004); feed scoped to the question (UX-012).
**→ WHY:** Invocation has a clear why.

## 10. Knowledge UX

**→ PROPOSED:** Knowledge graph is central: Lenses/Crystals/Synthesis/Forum are **nodes** in the graph. The Forum gains vote/pin/moderate (UX-009). Crystals = concluded knowledge units with provenance.
**→ WHY:** Unifies the grab-bag into one knowledge model.

## 11. Live execution UX

**→ PROPOSED:** A "Reasoning" panel shows live agent/debate activity **tied to the current question**, scoped (06-LIVE-1/2). Provenance events stream.
**→ WHY:** Realtime comprehension anchored to meaning.

## 12. History

**→ PROPOSED:** "Conclusions" archive + question history with full provenance trail (reuses Dexie).
**→ WHY:** Knowledge is the durable artifact.

## 13. Settings

**→ PROPOSED:** Policies/Providers/Roles grouped; policy editor enables recovery (UX-004).

## 14. Notifications

**→ PROPOSED:** "Conclusion ready" / "Debate resolved" notifications with provenance summary.

## 15. Search / Command Palette

**→ PROPOSED:** ⌘K "Ask…" first-class (UX-008); search questions, evidence, agents.

## 16. Mobile/responsive

**→ PROPOSED:** Question-centric single column; graph collapses to list.

## 17. Empty states

**→ PROPOSED:** "Ask your first question" hero (shared empty component, UX-007).

## 18. Loading states

**→ PROPOSED:** Provenance chips populate as agents answer.

## 19. Error states

**→ PROPOSED:** Structured error card + deep link (UX-004); Scheduler labeled preview (UX-002).

## 20. Information hierarchy

Question ▸ Evidence/Debate/Agents ▸ Conclusion + Provenance. Graph as the connective view.

---

## DESIGN SYSTEM E (visual language)

- **Typography:** Newsreader / Inter (editorial feel). Sizes 15/13/11; serif for conclusions, sans for UI. Monospace for provenance IDs.
- **Color:** Warm paper-dark `#16140f`, surface `#1f1c16`, border `#3a342a`. Accent **amber-gold `#e0a82e`** (knowledge/provenance), green `#5fbf6b` (concluded), violet `#a78bfa` (agents), blue `#5aa9e6` (evidence/links), red `#e06b6b`. Text `#f3ede0` / muted `#a89e8a`.
- **Spacing:** 8px grid; generous 16/24 padding (reading comfort).
- **Cards:** 1px border, 8px radius, paper texture subtle.
- **Buttons:** Gold primary, outline secondary.
- **Inputs:** 8px radius, warm focus.
- **Tabs:** Underline.
- **Nav (rail):** 64px icon + label; "Questions" emphasized.
- **Status indicators:** provenance chip + status dot.
- **Agent avatars:** Round 32px, gold ring, initials.
- **Badges:** pill, uppercase 10px; PLANNED=amber.
- **Dialogs:** Centered, paper card.
- **Tables:** evidence tables with source column.
- **Timeline:** question → debate → conclusion provenance chain.
- **Live stream:** "Reasoning" feed with provenance.
- **Empty state:** hero "Ask a question."
- **Error state:** red left border + action.

_Mockups: `mockups/design-e/` (questions-home, question-detail, knowledge-graph, debate-as-method, research-evidence, ask-agent, conclusions)._
