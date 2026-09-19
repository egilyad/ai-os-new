# 27_AGENT_TEAMS — Ready-made Teams from the 25 Agents

> Research-only. Tags **[VERIFIED]** (source/per-agent docs) / **[INFERRED]** / **[OPINION]**.
> Companion to `00_AGENTS_MASTER_MAP.md` and `26_CROSS_AGENT_ARCHITECTURE.md`.
> Reminder: there is **no agent→agent call**; teams meet via Debate, ConversationCore/Director,
> Invocation/Room, AgentService `executeGroup`, or Forum. All members resolve through the shared
> `AgentService` (`agent-service.ts:337`). **[VERIFIED]**

Teams below reuse the natural clusters from `26_`. "Lead / Critic / Synthesizer" roles are **logical**
(assigned per session), not hard-wired — the machinery is identical for all nodes.

---

## 0. How a team is assembled (no new code)

1. **Debate**: add member ids as participants; `PersonaSelector` assigns variant by topic
   (`persona-selector.ts:251`). **[VERIFIED]**
2. **ConversationCore / Director**: a scenario lists `participantId`s; `ChatExecutor` runs turns.
   **[VERIFIED]**
3. **Invocation / RoomPanel**: human picks agents; `Manual Room Chat` policy permits any registered
   agent (`phase21-invocation.ts:125-144`). **[VERIFIED]**
4. **AgentService `executeGroup`**: `parallel | sequential | consensus | pipeline | debate`
   patterns (`agent-service.ts:688`). **[VERIFIED]** — but **no group is seeded**, so seed the 5
   cluster groups first (`26_§7.4`). **[OPINION]**
5. **Forum**: publish team output as a topic/announcement (`forum:*` bridge, AGENTS.md).

---

## 1. Architecture Team

- **Members:** 04 architect (Marcus Hale), 01 network (Nadia Volkov), 05 security (Yara Haddad),
  08 perf (Leon Ortiz), 07 database (Priya Nair), 06 devops (Tomas Berg).
- **Roles:** _Lead_ = architect (scalability/modularity prompt `topology-defaults.ts:183`); _Critic_ =
  security (threat model `:194`); _Synthesizer_ = network+perf on latency/throughput trade-offs.
- **When to use:** "monolith→microservices?", "service mesh migration", "10x traffic capacity".
- **Enabling systems [VERIFIED]:** Debate (participants) or `executeGroup` consensus
  (`agent-service.ts:688`); Director scenario with these `participantId`s; RoomPanel human-pick.
- **Note:** all 6 are Technical-core nodes with decorative `tools` (`26_§3`) — value is their distinct
  _prompts_, not real tooling. **[INFERRED]**

## 2. Security Team

- **Members:** 05 security (lead, threat modeling/Zero Trust `topology-defaults.ts:194`),
  02 risk (Rafael Stone, STRIDE/DREAD/FAIR `:157`), 03 ethics (Elena Marchetti, bias/fairness `:169`),
  09 critic (Greta Lindqvist, fallacy check `:245`).
- **Roles:** _Lead_ = security; _Risk analyst_ = risk; _Ethics reviewer_ = ethics; _Critic_ = critic.
- **When to use:** threat-model a feature, compliance/responsible-AI review, post-incident root-cause.
- **Enabling systems [VERIFIED]:** Debate (pro/con/neutral) for adversarial review; Director scenario;
  `executeGroup` consensus; RoomPanel.

## 3. Research Team

- **Members:** 11 research (Mira Castellan, literature/synthesis `topology-defaults.ts:268`),
  10 data (Sam Okafor, stats/forecasting `:257`), 09 critic (fallacy/evidence check),
  03 ethics (bias audit).
- **Roles:** _Lead/Synthesizer_ = research (citations/synthesis); _Evidence_ = data; _Critic_ = critic;
  _Bias check_ = ethics.
- **When to use:** literature survey, evidence-quality assessment, "what does the data say?" — note the
  separate Research Engine subsystem (`research-run-service` etc.) is **not** agent-driven
  (`11_*/00_PROFILE.md:60`). **[VERIFIED]**
