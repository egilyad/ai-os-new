<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Статистика тестов

> Раздел: **Разработчикам** · Статус: verified · Теги: тесты, статистика, метрики

Источники: `src`, `e2e`

## Реальные замеры (на момент написания)

| Метрика | Значение |
| --- | --- |
| Unit-тест-файлов (src) | **671** |
| Unit-тестов (it/test) | **≈ 4426** |
| E2E-спек-файлов | **23** |
| E2E-тестов | **≈ 65** |
| Срезов полной unit-матрицы CI | **17** |
| E2E-шардов CI | **12** |

### Распределение unit-файлов по каталогам

| Каталог | Файлов |
| --- | --- |
| src/kernel | 453 |
| src/components | 169 |
| src/llm | 27 |
| src/stores | 14 |
| src/hooks | 3 |
| src/tests | 2 |
| src/shared, src/i18n | 1 |

### Что значат «17 срезов»

Полная unit-матрица: kernel-debate, kernel-svc-a, kernel-svc-r1a1/r1a2/r1a2-2/r1a2-3/r1a2b/r1b/r2,
kernel-svc-a2/a3/a4/b, kernel-rest, components-a, components-b1…b7, rest.


---

## Связанные материалы

- [Каталог тестов](./testing-catalog.md)

[← Все материалы](./README.md)
