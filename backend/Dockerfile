# Build context is the repo root: the server reads ../dataset/candles_1m.json.
FROM node:26-alpine AS deps
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

FROM node:26-alpine
ENV NODE_ENV=production PORT=3000
WORKDIR /app/backend
COPY --from=deps /app/backend/node_modules ./node_modules
COPY backend/package.json ./
COPY backend/src ./src
COPY dataset /app/dataset
USER node
EXPOSE 3000
HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -qO- http://localhost:3000/health || exit 1
# Node runs the TypeScript sources directly (type stripping), so there is no build step.
CMD ["node", "src/main.ts"]
