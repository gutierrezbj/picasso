# TRASPASO.md

Notas para llevarse el estudio a la infraestructura propia. Este documento se
completará al terminar la **Fase 7**; por ahora solo recoge lo del despliegue.

## Despliegue con Docker (§15.1)

- `docker-compose.yml` en la raíz levanta tres servicios: **mongo**, **backend**
  (FastAPI + ffmpeg) y **frontend** (build de Vite servido con nginx).
- Volúmenes persistentes: `datos_mongo` (base de datos) y `datos_medios`
  (`DATA_DIR`, donde viven los medios subidos y el material generado). Nada se
  pierde al reiniciar los contenedores.
- Variables desde un `.env` en la raíz, siguiendo `backend/.env.example`.
  **Ninguna clave está escrita en el compose ni en los Dockerfiles.**
- `backend/Dockerfile` declara **ffmpeg** (y las fuentes Liberation): el motor lo
  necesita para el último fotograma al encadenar planos, para las miniaturas y
  para el material del proveedor simulado.
- Healthcheck del backend contra `GET /api/salud`; el frontend espera a que el
  backend esté sano.

### Aviso honesto

**No se ha probado fuera de este entorno.** En la previsualización los servicios
los lanza supervisor, no `docker-compose`, así que el compose y los Dockerfiles
están escritos siguiendo el §15 pero sin ejecutarse aquí. Al primer despliegue en
tu máquina o en el VPS habrá que comprobar, como mínimo:

1. `docker compose build` y `docker compose up -d` sin errores.
2. `GET /api/salud` y `GET /api/entorno` desde el host.
3. Que `REACT_APP_BACKEND_URL` apunta a la URL pública del backend **en el
   momento de construir el frontend** (Vite la incrusta en el build).
4. Que los medios subidos y el material generado aparecen en el volumen
   `datos_medios` y sobreviven a `docker compose restart`.
