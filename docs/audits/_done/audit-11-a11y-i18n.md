# Аудит 11: Доступность и интернационализация (Accessibility & i18n)

## Оценка зрелости: 6/10
Сильная база: собственный i18n с parity-тестом (3604 ключа × 2 локали), lazy-загрузка локалей, skip-nav, focus-visible, prefers-reduced-motion, high-contrast-темы, 898 aria-атрибутов — но статичный lang="en", провал контраста muted-текста (4.12:1), мёртвый механизм defaultValue и полное отсутствие RTL.

## Резюме
i18n — собственная компактная реализация (src/i18n/, 4 файла): ключи — плоские строки, значения подгружаются динамическим import() по локалям (translations/index.ts:7–17), fallback-цепочка «текущая локаль → en → сырой ключ», dev-варнинг на отсутствующий ключ. Паритет en/ru защищён тестом i18n-keys.test.ts (в обеих локалях ровно 3604 ключа, файлы 1:1). Механика выше средней, но типизация ключей отсутствует (`TranslationKey = string`), а популярный паттерн `t(key, {defaultValue})` движком не поддерживается — 17 вызовов в 4 компонентах молча игнорируют фолбэк. По доступности: 255 файлов компонентов содержат 898 aria-атрибутов, 155 файлов — 214 role=, 33 aria-live, skip-nav и <main id="main-content"> в AppLayout, глобальные focus-visible и prefers-reduced-motion в CSS, модалки через @react-aria FocusScope. Ключевые пробелы: атрибут lang документа никогда не переключается при смене языка, основной muted-цвет даёт 4.12:1 (< WCAG AA 4.5:1) при активном использовании шрифтов 0.7–0.75rem, RTL-поддержки нет (0 совпадений `dir=`), Intl применяется лишь в 2 файлах на фоне 410 вызовов toFixed() в компонентах.

## Сводка находок

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| AI11-01 | Средний | document.documentElement.lang не обновляется при смене языка; lang="en" статичен | index.html:2; src/i18n/useTranslation.ts:15–25 |
| AI11-02 | Средний | Контраст --text-muted #71717a на #09090b = 4.12:1 < AA 4.5:1 при мелких кеглях 0.7–0.75rem | src/styles/variables.css:4,10,191–193 |
| AI11-03 | Средний | t(key, {defaultValue}) не поддерживается движком — 17 вызовов в 4 компонентах игнорируют фолбэк | src/i18n/translations/index.ts:31–60; src/components/GovernancePanel/GovernancePanel.tsx:23 |
| AI11-04 | Низкий | Недостижимые русские фолбэки `t(key) \|\| 'Русский'` — t() при промахе возвращает непустой ключ | src/components/DebateQualityPanel.tsx:270,275,281,301,320,339,425,444,497 |
| AI11-05 | Низкий | Тяжёлые RU-строки в ядре мимо i18n + DEFAULT_DEBATE_LANGUAGE='Russian' захардкожен | src/kernel/services/debate-runtime/stance-drift-tracker.ts:183; src/kernel/services/config-registry.ts:367 |
| AI11-06 | Низкий | TranslationKey = string — нет типизации ключей, опечатка компилируется | src/i18n/translations/index.ts:3; src/i18n/useTranslation.ts:28 |
| AI11-07 | Низкий | Intl используется в 2 файлах; 410 × toFixed() в 220 файлах и 170 × toLocale* — ручное форматирование | src/shared/utils/format-cost.ts:4–11; src/components/BudgetPanel/budget-utils.ts:2 |
| AI11-08 | Низкий | RTL не поддерживается: 0 установок dir= в src, стили без logical properties | src/components/AppLayout.tsx:179–195 (проверено rg 'dir=' — пусто) |
| AI11-09 | Инфо | Модалки без aria-labelledby/aria-label (role="dialog" + FocusScope есть) | src/components/ModalShell.tsx:33–36 |

## Детали находок

### AI11-01: Язык документа не переключается
Файл: `index.html:2`, `src/i18n/useTranslation.ts:15–25`
```html
<html lang="en">
```
```ts
const unsub = settingsService.subscribe((settings) => {
    const l = settings.language === 'ru' ? 'ru' : 'en';
    setLang(l);
    setLanguage(l);
    loadLocale(l);
});
```
Влияние: при переключении на ru обновляется только внутренний state — `document.documentElement.lang` остаётся "en" (rg `documentElement.lang` по src/ — 0 совпадений; обновляется лишь data-theme в AppLayout.tsx:58). Скринридер продолжает применять английские правила произношения к русскому тексту всего интерфейса (WCAG 3.1.1 Language of Page).
Рекомендация: в том же subscribe — `document.documentElement.lang = l`; начальное значение синхронизировать с settings.language при первом рендере.

