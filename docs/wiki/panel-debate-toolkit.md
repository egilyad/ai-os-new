<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Инструменты анализа дебатов

> Раздел: **Панели** · Статус: documented · Теги: панель, дебаты, анализ, аргументация, инструкция

Источники: `src/i18n/translations/en/nav.ts`, `src/components/LogicalFormPanel/`, `src/components/SteelmanPanel/`, `src/components/BayesianJudgePanel/`

## Назначение

Набор эвристик анализа аргументации. Каждая — отдельная панель с меткой из `nav.*`; часть работает поверх текста дебатов.

## Инструменты

- **Logical Form** — приведение утверждений к логической форме.
- **Rhetoric** — разбор риторических приёмов.
- **Steelman** — усиление позиции оппонента до сильнейшей версии.
- **Bayesian Judge** — байесовская оценка убедительности.
- **Belief Mining** — извлечение убеждений из текста.
- **Stance Drift** — дрейф позиции во времени.
- **Expert Witness** — оценка экспертного свидетельства.
- **Stakeholder** — интересы стейкхолдеров.
- **Vuln Targeting** — поиск уязвимых мест аргумента.
- **Adversarial Source** — оценка враждебного источника.
- **Credibility** — оценка достоверности.
- **Bias Profiler** — профиль когнитивных искажений.
- **Anchoring** — эффект якоря.
- **Justification** — оценка обоснованности.
- **Incentive Detector** — скрытые мотивы и стимулы.
- **Frame Tracker** — отслеживание фреймов.
- **Concept Blender** — смешение концепций.
- **GoT Deliberation** — делиберация над графом мыслей.
- **Argument Graph** — граф аргументов.

## Где менять

Компоненты: `LogicalFormPanel`, `RhetoricPanel`, `SteelmanPanel`, `BayesianJudgePanel` и родственные. Метки — `nav.*`.

---

## Связанные материалы

- [Дебаты: режимы и механика](./debates.md)
- [Панель: Анализ дебатов](./panel-debate-analysis.md)
- [Панель: Синтез мнений](./panel-synthesis.md)

[← Все материалы](./README.md)
