# Спецификация: Безопасность агентов (карта соответствия OWASP)

> Статус: анализ + план. Приоритет: P0/P1. Связано: `ROADMAP_07`, `SPEC_08`, `ROADMAP_05`.
> Источник: OWASP Top 10 LLM 2025, OWASP Agentic Security / Agentic Applications 2026, ACS, secure MCP guide.

---

## 1. Карта соответствия (что уже закрыто, что открыто)

| Риск OWASP                             | Уже закрыто у нас                               | Остаётся открытым                                                                                          |
| -------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| LLM01 Prompt Injection                 | sanitize, SSRF-guard, allowlist, approval-флоу  | **Indirect-инъекции** через веб-контент/RAG (нужна сегрегация недоверенного контента); регулярный red team |
| LLM02 Sensitive Information Disclosure | PII-redact (трейсы/память/чат/инструменты/логи) | Проверить redact на **выводе** и в extern-API; политика opt-out обучения                                   |
| LLM03 Supply Chain                     | sandbox                                         | SBOM/AI-BOM, проверка источника моделей/датасетов/MCP-серверов                                             |
| LLM04 Data/Model Poisoning             | sandbox                                         | Происхождение данных (DVC), red team, мониторинг                                                           |
| LLM05 Improper Output Handling         | sanitize, CSP (если строгая)                    | Контекстное кодирование; рендер как текста; запрет `unsafe-eval`; параметризованные запросы                |
| LLM06 Excessive Agency                 | approval-флоу, allowlist, least privilege       | Нет open-ended инструментов (shell/fetch URL); complete mediation на downstream; контекст пользователя     |
| LLM07 System Prompt Leakage            | —                                               | **Не хранить секреты/роли в system prompt**; guardrails вне модели                                         |
| LLM08 Vector/Embedding                 | SSRF-guard                                      | Санитизация/права на чанках RAG; контроль инъекций через извлечённый контент                               |
| LLM09 Misinformation                   | grounding/факт-чек частично                     | Grounding+цитаты, ограничение доверия; анти-галлюцинация                                                   |
| LLM10 Unbounded Consumption            | —                                               | **Rate-limiting + лимит итераций агента** (cost/время)                                                     |

## 2. Приоритетные меры

### 2.1 P0 (немедленно)

1. **Строгая CSP** + рендер вывода как текста (запрет `unsafe-inline/unsafe-eval`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors`). Прямо закрывает XSS (LLM05) и эксфильтрацию через изображения/markdown.
2. **Не хранить секреты/роли в system prompt** (LLM07): перенести контроль поведения в независимые guardrails/политики (вне модели).
3. **Лимит итераций + rate-limiting** для агентов/дебатов (LLM10): стоим-limit, токены, время, число раундов (частично есть через DebateBudget — распространить на все агентные циклы).
4. **Сегрегация недоверенного контента** (LLM01): в RAG/веб-контенте отделять «инструкции» от «данных» (обёртка `<external_data>`, уже частично есть), не смешивать с system prompt.

### 2.2 P1

5. **Модерация изображений** (CSAM и пр.) — внешний сервис или локалая модель (см. `ROADMAP_07`).
6. **Complete mediation**: иде авторизация на downstream (вызов инструмента/доступ) проходит через `IAuthorizationService` (SPEC_08), включая MCP.
7. **Аудит инструментов** (tool-calls) — единый `AuditService` + логирование «кто что сделал» с контекстом.
8. **Assessment против инъекций**: adversarial-тесты (prompt injection через датасет), red team запуск.

### 2.3 P2

9. **AI-BOM/SBOM**: фиксировать версии моделей/датасетов/плагинов (CycloneDX-совместимо).
10. **Trust-модель для плагинов** (SPEC_06): permissions по принципу минимальных привилегий; подпись артефактов.

## 3. Интеграция с существующим

- `PolicyService` / `GovernanceService` / `AgentPermissionService` → сводить к `IAuthorizationService` (SPEC_08), который и будет точкой enforcement.
- `GuardrailService` — расширить на «не выводить секреты» (LLM07) и «не повторять инструкции» (LLM01).
- `pii-redact.ts` — проверить, что применяется и к выводу, и к API-ответам.

## 4. Тесты (обязательно)

- CSP: нет `unsafe-inline/eval`; XSS-попытки через markdown блокируются.
- System prompt: grep-проверка — ключи/токены/роли не попадают в промпт.
- Итерации: агент с бесконечным циклом останавливается лимитом.
- Indirect injection: файл/страница с инструкцией «игнорируй всё» не меняет поведение.
- Red team: стандартный набор атак (prompt injection, exfiltration) → без пропусков.

## 5. Definition of Done

- CSP строгая; секреты не в system prompt; лимиты итераций работают; сегрегация контента RAG; авторизация complete mediation; тесты security зелёные.
