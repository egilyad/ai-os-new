<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 5: система и мониторинг

> Раздел: **История разработки** · Статус: verified · Теги: аудит, зона 5

## Что проверено и исправлено

- HealthPanel: Promise из getSystemHealth больше не попадает в state (был краш на .vitals) — guarded и refresh, и mount.
- HealthPanel: ошибка probeAll — баннером (было молча); бейдж OPERATIONAL стал условным (degraded при error-ключах).
- HealthPanel: latency без замера — «—» вместо выдуманных <10ms; recovery-оценка помечена как heuristic (+5/min assumed).
- Тесты HealthPanel чинены (rootLogger в моке, селектор useKeyStore) + 3 новых: degraded-бейдж, Promise-refresh, Promise-mount.
- TracesPanel: guards на getTraces/шину/поиск/steps/startTime/latency/confidence (NaN% → 0%, undefinedms → «—»).
- TracesPanel: delete — функциональный setState (не затирает свежие события) + ошибка через i18n; Show more — ключи en+ru.
- EventsTimeline: loadEvents валидирует массив и числовые id; неизвестная severity → info-фолбэк; поиск терпит legacy-поля.
- EventsTimeline: hover через brightness вместо хирургии rgba-строки.
- DashboardPanel: «RPS» был счётчиком за минуту → переподписан Req/min (en+ru); пороги SystemHealthPanel не трогались.
- DashboardPanel: Token Burn и cost считают окно 24ч (была сумма всего retention под видом «today»).
- DashboardPanel: cost берёт измеренный dailyAverage вместо month-spend под видом «today»; getBudgetInfo в try/catch.
- CostAnalytics/Budget/Costs/AnalyticsPanel: проверены, разрывов не найдено (this_month/projected/forecast подписаны честно).

## Отложено, требует проверки

- DashboardPanel.test.tsx вис в этом окружении (stash-прогон HEAD: сборка ~10с при скипе, рендер висит). Причина найдена в Зоне 7: петля «эффект от нестабильного t + setState». Лечится стабильным t в моке — 11/11, см. Зону 7.
- EventsTimeline полностью на английском без useTranslation — i18n-ретрофит не делался.
- HealthPanel VitalCard uptime fill=100 всегда (естественной шкалы нет) — оставлено сознательно.
- tsc -b не влезает в 10-минутные окна инструмента; типы покрыты eslint (0 errors) + vitest; CI — гейт.
- Сабпанели дашборда (PressureMap, InferenceMesh и др.) — только поверхностный проход, глубокий аудит цифр не делался.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
