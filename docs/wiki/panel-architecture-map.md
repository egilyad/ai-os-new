<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Карта архитектуры

> Раздел: **Панели** · Статус: documented · Теги: панели, архитектура

Источники: `src/components/ArchitectureMapPanel`

## Карта архитектуры

Визуальная схема слоёв и связей системы: kernel, сервисы, события, сторы и UI. Связана с [Архитектура и связи](./architecture.md) и [Разработчикам: обзор и слои](./dev-overview.md).

Компонент: `src/components/ArchitectureMapPanel`.

---

## Связанные материалы

- [Архитектура и связи](./architecture.md)
- [Разработчикам: обзор и слои](./dev-overview.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `architecture-map` → маршрут `/architecture-map`
  - Компонент: `src/components/ArchitectureMapPanel`
  - Тесты: — (рядом с компонентом не найдены)

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
