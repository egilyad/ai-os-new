<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: аргументация (debateplus)

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, аргументация, дебаты, консенсус

Источники: `src/kernel/services/debateplus/argtech-service.ts`, `src/kernel/services/debateplus/format-service.ts`, `src/kernel/services/debateplus/argtech-consensus-bridge.ts`

## Назначение

Формализовать аргументацию: структуры аргументов/атак, форматирование и мост к консенсусу дебатов.

## Возможности

- `ArgTechService` — работа с аргументационной структурой.
- `FormatService` — представление аргументов.
- `argtech-consensus-bridge.ts` — связка с расчётом консенсуса дебатов.

## Реализация

- Каталог `debateplus/` из трёх модулей; дополняет [Компонент: рантайм дебатов](./comp-debate-runtime.md) и [Компонент: консистентность и дрейф](./comp-consistency.md).
- **Проверено на текущей ветке:**
  - `FormatService` — 6 форматов (oxford, munk, lincoln-douglas, popper, deliberative, adversarial), но это **отдельная pipeline на базе CouncilService**, не интегрированная в DebateEngine.
  - `ArgTechService` — Dung AF (grounded/preferred extensions), Toulmin, Kialo-дерево; `preferredExtensions` ограничен 12 аргументами (иначе исключение).
  - `argtech-consensus-bridge.ts` — применяет бонусы Dung/Toulmin к консенсусу, но в финальном вердикте напрямую не участвует.

## Связи

- Дебаты — [Компонент: рантайм дебатов](./comp-debate-runtime.md); синтез/форум — [Компонент: синтез, форум и junction-движок](./comp-synthesis-forum.md).
- Панели: [Инструменты анализа дебатов](./panel-debate-toolkit.md), [Дебаты: режимы и механика](./debates.md).

## Проверка работоспособности

- Ручная: разобрать аргумент и посмотреть вклад в консенсус.
- В каталоге `debateplus/` выделенных тестов не найдено.

## Состояние

- Реализовано; подтверждено чтением кода, без автотестов.
- Модули почти не имеют прямых unit-тестов (большинство методов — WORKING_NOT_TESTED).

---

## Связанные материалы

- [Компонент: рантайм дебатов](./comp-debate-runtime.md)
- [Инструменты анализа дебатов](./panel-debate-toolkit.md)
- [Компонент: консистентность и дрейф](./comp-consistency.md)
- [Дебаты: режимы и механика](./debates.md)
- [Компонент: синтез, форум и junction-движок](./comp-synthesis-forum.md)

[← Все материалы](./README.md)
