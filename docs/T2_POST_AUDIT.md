# T2 POST Audit — Чаты: ключ + модель (глобальный дефолт + override на чат)

> Дата: 2026-09-09. Scope: settings-поля + ChatPanel wire. Селекты на ключ/модель уже были.

## Что было
- Селекты ключа (pills) и модели на ключ (dropdown) уже существовали, но выбор жил только в локальном state — при смене сессии слетал.
- Дефолт всегда «первый активный ключ», поменять нельзя.
- Store- API (`switchModel/switchKey/getSessionConfig` + `current*` на сессии) существовало, но UI его не вызывал.

## Что сделано
1. **Контракт `settings.ts`**: `chatDefaultProvider?/chatDefaultModel?/chatDefaultKeyId?` (опциональные).
2. **`settings-service.ts`**: validateSettings passthrough + заодно пофикшен мёртвый `llama-3.3-70b-versatile` в `fallbackChains.free_first` → maverick.
3. **GeneralTab**: секция Default chat provider/key/model (key только при провайдере, модель из SSOT).
4. **ChatPanel**:
   - Init: `chatDefaultKeyId` (если активен) → `chatDefaultProvider` → первый ключ; модель `chatDefaultModel` → `availableModels[0]` → `DEFAULT_MODELS`.
   - Restore: `useEffect` на `activeSessionId` читает `getSessionConfig()` → восстанавливает keys/model/perKey.
   - Persist: смена ключей → `switchKey(first)`; смена модели → `switchModel(provider, model)` (штатные system-entry + контекстные варнинги сохраняются).

## Проверки (static)
| Check | Evidence | Result |
|-------|----------|--------|
| Поля опциональны | старые сохранения без них валидны (deepMerge) | ✅ |
| Validate пропускает | passthrough String() | ✅ |
| `useKeyStore` в GeneralTab | тот же хук что ChatInputArea | ✅ |
| Restore не пишет | только setState, без switch* | ✅ (без петель) |
| Persist через существующее API | switchKey/switchModel уже персистят + варнят | ✅ |
| Контракты стора/таблицы | не тронуты | ✅ |

## Как проверить
1. Settings → General → Default chat provider/key/model → сохранить → новый чат стартует с них.
2. В чате А сменить ключ/модель → уйти в чат Б → вернуться в А → выбор на месте.
3. Два чата одновременно на разных ключах.

**STOP — T2 done. Дальше T3.1 (RU-сиды) только по GO.**
