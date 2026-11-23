FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm postinstall
RUN pnpm typecheck
RUN pnpm generate

FROM nginx:alpine AS runner

RUN rm -rf /usr/share/nginx/html/*
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/.output/public /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
