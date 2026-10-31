# Безопасность, доверие и границы (Security & Trust)

> **Карта 11 из «супер-карт»** · дата генерации: 2026-10-31
> **Формат:** скелет — наполняется из аудитов/фактов. Парные: карты 1–10 + wave-аудиты.
> **Покрывает исходные идеи списков:** Модель безопасности и границ доверия: доступ панелей/сервисов/агентов к файлам, сети, ключам и shell; секреты; изоляция; prompt injection; surface атаки; привилегии.

---

## Назначение

Модель безопасности и границ доверия: доступ панелей/сервисов/агентов к файлам, сети, ключам и shell; секреты; изоляция; prompt injection; surface атаки; привилегии.

## Методология

Статический анализ прав/импортов + карты: Security&Trust, Trust Boundary, Agent Safety/Sandbox, Attack Surface, Privilege, Privacy.

## Что уже есть (факты из аудитов)

**Критично (P0):**

- W2-005 / W4-019 / W7-CRY-001: vault-шифрование ключей обесценивается — deviceKey хранится в plaintext в `localStorage['key-vault:device-key']`; master-key выводится из него → XSS/кража профиля = полный доступ к ключам. (Отложено, нужен passphrase-UI.)
- W5-002 / W7-CRY-001: API-ключи провайдеров в plaintext в IndexedDB (`apiKeys`).
- W2-009 / W3-025 / W8-003: единый `SYNC_SECRET` для всех тенантов + WS cross-tenant leak; `/api/db` без tenant-скоупинга.
- W4-025 / W6-022 / W8-004: browser-sidecar без auth на `0.0.0.0` (исправлено: loopback + Bearer + SSRF-allowlist).

**Авторизация/доступ:**

- W2-001/002/017/018: permission middleware fail-open при отсутствии agentId; GovernanceService/AgentService/CrewService мутации без авторизации. (Отложено.)
- W2-016: `castAudienceVote` принимал произвольный voterId/pickId (исправлено: валидация + запрет двойного голоса).
- W3-024: `/api/approvals/:id/decide` без companyId-проверки.

**Prompt injection / AI-safety:**

- W2-014: история дебатов (аргументы оппонента) собирается в system prompt без санитизации.
- W4-022: tool-вывод возвращается в контекст без скана (исправлено частично: редэкция PII в tool-loop).
- W4-026/W7-UGC-009: dangerous-блоклист добавлен (CSAM/self-harm/weapons/drugs); модерация изображений отсутствует.
- W4-042/043/044: автономные file-writes мимо ToolPipeline; `autonomy-agent`/`autonomy-loop` обходят permission-пайплайн; пресет AUTOPILOT без admin-гейта (частично исправлено: `autoApproveAfterMin>=60`).

**Секреты/инфраструктура:**

- W6-002: SYNC_SECRET/BROWSER_USE_LLM_API_KEY в env (зависит от деплоя).
- W6-021: SSRF-гвард в http-адаптере (исправлено).
- W2-003: LLM-вызовы без валидации промпта/прав.
- W3-007: vault envelope с статичным salt.
- W5-010: nginx HTTP-only дефолт (документировано, dev-only).
- ReDoS: W6-023 — гвард добавлен в prompt-security/policy (isReDoSPattern).

## Пробелы / риски

- Доступ к ключам = доступ ко всем провайдерам (нет реального encryption-at-rest).
- Нет единой модели привилегий (authz-рефакторинг не завершён).
- Prompt injection через внешний контент/инструменты остаётся главным вектором.
- Модерация изображений (CSAM) — внешний сервис, отсутствует.
- Поверхность атаки: парсеры, веб-поиск, импорт, MCP не санитизируются на входе.

## Рекомендации

1. Passphrase-vault (UI при bootstrap) + шифрование ключей at-rest.
2. Authz-слой: обязательная авторизация для всех мутаций сервисов.
3. Санитизация внешнего контента до попадания в промпт/контекст.
4. Подключить модерацию изображений (внешний API).
5. Продолжить распространение ReDoS/SSRF-гвардов на оставшиеся входы.

---

## Источники-доноры

- `map-03-technical-health`
- `map-08-capability-accessibility`
- `audit-wave2`
- `audit-wave4`
- `audit-wave5`
- `audit-wave7`
