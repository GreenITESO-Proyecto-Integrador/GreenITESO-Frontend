# Imagen base de devcontainers con Node 22 LTS y utilidades de TypeScript
# (incluye usuario 'node', git y herramientas comunes).
FROM mcr.microsoft.com/devcontainers/typescript-node:22-bookworm

# pnpm mediante corepack (gestor de paquetes elegido por el equipo).
# Deja pnpm disponible de inmediato; si el repo fija "packageManager" en
# package.json, corepack respeta esa version al trabajar dentro del proyecto.
RUN corepack enable && corepack prepare pnpm@latest --activate

# Dependencias de sistema que requieren los navegadores de Playwright (E2E).
# Se instalan en build para que la creacion del contenedor sea rapida y estable.
RUN npx -y playwright install-deps
