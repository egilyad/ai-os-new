# 28 — AGENT DEBATE MATRIX

> Synthesis of the 25-system-agent deep-dive. Read-only research. Every material claim carries a `VERIFIED` (read from source / per-agent research doc) or `INFERRED` / `OPINION` label.
>
> Source of specializations: `src/kernel/state/agent-profiles.ts:21-272` (all 25 curated identities). Source of the persona gap: `persona-selector.ts:251-290` (variant chosen by `agentRole` + topic keywords only; `scoreTopicKeywords` at `:243-249` never reads `specializations`). Per-agent debate analysis: each agent's `04_DEBATE_ROLE.md`.

---

## 1. The core tension (VERIFIED)

All 25 agents are **topology nodes** whose behavioral voice is a one-line system prompt (`topology-defaults.ts`) plus — in debate — a `PersonaSelector` variant injected by **topic keywords only** (`persona-selector.ts:251-290`). The agent's declared `specializations` are **display/identity metadata** and are _not_ consulted when picking a debate side, persona, or variant (`persona-selector.ts:243-249`, `:271-285`). Specializations are only consumed for **invocation-by-expertise** matching (`invocation-engine-service.ts`; `AgentResolverDirectory` exposes them — `phase21-invocation.ts:44-57`).

**Consequence:** Today the "System Architect" and the "Documentation Checker" can be handed the _same_ `technologist` / `pragmatic_economist` persona on the same topic (`agent-architect/04_DEBATE_ROLE.md:6`, `agent-security/04_DEBATE_ROLE.md:14`). The debate matrix below therefore describes **desired best-fit roles justified by specialization**, not current behavior.

---

## 2. Agent → best-fit debate role matrix

Roles: **Pro** (advocate), **Con** (skeptic), **Neutral** (moderator), **Critic** (structured flaw-hunt), **Architect** (trade-off framing), **Evidence analyst** (data/grounded), **Fact checker** (claims/accuracy), **Security reviewer**, **Judge-advisor** (guidance/ethics/risk framing), **Synthesizer** (reconcile), **Red-team** (adversarial), **Devil's advocate** (lateral counter).

