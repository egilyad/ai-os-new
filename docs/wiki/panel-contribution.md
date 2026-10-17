<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: Вклад и сообщество

> Раздел: **Панели** · Статус: verified · Теги: панель, сообщество, вклад, лидерборд, инструкция

Источники: `src/i18n/translations/en/dashboard.ts`, `src/components/ContributionGraphPanel/`, `src/components/SocialLeaderboardPanel`

## Назначение

Активность и вклад участников. Ключи `contrib.*`.

## Граф вклада

Всего вклада, текущая серия (streak) и самая длинная, календарь активности по дням (меньше / больше).

## Лидерборд

Социальный лидерборд и хаб сообщества (`CommunityHubPanel`) — рейтинги и общая активность.

## Где менять

Компоненты: `ContributionGraphPanel`, `SocialLeaderboardPanel`, `CommunityHubPanel`. Агенты — [Агенты: устройство и управление](./agents.md).

---

## Связанные материалы

- [Агенты: устройство и управление](./agents.md)
- [Панель: Планировщик](./panel-scheduler.md)
- [Каталог компонентов OS](./dev-component-catalog.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `leaderboard` → маршрут `/leaderboard`
  - Компонент: `src/components/SocialLeaderboardPanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `community-hub` → маршрут `/community-hub`
  - Компонент: `src/components/CommunityHubPanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `contribution-graph` → маршрут `/contribution-graph`
  - Компонент: `src/components/ContributionGraphPanel`
  - Тесты: — (рядом с компонентом не найдены)

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
