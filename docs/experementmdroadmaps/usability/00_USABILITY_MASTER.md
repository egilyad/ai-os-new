# 00 — Usability Master Map

> Autonomous full-product UX audit of SuperAgents OS. READ-ONLY. No source modified.
> Evidence tags: **VERIFIED** (read component/registry code), **INFERRED** (reasonable from structure), **OPINION** (judgement).
> Companion docs in this folder: 01–14. Progress: `RESEARCH_PROGRESS.md`.

## What this system is (VERIFIED)

An event-driven **multi-agent runtime** with a broad React control plane. Core capabilities:
Debate runtime, ConversationCore/Director, Invocation Engine + Room, Forum, 7 cognitive modules
(Lenses→Crystals→Junction→Synthesis→Generator→Forum→Builder), agents, providers/keys, research
engine, workflows, scheduler, memory, routing, analytics, observability, admin.

## The single biggest usability truth

**The product massively over-promises in navigation and under-delivers in obvious capability.**

- ~30 "Coming Soon" debate sub-panels render as ordinary nav items (VERIFIED: `route-imports.ts:362-393`
  all map to `ComingSoonPanel`; `Sidebar.tsx` ignores `experimental` flag → no visual distinction).
- `SchedulerPanel` is a **static demo/mock** — hardcoded schedules, toggle flips a settings flag,
  no real CRUD, never touches `SchedulerService` (VERIFIED: `SchedulerPanel.tsx:24-65,107-111`).
- The Research engine computes 7 advanced phases (systematic review, fact-check, peer-review,
  knowledge graph, anomaly detection, discovery, citation export) but the UI exposes only session
  loops + citations (VERIFIED: `research-engine-service.ts:374-544` vs `SessionCard.tsx`).
- Forum backend supports voting/pinning/moderation/consensus-escalation; the UI supports none of it
  (VERIFIED: `forum-service.ts:149-308` vs `ForumPanel.tsx`).

**Net effect:** a new user sees ~177 nav items, ~30 of which are phantom features, and the most
promising-sounding ones (scheduler, debate analysis judges, research) are either dark or mocked.

## Usability scorecard (1–10, detail in 12)

| Dimension              | Score   | One-line                                   |
| ---------------------- | ------- | ------------------------------------------ |
| Discoverability        | 3       | features exist but buried / phantom        |
| Clarity                | 4       | jargon-heavy, technical IDs leak           |
| Navigation             | 3       | 9 sections, 177 items, no start point      |
| Consistency            | 4       | mixed patterns, duplicate entries          |
| Learnability           | 3       | assumes internal-architecture knowledge    |
| Task completion        | 5       | core flows work once found                 |
| Feedback               | 4       | some silent failures (research, scheduler) |
| Error recovery         | 4       | rejections show raw technical text         |
| Realtime comprehension | 5       | live debate good; Room feed unscoped       |
| AI/agent comprehension | 4       | who/what/why often unclear                 |
| Information hierarchy  | 3       | everything looks equally important         |
| **Overall**            | **3.8** | powerful but bewildering                   |

## Top systemic UX issues (detail across 02/08/09/11)

- **S-NAV-1**: 30+ Coming-Soon stubs indistinguishable from real features. (P0)
- **S-NAV-2**: `experimental` flag ignored by Sidebar. (P1)
- **S-NAV-3**: Duplicate nav id `builder` in Debates + Knowledge. (P1)
- **S-NAV-4**: 9 mega-sections, no "Start here". (P1)
- **S-DEMO-1**: SchedulerPanel is a non-functional demo. (P0)
- **S-DARK-1**: Research 7 phases dark. (P0)
- **S-DARK-2**: Forum vote/pin/moderate/escalate dark. (P0)
- **S-ONB-1**: Most features silently require provider keys. (P0)
- **S-FEED-1**: Room live feed unscoped (global). (P1)
- **S-ERR-1**: Rejection "no matching enabled policy" is raw technical text. (P1)

## Deliverable index

00 master · 01 first-time · 02 navigation · 03 panel-by-panel · 04 journeys · 05 agent-ux ·
06 live-realtime · 07 forms-controls · 08 information-architecture · 09 consistency ·
10 error-ux · 11 discoverability · 12 scorecard · 13 recommendations · 14 top-50.

_This is a living document; continue updating as panels are reviewed._
