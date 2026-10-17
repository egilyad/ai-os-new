<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 20: управление дебатами

> Раздел: **История разработки** · Статус: verified · Теги: аудит, зона 20

## Что проверено и исправлено

- GoTDeliberationPanel: handleDeliberate был try/finally без catch (unhandled) — теперь баннер; branches/diversity/confidence/novelty/reasoning/conclusion — guards от частичных веток.
- CouncilPanel: списки/детали/сообщения/факты/оценки — guards на legacy без полей; effect загрузки детали терпит и синхронный throw lazy-прокси.
- Тесты: GoTDeliberationPanel.guards 2/2 (мокнутый сервис с битой полезной нагрузкой), CouncilPanel 3/3 (новый, стора-мок).
- ВАЖНО: локальная верификация невозможна (vitest-пул мёртв), гейт — только CI. Синтаксис проверен транспиляцией.

## Отложено, требует проверки

- DirectorPanel (сценарии/прогоны) — большая панель с тестами, не тронута: отдельный аудит при необходимости.
- MetaAgentPanel/ExpertWitnessPanel — прочитаны поверхностно, явной лжи не видно; глубокий аудит не делался.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
