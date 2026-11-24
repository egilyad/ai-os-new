<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# NVIDIA SkillEvaluator — оценка агентных скиллов

> Раздел: **Разработчикам** · Статус: documented · Теги: скиллы, оценка, CI, качество, безопасность, harness, skillevaluator

Источники: `AGENTS.md`, `src/components/WikiPanel/wiki-skillevaluator.ts`

## Что это

**SkillEvaluator** — открытый (Apache-2.0) фреймворк NVIDIA для проверки «агентных скиллов» (папки с `SKILL.md` по спецификации Agent Skills) и измерений того, **помогают** ли они агенту. Часть инициативы NVIDIA Verified Skills. Статус — experimental, community-supported, без SLA.

Репозиторий: [NVIDIA/SkillEvaluator](https://github.com/NVIDIA/SkillEvaluator) · документация: [docs.nvidia.com/skills/skillevaluator](https://docs.nvidia.com/skills/skillevaluator/) · PyPI: `skillevaluator` (Python 3.12–3.14).

Установка:

```bash
pip install skillevaluator
# или
uv tool install --python 3.13 skillevaluator
```

## Три уровня проверки

| Уровень | Вопрос | Команда | Что нужно |
|---|---|---|---|
| Tier 1 — Validation | Скилл корректный и безопасный? | `skillevaluator validate ./my-skill --tiers 1` | 500+ статических правил; сканеры SkillSpector, Gitleaks, Bandit, опционально Semgrep; без ключа модели |
| Tier 1 — Harness Check | Загрузит ли агент скилл? | `skillevaluator harness-check ./my-skill` | ничего: статические профили 6 харнессов |
| Tier 2 — Deduplication | Нет ли повторов и пересечений? | `skillevaluator tier2 ./my-skill` | эмбеддинги + чат-модель; `--catalog ./skill-catalog.json` для сравнения с каталогом |
| Tier 3 — Live Evaluation | Улучшает ли скилл результат? | `skillevaluator tier3 ./my-skill` | провайдер, поддерживаемый агент, песочница (Docker) |

Полный прогон: `skillevaluator doctor --env-mode docker` и `skillevaluator validate ./my-skill`.

Tier 1 гейтит `validate`; Tier 2 гейтит, если не задан `--no-block-on-dedup`; Tier 3 только с `--block-on-agent-eval`.

## Harness Check — самое ценное для нас

В версии 1.0.1 проверяются шесть харнессов: `claude-code`, `codex`, `copilot-cli`, `hermes`, `openclaw` и **`opencode`** — то есть сразу и наши скиллы в `~/.config/opencode/skills`, и скиллы в `~/.agents/skills`.

```bash
skillevaluator harness-check ~/.config/opencode/skills --json reports/harness.json
skillevaluator harness-check ./my-skill --harness opencode,codex -v
```

Вердикты: `loads` / `degraded` / `not_loaded`. Проверяются frontmatter (дубли ключей, табы, BOM), имя `SKILL.md` в точном регистре, длина `description` (у OpenCode лимит 51 200 байт или 2000 строк на доставку), подстановка `$ARGUMENTS` (в OpenCode через `/command` подставляется, но в skill tool остаётся литералом), лимиты каталога скиллов и конфликтующие имена.

Для нас это означает: один прогон linter'а ловит те же ошибки, из-за которых скилл «есть на диске, но модель его не видит».

## Как измеряется польза (Skill Lift)

Tier 3 через Harbor запускает каждый кейс дважды в изолированной песочнице — со скиллом и без него — с одинаковыми промптом, моделью и критериями оценки. Разница в баллах и есть **Skill Lift**.

Опубликованные автором усреднённые результаты по 300+ скиллам (снимок 12.08.2026, два харнесса):

| Измерение | Без скилла | Со скиллом | Skill Lift |
|---|---:|---:|---:|
| Correctness | 46 | 87 | +41 |
| Discoverability | 42 | 82 | +40 |
| Effectiveness | 39 | 78 | +39 |
| Efficiency | 43 | 78 | +35 |
| Security | 97 | 98 | +1 |
| Среднее | — | — | +31 (+39 без Security) |

Это средние баллы по заданиям, не вероятность успеха; большинство скиллов имели одну попытку на кейс.

## Первое знакомство за 10 минут

```bash
git clone --depth 1 https://github.com/NVIDIA/SkillEvaluator.git
cd SkillEvaluator
skillevaluator quality-check \
  src/skillevaluator/tier3/reference_skills/text-analyzer \
  -r cli -r json -o reports/first-quality
```

На выходе — балл из 100, оценка A–F и список замечаний. Порог по умолчанию — 70. Отчёт: `reports/first-quality/skillevaluator-quality.json`. Статус публикации останется `INCOMPLETE`, пока не пройдены безопасность и живая оценка.

Для LLM-отзыва по инструкциям: `export SKILL_EVAL_LLM_PROVIDER=nv_build`, `NVIDIA_API_KEY=...`, затем `skillevaluator rubric-eval ./my-skill -r cli -r json -o reports/rubric`.

## Как встроить в SuperAgents OS

1. **Инвентаризация.** Собрать все скиллы в один каталог-зеркало: `~/.config/opencode/skills`, `~/.agents/skills`, скиллы в `.opencode/` репозитория. Прогонять `harness-check` по каждой папке, а не по одному скиллу: профиль учитывает соседние скиллы и бюджет списка.
2. **Локальный гейт (без ключей).** `quality-check` + `harness-check` + `validate --tiers 1` перед каждым изменением. Для scheduled-проверки — `skillevaluator ci init` либо пре-commit хуки из `.pre-commit-hooks.yaml` (quality, schema, lint-scripts; требуют Python 3.13).
3. **CI в репозитории.** Скопировать готовый шаблон [skill-checks.yml](https://github.com/NVIDIA/SkillEvaluator/blob/main/ci/bundles/1.0.1/skill-checks.yml) в `.github/workflows/skill-checks.yml`, указать свои папки скиллов и `min-score` (например 80). Шаблон использует общий контейнер со сканерами — добавлять код оценки в репозиторий не нужно. Отчёты: HTML/JSON/Markdown/SARIF.
4. **Глубокий аудит (по запросу).** Tier 2 с `--catalog` покажет дубли между нашими скиллами; Tier 3 — только для скиллов, которые реально влияют на поведение агентов. Генерировать кейсы: `skillevaluator tier3 create-eval-dataset ./my-skill --full --prompt eval-guidance.md`, обязательно ревьюить сгенерированные кейсы (шаблоны не содержат негативные кейсы).
5. **Интеграция в ядро OS.** На стороне сервиса (sync-server/sidecar) обернуть CLI в `SkillEvaluationService`: принимает путь к скиллу, запускает проверки, парсит JSON-отчёт, пишет результат через EventBus в `NotificationInboxService`, сохраняет в `RunHistoryService` и связывает с Universal Graph через `RunProvenanceLinkService`. Браузер не может запускать Python — только серверный контур, local-first ядро остаётся чистым.
6. **Единые метрики.** Добавить в дашборд: quality score, долю `loads` по харнессам, число дублей Tier 2, Skill Lift Tier 3 — рядом с нашими KPI (lint, coverage, bundle). Это даст объективный критерий «скилл готов к публикации», а не субъективное мнение агента.

## Ограничения

- Инструмент experimental, без SLA; версии профилей харнессов привязаны к конкретным релизам — перепроверять после обновления OpenCode/Codex.
- Tier 2/3 требуют ключей, провайдера и Docker; модели и managed-sandbox могут стоить денег. `doctor` проверяет готовность, а не успех вывода.
- `--no-llm` не снимает требования к сканерам: сканер, который не запустился, даёт `INCOMPLETE` и ненулевой код.
- Результаты Tier 3 стохастичны; для выводов нужны повторные прогоны и доверительные интервалы, которых в открытых отчётах пока нет.

## Пилот 23.11: реальный прогон

Локально установлен SkillEvaluator 1.0.1 (venv, Python 3.14.7), проверены все 8 скиллов из `~/.config/opencode/skills`.

- **Harness Check:** до исправления Tier 1 ругался на невалидный YAML во всех 8 `SKILL.md` — значения `description` содержали двоеточие без кавычек. После обёртывания в кавычки schema-ошибки исчезли; профиль `opencode` показывает `loads` для всех 8. Остальные 5 харнессов выдают `not found` — это следствие того, что скиллы лежат только в каталоге OpenCode (адвизорное предупреждение, не ошибка).
- **Quality Check:** `overall_passed = true`, 0 критических/высоких находок, 79 предупреждений (13 уникальных правил). Баллы: `docs-writing` 81.2 (B), остальные семь — 79.5 (C).
- **Типовые пробелы:** нет примеров использования, нет секции `## Purpose`, не описаны обработка ошибок, prerequisite, ограничения и troubleshoot-паттерны. Все скиллы определены как `guide-only`.
- **После правки:** в каждый `SKILL.md` добавлены секции `## Purpose`, `## Examples`, `## Error handling`, `## Limitations`, `## Troubleshooting`. Повторный `quality-check`: **92.8/100 (Grade A) у всех 8**, предупреждений 79 → 32, `overall_passed = true`. Harness Check без schema-ошибок, OpenCode по-прежнему загружает все 8.
- **Вывод:** структура инструкции дала +13 баллов без изменения содержания — это дешевле, чем переписывать скиллы.

Команды пилота:

```bash
skillevaluator harness-check ~/.config/opencode/skills
skillevaluator quality-check ~/.config/opencode/skills -r json -o reports/quality
```

## Внедрение в репозиторий (24.11)

- Скиллы зеркалируются из `~/.config/opencode/skills` в `.opencode/skills` скриптом `npm run sync:skills` (`scripts/sync-agent-skills.mjs`); уже там лежит `github-workflow`.
- Добавлен `.github/workflows/skill-checks.yml` на основе шаблона NVIDIA 1.0.1: проверяет `.opencode/skills` на PR и push в main, `min-score: 85`, `llm: false`, сканеры из общего образа.
- Контрольный прогон перед включением: 9 скиллов, все проходят; минимум 87.2 (github-workflow, B), остальные 92.8 (A).
- Tier 2 требует провайдера эмбеддингов (`SKILL_EVAL_EMBEDDING_PROVIDER` + ключ) — без ключа не запускается, поэтому в CI пока только Tier 1.

## Связь с нашей архитектурой

SkillEvaluator закрывает то же место для **скиллов**, которое CI и тесты закрывают для кода: gating до merge + измерение реальной пользы. Это логичное продолжение наших контрольных точек: EventBus → inbox → run history → provenance graph → метрики качества.

---

## Связанные материалы

- [Разработчикам: ворота качества и CI](./dev-ci.md)
- [Разработчикам: тесты](./dev-testing.md)
- [Скрипты и CLI](./dev-scripts.md)
- [Разработчикам: генераторы и сгенерированные файлы](./dev-generators.md)

[← Все материалы](./README.md)
