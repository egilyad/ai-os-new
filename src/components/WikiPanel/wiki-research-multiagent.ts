import type { WikiArticle } from './wiki-types';

export const RESEARCH_MULTIAGENT_ARTICLE: WikiArticle = {
    slug: 'research-multiagent-patterns',
    title: 'Исследование: мультиагентные ИИ-ОС',
    section: 'notes',
    tags: ['исследования', 'мультиагентные системы', 'паттерны', 'roadmap', 'deep research'],
    freshness: 'documented',
    sources: [],
    related: ['panel-research-cockpit', 'panel-graph-workbench', 'roadmap-notes'],
    body: `## О чём это

[[research-multiagent-patterns]] — аналитический обзор мультиагентных ИИ-ОС и фреймворков с целью выделить **редчайшие и наиболее полезные компоненты/паттерны** для SuperAgents OS. Полная версия — в \`docs/research/multiagent-os-patterns.md\`.

## Что изучено

- Многоагентные фреймворки: AutoGen, CrewAI, LangGraph, CAMEL, OpenAI Agents SDK, smolagents, agno.
- Агентные «ОС» и субагентные режимы: AIOS, OpenHands, Claude Code, Codex (углублённо — 2.3).
- Исследовательские системы: Perplexity Deep Research, Anthropic Research.
- Паттерны по темам: безопасность/доверие (2.4), память/знания (2.5), долгие задачи/оркестрация, оценка/само-улучшение (2.6), UX мультиагентных панелей (2.7).

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

Результаты исследования станут основой для Roadmap: по нему будет проще «сесть» и последовательно внедрять паттерны кодом, а не прыгать между задачами.`,
};
