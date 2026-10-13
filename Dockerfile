# Production image: builds the Vite SPA and serves it with nginx on :8080
# (Cloud Run's default). nginx also proxies /api/ and /ws/ to the Backend so
# the browser only ever talks to one origin; production Backend has CORS off.
#
# VITE_* values are baked into the JS bundle at build time, so they are build
# args, not runtime env vars. VITE_API_BASE_URL must be this site's own public
# origin (e.g. https://greeniteso-production-frontend-<project-number>.<region>.run.app).

FROM node:22-alpine AS build
WORKDIR /app

RUN npm install -g pnpm@12

# pnpm-lock.yaml is gitignored in this repo, so installs are not frozen.
COPY package.json pnpm-workspace.yaml ./
RUN pnpm install

COPY . .

ARG VITE_API_BASE_URL
ARG VITE_MICROSOFT_CLIENT_ID
ARG VITE_MICROSOFT_AUTHORITY=https://login.microsoftonline.com/organizations
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_MICROSOFT_CLIENT_ID=$VITE_MICROSOFT_CLIENT_ID \
    VITE_MICROSOFT_AUTHORITY=$VITE_MICROSOFT_AUTHORITY

RUN pnpm build

FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime

# The image's entrypoint renders /etc/nginx/templates/*.template with the
# container's env vars (BACKEND_URL, BACKEND_HOST) into /etc/nginx/conf.d/.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
