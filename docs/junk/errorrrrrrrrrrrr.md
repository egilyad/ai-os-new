react-dom-client.development.js:28004 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
logger-service.ts:140 [15:04:44.494] INFO  [DatabaseService] No clean shutdown flag — possible crash, running integrity scan
logger-service.ts:140 [15:04:44.986] INFO  [DatabaseService] Migration v5→v6: table 'keyValue' indexes changed: [id] → [id, createdAt]
logger-service.ts:140 [15:04:44.987] INFO  [DatabaseService] Migration v10→v11: table 'debateSessions' indexes changed: [id, phase, updatedAt] → [id, phase, updatedAt, topic, folder, isArchived]
logger-service.ts:140 [15:04:45.009] INFO  [DatabaseService] Integrity auto-scan started {intervalMs=1800000}
logger-service.ts:140 [15:04:45.019] INFO  [Runtime] Storage initialized {hasStorageLayer=true, hasKeys=true, keysType=object, hasListKeys=true, storageBackend=dexie}
logger-service.ts:140 [15:04:45.020] INFO  [Bootstrap] Initializing Super-Agents OS Runtime...
logger-service.ts:140 [15:04:45.025] INFO  [Phase0EventBridge] EventBridge initialized
logger-service.ts:140 [15:04:45.055] INFO  [ExperimentEngine] init {count=0}
logger-service.ts:137 [15:04:45.158] WARN  [CompromiseWebhook] Webhook secret not configured — compromise detection is DISABLED. Set CONFIG.security.webhookSecret to enable.
(anonymous) @ logger-service.ts:137
logger-service.ts:140 [15:04:46.008] INFO  [DexieIdentity] [DEXIE_ANCHOR] first anchor set {source=database-service:singleton, instanceRef=SuperAgentsDB[super_agents_os_v4, tables=0, ], apiKeysCount=18}
logger-service.ts:140 [15:04:46.578] INFO  [KeyMigration] Migration already completed — skipping
logger-service.ts:140 [15:04:46.591] INFO  [DexieIdentity] [DEXIE_IDENTITY_WITH_COUNT] {source=bootstrap:step3, instanceRef=SuperAgentsDB[super_agents_os_v4, tables=0, ], sameAsGlobalThis=true, globalRef=SuperAgentsDB[super_agents_os_v4, tables=0, ], apiKeysCount=18, timestamp=1789657486591}
logger-service.ts:140 [15:04:46.633] INFO  [Bootstrap] Snapshot repo count {count=18}
logger-service.ts:140 [15:04:46.633] INFO  [BootstrapKeyInit] [BOOTSTRAP_SNAPSHOT_FINAL] count {value=18}
logger-service.ts:140 [15:04:46.634] INFO  [BootstrapKeyInit] [BOOTSTRAP_SNAPSHOT_SOURCE] {value=keystore}
logger-service.ts:140 [15:04:46.674] INFO  [DexieIdentity] [DEXIE_IDENTITY_WITH_COUNT] {source=key-storage-hydrator:start, instanceRef=SuperAgentsDB[super_agents_os_v4, tables=0, ], sameAsGlobalThis=true, globalRef=SuperAgentsDB[super_agents_os_v4, tables=0, ], apiKeysCount=18, timestamp=1789657486674}
logger-service.ts:140 [15:04:46.701] INFO  [KeyStorageHydrator] dexieKeys.length = 18 from instance [object Object]
key-registry.ts:179 [KEY_REGISTRY_OVERWRITE] Object
(anonymous) @ key-registry.ts:179
(anonymous) @ key-service.ts:367
(anonymous) @ key-storage-hydrator.ts:54
logger-service.ts:140 [15:04:46.713] INFO  [DexieIdentity] [DEXIE_IDENTITY_WITH_COUNT] {source=KeyRegistry.forceResyncFromDexie, instanceRef=SuperAgentsDB[super_agents_os_v4, tables=0, ], sameAsGlobalThis=true, globalRef=SuperAgentsDB[super_agents_os_v4, tables=0, ], apiKeysCount=18, timestamp=1789657486713}
logger-service.ts:140 [15:04:46.733] INFO  [KeyRegistry] [KEY_TRACE] loadDexie: 0 -> 18 {sample=[{"id":"1ba8e153-a49a-4d18-8203-a9e5fde0d031","provider":"openrouter","hasKey":true,"keyLen":202,"isEncrypted":false},{"id":"2665e799-9ee2-46c9-873d-fe8bb9c61e47","provider":"gemini","hasKey":true,"ke…, source=repo.getAll()}
logger-service.ts:140 [15:04:46.734] INFO  [KeyRegistry] [KEY_TRACE] normalize.map: 18 -> 18 {sample=[{"id":"1ba8e153-a49a-4d18-8203-a9e5fde0d031","provider":"openrouter","hasKey":true,"keyLen":202,"isEncrypted":false},{"id":"2665e799-9ee2-46c9-873d-fe8bb9c61e47","provider":"gemini","hasKey":true,"ke…}
logger-service.ts:140 [15:04:46.735] INFO  [KeyRegistry] [KEY_TRACE] filterValid: 18 -> 18 {sample=[{"id":"1ba8e153-a49a-4d18-8203-a9e5fde0d031","provider":"openrouter","hasKey":true,"keyLen":202,"isEncrypted":false},{"id":"2665e799-9ee2-46c9-873d-fe8bb9c61e47","provider":"gemini","hasKey":true,"ke…}
logger-service.ts:140 [15:04:46.736] INFO  [KeyRegistry] [KEY_TRACE] assign: 0 -> 18 {sample=[{"id":"1ba8e153-a49a-4d18-8203-a9e5fde0d031","provider":"openrouter","hasKey":true,"keyLen":202,"isEncrypted":false},{"id":"2665e799-9ee2-46c9-873d-fe8bb9c61e47","provider":"gemini","hasKey":true,"ke…}
logger-service.ts:140 [15:04:47.646] INFO  [DatabaseService] Startup integrity scan: all tables clean
logger-service.ts:140 [15:04:50.103] INFO  [EventRecorder] Recovered 19 events from WAL
logger-service.ts:140 [15:04:50.930] INFO  [DexieIdentity] [DEXIE_IDENTITY_WITH_COUNT] {source=KeyRegistry.loadKeys, instanceRef=SuperAgentsDB[super_agents_os_v4, tables=0, ], sameAsGlobalThis=true, globalRef=SuperAgentsDB[super_agents_os_v4, tables=0, ], apiKeysCount=18, timestamp=1789657490930}
logger-service.ts:140 [15:04:50.930] INFO  [KeyRegistry] using bootstrap snapshot ONLY, count: 18
logger-service.ts:140 [15:04:50.931] INFO  [KeyRegistry] [KEY_TRACE] bootstrap.normalize.map: 18 -> 18 {sample=[{"id":"1ba8e153-a49a-4d18-8203-a9e5fde0d031","provider":"openrouter","hasKey":true,"keyLen":202,"isEncrypted":false},{"id":"2665e799-9ee2-46c9-873d-fe8bb9c61e47","provider":"gemini","hasKey":true,"ke…}
logger-service.ts:140 [15:04:50.932] INFO  [KeyRegistry] [KEY_TRACE] bootstrap.filterValid: 18 -> 18 {sample=[{"id":"1ba8e153-a49a-4d18-8203-a9e5fde0d031","provider":"openrouter","hasKey":true,"keyLen":202,"isEncrypted":false},{"id":"2665e799-9ee2-46c9-873d-fe8bb9c61e47","provider":"gemini","hasKey":true,"ke…}
logger-service.ts:140 [15:04:50.938] INFO  [KeyRegistry] [KEY_TRACE] bootstrap.decrypt: 18 -> 18 {sample=[{"id":"1ba8e153-a49a-4d18-8203-a9e5fde0d031","provider":"openrouter","hasKey":true,"keyLen":73,"isEncrypted":false},{"id":"2665e799-9ee2-46c9-873d-fe8bb9c61e47","provider":"gemini","hasKey":true,"key…}
logger-service.ts:140 [15:04:50.939] INFO  [KeyRegistry] [KEY_TRACE] bootstrap.assign: 18 -> 18 {sample=[{"id":"1ba8e153-a49a-4d18-8203-a9e5fde0d031","provider":"openrouter","hasKey":true,"keyLen":73,"isEncrypted":false},{"id":"2665e799-9ee2-46c9-873d-fe8bb9c61e47","provider":"gemini","hasKey":true,"key…}
logger-service.ts:140 [15:04:51.094] INFO  [KeyLifecycle] Counters restored from DB {errorCount=8, successCount=8}
logger-service.ts:140 [15:04:51.330] INFO  [SRE Agent (AdvisorService) initialized with capability manager] [object Object]
logger-service.ts:140 [15:04:51.335] INFO  [init] [object Object]
logger-service.ts:140 [15:04:51.336] INFO  [init] [object Object]
logger-service.ts:140 [15:04:51.336] INFO  [init] [object Object]
logger-service.ts:140 [15:04:51.353] INFO  [QualityImpactCollector] init {metricsLoaded=6, historyLoaded=15, baselinesLoaded=0}
logger-service.ts:140 [15:04:51.354] INFO  [init] [object Object]
logger-service.ts:140 [15:04:51.355] INFO  [init] [object Object]
logger-service.ts:140 [15:04:51.355] INFO  [init] [object Object]
logger-service.ts:140 [15:04:51.360] INFO  [SchedulerService] Scheduler started
logger-service.ts:140 [15:04:51.361] INFO  [SchedulerService] Initialized with 0 schedules
logger-service.ts:140 [15:04:51.362] INFO  [Orchestrator] Mounted topology: Agent Workforce (v2.0.0)
logger-service.ts:140 [15:04:51.522] INFO  [Bootstrap] Group Manager synced existing keys
logger-service.ts:140 [15:04:51.527] INFO  [Bootstrap] KeyStateStore seeded with 18 key(s)
logger-service.ts:140 [15:04:51.529] INFO  [Bootstrap] DebateService initialized
logger-service.ts:140 [15:04:51.530] INFO  [Bootstrap] MemoryWatchdog pressure callbacks registered
logger-service.ts:140 [15:04:51.544] INFO  [CrossTabStateSync] Initialized with BroadcastChannel {tabId=mu5nuwsy-f888f3f1-75f9-4b22-b909-14b60bba0fb4}
index.ts:47 [i18n] missing translation key "nav.start_debate" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
index.ts:47 [i18n] missing translation key "info.dashboard" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
index.ts:47 [i18n] missing translation key "common.req_unit" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
logger-service.ts:140 [15:05:14.477] INFO  [Main] [Memory] heap: 98.4MB / 107.4MB
index.ts:47 [i18n] missing translation key "groupChat.title" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
index.ts:47 [i18n] missing translation key "groupChat.subtitle" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
index.ts:47 [i18n] missing translation key "groupChat.list.empty" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
index.ts:47 [i18n] missing translation key "groupChat.openPlaceholder" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
index.ts:47 [i18n] missing translation key "groupChat.open" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
logger-service.ts:140 [15:05:44.483] INFO  [Main] [Memory] heap: 96.3MB / 102.6MB
index.ts:47 [i18n] missing translation key "groupChat.create.heading" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
index.ts:47 [i18n] missing translation key "groupChat.namePlaceholder" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
index.ts:47 [i18n] missing translation key "groupChat.selection.auto" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
index.ts:47 [i18n] missing translation key "groupChat.selection.round_robin" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
index.ts:47 [i18n] missing translation key "groupChat.selection.manual" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
index.ts:47 [i18n] missing translation key "groupChat.create.submit" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
api.groq.com/openai/v1/chat/completions:1  Failed to load resource: the server responded with a status of 404 ()
logger.ts:20 [2026-09-17T15:06:11.840Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.3-70b-versatile failed after 2656ms Object
formatLog @ logger.ts:20
logger-service.ts:140 [15:06:14.477] INFO  [Main] [Memory] heap: 119.9MB / 154.1MB
logger-service.ts:140 [15:06:44.475] INFO  [Main] [Memory] heap: 121.4MB / 169.8MB
logger-service.ts:140 [15:07:14.479] INFO  [Main] [Memory] heap: 94.8MB / 133.1MB
logger-service.ts:140 [15:07:44.474] INFO  [Main] [Memory] heap: 95.1MB / 103.6MB
logger-service.ts:140 [15:08:14.484] INFO  [Main] [Memory] heap: 121.0MB / 138.5MB
index.ts:47 [i18n] missing translation key "chat.delete_session_aria" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
index.ts:47 [i18n] missing translation key "info.chat" (locale=en missing=true, en missing=true)
(anonymous) @ index.ts:47
logger-service.ts:140 [15:08:44.483] INFO  [Main] [Memory] heap: 101.9MB / 110.1MB
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
logger-service.ts:140 [15:09:14.473] INFO  [Main] [Memory] heap: 104.4MB / 128.0MB
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
logger-service.ts:140 [15:09:44.472] INFO  [Main] [Memory] heap: 130.6MB / 165.3MB
proxy/openrouter/api/v1/chat/completions:1  Failed to load resource: the server responded with a status of 402 (Payment Required)
logger.ts:20 [2026-09-17T15:09:52.101Z] ERROR [LoggingDecorator] openrouter[rl][cb][pq][cost] meta-llama/llama-3.1-8b-instruct failed after 590ms Object
formatLog @ logger.ts:20
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
api.groq.com/openai/v1/chat/completions:1  Failed to load resource: the server responded with a status of 404 ()
logger.ts:20 [2026-09-17T15:10:04.992Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] meta-llama/llama-4-maverick-17b-128e-instruct failed after 905ms Object
formatLog @ logger.ts:20
api.groq.com/openai/v1/chat/completions:1  Failed to load resource: the server responded with a status of 404 ()
logger.ts:20 [2026-09-17T15:10:05.554Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] meta-llama/llama-4-scout-17b-16e-instruct failed after 473ms Object
formatLog @ logger.ts:20
logger-service.ts:137 [15:10:05.686] WARN  [PricingService] Unknown model "meta-llama/llama-4-scout-17b-16e-instruct" — using fallback pricing
(anonymous) @ logger-service.ts:137
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
api.groq.com/openai/v1/chat/completions:1  Failed to load resource: the server responded with a status of 404 ()
logger.ts:20 [2026-09-17T15:10:09.398Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] meta-llama/llama-4-maverick-17b-128e-instruct failed after 128ms Object
formatLog @ logger.ts:20
api.groq.com/openai/v1/chat/completions:1  Failed to load resource: the server responded with a status of 404 ()
logger.ts:20 [2026-09-17T15:10:10.185Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] meta-llama/llama-4-scout-17b-16e-instruct failed after 703ms Object
formatLog @ logger.ts:20
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
proxy/nvidia/v1/chat/completions:1  Failed to load resource: the server responded with a status of 410 (Gone)
logger-service.ts:137 [15:10:11.709] WARN  [LlmHttpClient] [nvidia-nim] POST 410 body {body={"type":"about:blank","title":"Gone","status":410,"detail":"The model 'meta/llama-4-maverick-17b-128e-instruct' has reached its end of life on 2026-07-27T00:00:00Z and is no longer available."} }
(anonymous) @ logger-service.ts:137
logger.ts:20 [2026-09-17T15:10:11.711Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-4-maverick-17b-128e-instruct failed after 848ms Object
formatLog @ logger.ts:20
proxy/nvidia/v1/chat/completions:1  Failed to load resource: the server responded with a status of 404 (Not Found)
logger-service.ts:137 [15:10:12.370] WARN  [LlmHttpClient] [nvidia-nim] POST 404 body {body=404 page not found }
(anonymous) @ logger-service.ts:137
logger.ts:20 [2026-09-17T15:10:12.371Z] ERROR [LoggingDecorator] nvidia-nim[rl][cb][pq][cost] meta/llama-4-scout-17b-16e-instruct failed after 561ms Object
formatLog @ logger.ts:20
logger-service.ts:137 [15:10:12.484] WARN  [PricingService] Unknown model "meta/llama-4-scout-17b-16e-instruct" — using fallback pricing
(anonymous) @ logger-service.ts:137
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
logger-service.ts:137 [15:10:13.664] WARN  [ProbeService] Heap too high — aborting probe cycle {heapMB=187.8, keysRemaining=9, keysTested=9}
(anonymous) @ logger-service.ts:137
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
logger-service.ts:140 [15:10:14.477] INFO  [Main] [Memory] heap: 198.0MB / 294.2MB
logger-service.ts:140 [15:10:14.477] INFO  [Main] [Memory] Still alive after 5 minutes
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
logger-service.ts:140 [15:10:17.775] INFO  [ChatExecutor] Auto-routed to groq {requestId=chat-8a6c8b41-52b4-462a-b37e-70a83522bd44}
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
completions:1  Failed to load resource: the server responded with a status of 404 ()
logger.ts:20 [2026-09-17T15:10:18.918Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] gemini-2.5-flash stream failed after 963ms Object
formatLog @ logger.ts:20
logger-service.ts:137 [15:10:18.918] WARN  [ChatExecutor] Provider groq failed: 404 {"error":{"message":"The model `gemini-2.5-flash` does not exist or you do not have access to it.","type":"invalid_request_error","code":"model_not_found"}} {requestId=chat-8a6c8b41-52b4-462a-b37e-70a83522bd44, provider=groq}
(anonymous) @ logger-service.ts:137
logger-service.ts:134 [15:10:18.925] ERROR [ChatExecutor] Inflight request failed {cacheKey=cache_d6e7dd1b8dcc187b80b1703d69a90d4a, error=404 {"error":{"message":"The model `gemini-2.5-flash` does not exist or you do not have access to it.","type":"invalid_request_error","code":"model_not_found"}}}
(anonymous) @ logger-service.ts:134
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
logger-service.ts:137 [15:10:43.959] WARN  [ChatExecutor] Response blocked by security scan {requestId=chat-8a6c8b41-52b4-462a-b37e-70a83522bd44, score=10, summary=Blocked (score: 10/10): 1 injection, 1 dangerous}
(anonymous) @ logger-service.ts:137
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
logger-service.ts:140 [15:10:44.764] INFO  [Main] [Memory] heap: 241.1MB / 338.1MB
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
logger-service.ts:140 [15:10:50.292] INFO  [ChatExecutor] Auto-routed to groq {requestId=chat-73d5eba9-1ca9-405d-b0b2-075368231fdb}
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
completions:1  Failed to load resource: the server responded with a status of 404 ()
logger.ts:20 [2026-09-17T15:10:51.349Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] gemini-2.5-flash stream failed after 911ms Object
formatLog @ logger.ts:20
logger-service.ts:137 [15:10:51.350] WARN  [ChatExecutor] Provider groq failed: 404 {"error":{"message":"The model `gemini-2.5-flash` does not exist or you do not have access to it.","type":"invalid_request_error","code":"model_not_found"}} {requestId=chat-73d5eba9-1ca9-405d-b0b2-075368231fdb, provider=groq}
(anonymous) @ logger-service.ts:137
logger-service.ts:134 [15:10:51.354] ERROR [ChatExecutor] Inflight request failed {cacheKey=cache_d6e7dd1b8dcc187b80b1703d69a90d4a, error=404 {"error":{"message":"The model `gemini-2.5-flash` does not exist or you do not have access to it.","type":"invalid_request_error","code":"model_not_found"}}}
(anonymous) @ logger-service.ts:134
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
logger-service.ts:140 [15:11:15.978] INFO  [Main] [Memory] heap: 214.9MB / 340.2MB
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
logger-service.ts:137 [15:11:17.878] WARN  [ChatExecutor] Response blocked by security scan {requestId=chat-73d5eba9-1ca9-405d-b0b2-075368231fdb, score=10, summary=Blocked (score: 10/10): 1 injection, 2 dangerous}
(anonymous) @ logger-service.ts:137
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
logger-service.ts:140 [15:11:44.486] INFO  [Main] [Memory] heap: 110.8MB / 115.2MB
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
flushSyncWork$1 @ react-dom-client.development.js:16898
f @ react-dom-client.development.js:27521
(anonymous) @ react-dom.development.js:140
(anonymous) @ index.js:74
(anonymous) @ index.js:346
(anonymous) @ index.js:358
memoizedFunction @ utils.js:18
(anonymous) @ index.js:425
(anonymous) @ index.js:103
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
flushSyncWork$1 @ react-dom-client.development.js:16898
f @ react-dom-client.development.js:27521
(anonymous) @ react-dom.development.js:140
(anonymous) @ index.js:74
(anonymous) @ index.js:346
(anonymous) @ index.js:358
memoizedFunction @ utils.js:18
(anonymous) @ index.js:425
(anonymous) @ index.js:103
logger-service.ts:140 [15:12:16.535] INFO  [Main] [Memory] heap: 126.2MB / 142.7MB
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
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
(anonymous) @ insight-engine.ts:234
(anonymous) @ advisor-service.ts:257
(anonymous) @ advisor-service.ts:171
logger.ts:20 [2026-09-17T15:12:25.948Z] ERROR [LoggingDecorator] groq[rl][cb][pq][cost] llama-3.3-70b-versatile failed after 12619ms {error: '404 {"error":{"message":"The model `llama-3.3-70b-…invalid_request_error","code":"model_not_found"}}'}
formatLog @ logger.ts:20
(anonymous) @ logger.ts:37
(anonymous) @ logging-decorator.ts:32
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
logger-service.ts:140 [15:12:44.472] INFO  [Main] [Memory] heap: 122.9MB / 155.4MB
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5o1ntg-6cca0c6a-76d1-440e-ab92-ad4c3310b085`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
react-dom-client.development.js:6604 Encountered two children with the same key, `mu5mo6qy-79ecce93-6cab-42ca-8431-04b71304bbbb`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
(anonymous) @ react-dom-client.development.js:6604
runWithFiberInDEV @ react-dom-client.development.js:871
warnOnInvalidKey @ react-dom-client.development.js:6603
reconcileChildrenArray @ react-dom-client.development.js:6645
reconcileChildFibersImpl @ react-dom-client.development.js:6993
(anonymous) @ react-dom-client.development.js:7098
reconcileChildren @ react-dom-client.development.js:9702
beginWork @ react-dom-client.development.js:12126
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:17641
workLoopSync @ react-dom-client.development.js:17469
renderRootSync @ react-dom-client.development.js:17450
performWorkOnRoot @ react-dom-client.development.js:16504
performSyncWorkOnRoot @ react-dom-client.development.js:18972
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:18814
processRootScheduleInMicrotask @ react-dom-client.development.js:18853
(anonymous) @ react-dom-client.development.js:18991
