# Аудит 10: Конфигурация и окружение (Configuration & Environment)

## Оценка зрелости: 7/10
Единый .env.example с комментариями, fail-fast валидация серверных env, секреты не закоммичены, dependabot — но мёртвые build-args, VITE_BUILD_ID не инжектится, клиентские env без схемы валидации, stage-контур отсутствует.

## Резюме
Конфигурация построена вокруг одного файла `.env.example` (94 строки, «single source of truth»), а dev/prod-различия разделены через Vite-прокси (dev) и nginx+envsubst (prod). Серверные процессы (sync-server, cors-proxy) валидируют env fail-fast с понятными сообщениями; клиентские `import.meta.env` используются точечно (9 уникальных переменных в 23 файлах) с фолбэками, но без стартовой схемы-валидации (zod есть в зависимостях, но для env не применяется). Найдены расхождения «задокументировано ↔ используется»: два build-args Dockerfile не имеют ни одного потребителя в коде, а два debug-флага используются в коде, но не описаны в .env.example; VITE_BUILD_ID заявлен как «инжектится в CI», но ни CI, ни Dockerfile его не задают — в проде всегда `buildId: 'dev'`. Секреты в репозитории не закоммичены (проверено `git ls-files | rg '\.env'` — только .env.example), токены Sentry/Datadog передаются только через `secrets.*`. Stage-окружение как класс отсутствует — есть только dev (Vite) и prod (GH Pages / Docker-профили).

## Сводка находок

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| CF10-01 | Средний | VITE_BUILD_ID не инжектится ни в CI, ни в Docker — в проде всегда 'dev' | .github/workflows/ci.yml:87–90; src/kernel/services/config-registry.ts:5–8 |
| CF10-02 | Средний | GH Pages деплой собирается без VITE_BASE_PATH — на project pages сломаются пути ассетов | .github/workflows/ci.yml:87–90; .env.example:9–11 |
| CF10-03 | Средний | featureFlags.mockServices.enabled=true по умолчанию — мок-панели включены в проде | src/kernel/services/config-registry.ts:288–290; src/components/Common/DemoGate.tsx:18 |
| CF10-04 | Средний | Мёртвые build-args VITE_DISABLE_TELEMETRY / VITE_LOG_LEVEL — 0 использований в src | Dockerfile:50–51; docker-compose.yml:36–37 |
| CF10-05 | Средний | VITE_DEBUG_MEMORY/VITE_DEBUG_KEYS используются через `as unknown as` и не описаны в .env.example; клиентский env без zod-валидации | src/main.tsx:35; src/kernel/services/key-management/key-registry.ts:178 |
| CF10-06 | Низкий | Все 29 GitHub Actions пиннуты по мутабельным тегам (@v4), не по SHA | .github/workflows/ci.yml:25 |
| CF10-07 | Низкий | npm ci --legacy-peer-deps как постоянная норма (peer-конфликт madge×typescript) | Dockerfile:35–37; .github/workflows/ci.yml:42 |
| CF10-08 | Низкий | CSP поддерживается в трёх местах и уже разошлась: 20 vs 16 vs 8 connect-src хостов | vite.config.ts:115; docker/nginx.conf:37; index.html:19 |
| CF10-09 | Низкий | Stage-окружения нет: только dev (Vite) и prod (GH Pages + docker-профили dev/prod) | docker-compose.yml:77–104 |

## Детали находок

### CF10-01: VITE_BUILD_ID не инжектится — версионирование сборки фиктивно
Файл: `.github/workflows/ci.yml:87–90`, `src/kernel/services/config-registry.ts:5–8`
```yaml
# ci.yml, шаг Build
- name: Build
  run: npm run build
  env:
      VITE_APP_ORIGIN: https://example.com
```
```ts
buildId:
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_BUILD_ID
        ? (import.meta.env.VITE_BUILD_ID as string)
        : 'dev',
```
Влияние: `.env.example:18–19` декларирует «Build ID (injected at CI build time)», но `rg VITE_BUILD_ID .github/ Dockerfile docker-compose.yml` — 0 совпадений. Каждый прод-билд сообщает `buildId: 'dev'`; диагностика инцидентов по сборкам невозможна, а `VITE_BUILD_ID=dev` в .env.example вводит в заблуждение.
Рекомендация: в CI передавать `VITE_BUILD_ID: ${{ github.sha }}` (и/или ARG в Dockerfile), добавить smoke-проверку в build-джобу: значение в dist != 'dev'.

