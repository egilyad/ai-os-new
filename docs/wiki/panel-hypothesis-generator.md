<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панель: Генератор гипотез

> Раздел: **Панели** · Статус: verified · Теги: панель, гипотезы, исследование, проверка, инструкция

Источники: `src/components/DebateResearch/HypothesisGenerator.tsx`, `src/kernel/services/hypothesis-service.ts`

## Назначение

Генератор гипотез: `hypothesisService.propose(...)` создаёт гипотезу, а дальше её можно проверить авто-дебатом (`autoDebate.runAutoDebate`).

## Как пользоваться

1. Открой `/hypothesis-gen`.
2. Сформулируй гипотезу.
3. Запусти проверку (авто-дебат по теме).
4. Посмотри, выдержала ли гипотеза спор.

## Связи

Это «предложил идею → проверил спором». Результат может уходить в [Панель: Синтез мнений](./panel-synthesis.md) и [Панель: Хранилище кристаллов](./panel-crystal-vault.md).

---

## Связанные материалы

- [Панель: Исследовательский движок](./panel-research-engine.md)
- [Панели: Исследования системы дебатов](./panel-debate-research.md)
- [Панель: Синтез мнений](./panel-synthesis.md)

[← Все материалы](./README.md)