| #   | Agent (role)                                      | Specializations (VERIFIED `agent-profiles.ts`)         | Best-fit debate roles (INFERRED from specialization)                         |
| --- | ------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 01  | `agent-network` (Network Engineer)                | TCP/IP, SDN, Latency Optimization (`:30`)              | Evidence analyst, Architect, Red-team/Devil's-advocate                       |
| 02  | `agent-risk` (Risk Analyst)                       | Risk Modeling, Monte Carlo, Compliance (`:40`)         | Evidence analyst, Fact checker (compliance), Judge-advisor, Devil's-advocate |
| 03  | `agent-ethics` (Ethics Officer)                   | Ethical Reasoning, Policy, Bias Audit (`:50`)          | Judge-advisor, Fact checker (bias), Synthesizer (responsible alt)            |
| 04  | `agent-architect` (System Architect)              | Distributed Systems, Event-Driven, Scalability (`:60`) | Architect (lead), Synthesizer, Red-team (topology critic)                    |
| 05  | `agent-security` (Security Engineer)              | Threat Modeling, AppSec, Zero Trust (`:70`)            | Security reviewer, Red-team, Fact checker (AppSec), Devil's-advocate         |
| 06  | `agent-devops` (DevOps Engineer)                  | CI/CD, Kubernetes, Observability (`:80`)               | Architect (operational), Evidence analyst, Fact checker                      |
| 07  | `agent-database` (Database Engineer)              | SQL Tuning, Replication, Data Modeling (`:90`)         | Evidence analyst, Fact checker, Architect (data)                             |
| 08  | `agent-perf` (Performance Engineer)               | Profiling, Caching, Load Testing (`:100`)              | Evidence analyst (benchmarks), Fact checker, Architect                       |
| 09  | `agent-critic` (Critical Auditor)                 | Critical Analysis, Fallacy Detection, Logic (`:110`)   | Critic (lead), Red-team, Devil's-advocate, Fact checker (logic)              |
| 10  | `agent-data` (Data Scientist)                     | Machine Learning, Statistics, Forecasting (`:120`)     | Evidence analyst, Fact checker (statistics), Synthesizer (quant)             |
| 11  | `agent-research` (Research Analyst)               | Literature Review, Synthesis, Citations (`:130`)       | Evidence analyst, Fact checker (citations), Synthesizer                      |
| 12  | `agent-quality` (Quality Engineer)                | Test Automation, QA, Coverage (`:140`)                 | Fact checker (QA/coverage), Critic (test gaps), Red-team                     |
| 13  | `agent-creative` (Creative Visionary)             | Ideation, Narrative, Brand (`:150`)                    | Pro (ideation), Synthesizer (narrative), Devil's-advocate (lateral)          |
| 14  | `agent-designer` (Product Designer)               | UX, Prototyping, Design Systems (`:160`)               | Synthesizer, Pro (vision), Architect (UX)                                    |
| 15  | `agent-content` (Content Strategist)              | Editorial, SEO, Messaging (`:170`)                     | Pro (messaging), Synthesizer (editorial), Fact checker (claims)              |
| 16  | `agent-ux` (UX Researcher)                        | User Research, Usability, Interviews (`:180`)          | Evidence analyst (user data), Fact checker (usability), Synthesizer          |
| 17  | `agent-pm` (Project Manager)                      | Planning, Agile, Risk (`:190`)                         | Judge-advisor (planning), Synthesizer (coordination), Devil's-advocate       |
| 18  | `agent-po` (Product Owner)                        | Backlog, Vision, Prioritization (`:200`)               | Pro (vision), Judge-advisor (prioritization), Synthesizer                    |
| 19  | `agent-lead` (Team Lead)                          | Mentoring, Coordination, Architecture (`:210`)         | Judge-advisor, Synthesizer, Architect                                        |
| 20  | `agent-writer` (Technical Writer)                 | Documentation, Tutorials, API Docs (`:220`)            | Synthesizer, Fact checker (doc consistency), Pro (clarity)                   |
| 21  | `agent-doc-architect` (Documentation Architect)   | Information Architecture, Taxonomy, Standards (`:230`) | Architect (IA), Synthesizer, Fact checker (standards)                        |
| 22  | `agent-doc-auditor` (Documentation Auditor)       | Compliance, Review, Accuracy (`:240`)                  | Fact checker, Critic (review), Red-team                                      |
| 23  | `agent-doc-simplifier` (Documentation Simplifier) | Plain Language, Clarity, Restructure (`:250`)          | Synthesizer (clarity), Pro (plain language), Fact checker                    |
| 24  | `agent-doc-historian` (Documentation Historian)   | Changelog, Context, Lineage (`:260`)                   | Fact checker (lineage), Evidence analyst (context), Synthesizer              |
| 25  | `agent-doc-checker` (Consistency Checker)         | Consistency, Cross-Reference, Validation (`:270`)      | Fact checker (consistency), Critic (validation), Red-team                    |

**Cluster read-out (INFERRED):** three agents are _near-universal_ assets on any panel — `agent-critic` (Critic/Red-team), `agent-ethics` (Judge-advisor/bias), `agent-data`/`agent-research` (Evidence). The six documentation agents (20–25) overlap heavily and are best deployed as a **doc-quality sub-panel** rather than scattered across every debate.

---

## 3. Best debate combinations

### 3.1 Two-agent pairs (A + B)

- **`agent-security` + `agent-architect`** — _Secure-design review._ Architect frames the monolith-vs-microservices / topology trade-off; Security reviewer stress-tests it with STRIDE/Zero-Trust/blast-radius. Architect's `Distributed Systems / Scalability` (`:60`) + Security's `Threat Modeling / Zero Trust` (`:70`) are the canonical pairing flagged in `agent-network/04_DEBATE_ROLE.md:31` and `agent-security/04_DEBATE_ROLE.md:30`. (INFERRED from specialization; VERIFIED these are distinct seeded nodes with the matching prompts.)

- **`agent-ethics` + `agent-risk`** — _Responsible-launch gate._ Ethics supplies fairness/policy/bias framing (`agent-ethics/04_DEBATE_ROLE.md:22`); Risk quantifies probability/impact via Monte Carlo/Compliance (`agent-risk/00_PROFILE.md:20`). Together they produce a "responsible alternative + residual-risk" verdict.

- **`agent-research` + `agent-data`** — _Evidence-based policy._ Research owns literature/citations; Data owns statistics/forecasting. `agent-data/04_DEBATE_ROLE.md:23` explicitly pairs them against `agent-risk` for market-forecast disputes; `agent-research/00_PROFILE.md:37` notes `cautious_scientist` keyword overlap.

- **`agent-critic` + (any domain agent)** — _Red-team audit._ Critic (Fallacy Detection/Logic, `:110`; temp 0.1, `agent-critic/04_DEBATE_ROLE.md:21`) demolishes the strongest argument of whichever specialist is the Pro/Con lead. This is the single highest-leverage pairing in the system (VERIFIED the critic is temperature-tuned for skepticism).

