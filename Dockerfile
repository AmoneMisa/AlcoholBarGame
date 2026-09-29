FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
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

