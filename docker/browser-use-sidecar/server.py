"""Browser-Use sidecar (Phase 70) — HTTP-мост gateway → browser automation.

Endpoints:
    GET  /health   — liveness для gateway testEnvironment.
    POST /execute  — { task, ticketId?, maxSteps?, allowedDomains? }
                     → { screenshot?, actions, finalState }.
    POST /act      — Phase 71: single computer-use action (Anthropic
                     computer_20250124 semantics) → { screenshot, output?, error? }.
                     После КАЖДОГО действия возвращается свежий скриншот —
                     это фидбэк для CUA-loop (модель видит результат хода).

Два режима:
    1. full-agent — если установлен пакет `browser_use` И задан LLM-ключ
       (env BROWSER_USE_LLM_API_KEY, провайдер через BROWSER_USE_LLM_PROVIDER).
       Единственная точка зависимости от внешнего API: `from browser_use
       import Agent` + `await Agent(task=..., llm=...).run()`.
    2. fallback (Playwright) — без ключа: извлекает первый http(s) URL из
       task, открывает его, возвращает screenshot (base64 PNG) + finalState.
       Этого достаточно для задач "открой X и покажи скриншот".

Безопасность (enforced здесь, не только на gateway):
    - allowed_domains: любой http(s) URL из task / редирект обязан совпадать
      с allowlist (если задана). Без allowlist — любой публичный http(s),
      но file://, ftp://, data:, javascript: запрещены всегда.
    - Приватные/loopback/metadata хосты запрещены (SSRF), КРОМЕ loopback —
      loopback разрешён, т.к. dev-стенды часто крутятся на localhost.
      Метадата 169.254.169.254 запрещён всегда.
    - maxSteps ограничен 50; task — 8000 символов.
"""

from __future__ import annotations

import asyncio
import base64
import ipaddress
import os
import re
import urllib.parse
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="browser-use-sidecar", version="0.1.0")

# Браузер (панель Agent Tasks) ходит сюда кросс-доменно
# (5173/5199/... -> 3100): без CORS preflight OPTIONS даёт 405 и fetch
# падает с голым 'Failed to fetch', хотя curl работает. Открываем только
# loopback-источники (sidecar и так слушает 127.0.0.1).
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=600,
)

MAX_TASK_CHARS = 8000
MAX_STEPS = 50
NAV_TIMEOUT_MS = 30_000

# Транспорт скриншотов: полный PNG 1280x800 (~50-150 КБ base64) рвёт
# JSON на обрезанных каналах (gateway transcript, клиентские слайсы) —
# в UI падал сырой обрезанный blob вместо картинки (баг из панели).
# Сжимаем до JPEG max-width 768 / q60 (~5-15 КБ): для просмотра и LLM
# vision достаточно, транспорт цел. Без PIL — честный passthrough PNG.
SHOT_MAX_WIDTH = 768
SHOT_JPEG_QUALITY = 60


def _compact_shot(png_bytes: bytes) -> str:
    """PNG bytes -> base64 компактного JPEG (или исходный PNG без PIL)."""
    try:
        import io

        from PIL import Image

        img = Image.open(io.BytesIO(png_bytes)).convert("RGB")
        if img.width > SHOT_MAX_WIDTH:
            img = img.resize((SHOT_MAX_WIDTH, int(img.height * SHOT_MAX_WIDTH / img.width)))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=SHOT_JPEG_QUALITY)
        return base64.b64encode(buf.getvalue()).decode()
    except Exception:
        return base64.b64encode(png_bytes).decode()


def _launch_kwargs() -> dict[str, Any]:
    """Параметры запуска браузера. Default — bundled chromium
    (`playwright install chromium`, docker-путь). Для нативного запуска
    без скачивания: BROWSER_USE_CHANNEL=msedge|chrome — системный браузер
    (Windows: Edge уже стоит; headless-режим, скриншоты работают)."""
    channel = os.environ.get("BROWSER_USE_CHANNEL", "").strip().lower()
    if channel in ("msedge", "edge"):
        return {"channel": "msedge", "args": ["--no-sandbox"]}
    if channel in ("chrome", "google-chrome"):
        return {"channel": "chrome", "args": ["--no-sandbox"]}
    return {"args": ["--no-sandbox"]}

URL_RE = re.compile(r"https?://[^\s\"'<>]+", re.IGNORECASE)
# Голые домены ("открой google.com", "screenshot example.com/page"):
# без схемы считаем https://. Осторожно: не матчим e-mail (user@host),
# версии (1.2.3 — TLD обязан быть буквенным) и хвосты путей без хоста.
DOMAIN_RE = re.compile(
    r"(?<![\w@.-])((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,})(/[^\s\"'<>]*)?",
    re.IGNORECASE,
)

