<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Universal Graph: проекция событий и провенанс

> Раздел: **Разработчикам** · Статус: documented · Теги: dev, graph, project-graph, provenance, events, junction

Источники: `src/kernel/services/project-graph/project-graph-service.ts`, `src/kernel/services/project-graph/project-graph-projection.ts`, `src/kernel/services/trust/unified-provenance-bridge.ts`, `src/kernel/types/project-types.ts`, `src/components/UniversalGraphPanel/UniversalGraphPanel.tsx`, `src/components/GraphStudioPanel/GraphStudioPanel.tsx`

## Что это

**Universal Graph** — сквозной граф сущностей системы (проекты, задачи, дебаты, вики-страницы,
цели, агенты, оркестрации). Строится событийно: доменные события проецируются в узел/ребро
графа, а зеркало пишется в провенанс (temporal-хронология).

## Компоненты

- `ProjectGraphService` — операции графа: upsert узлов, связи (contains/assigned_to/...),
  обход соседей, multi-hop traverse, статусы F6 (`proposed → active → superseded`),
  `listPotential` (знаниевый потенциал).
- `ProjectGraphProjection` — подписчик EventBus: PROJECT_CREATED, TASK_CREATED,
  WIKI_PAGE_WRITTEN, PROJECT_DEBATE_STARTED, AUTONOMY_GOAL_CREATED, GRAPH_STARTED,
  GRAPH_NODE, JUNCTION_DETECTED.
- `UnifiedProvenanceBridge` — зеркалит те же события в `ProvenanceService` с едиными
  `ProvenanceNodeKind`/тиProvenanceEdgeRelation` (temporal-валидность).
- `UniversalGraphPanel` — read-only просмотр графа проекта (узлы по типам, связи узла).
- `GraphStudioPanel` — визуальная студия: физика (repulsion/spring/gravity/freeze),
  стили (палитры, размер узлов, толщина рёбер), фильтры (порог близости, сироты, поиск-фокус),
  пресеты, мультиисточник (проект / wiki), кластеры по компонентам связности.

## События и связи

| Событие | Узел | Ребро |
|---|---|---|
| PROJECT_CREATED | project | contains (self) |
| TASK_CREATED | task, agent | contains, assigned_to |
| WIKI_PAGE_WRITTEN | knowledge | contains |
| PROJECT_DEBATE_STARTED | debate | contains |
| AUTONOMY_GOAL_CREATED | goal | contains |
| GRAPH_STARTED / GRAPH_NODE | subgraph / task | contains |
| JUNCTION_DETECTED | research (глобальный контейнер) | contains |

## Связанное

- Сервисы графа и типы — [Граф знаний](./dev-graph.md).
- Статус разработки — [Активная разработка](./dev-status-active.md).
- Ассистент (действия `graph.*`) — [Assistant: статус реализации (M0–M4)](./dev-assistant-progress.md).

---

## Связанные материалы

- [Граф знаний](./dev-graph.md)
- [Активная разработка](./dev-status-active.md)
- [Assistant: статус реализации (M0–M4)](./dev-assistant-progress.md)

[← Все материалы](./README.md)
