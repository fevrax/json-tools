FROM node:20-alpine AS builder

# 安装 pnpm
RUN npm install -g pnpm@9.12.2

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml* ./

RUN pnpm install

COPY . .

RUN pnpm build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
