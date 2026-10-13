# ─── Browser-Use sidecar (Phase 70) ─────────────────────────────
# Отдельный сервис рядом с gateway: gateway-образ (node:22-alpine +
# cap_drop: ALL + read_only) НЕ может запускать Chromium, поэтому
# исполнение browser-задач живёт здесь.
#
# Build:  docker build -f docker/browser-use-sidecar/Dockerfile -t browser-use-sidecar .
# Run:    docker compose -f docker-compose.quickstart.yml --profile browser up
# Health: curl http://localhost:3100/health
FROM mcr.microsoft.com/playwright/python:v1.49.1-noble

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY docker/browser-use-sidecar/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt \
    && playwright install --with-deps chromium || playwright install chromium

COPY docker/browser-use-sidecar/server.py ./server.py

# Non-root + no-new-privileges задаются в compose; порт только для loopback/дocker-сети.
EXPOSE 3100

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "3100"]
