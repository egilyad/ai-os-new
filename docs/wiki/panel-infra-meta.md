<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: Инфраструктура и платформа

> Раздел: **Панели** · Статус: documented · Теги: панель, инфраструктура, плагины, инструкция

Источники: `src/i18n/translations/en/nav.ts`, `src/components/ServiceRegistryPanel/ServiceRegistryPanel.tsx`, `src/components/PluginSdkPanel`

## Назначение

Инфраструктурные и платформенные панели. Метки — `nav.*`.

## Инструменты

- **Dependency Graph** — граф зависимостей.
- **Service Registry** — реестр сервисов.
- **Plugin SDK** — SDK плагинов.
- **Experimental** — экспериментальные функции (статус planned, бейдж).
- **Export / Import** — экспорт и импорт данных.

## Где менять

Компоненты: `DependencyMapPanel`, `ServiceRegistryPanel`, `PluginSdkPanel`, `ExperimentalPanel`, `ExportImportPanel`. Карта сервисов — [Карта зависимостей ядра (DI)](./dev-service-map.md).

---

## Связанные материалы

- [Панель: Наблюдаемость (логи, трейсы, здоровье)](./panel-observability.md)
- [Карта зависимостей ядра (DI)](./dev-service-map.md)
- [Каталог компонентов OS](./dev-component-catalog.md)

[← Все материалы](./README.md)
