<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 12: качество

> Раздел: **История разработки** · Статус: verified · Теги: аудит, зона 12

## Что проверено и исправлено

- ImpactTab: знаменатель «N/70» был зашит stale-литералом (в реестре ~77) — теперь из getTechniques(); сортировка/агрегаты терпят legacy без полей.
- quality-impact-shared: formatPct — «—» вместо NaN%; deltaStyle — нейтральный серый вместо красного по умолчанию для отсутствующих данных.
- debate-consistency-service: jaccardText и слайсы терпят undefined content (краш useMemo-панели).
- ConsistencyPanel: content-slice — guard.
- CalibrationPanel проверен — честен по дизайну (эвристика подписана, формула в UI, NaN-путей нет), правок не потребовал.
- Тесты: ImpactTab 3/3 (новый), ConsistencyPanel 5/5 (+1 legacy), CalibrationPanel 3/3 (без изменений).

## Отложено, требует проверки

- ExperimentsTab (A/B Liu) — только чтение, живой эксперимент не гонялся.
- quality_impact.*-ключи — с ?? 'English' фолбэками в коде; есть ли реальные переводы — не сверялось.
- Calibration/Consistency useMemo на живых дебатах с больными данными — только legacy-юнит, живого прогона нет.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
