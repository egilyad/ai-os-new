<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: Персоны агентов

> Раздел: **Панели** · Статус: verified · Теги: панель, персоны, persona, инструкция

Источники: `src/i18n/translations/en/nav.ts`, `src/components/PersonaPickerPanel/`, `src/components/PersonaMixerPanel/PersonaMixerPanel.tsx`, `src/components/PersonaMarketplacePanel/`

## Назначение

Персоны агентов: выбор, смешение и магазин. Метки — `nav.persona_*`.

## Панели

- **Persona Library** (picker) — выбрать персону для агента.
- **Persona Mixer** — смешать несколько персон в новую.
- **Persona Marketplace** — магазин персон.

## Где менять

Компоненты: `PersonaPickerPanel`, `PersonaMixerPanel`, `PersonaMarketplacePanel`. Флот — [Панель: Флот (Fleet Console)](./panel-fleet.md), агенты — [Агенты: устройство и управление](./agents.md).

---

## Связанные материалы

- [Агенты: устройство и управление](./agents.md)
- [Панель: Флот (Fleet Console)](./panel-fleet.md)
- [Каталог компонентов OS](./dev-component-catalog.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `persona-mixer` → маршрут `/persona-mixer`
  - Компонент: `src/components/PersonaMixerPanel/PersonaMixerPanel`
  - Тесты: `src/components/PersonaMixerPanel/PersonaMixerPanel.test.tsx`
- Панель `persona-marketplace` → маршрут `/persona-marketplace`
  - Компонент: `src/components/PersonaMarketplacePanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `persona-picker` → маршрут `/persona-picker`
  - Компонент: `src/components/PersonaPickerPanel`
  - Тесты: — (рядом с компонентом не найдены)

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
