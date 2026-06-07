# CommandLess AI proxy — minimal container (zero npm dependencies).
FROM node:20-alpine

WORKDIR /app
COPY server/ ./server/

# Hosts typically inject PORT; default for local container runs.
ENV PORT=8787
EXPOSE 8787

# Secrets (OLLAMA_API_KEY, APP_TOKEN, ...) are provided as env vars by the host.
CMD ["node", "server/index.mjs"]
