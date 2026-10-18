<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: политики, секреты и вебхуки

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, политики, безопасность, секреты, вебхуки

Источники: `src/kernel/services/policy-service.ts`, `src/kernel/services/external-secrets-service.ts`, `src/kernel/services/compromise-webhook-service.ts`, `src/kernel/services/notification-webhook-service.ts`

## Назначение

Управлять правилами доступа и приватности (политики), хранить секреты во внешних бэкендах, принимать сигналы компрометации и отправлять уведомления наружу.

## Возможности

- Политики типов `latency/privacy/cost/safety/rate_limit/content/custom` с действиями `block/warn/log/throttle/mask`.
- Пер-агентские ограничения (free-only, allow/deny провайдеров и моделей), запись нарушений и статистика.
- Маскирование PII (email/phone/SSN/credit-card) и blocklist моделей.
- Секреты: переключение бэкендов `local/vault/aws/gcp` с fallback на local.
- Уведомления: Slack/Telegram/Discord/Generic с SSRF-защитой и ретраями.

## Реализация

- `PolicyService` (`policy-service.ts`, ~565 строк): 6 дефолтных политик (`p-latency-1`, `p-privacy-1`, `p-cost-1`, `p-rate-limit-1`, `p-content-safety-1`, `p-model-blacklist-1`) и 8 паттернов (PII, toxic, blocklist). `enforcePrivacy`, `sanitizeOutput`, `checkAgentPolicy`. Нарушения ≤ `CONFIG.services.policy.maxViolations ?? 200`; persist дебаунс 50 мс; emit `policy:violation`. **C-79:** admin-token авторизация убрана (single-user), мутации только журналируются. `'safety'/'content'`-ветка объявлена типами, но метод `enforceContentSafety` в этом файле не реализован.
- `ExternalSecretsService` (`external-secrets-service.ts`): `register`, `activateBackend`, CRUD секретов, `migrateSecrets`; fallback на local **только при исключении** бэкенда (отсутствующий ключ → `null`); emit `secrets:lookup:failed`.
- `CompromiseWebhookService` (`compromise-webhook-service.ts`): **fail-closed** — требует секрет + подпись + raw body; HMAC-SHA256 verify. **P-CRIT-1:** у `onWebhookRequest` нет HTTP-точки входа в продакшене (SPA), живой путь — ручной `manuallyCompromise`.
- `NotificationWebhookService` (`notification-webhook-service.ts`): форматтеры slack/telegram/discord/generic; `isValidUrl` — синхронная проверка `https` + блок private IP перед каждой отправкой (защита от DNS-rebinding TOCTOU); ретраи с jitter; HMAC-заголовок `X-Signature-256`.

## Связи

- Ключи/компрометация — [Компонент: управление ключами провайдеров](./comp-key-management.md); шифрование — [Компонент: шифрование at-rest (SecurityService)](./comp-security-crypto.md).
- Панели: [Панель: Governance и безопасность](./panel-governance.md) (политики), [Панель: Настройки](./panel-settings.md) (вебхуки).

## Проверка работоспособности

- `policy-service.test.ts` (политики, agent-policies, паттерны, PII), `external-secrets-service.test.ts`, `compromise-webhook-service.test.ts`, `notification-webhook-service.test.ts`.
- `NotificationService` как класс **не существует** — только вебхук-сервис и событие `system:notification`.

## Состояние

- Подтверждено тестами; известные ограничения (нет HTTP-приёма вебхуков, нет content-safety enforce) зафиксированы явно.

---

## Связанные материалы

- [Компонент: шифрование at-rest (SecurityService)](./comp-security-crypto.md)
- [Компонент: управление ключами провайдеров](./comp-key-management.md)
- [Панель: Governance и безопасность](./panel-governance.md)
- [Панель: Настройки](./panel-settings.md)

[← Все материалы](./README.md)
