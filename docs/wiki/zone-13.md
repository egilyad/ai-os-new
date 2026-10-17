<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 13: коммуникации

> Раздел: **История разработки** · Статус: verified · Теги: аудит, зона 13

## Что проверено и исправлено

- GroupChatPanel: списки/сортировки/поиск/карточки/тёрны — guards на legacy без members/turns/speaker/createdAt; сортировка по ?? 0; статус-бейдж с фолбэком.
- ForumPanel: все 8 сервисных вызовов были голыми (unhandled + молчаливый stale UI) — теперь runGuarded с баннером; топики/heatmap терпят не-массив и NaN postCount.
- ChannelPanel: send/edit/delete/reaction/create/seed/thread — все через runGuarded с баннером; поллинг members/presence/typing глушит rejections и терпит не-массивы.
- ChannelPanel: legacy-сообщения без content/reactions/createdAt — рендер без краша («—» вместо Invalid Date).
- Ключи: groupChat.history.hint, forum.error.generic, channels.error.generic (en+ru).
- Тесты: GroupChatPanel.test переписан под текущий UI (был мёртв целиком — чипы вместо текстового membersPlaceholder, listitem'ов нет): 4/4. ForumPanel 5/5 (+2). ChannelPanel 5/5 (мок в instance-форму + 2 новых).

## Отложено, требует проверки

- TopicView/TopicList/PostComposer/ModerationQueue/ForumHeatmap — только через интеграционные тесты панели, прямых юнитов нет.
- groupChatService/select-логика nextTurn (speaker auto-pick) — живьём не гонялась, только моки.
- Channel thread-панель и реакции — рендер есть, живого multi-user сценария нет.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
