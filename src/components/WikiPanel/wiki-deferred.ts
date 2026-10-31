import type { WikiArticle } from './wiki-types';

/**
 * Сводная статья отложенных работ и фич. Собирает известные пробелы из
 * карт системной разведки (аудиты в `docs/audits/waves/`) и карты отложенных
 * (`docs/known-issues-deferred.md`), с указанием источника и причины.
 */
export const DEFERRED_ARTICLES: WikiArticle[] = [
    {
        slug: 'deferred-works-features',
        title: 'Отложенные работы и фичи',
        section: 'dev-status',
        tags: ['состояние разработки', 'бэклог', 'фичи', 'риски'],
        freshness: 'needs-check',
        sources: [],
        related: [
            'dev-status-debt',
            'dev-status-critical',
            'dev-status-bugs',
            'dev-status-roadmaps',
        ],
        body: `## Откуда этот список

Пробелы собраны из карт системной разведки (\`docs/audits/waves/\`), аудитов волн 2–8 и
карты отложенных (\`docs/known-issues-deferred.md\`). Здесь — с указанием **источника** и **причины**.

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

## Из «Карты доступности возможностей»

| Работа | Источник | Причина |
|---|---|---|
| Wiki-статьи для 64 панелей без документации | Accessibility Map §1 | discovery |
| Снизить cognitive overload (268 панелей / 22 раздела) | Accessibility Map §3 | навигация |
| Расширить CommandPalette quick actions (10 → больше) | Accessibility Map §3.2 | discovery |
| Onboarding: познакомить с killer-фичами (Crystal/Synthesis/Builder) | Accessibility Map §3.4 | онбординг |
| Явная команда «what can you do?» у Assistant | Accessibility Map §3.4 | discovery |
| Убрать/расширить stub-панели в main nav | Accessibility Map §1 | UX |

## Из «Карты потенциала» (Opportunity Map)

| Работа | Квадрант | Причина |
|---|---|---|
| Builder killer-service nodes (crystal/synthesis/lens/time-machine) | 🟢 Do First / 🔴 Strategic | стоимость 7, большой |
| Cross-panel navigation links (ROI 32) | 🟢 Do First | UI-ссылки, много точек |
| Import в 9 панелях (round-trip) | 🟢 Do First | фича восстановления |
| WikiPanel «Create article» UI | 🟢 Do First | фича |
| DebateArena «Save as Crystal» | 🟢 Do First | фича |
| Settings search + tooltips | 🟡 Quick Win | UI |
| Объединить budget/health панели | 🟡 Quick Win | рефакторинг |
| Coverage threshold в CI | 🟡 Quick Win | gating |
| eventBus cleanup audit (42 listeners) | 🟡 Quick Win | чинина |
| Переименовать rivals/ → experimental/ | 🟡 Quick Win | рефакторинг |
| Dev-status-*.md заполнены | ✅ сделано | — |
| Остальные Strategic Bets / Defer | 🔴/⚪ | крупное |

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
записывается сюда или в карту отложенных (\`docs/known-issues-deferred.md\`),
а не делается «вслепую».`,
    },
];