- **`agent-writer` + `agent-doc-checker`** — _Doc-quality loop._ Writer synthesizes; Checker validates consistency/cross-reference (`:270`). Useful whenever the debate output is a deliverable document.

### 3.2 Three-agent triads (A + B + C)

- **`agent-security` + `agent-architect` + `agent-critic`** — _Secure-design debate with red-team._ Architect (Pro trade-offs) ⇄ Security (Con threats) ⇄ Critic (structured fallacy/weakness hunt on both). Closes the loop that today is left open because the Critic has no `red-team` role (`agent-critic/04_DEBATE_ROLE.md:26`). Strongest "build vs. harden" panel.

- **`agent-ethics` + `agent-risk` + `agent-critic`** — _Responsible-launch tribunal._ Ethics (Judge-advisor/bias), Risk (Evidence/Compliance), Critic (audit of both). Mirrors a launch-review board; surfaces ethical risk + quantified residual risk + logical gaps before consensus.

- **`agent-research` + `agent-data` + `agent-critic`** — _Evidence-based policy with audit._ Research (literature) + Data (stats/forecasting) + Critic (fallacy/uncertainty check). Directly addresses `agent-research/04_DEBATE_ROLE.md` synthesis + `agent-data/04_DEBATE_ROLE.md:18` quantitative-skeptic gap.

- **`agent-pm` + `agent-po` + `agent-lead`** — _Product-strategy panel._ PO (vision/prioritization, `:200`) + PM (planning/agile/risk, `:190`) + Lead (coordination/architecture, `:210`). The natural "product triangle"; none is a true specialist, so add one domain Evidence agent when the topic is technical.

- **`agent-ux` + `agent-designer` + `agent-content`** — _Product-experience panel._ UX (user evidence, `:180`) + Designer (design systems, `:160`) + Content (messaging/SEO, `:170`). Generates human-centered, on-brand, usable output.

- **`agent-devops` + `agent-perf` + `agent-database`** — _Reliability/release panel._ Observability (`:80`) + benchmarks (`:100`) + data modeling/replication (`:90`) — the operational "will it survive production" trio.

---

## 4. The persona-selector gap (VERIFIED, the central limitation)

`PersonaSelector.selectForTopic` (`persona-selector.ts:292-308`) delegates to `selectVariant` (`:251-290`), which:

1. Filters variants by `agentRole` + `minRound` + `usedVariants` (`:260-266`) — **not** by agent `specializations`.
2. Scores purely by **topic keyword** overlap (`scoreTopicKeywords`, `:243-249`, `:271-285`).
3. Ties broken by a **deterministic hash of `agentId`** (`:279-281`) — again, not specialization.

There are exactly 11 variants and **no** `security_reviewer`, `red_team`, `quant_skeptic`, or `architecture` variant (VERIFIED `persona-selector.ts:3-241`; confirmed by `agent-security/04_DEBATE_ROLE.md:14` and `agent-architect/04_DEBATE_ROLE.md:18`). So even a perfectly specialized agent cannot currently be _forced_ into its specialization-appropriate persona — its voice is keyword-roulette plus its static system prompt.

**Implication for this matrix:** The best-fit roles above are _design targets_. Realizing them requires either (a) a specialization→variant affinity map in `persona-selector.ts` (small, declarative change), or (b) injecting `specializations` into the debate system prompt (`agent-security/04_DEBATE_ROLE.md:26`, `agent-data/04_DEBATE_ROLE.md:18`). Both are already identified as quick wins in the per-agent docs.

---

## 5. Recommendations (OPINION)

1. Add a declarative `specializations → variant` affinity table in `persona-selector.ts` (no new service) so the matrix in §2 becomes the _default_ rather than aspirational.
2. Introduce three missing variants: `security_reviewer` (STRIDE/OWASP/Zero-Trust), `red_team` (adversarial), `quant_skeptic` (demand CI/p-values) — directly serving agents 05, 09, 10.
3. Make `agent-critic` the **default Critic/Red-team seat** in every multi-agent debate (it is the only agent temperature-tuned for it), and wire `lens:critical` (`lens-library.ts:11-41`) into its debate prompt (`agent-critic/04_DEBATE_ROLE.md:29`).
4. Treat the six documentation agents (20–25) as a coordinated **doc-quality sub-panel**, not independent debate participants.

_These recommendations reuse existing infrastructure (persona pool, lens library, debate runtime). No new framework is proposed. Final decision rests with the human._
