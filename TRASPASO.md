# TRASPASO.md

Cómo levantar y operar Picasso fuera de Emergent. Al día a 05-10-2026: F1–F7 construidas, F7 a falta del visto bueno de Juan en DaVinci y F9 diseñada (maestro §9.7).

## Arranque en local

```bash
cd ~/dev/picasso && docker compose up -d --build
```

Interfaz en http://localhost:3000 y API en http://localhost:8001. Las pruebas aisladas corren con `bash scripts_pruebas/en_docker.sh`, sobre la base `picasso_pruebas` y sin tocar los datos reales.

## Carpeta de entregas (§11.3)

`ENTREGAS_HOST` en el `.env` (por ejemplo `/Users/juanguti/Movies/Picasso`) se monta en el contenedor como `/entregas`. Al exportar, el paquete se guarda ya descomprimido en `<entregas>/<proyecto>/<paquete>/`, con rutas absolutas. DaVinci Resolve 21 no importa rutas relativas. Sin esa variable (en el VPS) todo funciona como antes, con un ZIP y rutas relativas.

## DaVinci

En el Mac está instalado Resolve Studio 21.1, con la opción «External scripting: Local». El MCP de DaVinci (`~/dev/davinci-resolve-mcp`, registrado en Claude Code) importa el `timeline.fcpxml` del paquete y comprueba que los medios quedan enlazados.

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

### Comprobado y pendiente

El compose funciona en el Mac de Juan desde el 26-09-2026 (los arreglos están en el historial de git). Falta desplegarlo en el VPS. Al hacerlo hay que comprobar, como mínimo:

1. `docker compose build` y `docker compose up -d` sin errores.
2. `GET /api/salud` y `GET /api/entorno` desde el host.
3. Que `REACT_APP_BACKEND_URL` apunta a la URL pública del backend **en el
   momento de construir el frontend** (Vite la incrusta en el build).
4. Que los medios subidos y el material generado aparecen en el volumen
   `datos_medios` y sobreviven a `docker compose restart`.
