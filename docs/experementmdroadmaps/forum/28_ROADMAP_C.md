# 28 — FORUM ROADMAP C: KNOWLEDGE-FIRST

> Forum as a **living collective knowledge base**: Discussion → Evidence → Debate →
> Consensus → Knowledge → future discussions. Reuses the existing knowledge bridges
> (`phase18-forum.ts`), Cognitive modules (Lenses/Crystals/Synthesis/Generator), and
> `getConsensus`. No new engines (see `25_DO_NOT_BUILD_YET.md`).

---

## Phase 0 — Evidence capture from discussions

**Goal:** discussions become structured evidence, not just chat.

### C0.1 — "Promote post to evidence/crystal"

- **Task:** Any post (esp. agent or well-voted human post) can be promoted to a `Crystal` proposal via `crystalVault.propose` (Crystal Vault `AGENTS.md` Module 2; bridge pattern `phase18-forum.ts:66-79`). The `agentProvenance`/`votes` travel as evidence.
- **Existing code:** `CrystalVaultService`, `forum-service.ts:149` votes, `agentProvenance`.
- **Proposed UI:** "Promote to knowledge" action on `PostCard` (`TopicView.tsx:20`).
- **Effort:** S–M.
- **Risk:** Low.
- **Expected result:** High-signal posts become crystallizable.

### C0.2 — Link discussions to Lenses/Synthesis

- **Task:** Tag a topic with a `Lens` (`AGENTS.md` Module 1) so its threads are viewable through that lens; offer "Synthesize topic" → `synthesisEngine` (Module 4) to produce perspectives/zones from the thread's posts (`getThread` `forum-service.ts:223`).
- **Existing code:** `LensEngine`, `SynthesisEngine`, `getThread`.
- **Effort:** M.
- **Risk:** Low–Medium.
- **Expected result:** Topic → multi-perspective synthesis.

---

## Phase 1 — Debate as knowledge validator

**Goal:** contested threads resolve into knowledge via debate (reuse Roadmap B B1.1).

### C1.1 — Contested → Debate → Verdict → Knowledge

- **Task:** `getConsensus` `contested` (`forum-service.ts:300-306`) → Invocation debate (`phase21-invocation.ts:75-87`) → `DEBATE_VERDICT_GENERATED` → case-study post (`phase18-forum.ts:48-64`) → "Promote verdict to crystal" (C0.1). This is the Discussion→Debate→Consensus→Knowledge chain.
- **Existing code:** `getConsensus`, `debateService`, `crystalVault`.
- **Proposed UI:** Sequential prompts; final "crystallize verdict" button.
- **Effort:** M.
- **Risk:** Medium (orchestration).
- **Expected result:** Disputes end as durable knowledge.

---

## Phase 2 — Knowledge generator loop (fortify existing)

**Goal:** the existing forum→generator bridge already fires (`phase18-forum.ts:82-114`); make its output visible and re-injectable.

### C2.1 — Surface generated knowledge per topic

- **Task:** `knowledge-generator-service.ts:450` handles `forum-question`; the trigger carries `topicId` (`generator-types.ts:15`). Surface generated crystals/jobs in `TopicView` as a "Knowledge generated here" card.
- **Existing code:** `knowledge-generator`, `generator.kind_forum-question` i18n (`analytics.ts:296`).
- **Effort:** M.
- **Risk:** Low–Medium (linkage store).
- **Expected result:** Users see discussions producing knowledge.

### C2.2 — Re-inject knowledge into new discussions

- **Task:** When creating a topic, suggest related crystals (Crystal Vault search) as seed context (reuse `crystalVault.query`/`search`). New discussions start from existing knowledge.
- **Existing code:** `CrystalRepository`, `crystal-vault-service`.
- **Effort:** S–M.
- **Risk:** Low.
- **Expected result:** Knowledge→discussion flywheel.

---

## Phase 3 — Consensus as a knowledge signal

**Goal:** consensus verdicts feed the knowledge graph.

### C3.1 — High-confidence consensus → auto-crystal

- **Task:** `getConsensus` `consensus` + high `confidence` (`forum-service.ts:297-299`) auto-suggests (or, under policy, auto-proposes) a `Crystal` (`crystal-debate-bridge` pattern).
- **Existing code:** `getConsensus`, `CrystalVaultService`.
- **Effort:** S–M.
- **Risk:** Low (guard against false consensus via vote diversity check already in `:297`).
- **Expected result:** Agreement becomes knowledge automatically.

### C3.2 — Knowledge health dashboard

- **Task:** Extend `ForumHeatmap` (`ForumHeatmap.tsx`) to show consensus distribution (count of `consensus`/`contested`/`open` per category) using `getConsensus` over topics (batch).
- **Existing code:** `getConsensus`, `ForumHeatmap`.
- **Effort:** M.
- **Risk:** Low (perf: batch consensus is O(posts); cap per category).
- **Expected result:** Community knowledge health at a glance.

---

## Phase 4 — Living knowledge base (future)

**Goal:** Forum is the front-door to the knowledge graph.

### C4.1 — Topic ↔ Crystal bidirectional links

- **Task:** Persist links between a `Topic` and the `Crystal`(s) it produced/was seeded by (new Dexie index on `forumTopics` or a link table — additive, v18+ pattern). Enables "discuss this crystal" and "what knowledge came from this thread".
- **Existing code:** Dexie `forumTopics` (`forum-repository.ts:26`), `crystals` table.
- **Effort:** M.
- **Risk:** Medium (schema migration discipline per `AGENTS.md` versioning).
- **Expected result:** Navigable knowledge graph.

### C4.2 — Synthesis-driven topic creation

- **Task:** From a `SynthesisSession` (Module 4), "Open forum topic" to debate/open the synthesized zones — closing the loop Knowledge→Discussion.
- **Existing code:** `SynthesisEngine`, `createTopic`.
- **Effort:** S–M.
- **Risk:** Low.
- **Expected result:** Full cycle: discuss→synthesize→discuss.

---

## Effort / Value summary

| Phase | Focus             | Effort | Risk    | Reuse                  | Knowledge impact |
| ----- | ----------------- | ------ | ------- | ---------------------- | ---------------- |
| 0     | Evidence capture  | S–M    | Low     | CrystalVault + Lenses  | High             |
| 1     | Debate validation | M      | Med     | getConsensus + debate  | High             |
| 2     | Generator loop    | M      | Low–Med | phase18 + generator    | Medium           |
| 3     | Consensus signal  | S–M    | Low     | getConsensus + heatmap | Medium           |
| 4     | Living KB links   | M      | Med     | Dexie + Synthesis      | High             |

**Recommended starting point (OPINION):** Phase 0 + C1.1 — they make every discussion
potentially become knowledge using the **already-wired** bridges (`phase18-forum.ts`,
`generator-types.ts:15`) and `getConsensus`, with almost no new backend. Highest
knowledge leverage per line of new code. Final decision left to human.
