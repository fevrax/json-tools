FROM node:20-slim AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/40-ai-proxy.sh /docker-entrypoint.d/40-ai-proxy.sh
RUN chmod +x /docker-entrypoint.d/40-ai-proxy.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
