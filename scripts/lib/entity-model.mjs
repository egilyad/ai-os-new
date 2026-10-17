// Stage 2 — documentation architecture. ONE source of truth for the standard:
// the entity card model, confidence statuses, sources of truth, id conventions,
// the language policy and history rules. From this, gen-wiki-docs-standard.mjs
// produces docs/entity-model.json (for agents) and the wiki article (for people).
// Edit here, then re-run the generator.

export const STANDARD_VERSION = 1;

export const PURPOSE = [
    'Это логика документации проекта: что мы считаем фактом, откуда берём данные и как',
    'различаем реализованное, проверенное и запланированное. Остальные статьи и каталоги',
    'опираются на этот стандарт. Он отражает текущую систему (вики, manifest, генераторы),',
    'а не вводит параллельную инфраструктуру.',
];

export const CATEGORIES = [
    { id: 'wiki', where: 'docs/wiki/ + панель Wiki', role: 'Полная документация: гайды, домены, панели, зоны, каталоги', generated: true },
    { id: 'top', where: 'docs/*.md', role: 'Крупные описания (архитектура, сервисы, манифест, реестр)', generated: false },
    { id: 'reference', where: 'docs/reference/', role: 'Нормативные справочники, матрицы, контракты', generated: false },
    { id: 'roadmap', where: 'docs/roadmap/', role: 'Планы и направления (не текущее состояние)', generated: false },
    { id: 'audits', where: 'docs/audits/', role: 'Отчёты проверок; хранятся как история', generated: false },
    { id: 'history', where: 'docs/history/', role: 'Архив старого с исторической ценностью', generated: false },
    { id: 'superseded', where: 'docs/superseded/', role: 'Заменённое другим документом', generated: false },
    { id: 'active', where: 'docs/active/', role: 'Текущая рабочая документация', generated: false },
    { id: 'new', where: 'docs/new/', role: 'Черновики (в основном вне git)', generated: false },
    { id: 'repo', where: 'корень репозитория, .superagents/, src/kernel/DEPENDENCY_MAP.md', role: 'Входные документы репозитория: README, AGENTS, CHANGELOG, правила агентов', generated: false },
];

export const ENTITY_MODEL = [
    { name: 'id', required: true, auto: true, contains: 'Стабильный идентификатор: wiki:<slug>, panel:<id>', mapsTo: 'id' },
    { name: 'title', required: true, auto: true, contains: 'Человекочитаемое название', mapsTo: 'title' },
    { name: 'type', required: true, auto: true, contains: 'Тип сущности: article | panel | service | event | …', mapsTo: 'type' },
    { name: 'summary', required: false, auto: false, contains: 'Краткое назначение в одну строку', mapsTo: '—' },
    { name: 'purpose', required: false, auto: false, contains: 'Зачем сущность существует', mapsTo: '—' },
    { name: 'status', required: true, auto: true, contains: 'Статус достоверности (см. ниже), не путать с реализацией', mapsTo: 'status' },
    { name: 'language', required: false, auto: true, contains: 'Язык материала: ru | en | mixed', mapsTo: '—' },
    { name: 'audience', required: false, auto: false, contains: 'Для кого: новичок, пользователь, разработчик…', mapsTo: '—' },
    { name: 'source_files', required: false, auto: true, contains: 'Файлы-источники утверждения', mapsTo: 'sources' },
    { name: 'test_files', required: false, auto: true, contains: 'Проверяющие тесты', mapsTo: 'tests' },
    { name: 'related_docs', required: false, auto: true, contains: 'Связанные статьи вики', mapsTo: 'related' },
    { name: 'related_entities', required: false, auto: true, contains: 'Связанные сущности (панели, сервисы)', mapsTo: '—' },
    { name: 'related_commits', required: false, auto: false, contains: 'Ссылки на коммиты', mapsTo: '—' },
    { name: 'related_audits', required: false, auto: false, contains: 'Связанные аудиты', mapsTo: '—' },
    { name: 'known_issues', required: false, auto: false, contains: 'Известные проблемы', mapsTo: '—' },
    { name: 'evidence', required: false, auto: true, contains: 'Чем подтверждено (файл/тест/запуск)', mapsTo: 'tests' },
    { name: 'reviewed', required: false, auto: true, contains: 'Кто и когда проверил содержание, а не только ссылки: { at, by }', mapsTo: 'reviewed' },
    { name: 'verification_method', required: false, auto: false, contains: 'Как проверить утверждение', mapsTo: '—' },
    { name: 'confidence', required: false, auto: false, contains: 'Степень достоверности', mapsTo: 'status' },
    { name: 'generated', required: true, auto: true, contains: 'Собрано генератором (да) или написано человеком (нет)', mapsTo: '—' },
    { name: 'manual_sections', required: false, auto: false, contains: 'Ручные разделы, которые генерация не стирает', mapsTo: '—' },
    { name: 'history', required: false, auto: false, contains: 'История изменений сущности', mapsTo: '—' },
];

