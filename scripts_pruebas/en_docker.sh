#!/bin/sh
# Lanza las pruebas aisladas (§15.5) en un contenedor con la imagen del backend,
# contra el mongo del docker compose y la base de pruebas. Nunca toca la base real.
# Uso: scripts_pruebas/en_docker.sh [p1 p8 …]   (requiere `docker compose up -d`)
cd "$(dirname "$0")/.." || exit 1
# Imagen exclusiva de pruebas: nunca reconstruye las etiquetas de la instalación
# (picasso-backend, picasso-frontend).
docker build -q -t picasso-pruebas-backend ./backend >/dev/null
docker run --rm --network picasso_default -v "$PWD:/repo" -w /repo \
  -e MONGO_URL=mongodb://mongo:27017 -e DB_NAME=picasso -e DB_NAME_PRUEBAS=picasso_pruebas \
  picasso-pruebas-backend python scripts_pruebas/ejecutar.py "$@"
