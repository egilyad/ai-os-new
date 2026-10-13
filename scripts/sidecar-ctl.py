"""Управление browser-use sidecar без дублей процессов.

Проблема, которую закрывает: каждый ручной рестарт через Start-Process
плодил близнецов на одном порту (ретраи обёртки), а ручная чистка однажды
убила не тот процесс и уронила порт. Скрипт держит pidfile и действует
идемпотентно: повторный start ничего не запускает, stop бьёт точно.

Usage (stdlib only, Windows + posix):
    python scripts/sidecar-ctl.py status [--port 3100]
    python scripts/sidecar-ctl.py start [--port 3100] [--channel msedge]
        [--python C:\\sidecar-venv\\Scripts\\python.exe] [--llm-key ... --llm-provider ...]
    python scripts/sidecar-ctl.py stop [--port 3100]

Env (альтернатива флагам): BROWSER_USE_CHANNEL, BROWSER_USE_LLM_API_KEY,
BROWSER_USE_LLM_PROVIDER. Ключ в командной строке виден в списке процессов —
для постоянного использования задавайте его через env.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_DIR = os.path.join(REPO_ROOT, "docker", "browser-use-sidecar")


def _pidfile(port: int) -> str:
    return os.path.join(tempfile.gettempdir(), f"browser-use-sidecar-{port}.pid")


def _logfile(port: int, stream: str) -> str:
    return os.path.join(tempfile.gettempdir(), f"browser-use-sidecar-{port}.{stream}.log")


def _pid_alive(pid: int) -> bool:
    # os.kill(pid, 0) для ЧУЖИХ процессов на Windows врёт: на старых
    # сборках (проверено: Win10 16299) всегда WinError 87, т.е. любой
    # живой сервер выглядит мёртвым → дубли и ложные STALE. Поэтому
    # на win32 — OpenProcess напрямую (stdlib ctypes, без pywin32).
    if sys.platform == "win32":
        try:
            import ctypes

            kernel32 = ctypes.windll.kernel32
            handle = kernel32.OpenProcess(0x00100000, False, pid)  # SYNCHRONIZE
            if not handle:
                return False
            kernel32.CloseHandle(handle)
            return True
        except Exception:
            return False
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        # Процесс есть, но нет прав на сигнал — для наших целей жив.
        return True
    except OSError:
        return False
    return True


def _claim_pidfile(port: int) -> bool:
    """Атомарно занять pidfile (O_EXCL). True — claim наш, False — чужой."""
    try:
        fd = os.open(_pidfile(port), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        return False
    except OSError:
        return False
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(f"starting:{os.getpid()}")
    except OSError:
        return False
    return True


def _reclaim_stale_placeholder(port: int) -> bool:
    """Забрать claim, если там плейсхолдер мёртвого starter'а."""
    try:
        with open(_pidfile(port), encoding="utf-8") as f:
            content = f.read().strip()
        if not content.startswith("starting:"):
            return False
        other = int(content.split(":", 1)[1])
        if _pid_alive(other):
            return False
        os.remove(_pidfile(port))
    except (OSError, ValueError):
        return False
    return _claim_pidfile(port)


def _wait_health(port: int, timeout_s: float) -> dict | None:
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        h = _health(port)
        if h and h.get("ok") is True:
            return h
        time.sleep(2)
    return None


def _read_pid(port: int) -> int | None:
    try:
        with open(_pidfile(port), encoding="utf-8") as f:
            return int(f.read().strip())
    except (OSError, ValueError):
        return None


def _health(port: int, timeout: float = 5.0) -> dict | None:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=timeout) as r:
            if r.status != 200:
                return None
            return json.loads(r.read().decode("utf-8"))
    except Exception:
        return None


def _default_python() -> str:
    for cand in (
        r"C:\sidecar-venv\Scripts\python.exe",
        os.path.join(tempfile.gettempdir(), "..", "sidecar-venv", "Scripts", "python.exe"),
    ):
        if os.path.isfile(cand):
            return os.path.abspath(cand)
    return sys.executable


def cmd_status(port: int) -> int:
    pid = _read_pid(port)
    h = _health(port)
    if pid is not None and _pid_alive(pid) and h and h.get("ok") is True:
        print(f"RUNNING pid={pid} port={port} agent_llm={h.get('agent') is True}")
        return 0
    if pid is not None and _pid_alive(pid):
        print(f"STARTING pid={pid} port={port} (health not ready yet)")
        return 0
    if pid is not None:
        print(f"STALE pidfile (pid={pid} dead) port={port}")
    else:
        print(f"STOPPED port={port} (no pidfile)")
    if h and h.get("ok") is True:
        print(f"NOTE: something foreign answers on port={port} (not ours)")
    return 1


