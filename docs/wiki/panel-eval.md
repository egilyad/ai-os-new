<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панель: Датасеты оценки

> Раздел: **Панели** · Статус: verified · Теги: панель, eval, датасеты, оценка, инструкция

Источники: `src/i18n/translations/en/analytics.ts`, `src/components/EvalDatasetPanel/`

## Назначение

Датасеты для оценки моделей. Ключи `eval.*`.

## Возможности

Создание датасета (имя, описание, промпты), список датасетов, пустое состояние.

## Где менять

Компонент: `EvalDatasetPanel`. Влияние техник — [Панель: Влияние техник](./panel-quality-impact.md), качество дебатов — [Панель: Качество дебатов](./panel-debate-quality.md).

---

## Связанные материалы

- [Панель: Влияние техник](./panel-quality-impact.md)
- [Панель: Качество дебатов](./panel-debate-quality.md)
- [Каталог компонентов OS](./dev-component-catalog.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `eval-datasets` → маршрут `/eval-datasets`
  - Компонент: `src/components/EvalDatasetPanel`
  - Тесты: — (рядом с компонентом не найдены)

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
