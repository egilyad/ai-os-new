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

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `argument-graph` → маршрут `/argument-graph`
  - Компонент: `src/components/ArgumentGraphPanel/ArgumentGraphPanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `steelman` → маршрут `/steelman`
  - Компонент: `src/components/SteelmanPanel/SteelmanPanel`
  - Тесты: `src/components/SteelmanPanel/SteelmanPanel.test.tsx`
- Панель `bayesian-judge` → маршрут `/bayesian-judge`
  - Компонент: `src/components/BayesianJudgePanel/BayesianJudgePanel`
  - Тесты: `src/components/BayesianJudgePanel/BayesianJudgePanel.test.tsx`
- Панель `credibility` → маршрут `/credibility`
  - Компонент: `src/components/CredibilityPanel/CredibilityPanel`
  - Тесты: `src/components/CredibilityPanel/CredibilityPanel.test.tsx`
- Панель `frame-tracker` → маршрут `/frame-tracker`
  - Компонент: `src/components/FrameTrackerPanel/FrameTrackerPanel`
  - Тесты: `src/components/FrameTrackerPanel/FrameTrackerPanel.test.tsx`
- Панель `stance-drift` → маршрут `/stance-drift`
  - Компонент: `src/components/StanceDriftPanel/StanceDriftPanel`
  - Тесты: `src/components/StanceDriftPanel/StanceDriftPanel.test.tsx`
- Панель `anchoring` → маршрут `/anchoring`
  - Компонент: `src/components/AnchoringPanel/AnchoringPanel`
  - Тесты: `src/components/AnchoringPanel/AnchoringPanel.test.tsx`
- Панель `concept-blender` → маршрут `/concept-blender`
  - Компонент: `src/components/ConceptBlenderPanel/ConceptBlenderPanel`
  - Тесты: `src/components/ConceptBlenderPanel/ConceptBlenderPanel.test.tsx`
- Панель `belief-mining` → маршрут `/belief-mining`
  - Компонент: `src/components/BeliefMiningPanel/BeliefMiningPanel`
  - Тесты: `src/components/BeliefMiningPanel/BeliefMiningPanel.test.tsx`
- Панель `expert-witness` → маршрут `/expert-witness`
  - Компонент: `src/components/ExpertWitnessPanel/ExpertWitnessPanel`
  - Тесты: `src/components/ExpertWitnessPanel/ExpertWitnessPanel.test.tsx`
- Панель `rhetoric` → маршрут `/rhetoric`
  - Компонент: `src/components/RhetoricPanel/RhetoricPanel`
  - Тесты: `src/components/RhetoricPanel/RhetoricPanel.test.tsx`
- Панель `bias-profiler` → маршрут `/bias-profiler`
  - Компонент: `src/components/BiasProfilerPanel/BiasProfilerPanel`
  - Тесты: `src/components/BiasProfilerPanel/BiasProfilerPanel.test.tsx`
- Панель `incentive-detector` → маршрут `/incentive-detector`
  - Компонент: `src/components/IncentiveDetectorPanel/IncentiveDetectorPanel`
  - Тесты: `src/components/IncentiveDetectorPanel/IncentiveDetectorPanel.test.tsx`
- Панель `stakeholder` → маршрут `/stakeholder`
  - Компонент: `src/components/StakeholderPanel/StakeholderPanel`
  - Тесты: `src/components/StakeholderPanel/StakeholderPanel.test.tsx`
- Панель `got-deliberation` → маршрут `/got-deliberation`
  - Компонент: `src/components/GoTDeliberationPanel/GoTDeliberationPanel`
  - Тесты: `src/components/GoTDeliberationPanel/GoTDeliberationPanel.test.tsx`
- Панель `adversarial-source` → маршрут `/adversarial-source`
  - Компонент: `src/components/AdversarialSourcePanel/AdversarialSourcePanel`
  - Тесты: `src/components/AdversarialSourcePanel/AdversarialSourcePanel.test.tsx`
- Панель `vuln-targeting` → маршрут `/vuln-targeting`
  - Компонент: `src/components/VulnTargetingPanel/VulnTargetingPanel`
  - Тесты: `src/components/VulnTargetingPanel/VulnTargetingPanel.test.tsx`
- Панель `justification` → маршрут `/justification`
  - Компонент: `src/components/JustificationPanel/JustificationPanel`
  - Тесты: `src/components/JustificationPanel/JustificationPanel.test.tsx`
- Панель `logical-form` → маршрут `/logical-form`
  - Компонент: `src/components/LogicalFormPanel/LogicalFormPanel`
  - Тесты: `src/components/LogicalFormPanel/LogicalFormPanel.test.tsx`

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
