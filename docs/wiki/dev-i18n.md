<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Разработчикам: локализация (i18n)

> Раздел: **Разработчикам** · Статус: verified · Теги: dev, i18n, локали

Источники: `src/i18n/`, `src/i18n/i18n-keys.test.ts`

## Структура

- `src/i18n/translations/{en,ru}/<namespace>.ts` — словари по неймспейсам (chat, debate, memory, providers, settings, workspace, agents, analytics, budget, common, dashboard, dyad, errors, governance, groupChat, integrations, nav, observability, quality).
- `index.ts` собирает их через spread.
- `useTranslation()` → функция `t(key, params?)`. Пропущенный ключ рендерится как сырой ключ.

## Жёсткое правило: паритет

Тест `src/i18n/i18n-keys.test.ts` требует совпадения наборов ключей en ↔ ru. Добавил ключ в en — добавь в ru (и наоборот), иначе CI красный.

## Как добавить строку

1. Ключ в нужный неймспейс en и ru (наборы — идентичны).
2. В компоненте `const { t } = useTranslation();` и `t('ns.key')`.
3. Никакого хардкода UI-текста и «временных» английских строк.

Счётчики ключей по неймспейсам и верхнеуровневые префиксы — в [Каталог локализации](./dev-i18n-catalog.md).

---

## Связанные материалы

- [Каталог локализации](./dev-i18n-catalog.md)
- [Разработчикам: компоненты и панели](./dev-components.md)
- [Разработчикам: маршруты и добавление панели](./dev-routing.md)

[← Все материалы](./README.md)