- **Enabling systems [VERIFIED]:** ConversationCore/Director (multi-turn research scenario);
  `executeGroup` pipeline; Debate for conflicting-finding.

## 4. Product Team

- **Members:** 18 po (Sofia Romano, backlog/vision `topology-defaults.ts:357`), 17 pm (Dana Whitfield,
  planning/agile `:345`), 19 lead (Victor Soto, mentoring/delivery `:369`), 16 ux (Theo Nakamura,
  user research `:331`), 14 designer (Kai Mendez, UX design `:311`).
- **Roles:** _Lead_ = po (vision) or pm (execution) — pick per phase; _Researcher_ = ux; _Designer_ =
  designer; _Delivery_ = lead.
- **When to use:** roadmap/backlog prioritization, feature scoping, "is this valuable + feasible?".
  **[OPINION]** The 3 management nodes overlap; consider collapsing to 1 (see `26_§1.2`).
- **Enabling systems [VERIFIED]:** Director scenario (structured turns), Debate for scope trade-offs,
  RoomPanel, Forum for stakeholder thread.

## 5. Debate Team (adversarial)

- **Members (configurable):** any pro/con/neutral set; canonical cast = 04 architect (pro),
  05 security + 09 critic (con), 03 ethics or 11 research (neutral evidence), 17 pm (moderator).
- **Roles:** _Proponent_ = architect/po; _Opponent_ = security/critic; _Moderator/Neutral_ = pm/ethics.
- **When to use:** any go/no-go decision requiring opposing views.
- **Enabling systems [VERIFIED]:** Debate runtime (`debate-agent-executor.ts`); persona auto-assigned by
  topic (`persona-selector.ts:251`); RoomPanel `mode:'debate'` (hard-codes `neutral` for delegate,
  `phase21-invocation.ts:81`); EloLeaderboard for ranking.

## 6. Incident Team

- **Members:** 06 devops (Tomas Berg, incident response/observability `topology-defaults.ts:206`),
  08 perf (bottlenecks `:231`), 05 security (breach threat model `:194`), 02 risk (impact/probability
  `:157`), 19 lead (unblock/coordinate `:369`).
- **Roles:** _Incident commander_ = lead; _Ops_ = devops; _Forensics_ = perf+security; _Risk_ = risk.
- **When to use:** outage/postmortem, performance regression, suspected breach.
- **Enabling systems [VERIFIED]:** ConversationCore/Director for coordinated turn-based response;
  `executeGroup` parallel diagnostics; RoomPanel; AgentJournal for timeline.

## 7. Release Team

- **Members:** 06 devops (CI/CD/IaC `topology-defaults.ts:206`), 12 quality (Noah Ferreira, test
  gates/coverage `:280`), 05 security (AppSec gate `:194`), 04 architect (readiness `:183`),
  19 lead (velocity/quality balance `:369`).
- **Roles:** _Release manager_ = lead; _Quality gate_ = quality; _Security gate_ = security;
  _Pipeline_ = devops.
- **When to use:** release readiness review, "ship or hold?", regression/coverage sign-off.
- **Enabling systems [VERIFIED]:** Director scenario (gated turns); Debate for ship/hold; RoomPanel;
  Builder agent for deploy manifests (separate subsystem, `builder-agent-service.ts`).

## 8. Documentation Team

- **Members:** 20 writer (Clara Bengtsson, generalist `topology-defaults.ts:382`), 21 doc-architect
  (Bianca Conti, IA/taxonomy `:397`), 22 doc-auditor (Felix Moreau, accuracy/reject `:408`),
  23 doc-simplifier (Maya Lindholm, clarity `:421`), 24 doc-historian (Oscar Vilhelm, changelog `:433`),
  25 doc-checker (Iris Tanaka, consistency).
- **Roles:** _Lead/IA_ = doc-architect; _Author_ = writer; _Auditor_ = doc-auditor/checker;
  _Simplifier_ = doc-simplifier; _Historian_ = doc-historian.
