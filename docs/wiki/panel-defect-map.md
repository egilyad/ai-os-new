<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Карта дефектов

> Раздел: **Панели** · Статус: documented · Теги: панели, диагностика, дефекты

Источники: `src/components/DefectMapPanel/DefectMapPanel`

## Карта дефектов

Сводная карта известных дефектов и их статусов по подсистемам. Используется для навигации по отложенным проблемам.

Компонент: `src/components/DefectMapPanel/DefectMapPanel`.

---

## Связанные материалы

- [Панель: Наблюдаемость (логи, трейсы, здоровье)](./panel-observability.md)
- [Диагностика и известные проблемы](./diagnostics.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `defect-map` → маршрут `/defect-map`
  - Компонент: `src/components/DefectMapPanel/DefectMapPanel`
  - Тесты: — (рядом с компонентом не найдены)

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