### AI11-02: Muted-текст темнее порога WCAG AA
Файл: `src/styles/variables.css:4,10` (и 191–196 — кегли)
```css
--bg-main: #09090b;
--text-muted: #71717a;
```
Влияние: расчёт WCAG-контраста (относительная светимость): #71717a на #09090b = **4.12:1** — ниже 4.5:1 для обычного текста (AA проходит только как large text ≥18.66px bold / 24px). При этом `--text-muted` активно используется с кеглями `--text-xs: 0.7rem` (11.2px) и `--text-sm: 0.75rem` (12px) — вторичный текст (подписи, метаданные, hints) не проходит AA. Для сравнения: text-main 19.06:1, success 7.84:1, error 5.29:1, светлая тема text-muted 4.55:1 (проходит впритык).
Рекомендация: поднять --text-muted до #8b8b96 (~5.3:1) в тёмной теме; добавить в CI скрипт-проверку контраста пар токенов (аналог scripts/tokenize-colors.mjs).

### AI11-03: defaultValue молча игнорируется движком i18n
Файл: `src/i18n/translations/index.ts:31–60`, `src/components/GovernancePanel/GovernancePanel.tsx:23`
```ts
export function getTranslation(locale, key, params?) {
    const localeText = _loaded[locale]?.[key];
    const enText = _loaded.en?.[key];
    let text = localeText ?? enText ?? key;   // defaultValue не читается
    ...
    if (params) { for (...) text = text.replace(`{${k}}`, String(v)); }
```
```tsx
{t('governance.subtitle', { defaultValue: 'Назначение ролей observer/approver/director/auditor. Проверка can() перед HITL.' })}
```
Влияние: сигнатура t() — (key, lang?, params?) — параметр params интерполирует `{k}`, но опция `defaultValue` из react-i18next-привычки не поддерживается ни в одной точке src/i18n (rg defaultValue в src/i18n — 0). 17 вызовов в 4 компонентах (GovernancePanel, ProvenancePanel и др.) при отсутствии ключа покажут пользователю сырой ключ, а не заложенный текст.
Рекомендация: поддержать `params.defaultValue` в getTranslation (тривиально: `if (!localeText && !enText && params?.defaultValue) return params.defaultValue`) или убрать опцию из вызовов — сейчас это мёртвый контракт.

### AI11-04: Недостижимые фолбэки и русские литералы в компонентах
Файл: `src/components/DebateQualityPanel.tsx:270` (и ещё 8 мест файла)
```tsx
{t('quality.nav_title') || 'Качество дебатов'}
```
Влияние: getTranslation при промахе возвращает сам ключ (непустая строка — всегда truthy), поэтому `|| 'Русский текст'` не выполнится никогда; это ложная страховка, маскирующая реальный фолбэк-механизм. Всего rg `['\"][А-Яа-яЁё]{3,}` находит 31 совпадение в 10 из 230 файлов компонентов (4.3%): большинство — легитимные двуязычные структуры данных (TopicSuggesterPanel.tsx:20–27 `en/ru`-пары) и keyword-матчеры (BuilderAISidebar.tsx:6–9), но DebateQualityPanel — именно недостижимые UI-фолбэки.
Рекомендация: убрать `|| '…'`, положиться на parity-тест; при необходимости фолбэка — через поддержанный defaultValue (см. AI11-03).

