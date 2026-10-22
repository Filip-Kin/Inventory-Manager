# Replaces the nixpacks build so the Node runtime tracks the official node:22 image
# (nixpacks pinned Node 20 and could not pick up security releases).
# Mirrors the old nixpacks plan: npm ci -> bun run build -> bun run start (tsx on Node).
FROM node:22-slim
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun
# curl for Coolify's container healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV CI=true NPM_CONFIG_PRODUCTION=false
COPY . .
RUN npm ci && bun run build
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["bun", "run", "start"]
