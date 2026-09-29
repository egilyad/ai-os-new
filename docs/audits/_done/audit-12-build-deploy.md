# Аудит 12: Производительность сборки и деплоя (Build & Deploy Performance)

## Оценка зрелости: 6/10
Образцовый code splitting (~266 lazy-компонентов, 198 route-панелей) и продуманный manualChunks, hidden-sourcemaps с upload-скриптом, immutable-кэш и hardened Docker — но три «мёртвые» ветки manualChunks из-за substring-сравнения, утечка .map-файлов на GH Pages, Monaco под CSP-блок в проде и дублирование сборки в CI без таймаутов.

## Резюме
Сборка — `tsc -b && vite build` с target es2022/es2023, minify esbuild, sourcemap 'hidden' и развитым manualChunks; code splitting на маршрутах отличный — src/route-imports.ts содержит 198 вызовов React.lazy (плюс 58 в technique-panels-bundle, всего 266), тяжёлые панели (Monaco/TipTap-редакторы, xyflow-граф) уходят в отдельные чанки. Однако сам manualChunks содержит системную ошибку: проверка `id.includes('react')` стоит первой и матчит по подстроке — @xyflow/react, @tiptap/*, @react-aria/*, lucide-react, react-is, @tanstack/react-virtual все уходят в vendor-react, а ветки vendor-xyflow/vendor-tiptap/vendor-aria недостижимы. Три высокие находки: (1) hidden-.map-файлы остаются в dist/ и публикуются на GitHub Pages — исходники доступны публично; (2) Monaco грузится с cdn.jsdelivr.net по умолчанию @monaco-editor/react, но прод-CSP разрешает только script-src 'self' — редактор сломан в проде; (3) CI дублирует полную сборку в e2e-джобе и не имеет timeout-minutes ни в одной из 7 джоб. Nginx отдаёт gzip (без brotli), ассеты — 30d immutable, но для index.html Cache-Control не задан. Docker — multi-stage, alpine, non-root, healthcheck, compose с cap_drop/read_only — образцово, но без BuildKit cache-маунтов.

## Сводка находок

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| BD12-01 | Высокий | hidden-sourcemaps остаются в dist/ и публикуются на GH Pages — исходники доступны публично | .github/workflows/ci.yml:348–351; vite.config.ts:49 |
| BD12-02 | Высокий | `id.includes('react')` перехватывает @xyflow/react, @tiptap/*, @react-aria/*, lucide-react — vendor-xyflow/vendor-tiptap/vendor-aria недостижимы | vite.config.ts:57–62 vs 64–66, 82–87 |
| BD12-03 | Высокий | Monaco грузится с CDN по умолчанию, но прод-CSP blockирует сторонние script-src — CodeEditor не работает в проде | src/components/Editors/CodeEditor.tsx:2; docker/nginx.conf:37 |
| BD12-04 | Средний | e2e-джоба повторно выполняет полную `npm run build`; дублирование ×2 времени сборки на пайплайн | .github/workflows/ci.yml:304–307 vs 87–88 |
| BD12-05 | Средний | Ни одна из 7 джоб CI не имеет timeout-minutes (дефолт GitHub — 360 мин) | .github/workflows/ci.yml:19–356 |
| BD12-06 | Средний | Двойная загрузка Google Fonts: <link> в HTML + @import в CSS (разные наборы весов, @import render-blocking) | index.html:7–12; src/styles/variables.css:1 |
| BD12-07 | Низкий | Для index.html/SPA-fallback не задан Cache-Control — эвристическое кэширование после деплоя | docker/nginx.conf:41–43 |
| BD12-08 | Низкий | Только gzip, без brotli (экономия JS ~15–20% на текстовых ассетах) | docker/nginx.conf:10–14; docker/nginx-ssl.conf:13–17 |
| BD12-09 | Низкий | node_modules-кэш дублируется в 6 джобах; первый прогон по новому lockfile — 6 параллельных npm ci | .github/workflows/ci.yml:33–42,76–85,124–133,155–164,191–199,223–232 |
| BD12-10 | Инфо | Линт-гейт заморожен на 5200 предупреждений (~5k — fa-02 raw colors в панелях) | .github/workflows/ci.yml:58 |
| BD12-11 | Инфо | Сборка требует --max-old-space-size=4096 (build/dev), 6144 для тестов — признак тяжёлого single-process typecheck | package.json:15–17; .github/workflows/ci.yml:137 |
| BD12-12 | Инфо | Docker build без BuildKit cache-mount для npm-кэша — cold build переустанавливает всё | Dockerfile:34–37 |

## Детали находок

### BD12-01: Sourcemaps публикуются вместе с GH Pages
Файл: `.github/workflows/ci.yml:348–351`, `vite.config.ts:45–49`
```yaml
- name: Upload Pages artifact
  uses: actions/upload-pages-artifact@v3
  with:
      path: dist/
```
```ts
// P1.27: generate sourcemaps but keep them out of the shipped JS/CSS
// ... Maps are uploaded to Sentry/Datadog ... and never served to clients
sourcemap: 'hidden',
```
Влияние: `sourcemap: 'hidden'` лишь убирает комментарий `//# sourceMappingURL` — сами *.map-файлы генерируются в dist/. Deploy-джоба загружает sourcemaps в Sentry (ci.yml:331–346), но не удаляет их; `upload-pages-artifact` с `path: dist/` упаковывает ВСЁ содержимое, включая *.map. Итог: `.map`-файлы (исходники ~392K LOC TS) скачиваются с `<pages-url>/assets/<chunk>.map` любым желым; намерение P1.27 «never served to clients» нарушено; заодно в 2–3 раза раздувается pages-артефакт и искажается проверка размера (ci.yml:94 считает dist вместе с картами).
Рекомендация: после upload-sourcemaps выполнить `rm -rf dist/**/*.map` перед Upload Pages artifact (или собирать maps в отдельный каталог). Также стоит упомянуть, что `if: env.SENTRY_AUTH_TOKEN != ''` (ci.yml:337) без секретов пропускает загрузку, но карты всё равно остаются.

### BD12-02: Substring-баг в manualChunks — vendor-ветки недостижимы
Файл: `vite.config.ts:55–93`
```ts
manualChunks(id) {
    if (id.includes('node_modules')) {
        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'vendor-react';          // срабатывает ПЕРВЫМ
        }
        if (id.includes('@xyflow')) return 'vendor-xyflow';   // недостижимо: @xyflow/react содержит 'react'
        ...
        if (id.includes('@tiptap')) return 'vendor-tiptap';   // недостижимо: @tiptap/react
        if (id.includes('@react-aria')) return 'vendor-aria'; // недостижимо: @react-aria/...
```
Влияние: путь `/node_modules/@xyflow/react/...`, `@tiptap/react`, `@tiptap/pm`, `@react-aria/*`, `lucide-react`, `react-is`, `@tanstack/react-virtual` все содержат подстроку 'react' → уходят в vendor-react. Ветка vendor-xyflow (строки 64–66) становится мёртвой — графовая библиотека xyflow (сотни КБ) попадает в vendor-react и грузится до первого рендера, хотя граф нужен только 6 панелям; vendor-tiptap/vendor-aria аналогично (tiptap выручает только lazy-чанк EditorsPanel). Это раздувает критический путь и обнуляет часть усилий по code splitting.
Рекомендация: проверять точные сегменты пакета, например `id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || /node_modules\/react-router/`, и вынести xyflow/tiptap проверки до react-проверки; добавить CI-лог размера чанков (уже есть в ci.yml:99–100) с alert-порогом на vendor-react.

### BD12-03: Monaco Editor из CDN против прод-CSP
Файл: `src/components/Editors/CodeEditor.tsx:2`, `docker/nginx.conf:37`
```ts
import Editor from '@monaco-editor/react';
```
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; ..." always;
```
Влияние: @monaco-editor/react без `loader.config()` грузит monaco-loader и сам monaco c cdn.jsdelivr.net (дефолт). `rg 'loader\.config|cdn\.jsdelivr' src/` — 0 совпадений (кроме несвязанного шаблона). Прод-CSP (nginx.conf:37, nginx-ssl.conf, index.html:19) разрешает script-src только 'self' — CDN-скрипты Monaco будут заблокированы, CodeEditor в проде отрисует вечный loading. Одновременно прямой деп `monaco-editor@^0.52.2` (package.json:65) не импортируется ни одним файлом src (rg `from 'monaco-editor'` — 0) — в бандл не попадает, но висит в зависимостях (~80 МБ в node_modules, замедляет npm ci).
Рекомендация: либо self-host: `loader.config({ paths: { vs: <скопированный в public/ vs> } })` + копирование монако в dist, либо добавить CDN в CSP (осознанно), либо заменить на легковесный редактор. Убрать monaco-editor из dependencies, если используется только CDN.

### BD12-04: Повторная полная сборка в e2e-джобе
Файл: `.github/workflows/ci.yml:304–307` (vs 87–88, 102–107)
```yaml
- name: Build frontend for preview
  run: npm run build
  env:
      VITE_APP_ORIGIN: https://example.com
- name: Run E2E tests
  run: npm run test:e2e
```
Влияние: build-джоба уже собрала проект и выложила артефакт dist (retention 7d); e2e-джоба собирает заново (tsc -b + vite build при 4096 МБ heap — минуты на CI-раннере), затем поднимает `vite preview` (e2e/playwright.config.ts:11–15). На каждый push — двойная сборка; джобы build и e2e выполняются параллельно (needs: quality), т.е. пик нагрузки и общее время пайплайна определяются худшей веткой, но CPU-время расходуется вдвое.
Рекомендация: скачивать артефакт через actions/download-artifact (как это уже делает deploy, ci.yml:325–329) и запускать preview на нём; деплой при этом Wait-for-e2e уже учтён (needs: [build, e2e], ci.yml:315).

### BD12-05: Отсутствуют timeout-minutes
Файл: `.github/workflows/ci.yml:19–356` (rg 'timeout-minutes' — 0 совпадений)
```yaml
quality:
    name: Type-check & Lint
    runs-on: ubuntu-latest
    # нет timeout-minutes
```
Влияние: дефолтный таймаут джобы GitHub Actions — 360 минут. Зависший тест/OOM-петля (в vitest.config.ts:17–19 уже признают OOM-проблемы teardown) может жечь раннер-минуты часами; concurrency cancel-in-progress (ci.yml:3–5) спасает только при новом пуше той же ветки.
Рекомендация: задать job-level timeout-minutes (например, quality 15, build 20, test 30, coverage 20, e2e 20) — дешёвая страховка.

### BD12-06: Двойная загрузка Google Fonts
Файл: `index.html:7–12`, `src/styles/variables.css:1`
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono&display=swap');
```
Влияние: один и тот же fonts.googleapis.com запрашивается дважды с разными параметрами (HTML: Inter 400–700 + display=swap; CSS: Inter 400–800 + JetBrains Mono без display). CSS @import последовательный и render-blocking: браузер должен скачать variables.css, обнаружить @import, скачать шрифтовой CSS и лишь потом начать рендер текста. Внешний запрос к Google Fonts — также точка отказа/приватности (для оффлайн-режима local-first SPA).
Рекомендация: оставить один <link> с полным набором (добавить 800 и JetBrains Mono, display=swap), убрать @import из variables.css; в перспективе — self-host woff2 (fontsource) и убрать внешние хосты из CSP.

### BD12-07: Нет Cache-Control для index.html
Файл: `docker/nginx.conf:41–43`
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```
Влияние: ассеты кэшируются 30d immutable (nginx.conf:48–51), а index.html отдаётся без явного Cache-Control — применяется эвристика браузера (10% от Last-Modified). После нового деплоя браузер может держать устаревший index.html со ссылками на старые хэши; в контейнере старых файлов уже нет → белый экран до принудительного refresh. На GH Pages GitHub выставляет max-age=600 сам.
Рекомендация: добавить `location = /index.html { add_header Cache-Control "no-cache"; }` (+ повтор security headers по правилу BLD-09).

### BD12-08: Нет brotli
Файл: `docker/nginx.conf:10–14`
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript ...;
gzip_min_length 256;
gzip_vary on;
```
Влияние: только gzip (level по умолчанию 1). Для JS-бандла этого размера (чанк-warning 700 КБ, total до 30 МБ) brotli-11 даёт ~15–20% дополнительной экономии против gzip. Базовый nginx не содержит модуль brotli — потребуется ngx_brotli или предсжатие на этапе сборки.
Рекомендация: минимальный вариант без смены образа — прегенерация .br в CI (vite-plugin-compression2/brotli) + `gzip_static`/map-директива на отдачу.

### BD12-09: Шесть независимых npm ci без общего кэша первого уровня
Файл: `.github/workflows/ci.yml:33–42` (и аналогичные блоки в 5 других джобах)
```yaml
- name: Cache node_modules
  uses: actions/cache@v4
  with:
      path: node_modules
      key: npm-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
- name: Install dependencies
  if: steps.npm-cache.outputs.cache-hit != 'true'
  run: npm ci --legacy-peer-deps
```
Влияние: 6 джоб (quality/build/test/coverage/circular/dep-graph/e2e) восстанавливают ОДИН и тот же ключ кэша; при промахе (новый lockfile, вытеснение кэша) — 6 параллельных `npm ci` в lockstep (т.е. 6× сетевой трафик и ~2–4 мин каждая). Плюс отдельный кэш ~/.cache/ms-playwright для e2e (ci.yml:293–302) — это хорошо. Существование пакета-мультикэша (setup-node cache: npm для npm-кэша уже включён) смягчает проблему.
Рекомендация: собрать кэш в quality-джобе и переиспользовать артефакт/ключ, либо перейти на setup-node cache + `npm ci` без node_modules-кэша (npm ci и так чистый), сократив конфигурацию вдвое.

### BD12-10: Линт-гейт 5200 предупреждений
Файл: `.github/workflows/ci.yml:51–58`
```yaml
run: npm run lint -- --max-warnings 5200
```
Влияние: порог заморожен на текущем долге (~5k fa-02 raw colors + react-compiler strictness); новые предупреждения тихо добавляются к 5200 — порог перестаёт быть сигналом (деградация «boiling frog»). Положительно, что комментарием зафиксирован план «re-tighten as warnings are fixed».
Рекомендация: переводить правило fa-02 в autofix-скрипт (аналог scripts/tokenize-colors.mjs) и снижать порог ступенчато; либо вынести fa-02 из счётчика в отдельный отчётный джоб.

### BD12-11: Тяжёлый single-process typecheck/build
Файл: `package.json:15–17`, `.github/workflows/ci.yml:137`
```json
"build": "node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc -b && node --max-old-space-size=4096 ./node_modules/vite/bin/vite.js build",
```
Влияние: NODE_OPTIONS=6144 МБ для unit-тестов и 4096 МБ для build/dev прямо указывают на объём: ~392K LOC TS, 1418 модулей в графе dep-cruiser. Composite-references (tsconfig.json: files: [] + 3 references, tsBuildInfoFile в node_modules/.tmp) дают инкрементальность внутри кэшированного node_modules, но изоляция чанков ограничена. Это не дефект, а параметр масштаба — следить за временем CI.
Рекомендация: при росте — распределённый кэш (nx/turbo) или вынос typecheck в отдельный воркер с --buildInfoFile вне node_modules (сейчас tsbuildinfo живёт в кэше node_modules и может устаревать при ручной чистке).

### BD12-12: Docker build без кэш-маунтов
Файл: `Dockerfile:34–37`
```dockerfile
COPY package*.json ./
RUN npm ci --legacy-peer-deps --no-fund
COPY . .
```
Влияние: multi-stage + `COPY package*.json` до исходников уже дают докер-кэш слоёв на неизменном lockfile, но на изменении package-lock.json слой `npm ci` пересобирается с нуля без cache-mount (~2–4 мин). Синтаксис 1.7 (Dockerfile:1) уже подключён — маунты доступны.
Рекомендация: `RUN --mount=type=cache,target=/root/.npm npm ci --legacy-peer-deps`.

## Положительные практики
- Агрессивный, но управляемый code splitting: 198 React.lazy в route-imports.ts + 58 в technique-panels-bundle.tsx (всего 266), каждая панель — отдельный чанк с PanelSkeleton-фолбэком; тяжёлые редакторы (Monaco/TipTap) изолированы в lazy-панели EditorsPanel (route-imports.ts:124).
- `sideEffects` whitelist в package.json:6–10 (css/theme-init/workers) — корректный tree-shaking без побочных эффектов.
- Sourcemap-стратегия: 'hidden' (vite.config.ts:49) + отдельный скрипт upload-sourcemaps.mjs с graceful no-op без креденшелов (строки 64–79), поддержкой Sentry и Datadog и `--disable-git-metadata-upload`.
- Кэширование статики: `Cache-Control "public, immutable"` + expires 30d для хэшированных ассетов, access_log off (nginx.conf:48–57); HTTP/2 на SSL-конфиге (nginx-ssl.conf:25), TLSv1.2/1.3, HSTS.
- CI: concurrency cancel-in-progress (ci.yml:3–5), минимальные permissions на каждую джобу, отчёт по размерам топ-10 чанков и warn-порог 30 МБ на dist (ci.yml:92–100), артефакт dist с retention 7d переиспользуется деплоем.
- Кэш npm в setup-node + кэш Playwright-браузеров по hashFiles('package-lock.json') (ci.yml:293–302).
- Docker: multi-stage (node:22-alpine → nginxinc/nginx-unprivileged:1.28-alpine, non-root 8080), HEALTHCHECK, envsubst-шаблон конфига, проверка SSL-сертификатов на старте; compose: cap_drop ALL, no-new-privileges, read_only, tmpfs, лимиты 512M/1CPU, json-file logging с ротацией (docker-compose.yml:46–75) — эталонный прод-профиль.
- Гейтинг деплоя: deploy требует [build, e2e] и выполняется только с main/master (ci.yml:312–315).
- Тестовая инфраструктура: coverage.include только на стабильных директориях с порогами 30/20% и честным комментарием о ~4% при широком include (vitest.config.ts:23–45).
- Стратегия деплоя декларирована честно: GH Pages для SPA (с деплой-джобой и environment url) + Docker-образ для self-host; секреты error-tracking опциональны и не блокируют деплой.