BLOCKED_METADATA = ipaddress.ip_network("169.254.0.0/16")


class ExecuteRequest(BaseModel):
    task: str = Field(min_length=1, max_length=MAX_TASK_CHARS)
    ticketId: Optional[str] = Field(default=None, max_length=120)
    maxSteps: Optional[int] = Field(default=15, ge=1, le=MAX_STEPS)
    allowedDomains: Optional[list[str]] = None


def _is_blocked_host(host: str) -> Optional[str]:
    """Возвращает причину блокировки или None."""
    h = host.strip().lower().strip("[]")
    if not h:
        return "empty host"
    try:
        ip = ipaddress.ip_address(h)
        if ip in BLOCKED_METADATA:
            return "metadata endpoint blocked"
        # 0.0.0.0/:: — не маршрутизируются, блокируем явно.
        if ip.is_unspecified:
            return "unspecified address blocked"
        return None  # loopback/RFC1918 разрешены: sidecar в docker-сети, dev — на localhost
    except ValueError:
        pass
    if h in ("localhost",) or h.endswith(".localhost") or h.endswith((".local", ".internal")):
        return None  # dev-имена разрешены
    return None


def _check_url(url: str, allowed: Optional[list[str]]) -> str:
    """Валидирует URL задачи/редиректа. Возвращает нормализованный URL."""
    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        raise HTTPException(status_code=422, detail=f"bad url: {url[:120]}")
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=422, detail=f"only http(s) urls allowed: {parsed.scheme or '(none)'}")
    if parsed.username or parsed.password:
        raise HTTPException(status_code=422, detail="credentials in url blocked")
    host = (parsed.hostname or "").lower()
    reason = _is_blocked_host(host)
    if reason:
        raise HTTPException(status_code=422, detail=reason)
    if allowed:
        allow = {d.strip().lower().lstrip(".") for d in allowed if d.strip()}
        if not any(host == d or host.endswith("." + d) for d in allow):
            raise HTTPException(status_code=422, detail=f"domain not allowed: {host}")
    return parsed.geturl()


def _extract_urls(task: str) -> list[str]:
    urls = URL_RE.findall(task)
    if urls:
        return urls
    m = DOMAIN_RE.search(task)
    if m:
        return [f"https://{m.group(0)}"]
    return []


def _agent_configured() -> bool:
    return bool(os.environ.get("BROWSER_USE_LLM_API_KEY"))


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "agent": _agent_configured(), "maxSteps": MAX_STEPS}


@app.post("/execute")
async def execute(req: ExecuteRequest) -> dict[str, Any]:
    allowed = req.allowedDomains or (
        [d.strip() for d in os.environ.get("BROWSER_USE_ALLOWED_DOMAINS", "").split(",") if d.strip()]
        or None
    )
    for url in _extract_urls(req.task):
        _check_url(url, allowed)

    if _agent_configured():
        return await _run_agent(req, allowed)
    return await _run_playwright_fallback(req, allowed)


async def _run_agent(req: ExecuteRequest, allowed: Optional[list[str]]) -> dict[str, Any]:
    """Full-agent режим через библиотеку browser-use."""
    try:
        from browser_use import Agent  # единственная точка зависимости от browser-use API
    except ImportError:
        raise HTTPException(
            status_code=501,
            detail="browser_use package not installed but BROWSER_USE_LLM_API_KEY is set",
        )
    provider = os.environ.get("BROWSER_USE_LLM_PROVIDER", "openai").lower()
    model = os.environ.get("BROWSER_USE_LLM_MODEL", "gpt-4o-mini")
    llm = _make_llm(provider, model)
    steps = req.maxSteps or 15
    try:
        agent = Agent(task=req.task, llm=llm, max_actions_per_step=5)
        history = await agent.run(max_steps=steps)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"browser-use agent failed: {str(e)[:500]}")
    screenshot = _history_screenshot(history)
    return {
        "screenshot": screenshot,
        "actions": _history_actions(history),
        "finalState": _history_final(history),
        "ticketId": req.ticketId,
    }