// Separate "implementation" from "verification" — the program's key rule.
export const STATUSES = [
    { id: 'verified', ru: 'Проверено', dimension: 'verification', meaning: 'Подтверждено указанным способом (код + тест/запуск).' },
    { id: 'unverified', ru: 'Требует проверки', dimension: 'verification', meaning: 'Сведения есть, но подтверждения нет.' },
    { id: 'unknown', ru: 'Неизвестно', dimension: 'verification', meaning: 'Достоверных сведений недостаточно.' },
    { id: 'implemented', ru: 'Реализовано', dimension: 'implementation', meaning: 'Реализация найдена, тесты не гарантированы.' },
    { id: 'partially_implemented', ru: 'Частично', dimension: 'implementation', meaning: 'Реализована только часть заявленного.' },
    { id: 'planned', ru: 'Запланировано', dimension: 'implementation', meaning: 'Заявлено, но не реализовано.' },
    { id: 'experimental', ru: 'Экспериментально', dimension: 'implementation', meaning: 'Опытная реализация.' },
    { id: 'simulated', ru: 'Симуляция', dimension: 'implementation', meaning: 'Демонстрационный/симулированный режим.' },
    { id: 'deprecated', ru: 'Устарело', dimension: 'lifecycle', meaning: 'Механизм выводится из употребления.' },
    { id: 'historical', ru: 'Историческое', dimension: 'lifecycle', meaning: 'Материал о прошлом состоянии.' },
];

// Bridge from the values used by the wiki corpus (freshness) to the vocabulary.
export const FRESHNESS_MAP = [
    { freshness: 'verified', ru: 'Подтверждено кодом', status: 'verified' },
    { freshness: 'documented', ru: 'Из документов', status: 'implemented' },
    { freshness: 'needs-check', ru: 'Требует проверки', status: 'unverified' },
    { freshness: 'not-implemented', ru: 'Не реализовано', status: 'planned' },
];

export const SOURCES_OF_TRUTH = [
    { subject: 'Существование кода, сервиса, панели', source: 'Исходники репозитория', check: 'Файл/символ резолвится (docs:health resolveModule)' },
    { subject: 'Панель → маршрут → компонент', source: 'src/route-registry-*.ts, src/route-imports.ts', check: 'Каталог панелей / manifest' },
    { subject: 'Успешность теста', source: 'Результат запуска в CI', check: 'Зелёный job, не «тест существует»' },
    { subject: 'Текущее устройство системы', source: 'Код + вики-корпус (wiki-articles.ts)', check: 'docs/wiki и manifest' },
    { subject: 'Историческое решение/проблема', source: 'Исходный отчёт (audits/, zones)', check: 'Файл отчёта, не его пересказ' },
    { subject: 'План/будущее', source: 'docs/roadmap/ и раздел «История»', check: 'Не выдаётся за реализованное' },
    { subject: 'Состояние документации', source: 'docs:health + docs/inventory.json', check: 'Реальный прогон проверок' },
    { subject: 'Связи сущностей', source: 'Генераторы связей (manifest, wiki-connections)', check: 'Подтверждаются кодом, не совпадением имён' },
];

export const ID_CONVENTIONS = [
    { kind: 'Статья вики', pattern: 'wiki:<slug>', example: 'wiki:panel-chat' },
    { kind: 'Панель', pattern: 'panel:<nav-id>', example: 'panel:chat' },
    { kind: 'Документ вне вики', pattern: 'путь от корня', example: 'docs/audits/…md' },
];

export const LANGUAGE_POLICY = {
    primary: 'ru',
    note: 'Основной язык подробной документации — русский. Английские названия сущностей, библиотек и API сохраняются как есть.',
    english: {
        file: 'README_EN.md',
        status: 'mirror',
        detail: 'Английский README — зеркало входа: те же ссылки в вики, что и в русском (паритет проверяет docs:health). Сами статьи вики — русскоязычные; статус EN — «вход синхронизирован, содержимое вики на русском».',
    },
};

export const HISTORY_RULES = [
    'Оригинальные отчёты (audits/, history/, зоны) сохраняются без смысловой переписи.',
    'Устаревшее переносится в архив, а не удаляется.',
    'Исправление очевидной ошибки в историческом отчёте помечается явно с сохранением происхождения.',
    'Текущее состояние не смешивается с историей: зона — это запись о прошлой работе, а не описание сегодняшнего кода.',
    'Каждый значимый показатель имеет источник и метод подсчёта.',
];

export const STANDARD = {
    version: STANDARD_VERSION,
    purpose: PURPOSE,
    categories: CATEGORIES,
    entityModel: ENTITY_MODEL,
    statuses: STATUSES,
    freshnessMap: FRESHNESS_MAP,
    sourcesOfTruth: SOURCES_OF_TRUTH,
    idConventions: ID_CONVENTIONS,
    languagePolicy: LANGUAGE_POLICY,
    historyRules: HISTORY_RULES,
};
