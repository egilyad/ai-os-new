import type { WikiArticle } from './wiki-types';

export const GRAPH_WORKBENCH_ARTICLE: WikiArticle = {
    slug: 'panel-graph-workbench',
    title: 'Graph Workbench',
    section: 'panels',
    tags: ['графы', 'аналитика', 'визуализация', 'роутинг', 'дебаты', 'память', 'ключи', 'калибровка'],
    freshness: 'verified',
    sources: [
        'src/components/GraphWorkbenchPanel/GraphWorkbenchPanel.tsx',
        'src/components/GraphWorkbenchPanel/DebateLens.tsx',
        'src/components/GraphWorkbenchPanel/KeysLens.tsx',
        'src/components/GraphWorkbenchPanel/CalibrationLens.tsx',
        'src/components/GraphWorkbenchPanel/EmbeddingsLens.tsx',
        'src/components/GraphWorkbenchPanel/CoverageLens.tsx',
    ],
    related: ['memory-center-audit', 'panel-routing', 'debates', 'memory', 'panels-catalog'],
    body: `## Что это

[[panel-graph-workbench]] — универсальный рабочий стол визуализаций SuperAgents OS. Это не один граф, а набор переключаемых «линз» над реальными данными ядра. Каждая линза отвечает на свой вопрос, на который обычный граф ответить не может.

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

- Другие визуализации — [[panels-catalog]] и связанные статьи.
- Memory Center — [[memory-center-audit]], [[memory]].
- Роутинг и UCB1 — [[panel-routing]].
- Дебаты — [[debates]].`,
};
