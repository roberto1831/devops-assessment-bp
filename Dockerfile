# Etapa 1: instalamos solo las dependencias de producción
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# Etapa 2: imagen final
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production PORT=8080

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "src/server.js"]