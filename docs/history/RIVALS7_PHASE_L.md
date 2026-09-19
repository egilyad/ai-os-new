# Phase L — Дебатный паритет (DONE, без проверок)

Дата: 2026-09-05. Сравнения 1-к-1: `RIVALS7_COMPARE.md`. Проверки — на финал.
Прокачка Council (Волна 2), сам Council не тронут.

## Что сделано

### L.1 Форматы (Oxford/Munk/LD/Popper/Poll/AdvCollab)
- `FormatService.run()` поверх реального CouncilService:
  - `oxford`/`munk`: pre-vote → council → post-vote → swing и победитель.
  - `lincoln-douglas`: value/criterion в топике, судья с рубрикой
    clash/evidence/strategy/delivery, contentions как proposals.
  - `popper`: 3 раунда (constructive/cross с lens socrates/rebuttal) как
    связанные council-сессии.
  - `deliberative`: briefing через RagService + баланс-чек сторон +
    pre/post shift.
  - `adversarial`: crux-факты → дебаты → joint statement + residuals в summary.
- Прогоны persist в kv (`format-runs/*`), события `format:start/done`.

### L.2 ArgTech (mining/Dung/Toulmin/Brier/Kialo)
- `mineClaims` — эвристика claim-маркеров + LLM-фallback + evidenceHint.
- Dung: `addDungArgument/addDungAttack`, `groundedExtension` (fixed-point),
  `preferredExtensions` (перебор ≤12).
- Toulmin-карточки: 6 полей, completeness-score, gaps (пустые поля).
- Brier: прогнозы 0..1 по клеймам, `resolveClaim` → score + событие.
- Kialo-деревья: thesis → pro/con ветки, impact-голоса 1..5, рекурсивный
  score с затуханием 0.5, вердикт pro/con/balanced.

### Wiring
- **Без смены Dexie** (kv + council-таблицы).
- `phase39-debateplus` (2 сервиса), 5 событий, lazy-сервисы,
  кнопки 6 форматов + mine в табе Councils Fleet (+i18n en/ru).

## Отложено на финальную проверку
- typecheck/build/tests/lint по debateplus-срезу, e2e
  format→swing→dung→toulmin→brier→claimtree→store.

## Дальше — финальная проверка всего вместе, когда скажешь.
