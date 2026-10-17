<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: Линзы и кристаллы

> Раздел: **Панели** · Статус: verified · Теги: панель, линзы, кристаллы, знания, инструкция

Источники: `src/i18n/translations/en/analytics.ts`, `src/components/LensesPanel/LensesPanel.tsx`, `src/components/CrystalVaultPanel/CrystalVaultPanel.tsx`

## Назначение

Линзы анализа и кристаллы знаний. Ключи `lenses.*` и `lenses_crystal.*`.

## Линзы

Библиотека линз и активный стек, предложения (suggest). Категории: analytical, ethical, temporal, domain, risk, stakeholder. Создание, редактирование, удаление и очистка; у линзы есть имя, описание, категория, префикс и теги.

## Кристаллы

Кристаллы — зафиксированные утверждения: предложить (propose), кристаллизовать (crystallize), заменить (supersede), опровергнуть (refute). Статусы: semi, crystal, superseded, refuted. У кристалла есть доказательства, допущения, отрицание и противоречия; замена и опровержение подтверждаются.

## Где менять

Компоненты: `LensesPanel`, `CrystalVaultPanel`. Память — [Знания и память](./memory.md), синтез — [Панель: Синтез мнений](./panel-synthesis.md).

---

## Связанные материалы

- [Знания и память](./memory.md)
- [Панель: Синтез мнений](./panel-synthesis.md)
- [Инструменты анализа дебатов](./panel-debate-toolkit.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `lenses` → маршрут `/lenses`
  - Компонент: `src/components/LensesPanel/LensesPanel`
  - Тесты: `src/components/LensesPanel/LensesPanel.test.tsx`
- Панель `crystals` → маршрут `/crystals`
  - Компонент: `src/components/CrystalVaultPanel/CrystalVaultPanel`
  - Тесты: `src/components/CrystalVaultPanel/CrystalVaultPanel.test.tsx`

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
