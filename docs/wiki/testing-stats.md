<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Статистика тестов

> Раздел: **Разработчикам** · Статус: documented · Теги: тесты, статистика, метрики

Источники: `package.json`, `vitest.config.ts`

## Реальные замеры (на момент написания)

| Метрика | Значение |
| --- | --- |
| Unit-тест-файлов (src) | **671** |
| Unit-тестов (it/test) | **≈ 4426** |
| E2E-спек-файлов | **23** |
| E2E-тестов | **≈ 65** |
| Срезов полной unit-матрицы CI | **23** |
| E2E-шардов CI | **12** |
| Проверок в джобе Unit Tests | **2** (test:stable + test:server) |

Метод замера: Get-ChildItem -Recurse src -Include *.test.ts,*.test.tsx и подсчёт
регуляркой ^s*(it|test)( по содержимому. Дата замера: 2026-11-11.

### Распределение unit-файлов по каталогам

| Каталог | Файлов |
| --- | --- |
| src/kernel | 453 |
| src/components | 169 |
| src/llm | 27 |
| src/stores | 14 |
| src/hooks | 3 |
| src/tests | 2 |
| src/shared | 1 |
| src/i18n | 1 |
| корень src (единичные файлы) | 1 |

### Что значат «23 среза»

Полная unit-матрица: kernel-debate, kernel-svc-a, kernel-svc-r1a1, kernel-svc-r1a2,
kernel-svc-r1a2-2, kernel-svc-r1a2-3, kernel-svc-r1a2b, kernel-svc-r1b, kernel-svc-r2,
kernel-svc-a2, kernel-svc-a3, kernel-svc-a4, kernel-svc-b, kernel-rest,
components-a, components-b1 … components-b7, rest.


---

## Связанные материалы

- [Каталог тестов](./testing-catalog.md)

[← Все материалы](./README.md)
