# Программа экспериментальной проверки Debates

> **Источник-основа:** архивная монография `debates-deep-research-monograph.md` (гл. 16).
> **Статус:** это **планы** экспериментов, не результаты. Все метрики остаются гипотезами до запуска.

---

## Принципы

- Контрольные условия: 3 агента (pro/con/neutral), 5 раундов, идентичные модели и topic.
- Переменная: одна активная техника/стратегия, остальные отключены.
- Метрики: LLM-judge rating (1-10), rebuttal strength, novelty, depth, token usage, latency, convergence.
- Данные: ≥10 controversial topics (политика/этика/технологии/экономика).

## Эксперименты

| ID | Вопрос | Гипотеза | Критерий успеха |
|---|---|---|---|
| E1 | Cross-examination vs delta-focusing vs vulnerability-targeting: какая даёт лучший rebuttal? | vulnerability-targeting | различие ≥1.0 из 10 на 8+ topics |
| E2 | socratic vs argument_tree vs constrained: какая даёт больше глубины? | argument_tree | depth_score ≥ +20% на 7+ topics |
| E3 | Sequential vs parallel first-round (после реализации E4) | parallel в 2-3 раза быстрее | duration ≥ -40%, quality ≥ -10% |
| E4 | Оптимальное число участников (2/3/4/5) | 3 (pro/con/neutral) | немонотонная зависимость, пик на 3 |
| E5 | Влияние баланса ролей на verdict bias | 2:1 → bias в сторону pro | stanceResult раbalanced ≈ neutral |
| E6 | Обнаружение ложного утверждения во вступлении PRO | fact-check ловит 60-80% | detection ≥60% |
| E7 | Обнаружение внутри-агентного противоречия | consistency-check ловит 40-60% | detection ≥40% |
| E8 | Качество LLM-verdict vs human-expert | корреляция 0.6-0.8 | r ≥0.6 |
| E9 | Воспроизводимость при temperature=0 | 80%+ схожесть | cosine ≥0.8 |
| E10 | Какие техники реально увеличивают citation usage | credibility + triangulation + executable-evidence | citation count ≥ +50% |
| E11 | Pareto frontier качества/стоимости | «sweet spot» ~15 техник | пик quality-per-token ~15 |
| E12 | Multi-agent vs single-agent CoT | дебат лучше на 20% | rating ≥ +20% на 7+ topics |
| E13 | Blind human preference: дебат vs single-agent | 60%+ в пользу дебата | preference ≥60% |

---

## Ссылки

- Roadmap реализации — `docs/roadmap/debate-improvements-roadmap.md`.
- Реестр дефектов — `docs/audits/debate-audit.md`.
- Архивная монография — `debates-deep-research-monograph.md`.
