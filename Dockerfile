# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY api-gateway/package.json api-gateway/
COPY frontend/package.json frontend/
COPY packages/shared/package.json packages/shared/
COPY services/user-service/package.json services/user-service/
COPY services/job-service/package.json services/job-service/
COPY services/application-service/package.json services/application-service/
COPY services/recommendation-service/package.json services/recommendation-service/
RUN npm ci

FROM base AS backend
COPY packages ./packages
COPY api-gateway ./api-gateway
COPY services ./services
COPY scripts ./scripts
ENV NODE_ENV=production

FROM base AS frontend-build
COPY frontend ./frontend
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build -w frontend

FROM nginx:1.27-alpine AS frontend
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
