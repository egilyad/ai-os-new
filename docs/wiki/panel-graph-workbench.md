<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Graph Workbench

> Раздел: **Панели** · Статус: verified · Теги: графы, аналитика, визуализация, роутинг, дебаты, память, ключи, калибровка

Источники: `src/components/GraphWorkbenchPanel/GraphWorkbenchPanel.tsx`, `src/components/GraphWorkbenchPanel/DebateLens.tsx`, `src/components/GraphWorkbenchPanel/KeysLens.tsx`, `src/components/GraphWorkbenchPanel/CalibrationLens.tsx`, `src/components/GraphWorkbenchPanel/EmbeddingsLens.tsx`, `src/components/GraphWorkbenchPanel/CoverageLens.tsx`

## Что это

[Graph Workbench](./panel-graph-workbench.md) — универсальный рабочий стол визуализаций SuperAgents OS. Это не один граф, а набор переключаемых «линз» над реальными данными ядра. Каждая линза отвечает на свой вопрос, на который обычный граф ответить не может.

## Линзы

- **Routing** — решения роутинга: запрос → кандидаты-провайдеры → выбранный. Видно, почему выбрана модель.
- **UCB1** — панель бандита: средний балл и UCB1-граница доверия по провайдерам, sparkline истории, число выборов и доля, когда провайдер выбирался.
- **Cost** — расходы по глобальному бюджету и по провайдерам.
- **Tasks** — граф зависимостей задач AGEMS по проектам.
- **Debate** — траектории позиций участников по раундам (от −1 con до +1 pro) и матрица согласия. Для завершённых сессий показывается бейдж «досрочное завершение», если дебаты остановлены по сходимости.
- **Keys** — дорожки жизненного цикла ключей: сегменты статусов (active / probation / quota_exhausted / error / …) из history и rotationHistory, с текущим статусом и статистикой.
- **Calibration** — reliability diagram: заявленная уверенность против фактической точности, плюс Brier score.
- **Embeddings** — карта эмбеддингов памяти: 2D-проекция векторов, цвет по типу записи, тултипы содержимого.
- **Coverage** — treemap покрытия памяти: размер блока = объём записей по типу, плюс сводные числа (записи, агенты, дебат-сессии).

## Фильтры

Сверху панели — общие фильтры:

- по провайдеру (все / конкретный);
- по временному окну (всё время / 24 часа / 3 дня / 7 дней).

Фильтры действуют перекрёстно: выбор провайдера или окна сразу влияет на линзы Routing, UCB1, Cost и Keys.

## Данные

Всё строится из живого ядра, ничего не имитируется:

- routerService.getDecisionHistory() — решения роутинга;
- budgetService.getSpendSummary() — расходы;
- keyService.getKeys() — ключи и их история;
- sessionManager.getDebateHistory() — сессии дебатов;
- memoryService.getStats() / memoryService.getMemories() — память и эмбеддинги.

## Где смотреть

- Другие визуализации — [Каталог панелей: раздел → маршрут → компонент → статья](./panels-catalog.md) и связанные статьи.
- Memory Center — [Memory Center: аудит памяти системы](./memory-center-audit.md), [Знания и память](./memory.md).
- Роутинг и UCB1 — [Панели: Умная маршрутизация](./panel-routing.md).
- Дебаты — [Дебаты: режимы и механика](./debates.md).

---

## Связанные материалы

- [Memory Center: аудит памяти системы](./memory-center-audit.md)
- [Панели: Умная маршрутизация](./panel-routing.md)
- [Дебаты: режимы и механика](./debates.md)
- [Знания и память](./memory.md)
- [Каталог панелей: раздел → маршрут → компонент → статья](./panels-catalog.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `graph-workbench` → маршрут `/graph-workbench`
  - Компонент: `src/components/GraphWorkbenchPanel/GraphWorkbenchPanel`
  - Тесты: — (рядом с компонентом не найдены)

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
