FROM node:22-slim AS builder

WORKDIR /app
COPY service/package*.json ./
RUN npm ci
COPY service/ ./
RUN npm run build

# Production image
FROM node:22-slim

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
