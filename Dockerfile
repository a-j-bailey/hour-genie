# CVE-2026-111497: Node 20 is EOL and will not receive the bundled Brotli decoder
# out-of-bounds write fix. Pin the patched Node 22.23.4 Alpine image by digest
# (multi-arch index from Docker Hub, 2026-10-22).
FROM node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS node-base

FROM node-base AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node-base AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node-base AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM node-base
COPY ./package.json package-lock.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
CMD ["npm", "run", "start"]
