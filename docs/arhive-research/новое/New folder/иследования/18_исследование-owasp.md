# Исследование: OWASP — безопасность LLM-приложений и агентов

Источники: genai.owasp.org/llm-top-10, Agentic Security Initiative, Agentic Applications 2026, Agent Control Standard (ACS), secure MCP guide.

## (а) OWASP Top 10 LLM Applications 2025

| #     | Риск                             | Суть                                                                            | Ключевые контрмеры                                                                                        |
| ----- | -------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| LLM01 | Prompt Injection                 | внешний ввод меняет поведение; прямая и непрямая (indirect через веб/файлы/RAG) | ограничение system prompt, сегрегация недоверенного контента, валидация, least privilege, HITL, RAG Triad |
| LLM02 | Sensitive Information Disclosure | утечка PII/секретов/проприетарного                                              | санитизация PII, least privilege, redaction, политика opt-out                                             |
| LLM03 | Supply Chain                     | уязвимости в цепочке (модели/датасеты/плагины/MCP)                              | SBOM/AI-BOM, проверка хэшей, сканирование, изоляция                                                       |
| LLM04 | Data/Model Poisoning             | отравление данных/эмбеддингов, бэкдоры                                          | трекинг происхождения, sandbox, red team, мониторинг                                                      |
| LLM05 | Improper Output Handling         | невалидный вывод → XSS/SQLi/SSRF/RCE                                            | zero-trust к выводу, контекстное кодирование, строгая CSP                                                 |
| LLM06 | Excessive Agency                 | избыточный функционал/разрешения/автономия                                      | минимальные плагины/права, OAuth-контекст, approval, complete mediation                                   |
| LLM07 | System Prompt Leakage            | утечка системного промпта                                                       | не хранить секреты в промпте, guardrails вне модели                                                       |
| LLM08 | Vector/Embedding Weaknesses      | уязвимости RAG                                                                  | санитизация такиханков, права на уровне чанков, валидация извлечённого                                    |
| LLM09 | Misinformation                   | галлюцинации, overreliance                                                      | grounding (RAG, цитаты), проверка фактов, ограничение доверия                                             |
| LLM10 | Unbounded Consumption            | неограниченное потребление ресурсов                                             | rate-limiting, лимиты токенов/стоимости/времени, квоты итераций                                           |

## (б) Агентные риски (OWASP Agentic 2026 / ACS)

- Excessive agency (LLM06 усилен): excessive functionality/permissions/autonomy.
- Tool poisoning — компрометация инструмента/плагина/MCP.
- Memory poisoning — отравление памяти/контекста агента.
- Goal manipulation — подмена задачи, эксфильтрация.
- Неправильные/избыточные разрешения — нет complete mediation.
- Insecure MCP/tool-протоколы.
- Agent impersonation/spoofing.
- Unbounded agent loops — DoS/финпотери.

## (в) Чек-лист для браузерного/локального приложения

Инфраструктура: sandbox/изоляция; SSRF-guard (блок private IP/129.254.169.254, DNS-rebinding); allowlist инструментов; ключи не в коде/DOM.
Браузер: строгая CSP (без unsafe-inline/eval, base-uri, object-src none); анти-эксфильтрация (запрет произвольных URL/изображений, connect-src); санитизация вывода (рендер как текста); PII-redact на входе/выходе.
Права: least privilege; approval для необратимых действий; ограничение внешних источников RAG.
Мониторинг: rate-limiting/лимит итераций; аудит инструментов; red-teaming.

## (г) Карта соответствия для нашего приложения

| Риск     | Уже закрыто                               | Открыто                                                   |
| -------- | ----------------------------------------- | --------------------------------------------------------- |
| LLM01    | sanitize, SSRF-guard, allowlist, approval | indirect через веб/RAG (нужна сегрегация), red team       |
| LLM02    | PII-redact                                | redact на выводе/логах; opt-out                           |
| LLM03/04 | sandbox                                   | SBOM, проверка источников моделей/датасетов               |
| LLM05    | sanitize, CSP                             | контекстное кодирование, параметризованные запросы        |
| LLM06    | approval, allowlist, least privilege      | нет open-ended (shell/fetch), complete mediation          |
| LLM07    | —                                         | НЕ хранить секреты в system prompt; guardrails вне модели |
| LLM08    | SSRF-guard                                | санитизация/права на чанках                               |
| LLM09    | факт-чек частично                         | grounding+цитаты, ограничение доверия                     |
| LLM10    | —                                         | rate-limiting + лимит итераций                            |

Критично открыты: LLM07, LLM10, LLM09, indirect prompt injection (LLM01). Приоритет: (1) строгая CSP + рендер как текста, (2) не хранить секреты в промпте, (3) rate-limiting/лимит итераций, (4) grounding/цитаты.

Источники: genai.owasp.org (llm-top-10, agentic-security-initiative, agentic-applications-2026, ACS, secure-mcp-guide).
