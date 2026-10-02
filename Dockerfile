FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# The commit being built, so the app and /api/health can say which version is running.
ARG GIT_SHA=dev
ENV GIT_SHA=$GIT_SHA
RUN pnpm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN corepack enable

LABEL org.opencontainers.image.title="BarLingo"
LABEL io.barlingo.cleanup="true"

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY database ./database

USER node
EXPOSE 3000

CMD ["node", "dist-server/index.js"]

