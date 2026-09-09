react-dom-client.development.js:28004 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
logger-service.ts:140 [07:36:10.975] INFO  [DatabaseService] No clean shutdown flag — possible crash, running integrity scan
logger-service.ts:140 [07:36:11.478] INFO  [DatabaseService] Migration v5→v6: table 'keyValue' indexes changed: [id] → [id, createdAt]
logger-service.ts:140 [07:36:11.479] INFO  [DatabaseService] Migration v10→v11: table 'debateSessions' indexes changed: [id, phase, updatedAt] → [id, phase, updatedAt, topic, folder, isArchived]
logger-service.ts:140 [07:36:11.487] INFO  [DatabaseService] Integrity auto-scan started {intervalMs=1800000}
logger-service.ts:140 [07:36:11.490] INFO  [Runtime] Storage initialized {hasStorageLayer=true, hasKeys=true, keysType=object, hasListKeys=true, storageBackend=dexie}
logger-service.ts:140 [07:36:11.491] INFO  [Bootstrap] Initializing Super-Agents OS Runtime...
logger-service.ts:140 [07:36:11.494] INFO  [Phase0EventBridge] EventBridge initialized
logger-service.ts:137 [07:36:11.544] WARN  [CompromiseWebhook] Webhook secret not configured — compromise detection is DISABLED. Set CONFIG.security.webhookSecret to enable.
(anonymous) @ logger-service.ts:137
logger-service.ts:140 [07:36:12.183] INFO  [DexieIdentity] [DEXIE_ANCHOR] first anchor set {source=database-service:singleton, instanceRef=SuperAgentsDB[super_agents_os_v4, tables=0, ], apiKeysCount=18}
logger-service.ts:140 [07:36:12.593] INFO  [DatabaseService] Startup integrity scan: all tables clean
logger-service.ts:140 [07:36:12.596] INFO  [KeyMigration] Migration already completed — skipping
logger-service.ts:140 [07:36:12.602] INFO  [DexieIdentity] [DEXIE_IDENTITY_WITH_COUNT] {source=bootstrap:step3, instanceRef=SuperAgentsDB[super_agents_os_v4, tables=0, ], sameAsGlobalThis=true, globalRef=SuperAgentsDB[super_agents_os_v4, tables=0, ], apiKeysCount=18, timestamp=1788939372602}
logger-service.ts:140 [07:36:12.611] INFO  [Bootstrap] Snapshot repo count {count=18}
logger-service.ts:140 [07:36:12.612] INFO  [BootstrapKeyInit] [BOOTSTRAP_SNAPSHOT_FINAL] count {value=18}
logger-service.ts:140 [07:36:12.612] INFO  [BootstrapKeyInit] [BOOTSTRAP_SNAPSHOT_SOURCE] {value=keystore}
logger-service.ts:140 [07:36:12.647] INFO  [DexieIdentity] [DEXIE_IDENTITY_WITH_COUNT] {source=key-storage-hydrator:start, instanceRef=SuperAgentsDB[super_agents_os_v4, tables=0, ], sameAsGlobalThis=true, globalRef=SuperAgentsDB[super_agents_os_v4, tables=0, ], apiKeysCount=18, timestamp=1788939372647}
logger-service.ts:140 [07:36:12.653] INFO  [KeyStorageHydrator] dexieKeys.length = 18 from instance [object Object]
key-registry.ts:179 [KEY_REGISTRY_OVERWRITE] Object
(anonymous) @ key-registry.ts:179
(anonymous) @ key-service.ts:367
(anonymous) @ key-storage-hydrator.ts:54
logger-service.ts:140 [07:36:12.660] INFO  [DexieIdentity] [DEXIE_IDENTITY_WITH_COUNT] {source=KeyRegistry.forceResyncFromDexie, instanceRef=SuperAgentsDB[super_agents_os_v4, tables=0, ], sameAsGlobalThis=true, globalRef=SuperAgentsDB[super_agents_os_v4, tables=0, ], apiKeysCount=18, timestamp=1788939372660}
logger-service.ts:140 [07:36:12.665] INFO  [KeyRegistry] [KEY_TRACE] loadDexie: 0 -> 18 {sample=[{"id":"1ba8e153-a49a-4d18-8203-a9e5fde0d031","provider":"openrouter","hasKey":true,"keyLen":202,"isEncrypted":false},{"id":"2665e799-9ee2-46c9-873d-fe8bb9c61e47","provider":"gemini","hasKey":true,"ke…, source=repo.getAll()}
logger-service.ts:140 [07:36:12.666] INFO  [KeyRegistry] [KEY_TRACE] normalize.map: 18 -> 18 {sample=[{"id":"1ba8e153-a49a-4d18-8203-a9e5fde0d031","provider":"openrouter","hasKey":true,"keyLen":202,"isEncrypted":false},{"id":"2665e799-9ee2-46c9-873d-fe8bb9c61e47","provider":"gemini","hasKey":true,"ke…}
logger-service.ts:140 [07:36:12.667] INFO  [KeyRegistry] [KEY_TRACE] filterValid: 18 -> 18 {sample=[{"id":"1ba8e153-a49a-4d18-8203-a9e5fde0d031","provider":"openrouter","hasKey":true,"keyLen":202,"isEncrypted":false},{"id":"2665e799-9ee2-46c9-873d-fe8bb9c61e47","provider":"gemini","hasKey":true,"ke…}
logger-service.ts:140 [07:36:12.668] INFO  [KeyRegistry] [KEY_TRACE] assign: 0 -> 18 {sample=[{"id":"1ba8e153-a49a-4d18-8203-a9e5fde0d031","provider":"openrouter","hasKey":true,"keyLen":202,"isEncrypted":false},{"id":"2665e799-9ee2-46c9-873d-fe8bb9c61e47","provider":"gemini","hasKey":true,"ke…}
logger-service.ts:140 [07:36:13.469] INFO  [EventRecorder] Recovered 0 events from WAL
logger-service.ts:140 [07:36:13.889] INFO  [DexieIdentity] [DEXIE_IDENTITY_WITH_COUNT] {source=KeyRegistry.loadKeys, instanceRef=SuperAgentsDB[super_agents_os_v4, tables=0, ], sameAsGlobalThis=true, globalRef=SuperAgentsDB[super_agents_os_v4, tables=0, ], apiKeysCount=18, timestamp=1788939373889}
logger-service.ts:140 [07:36:13.890] INFO  [KeyRegistry] using bootstrap snapshot ONLY, count: 18
logger-service.ts:140 [07:36:13.891] INFO  [KeyRegistry] [KEY_TRACE] bootstrap.normalize.map: 18 -> 18 {sample=[{"id":"1ba8e153-a49a-4d18-8203-a9e5fde0d031","provider":"openrouter","hasKey":true,"keyLen":202,"isEncrypted":false},{"id":"2665e799-9ee2-46c9-873d-fe8bb9c61e47","provider":"gemini","hasKey":true,"ke…}
logger-service.ts:140 [07:36:13.891] INFO  [KeyRegistry] [KEY_TRACE] bootstrap.filterValid: 18 -> 18 {sample=[{"id":"1ba8e153-a49a-4d18-8203-a9e5fde0d031","provider":"openrouter","hasKey":true,"keyLen":202,"isEncrypted":false},{"id":"2665e799-9ee2-46c9-873d-fe8bb9c61e47","provider":"gemini","hasKey":true,"ke…}
logger-service.ts:140 [07:36:13.897] INFO  [KeyRegistry] [KEY_TRACE] bootstrap.decrypt: 18 -> 18 {sample=[{"id":"1ba8e153-a49a-4d18-8203-a9e5fde0d031","provider":"openrouter","hasKey":true,"keyLen":73,"isEncrypted":false},{"id":"2665e799-9ee2-46c9-873d-fe8bb9c61e47","provider":"gemini","hasKey":true,"key…}
logger-service.ts:140 [07:36:13.898] INFO  [KeyRegistry] [KEY_TRACE] bootstrap.assign: 18 -> 18 {sample=[{"id":"1ba8e153-a49a-4d18-8203-a9e5fde0d031","provider":"openrouter","hasKey":true,"keyLen":73,"isEncrypted":false},{"id":"2665e799-9ee2-46c9-873d-fe8bb9c61e47","provider":"gemini","hasKey":true,"key…}
logger-service.ts:140 [07:36:13.933] INFO  [KeyLifecycle] Counters restored from DB {errorCount=6, successCount=10}
logger-service.ts:140 [07:36:13.965] INFO  [ExperimentEngine] init {count=0}
logger-service.ts:140 [07:36:14.001] INFO  [SRE Agent (AdvisorService) initialized with capability manager] [object Object]
logger-service.ts:140 [07:36:14.006] INFO  [init] [object Object]
logger-service.ts:140 [07:36:14.007] INFO  [init] [object Object]
logger-service.ts:140 [07:36:14.007] INFO  [init] [object Object]
logger-service.ts:140 [07:36:14.011] INFO  [init] [object Object]
logger-service.ts:140 [07:36:14.011] INFO  [init] [object Object]
logger-service.ts:140 [07:36:14.013] INFO  [SchedulerService] Scheduler started
logger-service.ts:140 [07:36:14.013] INFO  [SchedulerService] Initialized with 0 schedules
logger-service.ts:140 [07:36:14.014] INFO  [Orchestrator] Mounted topology: Agent Workforce (v2.0.0)
logger-service.ts:140 [07:36:14.017] INFO  [QualityImpactCollector] init {metricsLoaded=0, historyLoaded=0, baselinesLoaded=0}
logger-service.ts:140 [07:36:14.017] INFO  [init] [object Object]
logger-service.ts:140 [07:36:14.127] INFO  [Bootstrap] Group Manager synced existing keys
logger-service.ts:140 [07:36:14.130] INFO  [Bootstrap] KeyStateStore seeded with 18 key(s)
logger-service.ts:140 [07:36:14.131] INFO  [Bootstrap] DebateService initialized
logger-service.ts:140 [07:36:14.132] INFO  [Bootstrap] MemoryWatchdog pressure callbacks registered
logger-service.ts:140 [07:36:14.140] INFO  [CrossTabStateSync] Initialized with BroadcastChannel {tabId=mttsb8vj-47936a3a-1731-4520-b719-ed3e2ed3c70a}
index.ts:47 [i18n] missing translation key "nav.meta_learning" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
index.ts:47 [i18n] missing translation key "nav.quantum_inspiration" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
index.ts:47 [i18n] missing translation key "nav.start_debate" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
index.ts:47 [i18n] missing translation key "nav.scheduler" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
index.ts:47 [i18n] missing translation key "info.tools" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
logger-service.ts:140 [07:36:41.028] INFO  [Main] [Memory] heap: 86.8MB / 90.4MB
logger-service.ts:140 [07:37:10.965] INFO  [Main] [Memory] heap: 89.6MB / 100.3MB
logger-service.ts:140 [07:37:40.965] INFO  [Main] [Memory] heap: 94.4MB / 115.1MB
api.groq.com/openai/v1/chat/completions:1  Failed to load resource: the server responded with a status of 404 ()
logger.ts:20 [2026-09-09T07:37:51.520Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.3-70b-versatile failed after 1662ms Object
formatLog @ logger.ts:20
proxy/openrouter/api/v1/chat/completions:1  Failed to load resource: the server responded with a status of 402 (Payment Required)
logger.ts:20 [2026-09-09T07:37:52.367Z] ERROR [LoggingDecorator] openrouter[rl][cb][pq][cost] meta-llama/llama-3.1-8b-instruct failed after 844ms Object
formatLog @ logger.ts:20
proxy/nvidia/v1/chat/completions:1  Failed to load resource: the server responded with a status of 410 (Gone)
logger-service.ts:137 [07:37:53.727] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.3-70b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
logger.ts:20 [2026-09-09T07:37:53.728Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.3-70b-instruct failed after 1360ms Object
formatLog @ logger.ts:20
logger-service.ts:140 [07:38:10.966] INFO  [Main] [Memory] heap: 99.4MB / 136.5MB
logger-service.ts:140 [07:38:40.964] INFO  [Main] [Memory] heap: 92.6MB / 101.2MB
index.ts:47 [i18n] missing translation key "info.debate" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
index.ts:47 [i18n] missing translation key "nav.debate" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
logger-service.ts:140 [07:39:10.965] INFO  [Main] [Memory] heap: 90.2MB / 98.6MB
logger-service.ts:140 [07:39:40.975] INFO  [Main] [Memory] heap: 90.5MB / 97.1MB
logger-service.ts:140 [07:40:10.964] INFO  [Main] [Memory] heap: 94.1MB / 97.9MB
logger-service.ts:140 [07:40:16.466] INFO  [DebateSyncManager] Starting debate {topic=получение воды из воздуха на берегу, participants=10, strategy=round_robin, maxRounds=3}
DebatePanel.tsx:287 DEBATE START ERROR: Error: No active session after sync
    at DebateSyncManager._initEngineSession (debate-sync-manager.ts:430:29)
    at DebateSyncManager.startDebate (debate-sync-manager.ts:321:30)
    at handleStart (DebatePanel.tsx:272:49)
    at executeDispatch (react-dom-client.development.js:19116:9)
    at runWithFiberInDEV (react-dom-client.development.js:871:30)
    at processDispatchQueue (react-dom-client.development.js:19166:19)
    at react-dom-client.development.js:19767:9
    at batchedUpdates$1 (react-dom-client.development.js:3255:40)
    at dispatchEventForPluginEventSystem (react-dom-client.development.js:19320:7)
    at dispatchEvent (react-dom-client.development.js:23585:11)
(anonymous) @ DebatePanel.tsx:287
logger-service.ts:140 [07:40:40.965] INFO  [Main] [Memory] heap: 92.5MB / 99.6MB
logger-service.ts:140 [07:41:10.966] INFO  [Main] [Memory] heap: 92.4MB / 101.6MB
proxy/openrouter/api/v1/chat/completions:1  Failed to load resource: the server responded with a status of 402 (Payment Required)
logger.ts:20 [2026-09-09T07:41:14.981Z] ERROR [LoggingDecorator] openrouter[rl][cb][pq][cost] meta-llama/llama-3.1-8b-instruct failed after 859ms Object
formatLog @ logger.ts:20
proxy/gemini/v1beta/models/gemini-3.1-flash-lite:generateContent:1  Failed to load resource: the server responded with a status of 503 (Service Unavailable)
api.groq.com/openai/v1/chat/completions:1  Failed to load resource: the server responded with a status of 404 ()
logger.ts:20 [2026-09-09T07:41:32.324Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.3-70b-versatile failed after 405ms Object
formatLog @ logger.ts:20
api.groq.com/openai/v1/chat/completions:1  Failed to load resource: the server responded with a status of 404 ()
logger.ts:20 [2026-09-09T07:41:32.824Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.1-8b-instant failed after 465ms Object
formatLog @ logger.ts:20
logger-service.ts:140 [07:41:40.979] INFO  [Main] [Memory] heap: 126.7MB / 145.1MB
logger-service.ts:140 [07:41:40.979] INFO  [Main] [Memory] Still alive after 5 minutes
api.groq.com/openai/v1/chat/completions:1  Failed to load resource: the server responded with a status of 404 ()
logger.ts:20 [2026-09-09T07:41:43.570Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.3-70b-versatile failed after 273ms Object
formatLog @ logger.ts:20
api.groq.com/openai/v1/chat/completions:1  Failed to load resource: the server responded with a status of 404 ()
logger.ts:20 [2026-09-09T07:41:44.083Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.1-8b-instant failed after 489ms Object
formatLog @ logger.ts:20
proxy/nvidia/v1/chat/completions:1  Failed to load resource: the server responded with a status of 410 (Gone)
logger-service.ts:137 [07:41:45.373] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.1-8b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
logger.ts:20 [2026-09-09T07:41:45.375Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.1-8b-instruct failed after 707ms Object
formatLog @ logger.ts:20
proxy/nvidia/v1/chat/completions:1  Failed to load resource: the server responded with a status of 410 (Gone)
logger-service.ts:137 [07:41:46.270] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.3-70b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
logger.ts:20 [2026-09-09T07:41:46.271Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.3-70b-instruct failed after 869ms Object
formatLog @ logger.ts:20
logger-service.ts:137 [07:41:52.752] WARN  [PricingService] Unknown model "meta-llama/llama-3.1-8b-instruct" — using fallback pricing
(anonymous) @ logger-service.ts:137
proxy/openrouter/api/v1/chat/completions:1  Failed to load resource: the server responded with a status of 402 (Payment Required)
logger.ts:20 [2026-09-09T07:41:58.161Z] ERROR [LoggingDecorator] openrouter[rl][cb][pq][cost] meta-llama/llama-3.1-8b-instruct failed after 749ms Object
formatLog @ logger.ts:20
proxy/nvidia/v1/chat/completions:1  Failed to load resource: the server responded with a status of 410 (Gone)
logger-service.ts:137 [07:42:01.700] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.1-8b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
logger.ts:20 [2026-09-09T07:42:01.702Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.1-8b-instruct failed after 1112ms Object
formatLog @ logger.ts:20
proxy/nvidia/v1/chat/completions:1  Failed to load resource: the server responded with a status of 410 (Gone)
logger-service.ts:137 [07:42:02.250] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.3-70b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
logger.ts:20 [2026-09-09T07:42:02.251Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.3-70b-instruct failed after 519ms Object
formatLog @ logger.ts:20
proxy/nvidia/v1/chat/completions:1  Failed to load resource: the server responded with a status of 410 (Gone)
logger-service.ts:137 [07:42:03.609] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.1-8b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
logger.ts:20 [2026-09-09T07:42:03.610Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.1-8b-instruct failed after 465ms Object
formatLog @ logger.ts:20
proxy/nvidia/v1/chat/completions:1  Failed to load resource: the server responded with a status of 410 (Gone)
logger-service.ts:137 [07:42:04.196] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.3-70b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
logger.ts:20 [2026-09-09T07:42:04.197Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.3-70b-instruct failed after 561ms Object
formatLog @ logger.ts:20
api.groq.com/openai/v1/chat/completions:1  Failed to load resource: the server responded with a status of 404 ()
logger.ts:20 [2026-09-09T07:42:05.441Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.3-70b-versatile failed after 686ms Object
formatLog @ logger.ts:20
api.groq.com/openai/v1/chat/completions:1  Failed to load resource: the server responded with a status of 404 ()
logger.ts:20 [2026-09-09T07:42:05.981Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.1-8b-instant failed after 516ms Object
formatLog @ logger.ts:20
proxy/openrouter/api/v1/chat/completions:1  Failed to load resource: the server responded with a status of 402 (Payment Required)
logger.ts:20 [2026-09-09T07:42:07.695Z] ERROR [LoggingDecorator] openrouter[rl][cb][pq][cost] meta-llama/llama-3.1-8b-instruct failed after 1152ms Object
formatLog @ logger.ts:20
logger-service.ts:140 [07:42:10.968] INFO  [Main] [Memory] heap: 143.7MB / 197.4MB
logger-service.ts:140 [07:42:40.974] INFO  [Main] [Memory] heap: 96.4MB / 105.1MB
logger-service.ts:140 [07:43:10.964] INFO  [Main] [Memory] heap: 96.5MB / 105.9MB
logger-service.ts:140 [07:43:40.966] INFO  [Main] [Memory] heap: 101.1MB / 106.7MB
logger-service.ts:140 [07:44:10.973] INFO  [Main] [Memory] heap: 106.5MB / 121.1MB
logger-service.ts:140 [07:44:40.968] INFO  [Main] [Memory] heap: 91.4MB / 122.3MB
[NEW] Explain Console errors by using Copilot in Edge: click  to explain an error. Learn moreDon’t show again
logger-service.ts:140 [07:45:12.004] INFO  [Main] [Memory] heap: 83.8MB / 121.8MB
logger-service.ts:140 [07:45:40.965] INFO  [Main] [Memory] heap: 93.5MB / 124.1MB
logger-service.ts:137 [07:46:06.757] WARN  [DebatePersistence] saveSnapshot version=1 for debate-mttsgic8-99a0345c-2873-4d51-9436-fb5969f2633f phase=created round=0
(anonymous) @ logger-service.ts:137
(anonymous) @ logger-service.ts:97
(anonymous) @ debate-persistence-manager.ts:244
(anonymous) @ debate-engine.ts:709
(anonymous) @ debate-engine.ts:143
(anonymous) @ debate-engine.ts:151
logger-service.ts:140 [07:46:11.251] INFO  [Main] [Memory] heap: 105.6MB / 147.9MB
llm-http-client.ts:202  POST http://localhost:5173/proxy/openrouter/api/v1/chat/completions 402 (Payment Required)
(anonymous) @ llm-http-client.ts:202
await in (anonymous)
(anonymous) @ openrouter-adapter.ts:180
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:46:15.776Z] ERROR [LoggingDecorator] openrouter[rl][cb][pq][cost] meta-llama/llama-3.1-8b-instruct failed after 1483ms {error: 'Payment Required — add funds or check key'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
(anonymous) @ probe-service.ts:120
VM2183:2 Uncaught TypeError: Cannot read properties of undefined (reading 'startTime')
    at et.reportAllChanges (<anonymous>:2:19429)
    at <anonymous>:2:13070
    at <anonymous>:2:331
    at d (<anonymous>:2:6141)
    at <anonymous>:2:6326
    at <anonymous>:2:2895
    at n.timeout (<anonymous>:2:5652)
et.reportAllChanges @ VM2183:2
(anonymous) @ VM2183:2
(anonymous) @ VM2183:2
d @ VM2183:2
(anonymous) @ VM2183:2
(anonymous) @ VM2183:2
n.timeout @ VM2183:2
requestIdleCallback
x @ VM2183:2
g @ VM2183:2
(anonymous) @ VM2183:2
groq-adapter.ts:72  POST https://api.groq.com/openai/v1/chat/completions 404 (Not Found)
fetchWithTimeout @ client.mjs:311
makeRequest @ client.mjs:212
await in makeRequest
request @ client.mjs:184
methodRequest @ client.mjs:179
post @ client.mjs:167
create @ completions.mjs:5
(anonymous) @ groq-adapter.ts:72
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:46:32.318Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.3-70b-versatile failed after 4732ms {error: '404 {"error":{"message":"The model `llama-3.3-70b-…invalid_request_error","code":"model_not_found"}}'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
groq-adapter.ts:72  POST https://api.groq.com/openai/v1/chat/completions 404 (Not Found)
fetchWithTimeout @ client.mjs:311
makeRequest @ client.mjs:212
await in makeRequest
request @ client.mjs:184
methodRequest @ client.mjs:179
post @ client.mjs:167
create @ completions.mjs:5
(anonymous) @ groq-adapter.ts:72
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:46:33.358Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.1-8b-instant failed after 989ms {error: '404 {"error":{"message":"The model `llama-3.1-8b-i…invalid_request_error","code":"model_not_found"}}'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
groq-adapter.ts:72  POST https://api.groq.com/openai/v1/chat/completions 404 (Not Found)
fetchWithTimeout @ client.mjs:311
makeRequest @ client.mjs:212
await in makeRequest
request @ client.mjs:184
methodRequest @ client.mjs:179
post @ client.mjs:167
create @ completions.mjs:5
(anonymous) @ groq-adapter.ts:72
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:46:40.016Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.3-70b-versatile failed after 745ms {error: '404 {"error":{"message":"The model `llama-3.3-70b-…invalid_request_error","code":"model_not_found"}}'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
groq-adapter.ts:72  POST https://api.groq.com/openai/v1/chat/completions 404 (Not Found)
fetchWithTimeout @ client.mjs:311
makeRequest @ client.mjs:212
await in makeRequest
request @ client.mjs:184
methodRequest @ client.mjs:179
post @ client.mjs:167
create @ completions.mjs:5
(anonymous) @ groq-adapter.ts:72
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:46:40.937Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.1-8b-instant failed after 873ms {error: '404 {"error":{"message":"The model `llama-3.1-8b-i…invalid_request_error","code":"model_not_found"}}'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger-service.ts:140 [07:46:41.100] INFO  [Main] [Memory] heap: 124.4MB / 162.4MB
llm-http-client.ts:202  POST http://localhost:5173/proxy/nvidia/v1/chat/completions 410 (Gone)
(anonymous) @ llm-http-client.ts:202
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger-service.ts:137 [07:46:43.392] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.1-8b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
(anonymous) @ logger-service.ts:97
(anonymous) @ llm-http-client.ts:261
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:46:43.394Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.1-8b-instruct failed after 1642ms {error: 'HTTP 410: {"type":"about:blank","title":"Gone","st…26-08-26T09:00:00Z and is no longer available."}\n'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
llm-http-client.ts:202  POST http://localhost:5173/proxy/nvidia/v1/chat/completions 410 (Gone)
(anonymous) @ llm-http-client.ts:202
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger-service.ts:137 [07:46:44.528] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.3-70b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
(anonymous) @ logger-service.ts:97
(anonymous) @ llm-http-client.ts:261
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:46:44.529Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.3-70b-instruct failed after 1033ms {error: 'HTTP 410: {"type":"about:blank","title":"Gone","st…26-08-26T09:00:00Z and is no longer available."}\n'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
llm-http-client.ts:202  POST http://localhost:5173/proxy/openrouter/api/v1/chat/completions 402 (Payment Required)
(anonymous) @ llm-http-client.ts:202
await in (anonymous)
(anonymous) @ openrouter-adapter.ts:180
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:46:55.646Z] ERROR [LoggingDecorator] openrouter[rl][cb][pq][cost] meta-llama/llama-3.1-8b-instruct failed after 1023ms {error: 'Payment Required — add funds or check key'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
llm-http-client.ts:202  POST http://localhost:5173/proxy/nvidia/v1/chat/completions 410 (Gone)
(anonymous) @ llm-http-client.ts:202
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger-service.ts:137 [07:46:58.835] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.1-8b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
(anonymous) @ logger-service.ts:97
(anonymous) @ llm-http-client.ts:261
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:46:58.838Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.1-8b-instruct failed after 635ms {error: 'HTTP 410: {"type":"about:blank","title":"Gone","st…26-08-26T09:00:00Z and is no longer available."}\n'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
llm-http-client.ts:202  POST http://localhost:5173/proxy/nvidia/v1/chat/completions 410 (Gone)
(anonymous) @ llm-http-client.ts:202
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger-service.ts:137 [07:46:59.923] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.3-70b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
(anonymous) @ logger-service.ts:97
(anonymous) @ llm-http-client.ts:261
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:46:59.927Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.3-70b-instruct failed after 1045ms {error: 'HTTP 410: {"type":"about:blank","title":"Gone","st…26-08-26T09:00:00Z and is no longer available."}\n'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
llm-http-client.ts:202  POST http://localhost:5173/proxy/nvidia/v1/chat/completions 410 (Gone)
(anonymous) @ llm-http-client.ts:202
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger-service.ts:137 [07:47:01.355] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.1-8b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
(anonymous) @ logger-service.ts:97
(anonymous) @ llm-http-client.ts:261
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:47:01.357Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.1-8b-instruct failed after 828ms {error: 'HTTP 410: {"type":"about:blank","title":"Gone","st…26-08-26T09:00:00Z and is no longer available."}\n'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
llm-http-client.ts:202  POST http://localhost:5173/proxy/nvidia/v1/chat/completions 410 (Gone)
(anonymous) @ llm-http-client.ts:202
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger-service.ts:137 [07:47:02.019] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.3-70b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
(anonymous) @ logger-service.ts:97
(anonymous) @ llm-http-client.ts:261
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:47:02.021Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.3-70b-instruct failed after 628ms {error: 'HTTP 410: {"type":"about:blank","title":"Gone","st…26-08-26T09:00:00Z and is no longer available."}\n'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
groq-adapter.ts:72  POST https://api.groq.com/openai/v1/chat/completions 404 (Not Found)
fetchWithTimeout @ client.mjs:311
makeRequest @ client.mjs:212
await in makeRequest
request @ client.mjs:184
methodRequest @ client.mjs:179
post @ client.mjs:167
create @ completions.mjs:5
(anonymous) @ groq-adapter.ts:72
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:47:03.291Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.3-70b-versatile failed after 472ms {error: '404 {"error":{"message":"The model `llama-3.3-70b-…invalid_request_error","code":"model_not_found"}}'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
groq-adapter.ts:72  POST https://api.groq.com/openai/v1/chat/completions 404 (Not Found)
fetchWithTimeout @ client.mjs:311
makeRequest @ client.mjs:212
await in makeRequest
request @ client.mjs:184
methodRequest @ client.mjs:179
post @ client.mjs:167
create @ completions.mjs:5
(anonymous) @ groq-adapter.ts:72
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:47:03.747Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.1-8b-instant failed after 417ms {error: '404 {"error":{"message":"The model `llama-3.1-8b-i…invalid_request_error","code":"model_not_found"}}'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
llm-http-client.ts:202  POST http://localhost:5173/proxy/openrouter/api/v1/chat/completions 402 (Payment Required)
(anonymous) @ llm-http-client.ts:202
await in (anonymous)
(anonymous) @ openrouter-adapter.ts:180
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:47:08.884Z] ERROR [LoggingDecorator] openrouter[rl][cb][pq][cost] meta-llama/llama-3.1-8b-instruct failed after 4253ms {error: 'Payment Required — add funds or check key'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger-service.ts:140 [07:47:10.976] INFO  [Main] [Memory] heap: 134.5MB / 186.8MB
logger-service.ts:140 [07:47:10.977] INFO  [Main] [Memory] Still alive after 5 minutes
logger-service.ts:140 [07:47:40.969] INFO  [Main] [Memory] heap: 136.4MB / 194.5MB
logger-service.ts:140 [07:48:10.971] INFO  [Main] [Memory] heap: 155.3MB / 198.9MB
logger-service.ts:140 [07:48:40.983] INFO  [Main] [Memory] heap: 91.6MB / 101.1MB
logger-service.ts:140 [07:49:10.974] INFO  [Main] [Memory] heap: 96.4MB / 110.5MB
logger-service.ts:140 [07:49:40.965] INFO  [Main] [Memory] heap: 90.7MB / 122.2MB
logger-service.ts:140 [07:50:10.976] INFO  [Main] [Memory] heap: 93.6MB / 124.7MB
logger-service.ts:140 [07:50:40.974] INFO  [Main] [Memory] heap: 106.3MB / 132.6MB
logger-service.ts:140 [07:51:10.976] INFO  [Main] [Memory] heap: 106.6MB / 152.7MB
llm-http-client.ts:202  POST http://localhost:5173/proxy/openrouter/api/v1/chat/completions 402 (Payment Required)
(anonymous) @ llm-http-client.ts:202
await in (anonymous)
(anonymous) @ openrouter-adapter.ts:180
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:51:15.167Z] ERROR [LoggingDecorator] openrouter[rl][cb][pq][cost] meta-llama/llama-3.1-8b-instruct failed after 1026ms {error: 'Payment Required — add funds or check key'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
(anonymous) @ probe-service.ts:120
groq-adapter.ts:72  POST https://api.groq.com/openai/v1/chat/completions 404 (Not Found)
fetchWithTimeout @ client.mjs:311
makeRequest @ client.mjs:212
await in makeRequest
request @ client.mjs:184
methodRequest @ client.mjs:179
post @ client.mjs:167
create @ completions.mjs:5
(anonymous) @ groq-adapter.ts:72
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:51:22.715Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.3-70b-versatile failed after 727ms {error: '404 {"error":{"message":"The model `llama-3.3-70b-…invalid_request_error","code":"model_not_found"}}'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
groq-adapter.ts:72  POST https://api.groq.com/openai/v1/chat/completions 404 (Not Found)
fetchWithTimeout @ client.mjs:311
makeRequest @ client.mjs:212
await in makeRequest
request @ client.mjs:184
methodRequest @ client.mjs:179
post @ client.mjs:167
create @ completions.mjs:5
(anonymous) @ groq-adapter.ts:72
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:51:23.346Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.1-8b-instant failed after 575ms {error: '404 {"error":{"message":"The model `llama-3.1-8b-i…invalid_request_error","code":"model_not_found"}}'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
groq-adapter.ts:72  POST https://api.groq.com/openai/v1/chat/completions 404 (Not Found)
fetchWithTimeout @ client.mjs:311
makeRequest @ client.mjs:212
await in makeRequest
request @ client.mjs:184
methodRequest @ client.mjs:179
post @ client.mjs:167
create @ completions.mjs:5
(anonymous) @ groq-adapter.ts:72
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:51:29.946Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.3-70b-versatile failed after 675ms {error: '404 {"error":{"message":"The model `llama-3.3-70b-…invalid_request_error","code":"model_not_found"}}'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
groq-adapter.ts:72  POST https://api.groq.com/openai/v1/chat/completions 404 (Not Found)
fetchWithTimeout @ client.mjs:311
makeRequest @ client.mjs:212
await in makeRequest
request @ client.mjs:184
methodRequest @ client.mjs:179
post @ client.mjs:167
create @ completions.mjs:5
(anonymous) @ groq-adapter.ts:72
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:51:30.550Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.1-8b-instant failed after 499ms {error: '404 {"error":{"message":"The model `llama-3.1-8b-i…invalid_request_error","code":"model_not_found"}}'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
llm-http-client.ts:202  POST http://localhost:5173/proxy/nvidia/v1/chat/completions 410 (Gone)
(anonymous) @ llm-http-client.ts:202
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger-service.ts:137 [07:51:32.462] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.1-8b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
(anonymous) @ logger-service.ts:97
(anonymous) @ llm-http-client.ts:261
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:51:32.464Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.1-8b-instruct failed after 1078ms {error: 'HTTP 410: {"type":"about:blank","title":"Gone","st…26-08-26T09:00:00Z and is no longer available."}\n'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
llm-http-client.ts:202  POST http://localhost:5173/proxy/nvidia/v1/chat/completions 410 (Gone)
(anonymous) @ llm-http-client.ts:202
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger-service.ts:137 [07:51:33.319] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.3-70b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
(anonymous) @ logger-service.ts:97
(anonymous) @ llm-http-client.ts:261
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:51:33.321Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.3-70b-instruct failed after 815ms {error: 'HTTP 410: {"type":"about:blank","title":"Gone","st…26-08-26T09:00:00Z and is no longer available."}\n'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger-service.ts:140 [07:51:40.993] INFO  [Main] [Memory] heap: 137.1MB / 182.2MB
llm-http-client.ts:202  POST http://localhost:5173/proxy/openrouter/api/v1/chat/completions 402 (Payment Required)
(anonymous) @ llm-http-client.ts:202
await in (anonymous)
(anonymous) @ openrouter-adapter.ts:180
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
logger.ts:20 [2026-09-09T07:51:46.600Z] ERROR [LoggingDecorator] openrouter[rl][cb][pq][cost] meta-llama/llama-3.1-8b-instruct failed after 944ms {error: 'Payment Required — add funds or check key'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
await in (anonymous)
(anonymous) @ probe-service.ts:120
llm-http-client.ts:202  POST http://localhost:5173/proxy/nvidia/v1/chat/completions 410 (Gone)
(anonymous) @ llm-http-client.ts:202
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
logger-service.ts:137 [07:51:59.039] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.1-8b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
(anonymous) @ logger-service.ts:97
(anonymous) @ llm-http-client.ts:261
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
logger.ts:20 [2026-09-09T07:51:59.040Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.1-8b-instruct failed after 751ms {error: 'HTTP 410: {"type":"about:blank","title":"Gone","st…26-08-26T09:00:00Z and is no longer available."}\n'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
llm-http-client.ts:202  POST http://localhost:5173/proxy/nvidia/v1/chat/completions 410 (Gone)
(anonymous) @ llm-http-client.ts:202
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
logger-service.ts:137 [07:51:59.604] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.3-70b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
(anonymous) @ logger-service.ts:97
(anonymous) @ llm-http-client.ts:261
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
logger.ts:20 [2026-09-09T07:51:59.606Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.3-70b-instruct failed after 525ms {error: 'HTTP 410: {"type":"about:blank","title":"Gone","st…26-08-26T09:00:00Z and is no longer available."}\n'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
llm-http-client.ts:202  POST http://localhost:5173/proxy/nvidia/v1/chat/completions 410 (Gone)
(anonymous) @ llm-http-client.ts:202
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
logger-service.ts:137 [07:52:01.146] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.1-8b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
(anonymous) @ logger-service.ts:97
(anonymous) @ llm-http-client.ts:261
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
logger.ts:20 [2026-09-09T07:52:01.149Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.1-8b-instruct failed after 619ms {error: 'HTTP 410: {"type":"about:blank","title":"Gone","st…26-08-26T09:00:00Z and is no longer available."}\n'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
llm-http-client.ts:202  POST http://localhost:5173/proxy/nvidia/v1/chat/completions 410 (Gone)
(anonymous) @ llm-http-client.ts:202
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
logger-service.ts:137 [07:52:02.083] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-3.3-70b-instruct' has reached its end of life on 2026-08-26T09:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
(anonymous) @ logger-service.ts:97
(anonymous) @ llm-http-client.ts:261
await in (anonymous)
(anonymous) @ nvidia-nim-adapter.ts:102
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
logger.ts:20 [2026-09-09T07:52:02.086Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-3.3-70b-instruct failed after 896ms {error: 'HTTP 410: {"type":"about:blank","title":"Gone","st…26-08-26T09:00:00Z and is no longer available."}\n'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
groq-adapter.ts:72  POST https://api.groq.com/openai/v1/chat/completions 404 (Not Found)
fetchWithTimeout @ client.mjs:311
makeRequest @ client.mjs:212
await in makeRequest
request @ client.mjs:184
methodRequest @ client.mjs:179
post @ client.mjs:167
create @ completions.mjs:5
(anonymous) @ groq-adapter.ts:72
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
logger.ts:20 [2026-09-09T07:52:07.461Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.3-70b-versatile failed after 4768ms {error: '404 {"error":{"message":"The model `llama-3.3-70b-…invalid_request_error","code":"model_not_found"}}'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
groq-adapter.ts:72  POST https://api.groq.com/openai/v1/chat/completions 404 (Not Found)
fetchWithTimeout @ client.mjs:311
makeRequest @ client.mjs:212
await in makeRequest
request @ client.mjs:184
methodRequest @ client.mjs:179
post @ client.mjs:167
create @ completions.mjs:5
(anonymous) @ groq-adapter.ts:72
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
logger.ts:20 [2026-09-09T07:52:08.510Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.1-8b-instant failed after 988ms {error: '404 {"error":{"message":"The model `llama-3.1-8b-i…invalid_request_error","code":"model_not_found"}}'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
await in (anonymous)
(anonymous) @ probe-service.ts:473
logger-service.ts:140 [07:52:10.978] INFO  [Main] [Memory] heap: 171.3MB / 241.7MB
llm-http-client.ts:202  POST http://localhost:5173/proxy/openrouter/api/v1/chat/completions 402 (Payment Required)
(anonymous) @ llm-http-client.ts:202
await in (anonymous)
(anonymous) @ openrouter-adapter.ts:180
(anonymous) @ base-adapter.ts:94
(anonymous) @ rate-limit-decorator.ts:155
await in (anonymous)
(anonymous) @ retry-decorator.ts:92
(anonymous) @ circuit-breaker.ts:385
(anonymous) @ circuit-breaker.ts:208
(anonymous) @ circuit-breaker.ts:384
(anonymous) @ priority-queue.ts:108
(anonymous) @ priority-queue.ts:101
(anonymous) @ priority-queue.ts:248
(anonymous) @ priority-queue.ts:225
(anonymous) @ cost-manager.ts:197
(anonymous) @ cache-decorator.ts:254
await in (anonymous)
(anonymous) @ logging-decorator.ts:24
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
logger.ts:20 [2026-09-09T07:52:11.341Z] ERROR [LoggingDecorator] openrouter[rl][cb][pq][cost] meta-llama/llama-3.1-8b-instruct failed after 2190ms {error: 'Payment Required — add funds or check key'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
await in (anonymous)
(anonymous) @ probe-service.ts:218
(anonymous) @ probe-service.ts:473
logger-service.ts:140 [07:52:40.969] INFO  [Main] [Memory] heap: 169.8MB / 240.2MB
logger-service.ts:140 [07:52:40.999] INFO  [Main] [Memory] Still alive after 5 minutes
