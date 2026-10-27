<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Дебаты: стратегии — обзор

> Раздел: **Дебаты** · Статус: verified · Теги: дебаты, стратегии, обзор, как выбрать

Источники: `src/kernel/services/debate-runtime/debate-strategy-definitions.ts`, `src/components/DebatePanel/StrategySelector.tsx`

## Назначение

Стратегия дебатов определяет, **как** агенты ведут спор: кто говорит, в каком порядке, как проверяются аргументы и когда спор завершается. В системе десятки встроенных стратегий (см. [Дебаты: шпаргалка стратегий (33)](./debate-strategies-cheatsheet.md)).

## Что задаёт стратегия

- **Схему ролей** — кто участники (pro/con/neutral/модератор/жюри).
- **Порядок ходов** — последовательно, одновременно, вопросы-ответы.
- **Правила аргументации** — требования к доказательствам, структуре.
- **Критерий завершения** — число раундов, согласие, вердикт.

## Как выбрать

| Цель | Подходящие стратегии |
| --- | --- |
| Классический спор | Round Robin, Moderated, Free-for-All |
| Проверить идею на прочность | Socratic, Red Teaming, Hypothesis Testing, Cross-Examination |
| Собрать идеи коллективно | Brainstorming, Delphi, Collaborative Consensus |
| Принять сложное решение | Multi-Criteria, Stakeholder Mapping, Evidence-Based Policy |
| Разобрать провал | Post-Mortem/Autopsy, Premortem |
| Формальное выступление | Parliamentary, Oxford Union, Lincoln-Douglas |

Полная шпаргалка со схемами — в [Дебаты: шпаргалка стратегий (33)](./debate-strategies-cheatsheet.md).

---

## Связанные материалы

- [Дебаты: шпаргалка стратегий (33)](./debate-strategies-cheatsheet.md)
- [Дебаты: режимы и механика](./debates.md)

[← Все материалы](./README.md)
