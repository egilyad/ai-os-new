<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панель: Синтез мнений

> Раздел: **Панели** · Статус: verified · Теги: панель, синтез, консенсус, инструкция

Источники: `src/i18n/translations/en/analytics.ts`, `src/components/SynthesisPanel/SynthesisPanel.tsx`

## Назначение

Синтез мнений ролей и линз в единый ответ. Ключи `synthesis.*`.

## Как пользоваться

Вопрос, выбор ролей и линз, глубина (quick / standard / deep), опция «сохранять несогласие», стратегия синтеза и запуск.

## Итог

Результат показывает консенсус, несогласие, неопределённость и общее число мнений. Есть сид-демо и обновление.

## Где менять

Компонент: `SynthesisPanel`. Дебаты — [Дебаты: режимы и механика](./debates.md), исследование — [Панель: Исследовательский движок](./panel-research.md).

---

## Связанные материалы

- [Дебаты: режимы и механика](./debates.md)
- [Панель: Исследовательский движок](./panel-research.md)
- [Каталог компонентов OS](./dev-component-catalog.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `synthesis` → маршрут `/synthesis`
  - Компонент: `src/components/SynthesisPanel/SynthesisPanel`
  - Тесты: `src/components/SynthesisPanel/SynthesisPanel.test.tsx`

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
