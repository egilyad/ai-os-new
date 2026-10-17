<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: Файлы, редакторы, обучение, голос

> Раздел: **Панели** · Статус: documented · Теги: панель, файлы, редакторы, обучение, голос, инструкция

Источники: `src/i18n/translations/en/nav.ts`, `src/components/WorkspacePanel/WorkspacePanel.tsx`, `src/components/Editors/EditorsPanel`

## Назначение

Работа с файлами, редакторы, обучение и голосовой ввод. Метки — `nav.*`.

## Инструменты

- **Files** — рабочее пространство файлов (`WorkspacePanel`).
- **Editors** — редакторы содержимого.
- **Tutorials** — обучающие материалы (`LearnHubPanel`).
- **Voice & Multimodal** — голосовой и мультимодальный ввод.

## Где менять

Компоненты: `WorkspacePanel`, `EditorsPanel`, `LearnHubPanel`, `VoiceInputPanel`.

---

## Связанные материалы

- [Панель: Чат](./panel-chat.md)
- [Панель: Библиотека промптов](./panel-prompt-library.md)
- [Каталог компонентов OS](./dev-component-catalog.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `tutorials` → маршрут `/tutorials`
  - Компонент: `src/components/LearnHubPanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `editors` → маршрут `/editors`
  - Компонент: `src/components/Editors/EditorsPanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `voice-input` → маршрут `/voice-input`
  - Компонент: `src/components/VoiceInputPanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `files` → маршрут `/files`
  - Компонент: `src/components/WorkspacePanel/WorkspacePanel`
  - Тесты: `src/components/WorkspacePanel/WorkspacePanel.test.tsx`

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