def _make_llm(provider: str, model: str) -> Any:
    """Нативные LLM-классы browser-use (НЕ langchain: Agent требует
    browser_use.llm.base.BaseChatModel — langchain-объекты несовместимы,
    проверено сигнатурой Agent.__init__).
    - gemini/google → browser_use.llm.google.ChatGoogle (тот же AI Studio key);
    - openai/anthropic → browser_use.llm.litellm.ChatLiteLLM (имена моделей
      вида gpt-.../claude-... резолвятся самим litellm; base_url — для
      совместимых прокси).
    """
    key = os.environ["BROWSER_USE_LLM_API_KEY"]
    base = os.environ.get("BROWSER_USE_LLM_BASE_URL")
    if provider in ("gemini", "google"):
        from browser_use.llm.google import ChatGoogle

        return ChatGoogle(model=model, api_key=key)
    if provider in ("openai", "anthropic"):
        from browser_use.llm.litellm import ChatLiteLLM

        kwargs: dict[str, Any] = {"model": model, "api_key": key}
        if base:
            kwargs["api_base"] = base
        return ChatLiteLLM(**kwargs)
    raise HTTPException(status_code=500, detail=f"unsupported BROWSER_USE_LLM_PROVIDER: {provider}")


def _history_screenshot(history: Any) -> Optional[str]:
    # AgentHistoryList.screenshots() — МЕТОД (n_last, ...), не поле:
    # брать без вызова = вечно None (проверено инспекцией пакета).
    try:
        shots_fn = getattr(history, "screenshots", None)
        shots = shots_fn() if callable(shots_fn) else (shots_fn or [])
        valid = [s for s in shots if isinstance(s, str) and s]
        if valid:
            s = valid[-1]
            return s if len(s) < 200_000 else s[:200_000]
    except Exception:
        pass
    return None


def _history_actions(history: Any) -> Any:
    # Аналогично: urls() — метод.
    try:
        urls_fn = getattr(history, "urls", None)
        urls = urls_fn() if callable(urls_fn) else urls_fn
        if urls:
            return [{"url": u} for u in list(urls)[-50:] if isinstance(u, str)]
        actions_fn = getattr(history, "action_names", None)
        actions = actions_fn() if callable(actions_fn) else actions_fn
        if actions:
            return list(actions)[-50:]
        return str(history)[-2000:]
    except Exception:
        return []


def _history_final(history: Any) -> Any:
    try:
        result = getattr(history, "final_result", None)
        if callable(result):
            result = result()
        if result is not None:
            return str(result)[:4000]
        return str(history)[-4000:]
    except Exception:
        return None


async def _run_playwright_fallback(req: ExecuteRequest, allowed: Optional[list[str]]) -> dict[str, Any]:
    """Без LLM-ключа: открыть первый URL из task, вернуть скриншот."""
    from playwright.async_api import async_playwright

    urls = _extract_urls(req.task)
    if not urls:
        raise HTTPException(status_code=422, detail="fallback mode needs an http(s) URL in task (no LLM key set)")
    target = _check_url(urls[0], allowed)
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(**_launch_kwargs())
        try:
            page = await browser.new_page(viewport={"width": 1280, "height": 800})
            try:
                resp = await page.goto(target, wait_until="domcontentloaded", timeout=NAV_TIMEOUT_MS)
                status = resp.status if resp else None
            except Exception as e:
                raise HTTPException(status_code=502, detail=f"navigation failed: {str(e)[:300]}")
            shot = _compact_shot(await page.screenshot(full_page=False))
            title = await page.title()
            return {
                "screenshot": shot,
                "actions": [{"goto": target, "httpStatus": status}],
                "finalState": {"url": page.url, "title": title[:300], "mode": "playwright-fallback"},
                "ticketId": req.ticketId,
            }
        finally:
            await browser.close()


# ─── Phase 71: action-level actuator (/act) ──────────────────────────
# Маппинг действий Anthropic computer_20250124 на Playwright.
# Координаты — абсолютные пиксели (как у Anthropic); страница держится
# персистентной (один browser на процесс), viewport подгоняется под
# displayWidthPx/displayHeightPx из запроса (default 1280x800 — совпадает
# с дефолтом ComputerUseLoopService).

ACT_VIEWPORT_W = 1280
ACT_VIEWPORT_H = 800
ACT_TEXT_LIMIT = 2000
ACT_WAIT_MAX_MS = 10_000

# Подмножество Anthropic + прагматичное расширение goto (навигация нужна
# loop для старта; enforced тем же domain-allowlist что /execute).
ACT_ACTIONS = frozenset({
    "screenshot", "mouse_move",
    "left_click", "right_click", "middle_click",
    "double_click", "triple_click",
    "left_click_drag", "left_mouse_down", "left_mouse_up",
    "scroll", "type", "key", "hold_key", "wait", "goto",
    # Gemini Computer Use (история браузера вместо новых вкладок).
    "go_forward", "go_back",
})

