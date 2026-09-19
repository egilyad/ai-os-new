# 31 — FORUM MASTER ROADMAP (ORDERED SEQUENCE)

> "If we seriously develop Forum tomorrow, in what order, so each step reuses what's
> built?" A single ordered master sequence synthesizing Roadmaps A/B/C. Each step lists
> its dependency and the recommended starting point. Final decision left to human.

---

## Prerequisite fix (must land first — VERIFIED defect)

**P0 — Repair `forumService` import.**

- `ForumPanel.tsx:4` imports `forumService` from `'../../kernel/instances'`, but LSP
  reports **no exported member `forumService`** (verified at write-time). The Forum UI
  currently cannot resolve its service. This is a hard blocker for _any_ roadmap work.
- **Action:** export `forumService` from `instances` (lazyService pattern, cf.
  `conversationDirector`/`invocationEngine` in `AGENTS.md` B5.4a/Step 5) or fix the
  import to the registered token. No behavioral change.
- **Effort:** XS. **Risk:** Low. **Dependency:** none.

---

## Master sequence (each step reuses the prior)

| #   | Step                                             | Reuses (verified)                                                                    | Depends on | Roadmap ref | Effort |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------ | ---------- | ----------- | ------ |
| 1   | **Search + filters**                             | `listTopics` `forum-service.ts:209`, `forum-repository.ts:34`                        | P0         | A0.1        | S      |
| 2   | **Voting UI**                                    | `votePost` `forum-service.ts:149`                                                    | P0         | A0.2        | S      |
| 3   | **Pinning UI**                                   | `pinTopic` `forum-service.ts:237`                                                    | P0         | A0.3        | S      |
| 4   | **Consensus summary + contested affordance**     | `getConsensus` `forum-service.ts:262` (badge already shown `TopicView.tsx:104`)      | 1          | A1.1        | S      |
| 5   | **Moderation UX (reason surfacing)**             | `moderatePost` `forum-service.ts:245` (already wired `TopicView.tsx:51`)             | P0         | A1.2        | S–M    |
| 6   | **Realtime posts/votes**                         | `FORUM_POST_ADDED`/`VOTED` `event-registry.ts:1401/1409`                             | 1,2        | A3.1        | M      |
| 7   | **Subscribe + alerts**                           | `subscribe` `forum-service.ts:195`, `forumSubs` `forum-repository.ts:103`            | 1          | A3.2        | M      |
| 8   | **Invite agent to thread (chat)**                | `invocationEngine` `phase21-invocation.ts:61`, `agentProvenance` `forum-types.ts:27` | P0         | B0.1        | M      |
| 9   | **Agent provenance card**                        | `AgentProvenance`, `AuthorBadge.tsx:19`                                              | 8          | B0.2        | S      |
| 10  | **Escalate contested → Debate (via Invocation)** | `getConsensus` `contested` `forum-service.ts:300`, `phase21-invocation.ts:75`        | 4,8        | B1.1        | M      |
| 11  | **Debate verdict → forum link**                  | `phase18-forum.ts:48-64`                                                             | 10         | B1.2        | S      |
| 12  | **Promote post → Crystal**                       | `crystalVault.propose`, `phase18-forum.ts:66`                                        | 2          | C0.1        | S–M    |
| 13  | **Topic ↔ Synthesis/Lens view**                  | `SynthesisEngine`, `LensEngine`                                                      | 1          | C0.2        | M      |
| 14  | **Surface generated knowledge per topic**        | `knowledge-generator` `generator-types.ts:15`, `analytics.ts:296`                    | 1,8        | C2.1        | M      |
| 15  | **Re-inject crystals into new topics**           | `crystalVault.query`                                                                 | 12         | C2.2        | S–M    |
| 16  | **High-consensus → auto-crystal**                | `getConsensus` `consensus` `forum-service.ts:297`                                    | 4,12       | C3.1        | S–M    |
| 17  | **Knowledge health heatmap**                     | `ForumHeatmap.tsx`, `getConsensus`                                                   | 4          | C3.2        | M      |
| 18  | **Topic ↔ Crystal bidirectional links**          | `forumTopics` `forum-repository.ts:26`, `crystals`                                   | 12,15      | C4.1        | M      |
| 19  | **Synthesis → open topic**                       | `createTopic` `forum-service.ts:60`                                                  | 13         | C4.2        | S–M    |

> Steps 1–7 = Roadmap A foundation. Steps 8–11 = Roadmap B. Steps 12–19 = Roadmap C.
> A's foundation (1–7) is the **prerequisite** for B/C to feel usable.

---

## Recommended starting point (OPINION)

**Begin at P0 → 1 → 2 → 3 → 4 → 8 → 10 → 12.** This minimal spine delivers, in order:

1. A _working, navigable_ Forum (P0+1-3 fix the "thinnest UI" defect, `FORUM_ROADMAP.md:9`).
2. A _living_ Forum (4 + realtime 6 when convenient).
3. A _human↔agent_ Forum (8, 10 — using only Invocation + Debate, no new engine).
4. A _knowledge-producing_ Forum (12 — surfacing the already-firing `phase18` bridges).

From that spine, extend outward along A (5–7), B (9,11), or C (13–19) per strategic
priority (user-growth / differentiation / knowledge-platform — see `29_ROADMAP_COMPARISON.md`).

---

## Dependency graph (compact)

```
P0 ─┬─ 1 ─ 4 ─ 6 ─ 7        (A: search→consensus→realtime→subscribe)
    ├─ 2 ─ 5                (A: vote→moderation UX)
    ├─ 3                    (A: pin)
    ├─ 8 ─ 9 ─ 10 ─ 11      (B: invite agent→provenance→escalate→verdict link)
    └─ 12 ─ 13 ─ 14         (C: promote→synthesis/lens→surface generator)
            ├─ 15 ─ 18       (C: re-inject→links)
            ├─ 16 ─ 17       (C: auto-crystal→heatmap)
            └─ 19            (C: synthesis→topic)
```

No cycle; every node descends from P0; A-foundation (1–7) precedes B/C branches.

---

## Guardrails (from `25_DO_NOT_BUILD_YET.md`)

- Do **not** build a new forum engine (a) — `ForumService` exists.
- Do **not** build a separate forum→debate escalation subsystem (b) — use Invocation (step 10).
- Do **not** expand Invocation for forum without proof (c) — only wire existing handoff.
- Do **not** add a search microservice (d) — use repo filters; add index only if perf-proven.
- Do **not** add a websocket layer (e) — use `IEventBus` (step 6).
- Do **not** add reputation RBAC (f/h) prematurely — derive from votes / gate by identity.

---

## Final note to the human

The sequence above is the **lowest-risk, highest-reuse** ordering. It is OPINION where
strategic; every step cites VERIFIED source. Choose the entry branch (A/B/C emphasis)
after step 4 based on product strategy — the architecture supports all three
concurrently. `30_FORUM_FUTURE_CONCEPT.md` is the one-year target this sequence reaches.

_Labels: VERIFIED = source Read/Grep (cited file:line); OPINION = ordering judgment;
INFERRED = forward projection. Prerequisite P0 is a confirmed import defect at
`ForumPanel.tsx:4`._
