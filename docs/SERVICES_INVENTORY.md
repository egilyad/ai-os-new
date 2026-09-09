# Services Inventory — SuperAgents OS

> Дата: 2026-09-09. Этап T0.1. Только описание, без кода. Вопрос «зачем сервис и кто его зовёт» — за 1 минуту.

## 0. Контейнер (как всё связано)
- `src/kernel/container.ts` — `Container` + `defaultContainer`; `register`=eager singleton, `registerFactory`=lazy singleton (cache на первом `get()`), `registerTransient`=новый каждый раз, `override`=подмена для тестов.
- `src/kernel/service-registration/index.ts: registerServices()` дергает `registerPhase0..65` по порядку; фазы используют `helpers.makeHelpers(ctx).register(name, factory)` → всё lazy, с lifecycle `init()/start()` на первом `get()`.
- Исключения: `phase0` строит EventBridge/ProjectionRegistry/RouterProjection eager; `phase22` форсит `get('invocationCostTracker')` для подписки.
- Файлов фаз: 65 (`phase0-11,13-19,20-32,33-44,45-52,53-65`; нет `phase12`, нет `phase40-rivals8`).

## 1. Группы фаз и ключевые DI-имена
- **P0 bridge:** `eventBridge`, `projectionRegistry`, `routerProjection`.
- **P1 foundation:** `settingsService`, `pricingService`, `keyStateStore`, `providerTracker`, `kernel`, `metricsService`, `providerAdapterRegistry`, `keyService`, `groupManagerService`, `sessionManagerService`, `executionGovernor`, `fingerprints`, `keyIntelligencePipeline`, `deadLetterQueue`, `distributedLock`.
- **P2 infra:** `sessionAffinityStore`, `chatBookmarksService`, `agentJournalService`, `systemStatusService`, `rotationService` ⚠️ (для T1.1 — проверить, что умеет), `policyService`, `toolService`, `memoryService`, `externalSecretsService`, `blackboardService`, `cognitiveService`.
- **P3 debate-runtime (~100 имён):** `debateService` (=DebateSyncManager), `debateEngine`, `debateEvaluator`, `weightedJudgeEvaluator`, `debateMemoryExtractor`, `debateRAGRetriever`, `qualityImpactCollector`, `experimentEngine`, `factCheckService`, `debatePolicyEngine`, `bayesianJudge`, `blindEval`, `stanceDriftTracker`, `calibrationService`, `strategyManager`, `debateModeManager`, `debateApiService`, `debateHumanService`, `cognitiveIntelligenceService`, `whatIfService`, `pressureMapService`, `diagnosticService` + ~60 узких prompt/quality-сервисов (entanglement, anchoring, steelman, minimax, insightBus, …).
- **P4 agents-roles:** `agentService`, `templateService`, `agentVersionService`, `roleVersionService`, `agentHealthMonitor`, `taskHandoffService`, `traceService`, `orchestrator`, `roleService`, `skillService`, `mcpService`, `sandboxService`, `budgetService`, `routingPolicyService`.
- **P5 routing-llm:** `raceExecutor`, `routerService`, `usageTracker`, `cacheService`, `configService`, `snapshotService`, `capabilityManager`, `advisorService`, `adminService`, `timelineService`, `monitoringService`, `llmClientService`, `virtualKeyService`, `providerRuntimeService`.
- **P6 high-level (~50):** `chatService` (=ChatExecutor), `workspaceService`, `probeService`, `autoDebateService`, `topologyManager`, `agentWizardService`, `roleTestingSandboxService`, `personaService`, `smartRoutingService`, `nvidiaEnterpriseService`, `workflowService`, `promptLibraryService`, `agentAvatarService`, `metaLearningService`, … (полный список — в аудите фазы, все `new XService`).
- **P7/P8:** `memoryOrchestrator`, `evalDatasetService`, `customMetricsService`, `unifiedRoleRegistry`, `roleTeamService`.
- **P9-P11:** `researchEngine`, `geminiResearchService`, `ecosystemEngine`, `causalScopeManager`, `causalTimelineService`, `counterfactualEngine`, `temporalReplayService`, `truthConsistencyMonitor`.
- **P13-P19 knowledge:** `lensEngine`, `crystalVault`, `crystalDebateBridge`, `junctionEngine`, `synthesisEngine`, `knowledgeGenerator`, `forumService`, `builderAgent`.
- **P20-P22:** `conversationDirectorService`, `invocationEngineService` (+Repository), `invocationCostTracker`.
- **P23-P32 orchestration:** `crewService`+`agentForgeService`, `councilService`(+facade), `graphService`, `personaService`, `auditService`/`hierarchyService`/`toolGovernanceService`/`sandboxBrokerService`/`skillMarketService`/`fleetMonitorService`/`mobileAccessService`, `a2aService`/`gatewayService`/`federationService`/`coordinationService`, `metaAgentService`/`strategyService`/`cogMemoryService`, `governanceService`/`provenanceService`/`ecosystemService`, `evalService`/`simulationService`/`frontierOpsService`, `knowledgeService`/`toolRunnerService`/`trainingService` (+ParityRepository).
- **P33-P44 rivals (10 фаз × ~10 имён):** parity-импорты внешних систем (groupChat/guardrail/sop/planner/dyad, ReAct/RAG/SWE/modes/character, reasoning/sessionState/flowApi, copilot/bedrock/cxf/entity, appBuilder/ide/acl/search/codeExec, n8n/temporal/asset/verify, debateplus `formatService`/`argTechService`, forumPlus/decision/polis/reflexion/meter, openClaw/dsh/manus/genspark, a2aSpec/cacheRegistry/dotprompt/notebook/quotaGuard, netLogo/mesa/chainlit/chart/gym, constitutional/voyager/swarm/quantumDeep).
- **P45-P52 business/synth/coding:** orgChart/bizTicket/meeting/hitlLevels/playbook/compose/scraper/relay/seo/outreach/finance/siteAudit/calendar; claudeCode/mcpDeep/filesApi/cacheControl/project/routine/agentView; RU-пакет `metabolicService`/`maestroService`/`localTripleService`/`chemistService`/`analitikService`/`ruslanService`/`heisenbergService`/`agencyRuService`/`evoLabService`/`gigaStudioService`; synth-пакеты (sciAgents/sparks/aiScientist/latent/…); coding-агенты (pi/zed/warp/goose/continue/crush/codex/geminiCli/kilo/langfuse…).
- **P53-P65 capability/sim:** `capabilityResolver`, `agentFactory`, `bm25Service`, `rerankerService`, `hybridRetrievalService`, `toolCatalogService`, `executionVizService`, `deployBundleService`, `codeSandboxService`, `browserHarnessService`, `mcpHarnessService`, `scorerRegistryService`, `llmJudgeService`, `worldStateService`, `simulationEngineService`, `agentActAdapterService`, `councilMigrationService`.