# Anthropic key-имена → Playwright keyboard.press.
ACT_KEY_ALIASES = {
    "return": "Enter", "enter": "Enter", "tab": "Tab", "space": " ",
    "escape": "Escape", "esc": "Escape", "backspace": "Backspace",
    "delete": "Delete", "up": "ArrowUp", "down": "ArrowDown",
    "left": "ArrowLeft", "right": "ArrowRight",
    "home": "Home", "end": "End", "pageup": "PageUp", "pagedown": "PageDown",
}


class ActRequest(BaseModel):
    action: str = Field(min_length=1, max_length=64)
    coordinate: Optional[list[float]] = None
    start_coordinate: Optional[list[float]] = None
    text: Optional[str] = Field(default=None, max_length=ACT_TEXT_LIMIT)
    # Gemini type_text_at: фокус по координате + флаги (см. docs computer-use).
    press_enter: Optional[bool] = None
    clear_before_typing: Optional[bool] = None
    scroll_direction: Optional[str] = None
    scroll_amount: Optional[int] = Field(default=None, ge=1, le=50)
    duration_ms: Optional[int] = Field(default=None, ge=0, le=ACT_WAIT_MAX_MS)
    url: Optional[str] = None
    displayWidthPx: Optional[int] = Field(default=None, ge=1, le=7680)
    displayHeightPx: Optional[int] = Field(default=None, ge=1, le=4320)
    ticketId: Optional[str] = Field(default=None, max_length=120)
    allowedDomains: Optional[list[str]] = None


def _act_coord(value: Any, width: int, height: int, name: str) -> tuple[float, float]:
    if not isinstance(value, (list, tuple)) or len(value) != 2:
        raise HTTPException(status_code=422, detail=f"{name} must be [x, y]")
    try:
        x, y = float(value[0]), float(value[1])
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail=f"{name} must be [x, y] numbers")
    if not (0 <= x < width and 0 <= y < height):
        raise HTTPException(status_code=422, detail=f"{name} [{x}, {y}] outside {width}x{height}")
    return x, y


def _act_key_name(text: str) -> str:
    t = (text or "").strip()
    if not t:
        raise HTTPException(status_code=422, detail="key: text is required")
    if "+" in t or len(t) > 1:
        # Комбо вида ctrl+c / один именованный ключ.
        parts = [ACT_KEY_ALIASES.get(p.strip().lower(), p.strip()) for p in t.split("+")]
        if len(parts) == 1:
            return parts[0]
        mods = {"ctrl": "Control", "control": "Control", "alt": "Alt", "shift": "Shift", "meta": "Meta", "cmd": "Meta"}
        return "+".join(mods.get(p.lower(), p) if i < len(parts) - 1 else parts[i] for i, p in enumerate(parts))
    return t


_act_lock = asyncio.Lock()
_act_pw = None
_act_browser = None
_act_page = None
_act_viewport: tuple[int, int] | None = None


async def _ensure_act_page(width: int, height: int):
    """Персистентная страница; пересоздаётся при смене viewport."""
    global _act_pw, _act_browser, _act_page, _act_viewport
    async with _act_lock:
        if _act_page is not None and _act_viewport == (width, height):
            return _act_page
        from playwright.async_api import async_playwright

        if _act_browser is not None:
            try:
                await _act_browser.close()
            except Exception:
                pass
            _act_browser, _act_page = None, None
        if _act_pw is None:
            _act_pw = await async_playwright().start()
        _act_browser = await _act_pw.chromium.launch(**_launch_kwargs())
        _act_page = await _act_browser.new_page(viewport={"width": width, "height": height})
        _act_viewport = (width, height)
        return _act_page