### CF10-02: Деплой на GH Pages без VITE_BASE_PATH
Файл: `.github/workflows/ci.yml:87–90`, `.env.example:9–11`
```yaml
- name: Build
  run: npm run build
  env:
      VITE_APP_ORIGIN: https://example.com   # VITE_BASE_PATH не задан
```
```bash
# .env.example
# Set to /repo-name/ when deploying to GitHub Pages project page
VITE_BASE_PATH=/
```
Влияние: job `deploy` публикует артефакт на GitHub Pages (ci.yml:312–355). Для project page (`<user>.github.io/<repo>/`) база `/` даст 404 на `/assets/*`; собственный домен/user page — работает. Ошибка проявится только после включения Pages.
Рекомендация: вынести VITE_BASE_PATH в repository variable/secret и прокинуть в оба шага сборки (build и e2e), либо задокументировать требование user-page/кастомного домена.

### CF10-03: Мок-сервисы включены в проде по умолчанию
Файл: `src/kernel/services/config-registry.ts:288–290`, `src/components/Common/DemoGate.tsx:18`
```ts
mockServices: {
    enabled: true,
},
```
```ts
const enabled = CONFIG?.featureFlags?.mockServices?.enabled ?? true;
```
Влияние: дефолт конфигурации продакшен-сборки включает мок-панели; двойной дефолт `?? true` в DemoGate/DemoBadge означает, что даже при недоступном CONFIG мок-UI показывается. Пользователь прод-деплоя видит демо-данные как полноценные панели.
Рекомендация: дефолт `false` + явное включение через settings/dev-флаг; в DemoGate fallback на false.

### CF10-04: Мёртвые build-args телеметрии/логирования
Файл: `Dockerfile:50–51`, `docker-compose.yml:36–37`
```dockerfile
ARG VITE_DISABLE_TELEMETRY=
ARG VITE_LOG_LEVEL=
```
Влияние: `rg 'VITE_DISABLE_TELEMETRY|VITE_LOG_LEVEL' src/ scripts/ server/` — 0 совпадений: аргументы прокидываются в `npm run build` (Dockerfile:52–63) и compose, но ни на что не влияют. Оператор, выставивший VITE_LOG_LEVEL=debug, получит тишину.
Рекомендация: либо реализовать потребление (например, в src/shared/utils/logger.ts), либо удалить ARG из Dockerfile и docker-compose, чтобы не создавать ложное ощущение управляемости.

### CF10-05: Скрытые debug-флаги и отсутствие схемы клиентского env
Файл: `src/main.tsx:35`, `src/kernel/services/key-management/key-registry.ts:178`
```ts
if (import.meta.env.DEV && typeof window !== 'undefined' && (import.meta.env as unknown as { VITE_DEBUG_MEMORY?: string }).VITE_DEBUG_MEMORY) {
```
Влияние: два рабочих флага не существуют в .env.example и пробиваются через двойной каст (типобезопасность отключена локально). Ключи типа VITE_KEY_* описаны, но единая zod-схема `import.meta.env` при старте отсутствует (zod есть в зависимостях) — опечатка в имени переменной молча даёт undefined. Серверная часть, напротив, образцова: `server/sync-server.mjs:51–56` и `scripts/cors-proxy.mjs:9–20` валидируют SYNC_SECRET/CORS_ORIGIN fail-fast.
Рекомендация: добавить `src/env.ts` с zod-схемой поверх import.meta.env (единая точка типизации + предупреждение о неизвестных VITE_*), задокументировать VITE_DEBUG_*.

### CF10-06: Действия пиннуты по тегам, а не по SHA
Файл: `.github/workflows/ci.yml:25` (и все 29 использований)
```yaml
- uses: actions/checkout@v4
```
Влияние: компрометация тега action (или подмена стороннего action) автоматически попадает в пайплайн с `permissions: id-token: write` у deploy-джобы. Для проекта с deploy-доступом к Pages это реальный supply-chain вектор.
Рекомендация: пин по полному SHA + комментарий с версией; dependabot уже настроен на github-actions и будет обновлять пины.

