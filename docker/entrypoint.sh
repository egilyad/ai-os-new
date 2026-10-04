#!/bin/sh
# SuperAgents OS — Docker entrypoint
# Runs envsubst on nginx config template before starting nginx.
set -e

# Set defaults for all env vars used in nginx template
# BLD-01: envsubst processes these into the rendered config
: "${API_UPSTREAM:=https://api.openrouter.ai}"
: "${PROXY_GEMINI:=https://generativelanguage.googleapis.com}"
: "${PROXY_OPENROUTER:=https://openrouter.ai}"
: "${PROXY_NVIDIA:=https://integrate.api.nvidia.com}"
: "${PROXY_GROQ:=https://api.groq.com/openai/v1}"
: "${PROXY_CEREBRAS:=https://api.cerebras.ai/v1}"
: "${PROXY_CLOUDFLARE:=https://api.cloudflare.com/client/v4}"
# SEC-07: MUST be set to your own proxy in production. Defaulting to a public
# CORS proxy (api.allorigins.win) would route ALL fetch tool traffic through a
# third-party service. Set to /proxy/fetch (self-hosted nginx) or your own proxy.
: "${PROXY_FETCH:=}"
# C-02: OpenAI target must include /v1 (adapter baseUrl is .../v1, nginx strips prefix)
: "${PROXY_OPENAI:=https://api.openai.com/v1}"
export API_UPSTREAM PROXY_GEMINI PROXY_OPENROUTER PROXY_NVIDIA \
       PROXY_GROQ PROXY_CEREBRAS PROXY_CLOUDFLARE PROXY_FETCH PROXY_OPENAI

# BLD-01: envsubst runs against the .template file, output goes to nginx's default.conf.
# On read_only rootfs compose mounts tmpfs over /etc/nginx/conf.d, shadowing
# the baked template — restore it from the seed copy first.
if [ ! -f /etc/nginx/conf.d/default.conf.template ] && [ -f /usr/share/nginx/template/default.conf.template ]; then
  cp /usr/share/nginx/template/default.conf.template /etc/nginx/conf.d/default.conf.template
fi
if [ -f /etc/nginx/conf.d/default.conf.template ]; then
  envsubst \
    '${API_UPSTREAM} ${PROXY_GEMINI} ${PROXY_OPENROUTER} ${PROXY_NVIDIA} \
     ${PROXY_GROQ} ${PROXY_CEREBRAS} ${PROXY_CLOUDFLARE} ${PROXY_FETCH} ${PROXY_OPENAI}' \
    < /etc/nginx/conf.d/default.conf.template \
    > /etc/nginx/conf.d/default.conf
fi

# 8.5: empty PROXY_FETCH renders `proxy_pass /;` — a self-recursion loop,
# not fail-closed. Replace with an explicit 501 so the fetch tool reports
# "disabled" instead of hanging/looping. Set PROXY_FETCH to enable it.
if [ -z "$PROXY_FETCH" ] && [ -f /etc/nginx/conf.d/default.conf ]; then
  echo "WARN: PROXY_FETCH is not set — /proxy/fetch/ will return 501 (fetch tool disabled)"
  sed -i 's|proxy_pass /;|return 501;  # PROXY_FETCH unset: fetch tool disabled (8.5 fail-closed)|' /etc/nginx/conf.d/default.conf
  # L-10: the sed above is brittle against template drift — verify it matched,
  # otherwise fail the container instead of serving a self-recursing proxy.
  if grep -q 'proxy_pass /;' /etc/nginx/conf.d/default.conf; then
    echo "ERROR: PROXY_FETCH fallback sed did not match — refusing to serve a self-loop"
    exit 1
  fi
fi

# BLD-C5: Verify TLS certs exist if SSL config is in use
# C-99: NGINX_CONFIG is a Docker build arg — not available at runtime.
# Detect SSL config by checking if the rendered template contains "listen.*ssl".
if [ -f /etc/nginx/conf.d/default.conf ] && grep -q 'listen.*ssl' /etc/nginx/conf.d/default.conf; then
  if [ ! -f /etc/nginx/ssl/cert.pem ] || [ ! -f /etc/nginx/ssl/key.pem ]; then
    echo "ERROR: SSL config requires certs at /etc/nginx/ssl/cert.pem and /etc/nginx/ssl/key.pem"
    echo "  Generate self-signed: openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\"
    echo "    -keyout /etc/nginx/ssl/key.pem -out /etc/nginx/ssl/cert.pem \\"
    echo "    -subj \"/CN=localhost\""
    exit 1
  fi
fi

exec nginx -g "daemon off;"