- **When to use:** doc overhaul, API reference generation, consistency/accuracy pass.
  **[OPINION]** 6 near-duplicate nodes — collapse to 1 Doc agent + `mode` (see `26_§1.1`).
- **Enabling systems [VERIFIED]:** ConversationCore/Director (multi-stage doc pipeline);
  `executeGroup` pipeline; RoomPanel; Forum for doc announcements.

---

## 9. Cross-team governance

- **Critic (09) and Ethics (03) are universal reviewers** — add to any team as quality/bias gate without
  new machinery. **[INFERRED]**
- **No seeded `AgentGroup` exists** (`agent-service.ts:667-686` groups are user-created). Recommend
  seeding the 5 cluster groups so teams are one call away. **[OPINION]**
- **Debate = universal adversarial surface; Director/ConversationCore = universal cooperative surface;
  RoomPanel/Invocation = human dispatch; Forum = publish.** Each team can mix these. **[VERIFIED]**
- **None of these teams requires new agent code** — they are participant sets over the shared substrate.
  **[INFERRED]**

## 10. Team → enabling-system mapping (quick reference)

| Team          | Best surface                      | Fallback surface          |
| ------------- | --------------------------------- | ------------------------- |
| Architecture  | Debate / `executeGroup` consensus | Director scenario         |
| Security      | Debate (adversarial)              | Director + RoomPanel      |
| Research      | Director (multi-turn)             | `executeGroup` pipeline   |
| Product       | Director (structured)             | Debate + Forum            |
| Debate        | Debate runtime                    | RoomPanel `mode:'debate'` |
| Incident      | Director (coordinated)            | `executeGroup` parallel   |
| Release       | Director (gated)                  | Debate ship/hold          |
| Documentation | Director pipeline                 | `executeGroup` + Forum    |

All surfaces resolve members via the shared `AgentService` (`agent-service.ts:337`). **[VERIFIED]**

## 11. Anti-patterns to avoid

- **Don't hand-wire a team in source.** Teams are participant _sets_; hard-coding them would recreate the
  25-bespoke-blob problem in reverse. Use groups/policies. **[OPINION]**
- **Don't expect specialization-aware debate without §7.2/§7.3 from `26_`.** Today every team member
  debates via topic-keyword persona only. **[VERIFIED]**
- **Don't rely on doc/management agents as distinct executors** — they overlap (§1 of `26_`); treat them
  as one role with mode flags. **[OPINION]**

## 11. Team readiness scorecard

| Team          | Members available | Distinct behavior? | Ready now? | Blocker                                  |
| ------------- | ----------------- | ------------------ | ---------- | ---------------------------------------- |
| Architecture  | 6                 | prompts only       | Yes        | none                                     |
| Security      | 4                 | prompts only       | Yes        | none                                     |
| Research      | 4                 | prompts only       | Yes        | separate Research Engine not agent-wired |
| Product       | 5                 | prompts only       | Yes        | mgmt overlap (collapse suggested)        |
| Debate        | any               | persona-by-topic   | Yes        | specialization-blind persona             |
| Incident      | 5                 | prompts only       | Yes        | none                                     |
| Release       | 5                 | prompts only       | Yes        | none                                     |
| Documentation | 6                 | prompts only       | Yes        | 6→1 collapse suggested                   |

"Ready now" = assembleable via existing Debate/Director/Room/`executeGroup`. **[INFERRED]** from §0.

## 12. Example: assemble the Security Team via RoomPanel

Human opens Room → picks 05/02/03/09 → `invocationEngine.invoke({ target:{agentId:'agent-security'},
context:{type:'debate',ref:'general'}, constraints:{mode:'debate'} })` → resolves through
`AgentResolverDirectory` → Debate runtime runs them as participants
(`phase21-invocation.ts:43-58`). The same four ids dropped into a Director scenario produce a
cooperative multi-turn review instead. **[VERIFIED]** path, **[OPINION]** assembly suggestion.
