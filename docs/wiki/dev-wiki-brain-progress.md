<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Wiki-Brain: статус реализации (F0–F8)

> Раздел: **Разработчикам** · Статус: documented · Теги: dev, wiki, brain, research, mcp, статус, roadmap

Источники: `src/kernel/services/wiki-brain/wiki-knowledge-unit.service.ts`, `src/kernel/services/wiki-brain/wiki-research.service.ts`, `src/kernel/services/wiki-brain/wiki-contradiction-detector.ts`, `src/kernel/services/wiki-brain/wiki-decay-service.ts`, `src/kernel/services/wiki-brain/wiki-brain-mcp-server.ts`, `src/kernel/services/research/literature-fetcher-service.ts`, `src/kernel/services/project-graph/project-graph-service.ts`

## Что было сделано

Wiki-Brain прошёл роадмап F0→F8 (источник: wiki-wikibrain-somem-scimars-roadmap).

### F0–F4 — Фундамент
- `KnowledgeUnitService` — claim-level юниты (стабильный id, evidence, span) + типизированные связи.
- Персистентные эмбеддинги (`wikiEmbeddings`), real BM25 через `Bm25Service`.
- `WikiEditService` — staged-правки; `WikiChunkerService` — чанкинг; `WikiResearchService` — research-loop.
- События `wiki:*` (page written/deleted/ingested/edit committed).

### F5–F6 — Research и Knowledge Potential Graph
- `wiki.research` — замкнутый цикл: вопрос → поиск → синтез → запись hypothesis/observation-юнитов.
- `ProjectGraphService` F6: статусы `proposed → active → superseded`, `listPotential`,
  действия ассистента `graph.propose/potential/activate/supersede`.

### F7 — QC
- `WikiContradictionDetector` — консервативная проверка противоречий (общие термины + контрарный маркер).
- `WikiDecayService` — importance-weighted retention (score = база по kind × exp(−λ·age)).
- `WikiLintService` — новое правило `missing-evidence-citation`.

### F8 — MCP exposure
- `WikiBrainMcpServer` — тонкая обёртка: `wiki.search`, `wiki.read_page`,
  `wiki.graph_query`, `wiki.add_knowledge_unit` (in-process, local-first).

### F5b — Literature fetcher
- `LiteratureFetcherService`: провайдеры arXiv (публичный API) и Perplexity
  (`sonar-deep-research`, ключ `PERPLEXITY_API_KEY`), web-stub; `ingestAsSources`
  сохраняет статьи как `TWikiSource` (fnv1a-hash, дедупликация).
- Действие ассистента `research.fetch_literature` (query, provider, maxResults, ingest).

## Открытые вопросы

- Web-провайдер литературы (реальный поиск) — пока stub.
- Perplexity-провайдер включается только при заданном ключе.

## Связанное

- Ассистент (wiki-действия) — [Assistant: статус реализации (M0–M4)](./dev-assistant-progress.md).
- Граф и связь с проектами — [Universal Graph: проекция событий и провенанс](./dev-universal-graph.md).
- MCP-серверы — [MCP-инструменты OpenCode: сводный каталог](./dev-mcp-tools.md).

---

## Связанные материалы

- [Assistant: статус реализации (M0–M4)](./dev-assistant-progress.md)
- [Граф знаний](./dev-graph.md)
- [MCP-инструменты OpenCode: сводный каталог](./dev-mcp-tools.md)
- [Roadmaps](./dev-status-roadmaps.md)

[← Все материалы](./README.md)
