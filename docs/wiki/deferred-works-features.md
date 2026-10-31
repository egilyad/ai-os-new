<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Отложенные работы и фичи

> Раздел: **Состояние разработки** · Статус: needs-check · Теги: состояние разработки, бэклог, фичи, риски

## Откуда этот список

Пробелы собраны из карт системной разведки (`docs/audits/waves/`), аудитов волн 2–8 и
карты отложенных (`docs/known-issues-deferred.md`). Здесь — с указанием **источника** и **причины**.

## Из «Карты функциональных пробелов»

| Работа | Источник | Причина |
|---|---|---|
| Builder не вызывает killer-сервисы (crystal/synthesis/lens/time-machine) | Gap Map §3 | архитектурный, большой |
| Round-trip: export без import у 9 панелей | Gap Map §4 | фича восстановления из бэкапа |
| Provenance агент↔память / дебаты↔память | Gap Map §5 | граф/связи |
| Единые overview: agents/memory/debates/providers/background | Gap Map §6 | новый UI |
| Search в Settings, autocomplete в Wiki | Gap Map §7 | UI |
| Массовые операции (Roles/Traces/Governance) | Gap Map §8 | фича (approvals уже сделаны) |
| Уведомления: crystal refuted / debate concluded / memory worker | Gap Map §9 | событийная шина |

## Из «Карты технического состояния»

| Работа | Источник | Причина |
|---|---|---|
| Coverage-gate в CI | Tech Map §9.4 | нужен порог, риск падения |
| Снизить lint baseline (5600) | Tech Map §3.5 | плановая чистка |
| Декомпозиция hotspots (dexie-schema, sandbox, key-service…) | Tech Map §6 | рефакторинг |
| Рефакторинг 62 TechniquePanels → generic | Tech Map §5.6 | устранить дублирование |
| Внешний security audit sandbox-interpreter | Tech Map §6 | безопасность |

## Из аудитов (волны 2–8) — безопасность/настойчивость

| Работа | Источник | Причина |
|---|---|---|
| KeyVault fail-open + passphrase-UI | W2-005/W4-019/W7-CRY-001 | продуктовое решение |
| API-ключи в IndexedDB plaintext | W5-002 | зависит от vault |
| Multi-tenant IDOR / SYNC_SECRET / WS cross-tenant | W2-009/W8-003 | server-скоупинг |
| Cross-session потеря сообщений | W6-019 | per-session изоляция |
| Feature-flag UI (dotted vs nested) | W6-018 | типы/семантика |
| streamMessage in-flight dedup | W6-039 | обёртка большого блока |
| CSAM/модерация изображений | W7-UGC-009 | внешний сервис |

## Правило

Любая крупная небезопасная работа без локального прогона тестов/typecheck
записывается сюда или в карту отложенных (`docs/known-issues-deferred.md`),
а не делается «вслепую».

---

## Связанные материалы

- [Технический долг](./dev-status-debt.md)
- [Критические проблемы](./dev-status-critical.md)
- [Отложенные баги](./dev-status-bugs.md)
- [Roadmaps](./dev-status-roadmaps.md)

[← Все материалы](./README.md)
