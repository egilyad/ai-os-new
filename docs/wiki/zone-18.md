<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 18: SRE и пулы

> Раздел: **История разработки** · Статус: documented · Теги: аудит, зона 18

## Что проверено и исправлено

- SREAgentPanel: все catch были пустыми («resolver logged») — теперь баннер + лог; refresh терпит не-массивы; execute/dismiss/autofix — с видимыми ошибками.
- PoolStatusPanel: сохранение квоты санитизировано (NaN/отрицательные → 0, иначе травит все суммы); legacy-ключи без provider не роняют matching; 4 захардкоженных лейбла — в ключи en+ru.
- ServiceRegistryPanel проверен чтением — честный (glob-источник, самоподдерживающийся), правок не потребовал.
- Тесты: SREAgentPanel 4/4 (новый), PoolStatusPanel 7/5+2 (мок через vi.hoisted-stores).
- ВАЖНО: локальная верификация невозможна (vitest-пул мёртв), гейт — только CI. Синтаксис проверен транспиляцией.

## Отложено, требует проверки

- WhatIfCard/CachingAdvice/AlertItem/SREHeader — только через интеграционные тесты панели.
- usePoolStatus/getPoolKeyDistribution — живые стора-пути не гонялись, только моки.
- ServiceRegistry DetailPanel/UnmappedPanel — не покрыты.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
