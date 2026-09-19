# Сравнение 1-к-1, седьмая десятка: ДЕБАТЫ + что дописываем

Дата: 2026-09-05. Фаза L — прокачка наших дебатов (Council, Волна 2).
Без проверок до финала. Всё на kv + council-таблицы (смены Dexie нет).

## 1. IBM Project Debater
- **У них:** argument mining (claim/evidence из текстов), rebuttal по
  структуре оппонента, нарративная сборка.
- **Было у нас:** факты руками (submitFact), майнинга аргументов нет.
- **Дописываем (L.2):** `mineClaims()` — разбивка текста на claim-кандидаты
  (эвристика + LLM), привязка evidence из Knowledge, rebuttal-скелет
  (claim→counter→evidence) в ArgTech.

## 2. Dung AF (абстрактная аргументация)
- **У них:** фреймворк аргументы+атаки, семантики grounded/preferred,
  вычислимые победители.
- **Было у нас:** только взвешенный tally судей.
- **Дописываем (L.2):** `DungService` (addArgument/addAttack, grounded
  fixed-point, preferred перебором для малых множеств) — формальный
  second opinion к вердикту судей.

## 3. Kialo
- **У них:** деревья тезисов pro/con с impact-голосами, коллапс веток.
- **Было у нас:** плоские сообщения форума, деревьев нет.
- **Дописываем (L.2):** `ClaimTree` (корень-тезис, дети pro/con, impact
  1..5 голосами, свертка ветви в score) — проецируется на council messages.

## 4. Oxford / Munk (форматные дебаты)
- **У них:** pre-vote → речи → post-vote, победитель = swing (сдвиг зала).
- **Было у нас:** голоса без замера сдвига.
- **Дописываем (L.1):** формат `oxford`: pre-vote → council run → post-vote →
  swing-метрика и победитель по свингу.

## 5. Lincoln-Douglas
- **У них:** value + criterion + contentions, рубрики (clash/evidence/strategy).
- **Было у нас:** dimensions судей свободные, value-фрейма нет.
- **Дописываем (L.1):** формат `lincoln-douglas`: value/criterion в конфиге,
  рубрика clash/evidence/strategy/delivery, contentions как proposals.

## 6. Karl Popper format
- **У них:** constructive → cross-examination → rebuttal, строгие роли.
- **Было у нас:** фазы proposal/debate/consensus без кросс-допросов.
- **Дописываем (L.1):** формат `popper`: 3 команды × (constructive, cross,
  rebuttal) как council-раунды с lens-подсказками (socrates для cross).

## 7. Deliberative Poll (Fishkin)
- **У них:** briefing-материалы + сбалансированная панель + замер сдвига мнений.
- **Было у нас:** briefing и баланс-проверки нет.
- **Дописываем (L.1):** формат `deliberative`: briefing из Knowledge/RAG +
  баланс-чек сторон + pre/post + shift-отчёт.

## 8. Prediction markets / Brier-калибровка
- **У них:** вероятности по исходам, скоринг Brier, калибровочные кривые.
- **Было у нас:** prediction-market контракт в старом runtime, в Council —
  только winnerId.
- **Дописываем (L.2):** прогнозы по клеймам (0..1) + Brier-score после
  резолюции + калибровка участников.

## 9. Adversarial Collaboration (Tetlock)
- **У них:** пре-регистрация crux-вопросов, совместное заявление, честная
  фиксация разногласий.
- **Было у нас:** consensus без crux-протокола.
- **Дописываем (L.1):** протокол `adversarial`: cruxes → дебаты → joint
  statement + residual disagreements в summary.

## 10. Toulmin model
- **У них:** claim/grounds/warrant/backing/qualifier/rebuttal — полнота
  аргумента проверяется структурно.
- **Было у нас:** аргументы свободным текстом.
- **Дописываем (L.2):** Toulmin-карточки (6 полей, completeness-score,
  слабые места = пустые поля) + маппинг в council messages.

## Карта реализации (Фаза L, phase39)
- `FormatService` (6 форматов поверх CouncilService, всё в kv + council).
- `ArgTechService` (mine/Dung/Toulmin/Brier/Kialo-деревья, kv).
- События: `format:*`, `dung:*`, `toulmin:*`, `brier:*`, `claimtree:*` (~6).
- UI: кнопки форматов в табе Councils Fleet (+i18n).