def cmd_stop(port: int) -> int:
    pid = _read_pid(port)
    if pid is None:
        print(f"STOPPED port={port} (no pidfile, nothing to do)")
        return 0
    if not _pid_alive(pid):
        os.remove(_pidfile(port))
        print(f"STALE pidfile removed (pid={pid} already dead)")
        return 0
    if sys.platform == "win32":
        subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], capture_output=True)
    else:
        os.kill(pid, 15)
    for _ in range(50):
        if not _pid_alive(pid):
            break
        time.sleep(0.2)
    try:
        os.remove(_pidfile(port))
    except OSError:
        pass
    print(f"STOPPED pid={pid} port={port}")
    return 0


def cmd_start(port: int, channel: str, python: str | None, llm_key: str | None, llm_provider: str | None) -> int:
    pid = _read_pid(port)
    if pid is not None and _pid_alive(pid):
        # Кто-то держит pidfile: либо здоровый сервер, либо чужой процесс,
        # либо свой же запуск в разгаре (тяжёлый импорт ~60с). Ждём health.
        h = _wait_health(port, 120)
        if h:
            print(f"ALREADY RUNNING port={port} (not starting a duplicate)")
            return 0
        print(f"ERROR: pid={pid} is alive but unhealthy on port={port} — stop it first")
        return 1
    if pid is not None:
        print(f"STALE pidfile (pid={pid} dead), continuing")
        try:
            os.remove(_pidfile(port))
        except OSError:
            pass
    claimed = _claim_pidfile(port)
    if not claimed:
        # Может, плейсхолдер упавшего starter'а — проверяем его PID
        # и перезахватываем, иначе ждём чужой health.
        claimed = _reclaim_stale_placeholder(port)
    if not claimed:
        h = _wait_health(port, 120)
        if h:
            print(f"ALREADY RUNNING port={port} (won by concurrent starter)")
            return 0
        print(f"ERROR: concurrent starter failed to bring up port={port}")
        return 1
    def _drop_claim() -> None:
        # Убираем claim только если там всё ещё наш плейсхолдер.
        try:
            with open(_pidfile(port), encoding="utf-8") as f:
                if f.read().strip() == f"starting:{os.getpid()}":
                    os.remove(_pidfile(port))
        except OSError:
            pass

    # Порт уже держит чужой здоровый сервер (pidfile потерян/не наш):
    # дубли не плодим — сообщаем и выходим успешно (сервер есть).
    h0 = _health(port)
    if h0 and h0.get("ok") is True:
        print(f"ALREADY RUNNING port={port} (foreign healthy server, not ours — stop it or pick another port)")
        _drop_claim()
        return 0
    py = python or _default_python()
    if not os.path.isfile(py):
        print(f"ERROR: python not found: {py}")
        _drop_claim()
        return 1
    env = dict(os.environ)
    if channel:
        env["BROWSER_USE_CHANNEL"] = channel
    if llm_key:
        env["BROWSER_USE_LLM_API_KEY"] = llm_key
    if llm_provider:
        env["BROWSER_USE_LLM_PROVIDER"] = llm_provider
    out = open(_logfile(port, "out"), "ab", buffering=0)
    err = open(_logfile(port, "err"), "ab", buffering=0)
    try:
        kwargs: dict = {
            "stdout": out,
            "stderr": err,
            "env": env,
            "cwd": REPO_ROOT,
        }
        if sys.platform == "win32":
            # DETACHED_PROCESS: пережить смерть родительской консоли.
            kwargs["creationflags"] = 0x00000008
        else:
            kwargs["start_new_session"] = True
        try:
            proc = subprocess.Popen(
                [py, "-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", str(port), "--app-dir", APP_DIR],
                **kwargs,
            )
        except OSError as e:
            print(f"ERROR: cannot spawn server: {e}")
            _drop_claim()
            return 1
    finally:
        out.close()
        err.close()
    with open(_pidfile(port), "w", encoding="utf-8") as f:
        f.write(str(proc.pid))
    deadline = time.time() + 120
    while time.time() < deadline:
        h = _health(port)
        if h and h.get("ok") is True:
            print(f"STARTED pid={proc.pid} port={port} agent_llm={h.get('agent') is True}")
            return 0
        if proc.poll() is not None:
            print(f"ERROR: server exited early (code {proc.returncode}), see {_logfile(port, 'err')}")
            try:
                os.remove(_pidfile(port))
            except OSError:
                pass
            return 1
        time.sleep(2)
    print(f"ERROR: health not ready in 120s (pid={proc.pid}), see {_logfile(port, 'err')}")
    return 1


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="browser-use sidecar process control")
    p.add_argument("command", choices=["status", "start", "stop"])
    p.add_argument("--port", type=int, default=3100)
    p.add_argument("--channel", default=os.environ.get("BROWSER_USE_CHANNEL", ""))
    p.add_argument("--python", default="")
    p.add_argument("--llm-key", default="")
    p.add_argument("--llm-provider", default="")
    args = p.parse_args(argv)
    if args.command == "status":
        return cmd_status(args.port)
    if args.command == "stop":
        return cmd_stop(args.port)
    return cmd_start(args.port, args.channel, args.python or None, args.llm_key or None, args.llm_provider or None)


if __name__ == "__main__":
    raise SystemExit(main())
