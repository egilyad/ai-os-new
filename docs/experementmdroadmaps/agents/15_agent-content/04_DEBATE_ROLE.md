# 04 — DEBATE ROLE for `agent-content`

> Debate participation is generic. There is NO content-specific debate path. Labels: VERIFIED / INFERRED / OPINION.

## CURRENT

- `agent-content` can be added as a **debate participant** (role `pro`/`con`/`neutral`) like any agent — debate-agent-executor.ts:38-116 executes it via `callLLM(session, participant)`.
- Its debate identity = `node.config.systemPrompt` (content strategist) + pinned model — resolved through the same `findParticipant`/executor path as all agents.
- **Persona injection is generic.** `PersonaSelector.selectForTopic()` (persona-selector.ts:251-308) scores 10 topic-keyword personas (cautious_scientist, passionate_advocate, pragmatic_economist, legal_expert, historian, technologist, philosopher, diplomat, cultural_critic, strategist). None is editorial/SEO/content. The selector matches on **topic keywords + round number + agent role string**; `agent-content`'s role `Content Strategist` is not a `pro/con/neutral` role, so it falls into the deterministic tiebreak (persona-selector.ts:287-289).
- Net: in a debate, `agent-content` speaks with its base content-strategist prompt plus a _random-but-deterministic_ generic persona. Its editorial/SEO expertise is **not** leveraged.
- VERIFIED: no "content"/"editorial"/"SEO" string exists in persona-selector.ts or debate-runtime beyond generic usage.

## POTENTIAL (justified by specializations)

`agent-content`'s specializations (`Editorial`, `SEO`, `Messaging`) map naturally to debate functions that **no existing persona covers**:

1. **Editorial fact-checker / clarity advocate** — a persona that challenges verbose/ambiguous claims for readability and evidence quality. Justified: "Editorial" = clarity + accuracy.
2. **Messaging / framing analyst** — evaluates how each side frames the issue (narrative, audience, persuasion). Justified: "Messaging".
3. **SEO / discoverability lens** — argues for the position most likely to be found/referenced (surfacing, indexing, citation-worthiness). Justified: "SEO".

These are legitimate _content-domain_ contributions to a dispute that the current 10 personas ignore.

## RECOMMENDED

- Add **one** content-domain persona variant (e.g. `editorial_clarity`) to `PersonaSelector` and allow `agent-content` (and siblings in the `Creative` group) to be preferentially matched to it when the debate topic contains content/messaging/communication keywords. This reuses the existing keyword-scoring machinery (persona-selector.ts:243-249) — no new subsystem.
- Do **NOT** hard-code `agent-content` into debate logic. Gate via the same `suitableRoles`+keyword mechanism so the change benefits the whole `Creative` group and stays generic.

## Scenarios (2-3)

1. **"Should the company blog about X?"** — `agent-content` as `editorial_clarity` persona argues for/against publishability, readability, and audience fit; `agent-risk` and `agent-ethics` join. Outcome: a publish/no-publish recommendation with editorial conditions.
2. **"Which messaging resonates with Gen-Z?"** — `agent-content` (messaging analyst) vs `agent-ux` (user-research) vs `agent-data` (forecasting) in a 3-way debate; `agent-content` frames audience-segment narratives.
3. **"Is this technical doc clear enough for non-experts?"** — `agent-content` + `agent-doc-simplifier` + `agent-doc-checker` debate clarity; `agent-content` represents the target-reader perspective.

## Risks / dependencies

- Risk: a content persona in a non-content debate could feel out of place → mitigate with keyword gating (already the design).
- Deps: `persona-selector.ts` (add variant), `debate-llm-prompt-context.ts:875` (already imports selector — no change needed).
- Effort: LOW (one variant object + keyword list).