### CF10-07: Постоянный --legacy-peer-deps
Файл: `Dockerfile:35–37`, `.github/workflows/ci.yml:42`
```dockerfile
# `--legacy-peer-deps` is required: madge@8 expects typescript ^5.4.4
# while the project pins ~6.0.2.  See bugi2.md item #1.
RUN npm ci --legacy-peer-deps --no-fund
```
Влияние: флаг отключает проверку peer-зависимостей для ВСЕХ пакетов, а не только madge — будущий реальный конфликт пройдёт молча и вскроется в рантайме. Проблема самопорождённая: typescript 6.0.2 при madge ^8.
Рекомендация: использовать `overrides` в package.json для madge либо overrid peer через npm pkg set, снять глобальный флаг.

### CF10-08: CSP в трёх источниках, рассинхронизация connect-src
Файл: `vite.config.ts:115`, `docker/nginx.conf:37`, `index.html:19`
```ts
// vite.config.ts (dev): 20+ хостов
"connect-src 'self' https://generativelanguage.googleapis.com https://openrouter.ai ... https://api.mistral.ai https://api.cohere.com ...;"
```
```html
<!-- index.html (meta): 8 хостов -->
connect-src 'self' https://*.openrouter.ai ... https://*.groq.com https://*.nvidia.com;
```
Влияние: комментарий index.html:13 требует синхронности с nginx.conf, но meta-CSP знает 8 источников, nginx — 16, vite dev — 20+ (например, api.mistral.ai, api.cohere.com, api.perplexity.ai есть в dev/prod-nginx, но отсутствуют в meta). Прямые вызовы «непроксированных» провайдеров в dev с meta-CSP заблокируются.
Рекомендация: генерировать CSP из одного списка провайдеров (build-time кодогенерация в vite.config), оставить комментарий-инвариант + CI-тест на равенство наборов хостов.

### CF10-09: Отсутствует stage-контур
Файл: `docker-compose.yml:77–104`
```yaml
# ── Dev profile: HTTP on :80 (localhost only) ────────────────
app-dev: ...
# ── Prod profile: HTTPS on :443 ... ─────────────────────────
app-prod: ...
```
Влияние: разделение dev/prod есть (профили compose, nginx.conf vs nginx-ssl.conf), но промежуточной среды нет: проверка прод-сборки возможна только на GH Pages (которая и есть prod). Инфраструктурные env-отличия (PROXY_FETCH, SYNC_SECRET) проверяются лишь в момент реального деплоя.
Рекомендация: добавить stage-профиль/окружение GitHub Environment с теми же секретами-заглушками; e2e прогонять на prod-конфигурации nginx-ssl.

## Положительные практики
- `.env.example` (94 строки) — самодокументированный единый источник с секциями и предупреждениями о секретах; `git ls-files | rg '\.env'` подтверждает: ни один реальный .env не закоммичен.
- Fail-fast валидация серверных env: `server/sync-server.mjs:51–56` (SYNC_SECRET обязателен, без fallback), `scripts/cors-proxy.mjs:9–20` (FATAL при отсутствии CORS_ORIGIN и явный запрет `*` как open-relay).
- `docker/entrypoint.sh:33–44` проверяет наличие TLS-сертификатов при SSL-конфиге и падает с понятной инструкцией по генерации.
- Наименьшие привилегии в CI: у каждой джобы свой блок `permissions: contents: read` (ci.yml:22–23, 64–66 и др.), deploy — единственная с `pages: write, id-token: write`.
- Секреты только через `secrets.*` (ci.yml:338–345); upload-sourcemaps аккуратно но-опится без креденшелов (scripts/upload-sourcemaps.mjs:72–79).
- `.github/dependabot.yml` — еженедельные npm + github-actions обновления с осмысленным ignore-листом (react-router RSC-CSRF GHSA-qwww-vcr4-c8h2 задокументирован в ci.yml:201–206).
- Инфраструктурная конфигурация проксей нормализована в трёх слоях с согласованными дефолтами (vite.config.ts:120–178 ≡ entrypoint.sh:8–22 ≡ nginx.conf:73–153), catch-all `/proxy/` — deny by default (nginx.conf:158–161).
- Разделение tsconfig на app/node/test (solution-style с references), строгие опции `noUncheckedIndexedAccess`, а тестовый проект осознанно мягче (tsconfig.test.json:8–10).
