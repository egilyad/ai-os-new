---
title: Демо — промпт для Browser Use (Playwright)
category: browser-use
usage: Автоматизация веб-страниц через Playwright MCP
price: medium
---

# Промпт: Browser Use (Playwright)

## Назначение

Шаблон для веб-автоматизации через Playwright MCP: навигация,
снапшоты, клики, ввод, сетевые запросы, скриншоты.

## Промпт

```
Выполни действие в браузере с помощью Playwright MCP:

1. Открой страницу: navigate <URL>.
2. Получи снапшот (snapshot) — разберись в структуре (ref).
3. Взаимодействуй: click / type / fill_form по ref или селектору.
4. Проверь результат: network_requests, console_messages, снова snapshot.
5. При необходимости сделай скриншот (take_screenshot).

Ожидание: используй wait_for для динамических элементов.
```

## Заметки

- Playwright MCP подключён в opencode.jsonc (type: local).
- Пригодится для проверки UI и «живых» данных.