## 2. Цепочка «ключ → провайдер → LLM» (для T1)
```
KeyService.getKeys()/selectFromPool()
 → KeyRegistry.keys[] (in-mem snapshot) → keyStore/Dexie apiKeys (localStorage canonical)
 → RouterService.getRankedProviders()/getDebateProviders()/resolveWithFallback()
 → ProbeService/KeyStateStore/Circuit/RateLimit gates
 → ProviderAdapterRegistry.getAdapter() → AdapterFactory.create()
 → Logging→Cache→Cost→PriorityQueue→CircuitBreaker→Retry→RateLimit→RawAdapter
 → adapter.sendMessage(msgs, model, apiKey, signal, opts)
```
Ключевые файлы: `key-management/key-service.ts`, `key-registry.ts`, `key-storage-hydrator.ts`, `provider-router.ts`, `router-ranking.ts`, `router-debate-selector.ts`, `provider-adapter-registry.ts`, `llm/registry/adapter-factory.ts:55-80,229-269`, `llm/decorators/*`, `llm/core/base-adapter.ts`.
Дефолты моделей: SSOT `kernel/utils/provider-default-models.ts`; копии — `probe-service.ts:22-38`, `debate-query-engine.ts:29-36` (DEBATE_MODEL_PRIORITY), `role-team-service.ts:467-472`, `config-registry.ts:90-96`, `key-models.ts:18-35`.

## 3. Входы по путям
- **Debate:** `debate-sync-manager.startDebate/startTopologyDebate` → `debate-engine.createSession` → `buildPipeline(preflight→roundLoop→consensusAndFinalize)` → `callLLM` → `debate-query-engine.resolveProvider` → `debate-llm-caller.adapter.sendMessage`. Preflight-проба: `debate-provider-preflight.ts:115`.
- **Teams:** `role-team-service.pickProviderAndKey` (random active key + `providerDefaults`, БЕЗ роутера) → `callRoleLLM → adapter.sendMessage`.
- **Chat:** `ChatPanel.handleSend` → `sendMessage([{provider:'auto',model,keyId}])` → `SEND_MESSAGE` → `chat-executor.handle→executeRequest` → `router.getRankedProviders` → `llmClientService.sendMessage` → adapter. Per-chat привязка уже есть: `session.currentProvider/currentModel/currentKeyId` (`stores/chat/*`, `ChatPanel:121,126,189`).
- **Council:** `council-service` (base) → декоратор `council-service-facade` (dual-write в DebateEngine).
- **Agents/roles:** `role-service` (CRUD+промпты), `unifiedRoleRegistry` (статика), `agent-generator` (NL→JSON агента), `agent-wizard/agentVersion/roleVersion/healthMonitor`.

## 4. Проверено для следующих этапов
- T1.2 (панель ротации): читать `keyService.getKeys()`, `adapterRegistry.getProviderRuntimeStatus()`, `keyStateStore`, `router-ranking` фильтры; писать настройки в config/keyValue.
- T1.3/T1.4 (привязка агента): смотреть `role-service` + потребителей `pickBestModel*` — override `keyId+model` до роутера.
- T2 (чаты): per-chat уже есть в store — доделать UI (селект модели) + глобальный дефолт в settings.
- T3.1 (RU-сиды): `src/data/` отсутствует — сиды класть в `src/data/` + снять заглушки (`debate-archetypes`, `debate-historical-figures`, `PersonaPickerPanel`, `RoleLibrary`, `role-team-service`, `unified-role-service`).
- T4 (opencode research): точки интеграции — `provider-adapter-registry` (вариант A) / `coordinationService`+Fleet (вариант B).

**STOP — T0.1 done. Дальше T0.2 (карта панелей).**