### AI11-05: Русские шаблоны в ядре без i18n
Файл: `src/kernel/services/debate-runtime/stance-drift-tracker.ts:183`, `src/kernel/services/config-registry.ts:367`
```ts
return `### Сдвиг позиции оппонента\n${e.agentName} значительно изменил свою позицию между раундом ${e.fromRound} и раундом ${e.round} ...`;
```
```ts
export const DEFAULT_DEBATE_LANGUAGE: string = 'Russian';
```
Влияние: аналитические вставки дебат-движка (stance-drift-tracker, debate-conclusion-engine.ts:115–117 — словари маркеров «поддерживаю/согласен») и дефолт языка дебатов захардкожены на русском вне системы переводов: en-пользователь получает RU-вставки, а смена языка дебатов не централизована. Для промпт-инженерии это осознанный выбор, но он нигде не объявлен как контракт.
Рекомендация: вынести шаблоны в словарь по аналогии с techniques.ts; зафиксировать DEFAULT_DEBATE_LANGUAGE в конфиге с возможностью переопределения из настроек.

### AI11-06: Ключи переводов не типизированы
Файл: `src/i18n/translations/index.ts:3`, `src/i18n/useTranslation.ts:28`
```ts
export type TranslationKey = string;
...
const t = useCallback((key: string, params?): string => translate(key, lang, params), [lang]);
```
Влияние: при 3604 ключах опечатка в ключе (`'quallity.nav_title'`) компилируется и ловится только dev-варнингом в консоли (translations/index.ts:42–52) или пользователем. Русский ключ — просто строка в рантайме.
Рекомендация: сгенерировать union-тип ключей из ru/index.ts (code-gen скрипт уже есть в арсенале: scripts/rebuild-ru.mjs), что превратит промах в ошибку компиляции.

### AI11-07: Смешанное форматирование чисел/дат
Файл: `src/shared/utils/format-cost.ts:4–11`, `src/components/BudgetPanel/budget-utils.ts:2`
```ts
const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', ... });
```
Влияние: Intl.NumberFormat/DateTimeFormat применяются только в 2 файлах (rg `Intl\.` по src — 2 файла), тогда как `toFixed(` встречается 410 раз в 220 файлах компонентов, а toLocaleDateString/toLocaleTimeString — 170 раз в 122 файлах. Числа форматируются без привязки к активной локали (fixed 'en-US' в format-cost), даты — вперемешку с ручным `toISOString().slice()` — русский пользователь видит англо-формат чисел и непоследовательные даты между панелями.
Рекомендация: централизовать в shared/utils (fmtNumber/fmtDate с учётом settings.language) и постепенно мигрировать hottest-панели (Budget, CostAnalytics, Traces).

### AI11-08: RTL не поддерживается архитектурно
Файл: `src/components/AppLayout.tsx:179–195` (layout на фиксированных left/right)
Влияние: `rg 'dir=' src/` — 0 совпадений; раскладка и стили используют физические свойства (sidebar border-right в variables.css:131). Для текущих локалей en/ru (оба LTR) дефект не проявляется, но добавление любого RTL-языка потребует тотального рефакторинга. Оценка: осознанное ограничение, а не регресс.
Рекомендация: при планах расширения локалей — перейти на CSS logical properties (margin-inline-start и т.п.) и установить dir на documentElement вместе с lang (AI11-01).

### AI11-09: Диалоги без связки с заголовком
Файл: `src/components/ModalShell.tsx:33–36`
```tsx
<div ... onClick={onClose} role="dialog" aria-modal="true">
```
Влияние: FocusScope contain/restoreFocus/autoFocus + Escape закрытие реализованы (ModalShell.tsx:14–22, 34), но aria-labelledby/aria-label отсутствуют — скринридер объявляет «диалог» без имени. Проверено: 8 `<img>` в компонентах — все с alt (9/9), кнопки-иконки в AppLayout имеют aria-label (AppLayout.tsx:208).
Рекомендация: добавить проп `aria-label`/`labelledById` в ModalShell и прокинуть заголовок модалки.

## Положительные практики
- Паритет локалей под CI-защитой: `src/i18n/i18n-keys.test.ts:13–35` — тест падает при расхождении наборов ключей en/ru (FX-02/FL-6), сейчас ровно 3604 ключа в каждой, файлы локалей 1:1 (19 файлов).
- Ленивая загрузка локалей через dynamic import (translations/index.ts:7–17) — русские строки не попадают в начальный бандл для en-пользователей и наоборот.
- Прозрачный fallback с dev-диагностикой: warn-once на отсутствующий ключ с указанием, какая из локалей промахнулась (translations/index.ts:40–52), вместо молчаливой деградации.
- Skip-nav ссылка с обработкой focus/blur и переходом на `<main id="main-content">` (AppLayout.tsx:156–178, 195).
- Глобальные `:focus-visible { outline: 2px solid … }` и отключение outline только для мыши (base.css:271–283); `@media (prefers-reduced-motion: reduce)` гасит все анимации/переходы (base.css:286–300, panels.css:272).
- Полноценная high-contrast тема — отдельные токены поверх dark/light (variables.css:34–49, 230–287) плюс отключение backdrop-blur и утолщение границ (variables.css:121–132).
- Клавиатурная навигация: 118 onKeyDown/onKeyUp в 85 файлах компонентов; lazy-панели оборачиваются в Suspense с сохранением фокуса.
- Aria-покрытие статистически значимое: 898 aria-атрибутов в 255 файлах, 214 role= в 155 файлах, 33 aria-live (ошибки/статусы озвучиваются: TasksPanel.tsx:335–336, SkillsPanel.tsx:304–305).
- Модальный фокус-менеджмент через @react-aria/focus FocusScope (ModalShell.tsx:2, 34) в 6 файлах, включая Wizard и ProviderManager.
- Единый источник дизайн-токенов: variables.css ↔ tokens.ts (FA-02), запрет сырых hex в компонентах подкреплён eslint-правилом (fa-02, ~5k ворнингов отсчитываются в ci.yml:51–58).
