FROM --platform=$BUILDPLATFORM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build \
    && npm prune --omit=dev \
    && rm -rf /app/node_modules/.cache

FROM node:22-alpine AS final

WORKDIR /app

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

RUN apk add --no-cache curl \
    && rm -rf /var/cache/apk/*

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://127.0.0.1:${PORT:-3000}/ || exit 1

CMD ["node", "dist/server/index.mjs"]
