<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Record a Skill: процедурная память агента

> Раздел: **Знания и память** · Статус: documented · Теги: навыки, память, процедуры, P2-1

Источники: `src/kernel/services/skill-service.ts`, `src/kernel/contracts/storage/skills-store.ts`, `src/kernel/types/domain-types.ts`

## Что это

**Record a Skill** (P2-1) — процедурная память агента: возможность **записать переиспользуемый навык** из выполненной задачи. Если агент нашёл рабочий способ что-то сделать, он может сохранить его как навык и применять в будущем.

## Модель навыка

Навык (`CognitiveSkill`) — это карточка с полями:

| Поле | Что значит |
| --- | --- |
| `id` | Уникальный идентификатор |
| `name` | Название (например «Отладка vitest») |
| `description` | Короткое описание |
| `category` | analysis / generation / orchestration / utility |
| `status` | installed / active / not_installed |
| `toolsUsed` | Какие инструменты пригодятся |
| `version` | Версия навыка |
| `executionCount` | Сколько раз применялся |

Навыки хранятся через `SkillsStore` и управляются `SkillService`.

## Метод recordSkill

Метод `recordSkill(input)` создаёт новый навык, помечает его как установленный (`status: 'installed'`, `executionCount: 0`), сохраняет в хранилище и уведомляет систему (`SKILLS_UPDATED`).

```ts
await skillService.recordSkill({
  name: 'Отладка vitest',
  description: 'Запуск и разбор провалов тестов',
  category: 'utility',
  toolsUsed: ['npx vitest run'],
});
```

## Пример: записать навык из задачи

1. Агент выполнил задачу «починить тест» и понял, как это делать.
2. Он вызывает `recordSkill({ name: 'Отладка vitest', description: '...', toolsUsed: ['vitest'] })`.
3. Навык появляется в библиотеке и доступен в пикере.
4. В следующий раз агент ищет навык, находит его и применяет (`incrementExecution` увеличивает счётчик использований).

## Где это в коде

- `src/kernel/services/skill-service.ts` — `SkillService` + `recordSkill`.
- `src/kernel/contracts/storage/skills-store.ts` — интерфейс хранилища.
- `src/kernel/types/domain-types.ts` — тип `CognitiveSkill`.
- Пометка «навык» появляется у ролей/агентов в библиотеке.

## Советы

- Имя делай коротким и понятным — оно ищется подстрокой.
- В `toolsUsed` перечисляй реальные команды/инструменты.
- Разделяй «общий навык» и «специфичный для проекта» через описание.
- Периодически удаляй неиспользуемые навыки (`remove`), чтобы библиотека не засорялась.

---

## Связанные материалы

- [Знания и память](./memory.md)
- [Агенты: устройство и управление](./agents.md)
- [Роли агентов: как настраивать и использовать](./roles-for-agents.md)
- [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md)

[← Все материалы](./README.md)
