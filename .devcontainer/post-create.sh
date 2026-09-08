#!/usr/bin/env bash
# Se ejecuta una vez al crear el contenedor.
set -euo pipefail

echo "==> GreenITESO frontend devcontainer: post-create"

# Localizar el proyecto: monorepo (frontend/) o repo dedicado de frontend (raiz).
if [ -f frontend/package.json ]; then
  APP_DIR="frontend"
elif [ -f package.json ]; then
  APP_DIR="."
else
  echo "==> No hay package.json todavia; se omite la instalacion."
  echo "    (Se instalara cuando exista el proyecto Vite. Ver 'scaffold' en el README.)"
  exit 0
fi

echo "==> Instalando dependencias con pnpm en '$APP_DIR'"
( cd "$APP_DIR" && pnpm install )

# Navegador de Playwright: solo si el proyecto declara la dependencia.
if ( cd "$APP_DIR" && pnpm ls @playwright/test >/dev/null 2>&1 ) \
   || ( cd "$APP_DIR" && pnpm ls playwright >/dev/null 2>&1 ); then
  echo "==> Instalando Chromium para Playwright"
  ( cd "$APP_DIR" && pnpm exec playwright install chromium )
else
  echo "==> Playwright no esta en el proyecto todavia; se omite la descarga de navegadores."
fi

echo "==> Listo."
echo "    Arrancar dev server:  cd $APP_DIR && pnpm dev --host"
echo "    Correr E2E:           cd $APP_DIR && pnpm exec playwright test"
