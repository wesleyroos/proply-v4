# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* env vars at build time, so they must be present here.
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

RUN npm run build

# ── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# postgresql-client gives us pg_dump/pg_restore for the one-off
# Railway → Fly Postgres migration release_command.
RUN apk add --no-cache postgresql17-client

# Only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Built artefacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/scripts/migrate-from-railway.sh ./scripts/migrate-from-railway.sh
RUN chmod +x ./scripts/migrate-from-railway.sh

EXPOSE 8080

CMD ["node", "dist/index.js"]
