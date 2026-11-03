# Справочник: Полный инвентарь 33 встроенных стратегий дебатов

> Источник: `src/kernel/services/debate-runtime/debate-strategy-definitions.ts` (BUILTIN_STRATEGIES).
> Полезно для `SPEC_07` (интерпретатор DSL) и панелей выбора стратегий.

## Примитивы (root):

- `sequence` — пошаговый конвейер (несколько фаз/под-стратегий).
- `debate_graph` — граф аргументации (agents + edges: sequential/challenge/refine/broadcast).
- `critic_loop` — цикл «пропонент ↔ критик» до условия.
- `voting` — голосование (tally: majority/ranked_choice/consensus).
- `peer_review` — рецензирование (authors → reviewers → revisions до порога).

Общие поля: `agents[] {nodeId, role: pro|con|neutral}`, `edges[] {from,to,type}`,
`parameters[]`, `convergenceThreshold`, `maxRounds/maxIterations/maxRevisions`, `tally`.

| №   | id                          | имя                              | root         | Ключевые поля                                                                                                | Что это                                 |
| --- | --------------------------- | -------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| 1   | round_robin                 | Round Robin                      | debate_graph | pro/con; edges sequential; maxRounds=5; conv=0.85                                                            | последовательный round-robin            |
| 2   | socratic                    | Socratic Method                  | critic_loop  | proponent+critic; maxIterations=6; stopWhen=agreement                                                        | вопросно-ориентированный метод          |
| 3   | argument_tree               | Argument Tree                    | debate_graph | thesis/antithesis/synthesis; edges challenge+refine; maxRounds=4                                             | древовидная диалектика                  |
| 4   | constrained                 | Constrained Debate               | peer_review  | author+reviewers×2; criteria=[correctness,completeness]; maxRevisions=3                                      | дебаты с ограничениями/рецензированием  |
| 5   | moderated                   | Moderated Debate                 | debate_graph | moderator + pro/con; maxRounds=6                                                                             | модератор управляет                     |
| 6   | free_for_all                | Free-for-All                     | debate_graph | pro/con/neutral; edges broadcast; maxRounds=8                                                                | одновременно все                        |
| 7   | jury_trial                  | Jury Trial                       | debate_graph | jurySize 1–12; prosecution/defense/judge; maxRounds=5                                                        | суд присяжных                           |
| 8   | brainstorming               | Brainstorming                    | sequence     | Step1 debate_graph (facilitator+contributors, broadcast, 2) → Step2 voting (ranked_choice)                   | генерация идей + кластеризация          |
| 9   | delphi                      | Delphi Method                    | debate_graph | coordinator+panelists; sequential; maxRounds=4; conv=0.8                                                     | анонимный консенсус                     |
| 10  | debate_athon                | Debate-athon                     | sequence     | totalRounds 6–30; opening → args (challenge,10) → voting majority                                            | марафон                                 |
| 11  | meta_debate                 | Meta-Debate                      | debate_graph | meta_analyst + pro/con; sequential; maxRounds=3                                                              | дебаты о правилах дебатов               |
| 12  | autopsy                     | Post-Mortem                      | debate_graph | focusArea enum; facilitator + analysts; maxRounds=4                                                          | ретроспективный разбор                  |
| 13  | simulated_negotiation       | Simulated Negotiation            | debate_graph | negotiatorCount 2–6; mediator + parties; sequential; maxRounds=6                                             | симулированные переговоры               |
| 14  | premortem                   | Premortem                        | sequence     | Step1 debate_graph (Imagine Failure) → Step2 peer_review (Identify Causes) → Step3 debate_graph (Prevention) | допустить провал и найти причины        |
| 15  | red_teaming                 | Red Teaming                      | debate_graph | red(con) vs blue(pro); challenge red→blue + refine blue→red; maxRounds=5                                     | атака/защита                            |
| 16  | rhetorical_triangle         | Rhetorical Triangle              | debate_graph | ethos/pathos/logos; edges challenge; maxRounds=4                                                             | этос/пафос/логос                        |
| 17  | evidence_based_policy       | Evidence-Based Policy            | debate_graph | evidenceLevel enum; proponent/opponent/evidencer; maxRounds=5                                                | обязательное цитирование                |
| 18  | principle_based_negotiation | Principle-Based Negotiation      | debate_graph | negotiator_a/b + facilitator; sequential; maxRounds=5                                                        | Гарвардские переговоры                  |
| 19  | uncertainty_quantification  | Uncertainty Quantification       | debate_graph | optimist/pessimist/analyst; sequential+refine; maxRounds=4                                                   | количественная оценка неопределённостей |
| 20  | multi_criteria              | Multi-Criteria Decision Analysis | debate_graph | criteriaCount 2–8; evaluators + weight_assigner; sequential; maxRounds=4                                     | MCDA                                    |
| 21  | stakeholder_mapping         | Stakeholder Mapping              | sequence     | Step1 debate_graph (Identify) → Step2 debate_graph (Map) → Step3 voting (ranked_choice Assess)               | карта стейкхолдеров                     |
| 22  | cross_examination           | Cross-Examination                | debate_graph | examiner(con)/witness(pro); challenge+refine; maxRounds=8; conv=0.9                                          | перекрёстный допрос                     |
| 23  | trial                       | Trial by Argument                | sequence     | Opening → Evidence (judge) → Closing → Verdict (voting majority)                                             | полный судебный формат                  |
| 24  | parliamentary               | Parliamentary Debate             | debate_graph | speaker(neutral)+government(pro)+opposition(con); sequential+challenge; maxRounds=6                          | парламентские дебаты                    |
| 25  | oxford_union                | Oxford Union Debate              | sequence     | Proposition → Opposition → Floor Debate (3) → Vote (voting majority)                                         | Oxford Union                            |
| 26  | lincoln_douglas             | Lincoln-Douglas                  | debate_graph | affirmative(pro)/negative(con); sequential+challenge; maxRounds=5                                            | ценностные дебаты 1-на-1                |
| 27  | spontaneous_argumentation   | Spontaneous Argumentation        | debate_graph | speaker_a/b; challenge; maxRounds=4                                                                          | импровизация                            |
| 28  | asynchronous_marathon       | Asynchronous Marathon            | sequence     | Round1 Opening → Round2 Rebuttal → Round3 Response (debate_graph по 1)                                       | многодневные асинхронные                |
| 29  | flash_debate                | Flash Debate                     | debate_graph | flash_a/b; challenge; maxRounds=3                                                                            | ультрабыстрые                           |
| 30  | collaborative_consensus     | Collaborative Consensus          | debate_graph | facilitator + contributors; sequential+refine; maxRounds=4; conv=0.9                                         | несостязательный поиск консенсуса       |
| 31  | scenario_testing            | Scenario Testing                 | sequence     | Define → Test (3) → Synthesize (peer_review)                                                                 | проверка сценариев                      |
| 32  | hypothesis_testing          | Hypothesis Testing               | sequence     | Formulate → Evaluate Evidence (reviewer,3) → Conclusion (voting consensus)                                   | научный метод                           |
| 33  | contest_mode                | Contest Mode                     | sequence     | pointsToWin 1–10; Round Robin (challenge,5) → Final Verdict (voting majority)                                | соревнование с судьёй                   |

## Статистика

- root-распределение: `debate_graph` — 20, `sequence` — 10, `critic_loop` — 1, `peer_review` — 1, `voting` — 0 (только вложенно).
- Параметры имеют 9 стратегий (moderated, jury_trial, debate_athon, autopsy, simulated_negotiation, evidence_based_policy, multi_criteria, contest_mode, constrained через criteria).
- `convergenceThreshold` — round_robin, delphi, cross_examination, collaborative_consensus.

## Вывод для SPEC_07

Все 33 уже описаны как DSL (`StrategyDefinition`). Интерпретатор должен компилировать
зна-примитивы в: (а) топологию, (б) quality-маску, (в) порядок ходов. Инвентарь выше —
это «пиксели», которые интерпретатор оживит. 10 `sequence`-стратегий — многофазные и
требуют композиции под-программ (это отдельный вызов для интерпретатора).
