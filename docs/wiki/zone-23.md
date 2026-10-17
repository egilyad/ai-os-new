<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 23: коммуникации-2

> Раздел: **История разработки** · Статус: verified · Теги: аудит, зона 23

## Что проверено и исправлено

- GroupsPanel: refresh был голым — getGroups мог бросить и дать unhandled rejection; теперь try/catch с баннером. Группы с legacy-полем keyIds (без массива) роняли .includes/.length — fallback на пустой массив.
- GroupDetail: group.keyIds и поля burst/quota шареного пула терпят отсутствующие значения (0 вместо краша).
- BoPTrackerPanel: loadDebate при undefined round давал NaN в инпуте раунда (Math.max с undefined) и ронял recordClaim на отсутствующем content — guards (round→1, content→пусто). Рендер claimText — безопасный slice.
- debate-bop-service.recordClaim: не-строковый claimText больше не роняет запись (пусто), round приводится к конечному числу.
- ChatDock: legacy-сессии без title и сообщения без text роняли .slice — guards (fallback на id и пустую строку).
- i18n: добавлен ключ групп groups.error.load (en+ru, паритет сохранён).
- Тесты: GroupsPanel 3/3 (новый: счётчики, legacy без keyIds, баннер ошибки), BoPTracker +1 (legacy live-аргументы без content/round — нет NaN), ChatDock 2/2 (новый: legacy-сессия).
- ВАЖНО: локальная верификация невозможна (vitest-пул мёртв), гейт — только CI. Синтаксис проверен транспиляцией.

## Отложено, требует проверки

- RoomPanel: прочитан целиком — уже хорошо guarded (id/sessionRef/feed guards, error-баннеры); в живом прогоне не гонялся.
- ChatAdminPanel (AdminToolbar/SessionRow/PreviewModal/AdminStatsCards/SessionTable) и ChatExportPanel (Source/Format/ExportActions/PreviewPane) — не тронуты, только заметки о размерах.
- DebateLive (DebateLivePanel + сабкомпоненты) — не тронут, есть собственный comprehensive-тест.
- StakeholderPanel: relevanceScore гарантированно число (hits/4) — правок не потребовал.
- invocationEngine/invocationRepository из services-extras — живьём не поднимались, только type-guards.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