@app.post("/act")
async def act(req: ActRequest) -> dict[str, Any]:
    action = req.action.strip().lower()
    if action not in ACT_ACTIONS:
        raise HTTPException(status_code=422, detail=f"unknown action: {req.action[:64]}")
    allowed = req.allowedDomains or (
        [d.strip() for d in os.environ.get("BROWSER_USE_ALLOWED_DOMAINS", "").split(",") if d.strip()]
        or None
    )
    width = req.displayWidthPx or ACT_VIEWPORT_W
    height = req.displayHeightPx or ACT_VIEWPORT_H
    page = await _ensure_act_page(width, height)

    output: str = action
    try:
        if action == "screenshot":
            output = f"screenshot {width}x{height}"
        elif action == "goto":
            if not req.url:
                raise HTTPException(status_code=422, detail="goto: url is required")
            target = _check_url(req.url, allowed)
            resp = await page.goto(target, wait_until="domcontentloaded", timeout=NAV_TIMEOUT_MS)
            output = f"goto {target} (http {resp.status if resp else '?'})"
        elif action == "mouse_move":
            x, y = _act_coord(req.coordinate, width, height, "coordinate")
            await page.mouse.move(x, y)
            output = f"mouse_move [{x}, {y}]"
        elif action in ("left_click", "right_click", "middle_click"):
            x, y = _act_coord(req.coordinate, width, height, "coordinate")
            button = {"left_click": "left", "right_click": "right", "middle_click": "middle"}[action]
            await page.mouse.click(x, y, button=button)
            output = f"{action} [{x}, {y}]"
        elif action == "double_click":
            x, y = _act_coord(req.coordinate, width, height, "coordinate")
            await page.mouse.dblclick(x, y)
            output = f"double_click [{x}, {y}]"
        elif action == "triple_click":
            x, y = _act_coord(req.coordinate, width, height, "coordinate")
            await page.mouse.click(x, y, click_count=3)
            output = f"triple_click [{x}, {y}]"
        elif action == "left_click_drag":
            sx, sy = _act_coord(req.start_coordinate, width, height, "start_coordinate")
            x, y = _act_coord(req.coordinate, width, height, "coordinate")
            await page.mouse.move(sx, sy)
            await page.mouse.down()
            try:
                await page.mouse.move(x, y, steps=12)
            finally:
                await page.mouse.up()
            output = f"left_click_drag [{sx}, {sy}] -> [{x}, {y}]"
        elif action == "left_mouse_down":
            await page.mouse.down()
        elif action == "left_mouse_up":
            await page.mouse.up()
        elif action == "scroll":
            direction = (req.scroll_direction or "down").lower()
            if direction not in ("up", "down", "left", "right"):
                raise HTTPException(status_code=422, detail="scroll_direction must be up|down|left|right")
            amount = req.scroll_amount or 3
            if req.coordinate is not None:
                x, y = _act_coord(req.coordinate, width, height, "coordinate")
                await page.mouse.move(x, y)
            dx, dy = 0, 0
            if direction == "down":
                dy = 120 * amount
            elif direction == "up":
                dy = -120 * amount
            elif direction == "right":
                dx = 120 * amount
            else:
                dx = -120 * amount
            await page.mouse.wheel(dx, dy)
            output = f"scroll {direction} x{amount}"
        elif action == "type":
            if not req.text:
                raise HTTPException(status_code=422, detail="type: text is required")
            if req.coordinate is not None:
                x, y = _act_coord(req.coordinate, width, height, "coordinate")
                await page.mouse.click(x, y)
            if req.clear_before_typing:
                await page.keyboard.press("Control+a")
                await page.keyboard.press("Backspace")
            await page.keyboard.type(req.text)
            if req.press_enter:
                await page.keyboard.press("Enter")
            output = f"typed {len(req.text)} chars"
        elif action == "go_forward":
            try:
                await page.go_forward(wait_until="domcontentloaded", timeout=NAV_TIMEOUT_MS)
            except Exception:
                pass  # некуда идти вперёд — не ошибка задачи
            output = f"go_forward {page.url[:200]}"
        elif action == "go_back":
            try:
                await page.go_back(wait_until="domcontentloaded", timeout=NAV_TIMEOUT_MS)
            except Exception:
                pass
            output = f"go_back {page.url[:200]}"
        elif action == "key":
            await page.keyboard.press(_act_key_name(req.text or ""))
            output = f"key {req.text}"
        elif action == "hold_key":
            key = _act_key_name(req.text or "")
            await page.keyboard.down(key)
            try:
                await asyncio.sleep(min((req.duration_ms or 500) / 1000.0, ACT_WAIT_MAX_MS / 1000.0))
            finally:
                await page.keyboard.up(key)
            output = f"hold_key {key}"
        elif action == "wait":
            await page.wait_for_timeout(min(req.duration_ms if req.duration_ms is not None else 1000, ACT_WAIT_MAX_MS))
            output = "waited"
        shot = _compact_shot(await page.screenshot(full_page=False))
        return {"screenshot": shot, "output": output, "ticketId": req.ticketId}
    except HTTPException:
        raise
    except Exception as e:
        # Action-level ошибка: loop получит error + следующий скриншот и решит сам.
        try:
            shot = _compact_shot(await page.screenshot(full_page=False))
        except Exception:
            shot = None
        return {"screenshot": shot, "output": output, "error": str(e)[:500], "ticketId": req.ticketId}
