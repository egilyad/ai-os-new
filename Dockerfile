# syntax=docker/dockerfile:1.7
# ────────────────────────────────────────────────────────────────
# SuperAgents OS — multi-stage production Dockerfile
# LABELS: https://github.com/opencontainers/image-spec/blob/main/annotations.md
LABEL org.opencontainers.image.title="SuperAgents OS"
LABEL org.opencontainers.image.description="Autonomous multi-agent runtime with cognitive topology DSL"
LABEL org.opencontainers.image.url="https://github.com/n95887174-source/ai-os-new"
LABEL org.opencontainers.image.source="https://github.com/n95887174-source/ai-os-new"
LABEL org.opencontainers.image.licenses="MIT"
#
# Stage 1 (build): installs deps with legacy-peer-deps to bypass the
#                  typescript/madge peer-dep conflict, then runs
#                  `tsc -b && vite build`.
# Stage 2 (runtime): nginx-unprivileged (no root, listens on 8080
#                    which docker-compose maps to 80/443).
#
# Build args:
#   NGINX_CONFIG  — relative path under ./docker/ of the nginx config
#                    to bake into the image.  Defaults to nginx.conf
#                    (HTTP + reverse proxy for dev).  For prod with
#                    TLS, build with --build-arg NGINX_CONFIG=nginx-ssl.conf
#                    and mount certs via docker-compose.
# ────────────────────────────────────────────────────────────────

# ─── Stage 1: build ─────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# libstdc++ is required by sql.js native bindings used by Vite at
# build time.  git is needed for some npm packages with native git
# deps (e.g. esbuild postinstall).
RUN apk add --no-cache libc6-compat git

COPY package*.json ./
# `--legacy-peer-deps` is required: madge@8 expects typescript ^5.4.4
# while the project pins ~6.0.2.  See bugi2.md item #1.
RUN npm ci --legacy-peer-deps --no-fund

COPY . .
# M3 (3c): Allow VITE_* env overrides at build time via --build-arg
ARG VITE_BASE_PATH=/
ARG VITE_SANDBOX_ENABLED=
ARG VITE_PROXY_GEMINI=
ARG VITE_PROXY_OPENROUTER=
ARG VITE_PROXY_NVIDIA=
ARG VITE_PROXY_GROQ=
ARG VITE_PROXY_CEREBRAS=
ARG VITE_PROXY_CLOUDFLARE=
ARG VITE_PROXY_OPENAI=
ARG VITE_DISABLE_TELEMETRY=
ARG VITE_LOG_LEVEL=
RUN VITE_BASE_PATH=$VITE_BASE_PATH \
    VITE_SANDBOX_ENABLED=$VITE_SANDBOX_ENABLED \
    VITE_PROXY_GEMINI=$VITE_PROXY_GEMINI \
    VITE_PROXY_OPENROUTER=$VITE_PROXY_OPENROUTER \
    VITE_PROXY_NVIDIA=$VITE_PROXY_NVIDIA \
    VITE_PROXY_GROQ=$VITE_PROXY_GROQ \
    VITE_PROXY_CEREBRAS=$VITE_PROXY_CEREBRAS \
    VITE_PROXY_CLOUDFLARE=$VITE_PROXY_CLOUDFLARE \
    VITE_PROXY_OPENAI=$VITE_PROXY_OPENAI \
    VITE_DISABLE_TELEMETRY=$VITE_DISABLE_TELEMETRY \
    VITE_LOG_LEVEL=$VITE_LOG_LEVEL \
    npm run build

# ─── Stage 2: runtime (nginx-unprivileged) ──────────────────────
# nginx-unprivileged listens on 8080 by default; docker-compose maps
# it to host ports 80/443.  Running as non-root avoids the bind-to-80
# permission issue that broke the previous Dockerfile.
FROM nginxinc/nginx-unprivileged:1.28-alpine

ARG NGINX_CONFIG=nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY --chown=nginx:nginx docker/${NGINX_CONFIG} /etc/nginx/conf.d/default.conf.template

# Healthcheck defined in docker-compose.yml (overrides this) — keep single source of truth
# Image-level HEALTHCHECK so the image is self-describing even without compose.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/ || exit 1
COPY --chmod=755 docker/entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
EXPOSE 8080
# 8443 because nginx-unprivileged can't bind 443; docker-compose maps 443:8443
EXPOSE 8443
