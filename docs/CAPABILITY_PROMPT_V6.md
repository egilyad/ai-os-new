# CAPABILITY MATRIX PROMPT v6 — с поправками

## Поправки

1. **Не писать новые фичи** — только аудит, как в исходном промте.
2. **4 измерения вместо чекбокса:** Existence / Integration / Runtime / Maturity (бары 10).
3. **Статус A-G + ⏳:** `⏳ = B (Implemented, runtime not verified)` до сильного ПК. Не ставить `A` без прогона.
4. **Глубина честно:** hash embedding ≠ vector DB (оба `✅`, но Maturity 6 vs 9).
5. **10 систем — не проценты, а `strengths/gaps/иначе/уникальное`.**
6. **Порядок:** ARCHITECTURE MAP ✅ → USER CONTROL ✅ → USER ACTION → RESULT ✅ → **CAPABILITY MATRIX (этот файл)** → 10-system comparison → RUNTIME VERIFICATION (Заход 2) → FINAL GAP.
