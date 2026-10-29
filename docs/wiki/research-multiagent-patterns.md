<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Исследование: мультиагентные ИИ-ОС

> Раздел: **Заметки** · Статус: documented · Теги: исследования, мультиагентные системы, паттерны, roadmap, deep research

Источники: `docs/research/multiagent-os-patterns.md`

## О чём это

[Исследование: мультиагентные ИИ-ОС](./research-multiagent-patterns.md) — аналитический обзор мультиагентных ИИ-ОС и фреймворков с целью выделить **редчайшие и наиболее полезные компоненты/паттерны** для SuperAgents OS. Полная версия — в `docs/research/multiagent-os-patterns.md`.

## Что изучено

- Многоагентные фреймворки: AutoGen, CrewAI, LangGraph, CAMEL, OpenAI Agents SDK, smolagents, agno.
- Агентные «ОС» и субагентные режимы: AIOS, OpenHands, Claude Code, Codex.
- Исследовательские системы: Perplexity Deep Research, Anthropic Research.
- Паттерны по темам: безопасность/доверие, память/знания, долгие задачи/оркестрация, оценка/само-улучшение.

## Топ редких паттернов

1. **Claim-centric evidence** — выводы строго из проверяемых утверждений с цитатами (у нас есть база: Crystal Vault).
2. **Record a Skill / процедурная память** — превращение удачных цепочек в навыки.
3. **Blackboard / Global Workspace** — общий «фокус внимания» агентов.
4. **Sub-agent spawn с изоляцией контекста и бюджета**.
5. **Cross-session memory consolidation** — консолидация и забывание.
6. **Sandbox с отрезанной сетью** — безопасное исполнение кода.
7. **Long-horizon state machine с checkpoint/resume** — переживание перезагрузки.
8. **Multi-agent debate с ограничением семейств моделей** — против подстройки.

## Что у нас уже сильно

- Дебаты (33+ стратегии, живые графы, вердикты).
- Crystal Vault + Junction + Synthesis (claim-центричная работа).
- Маршрутизация UCB1/broadcast/race и декораторы (circuit breaker, retry, rate-limit, cost).
- Знаниевый конвейер и гибридный поиск (BM25 + семантика).

## Как использовать

Результаты исследования станут основой для Roadmap: по нему будет проще «сесть» и последовательно внедрять паттерны кодом, а не прыгать между задачами.

---

## Связанные материалы

- [Deep Research](./panel-research-cockpit.md)
- [Graph Workbench](./panel-graph-workbench.md)
- [Планы и направления](./roadmap-notes.md)

[← Все материалы](./README.md)
