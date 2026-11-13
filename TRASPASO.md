# TRASPASO.md

Cómo levantar y operar Picasso fuera de Emergent, y punto de entrega del estado a **13-11-2026**, antes de reorientar por módulos. Este documento describe lo que hay; no aprueba nada.

## Punto de entrega del 13-11-2026

### Ramas
- `main` (`205af00`): último código y documentos de Picasso. No se toca en esta entrega.
- `traspaso/2026-11-13-estado`: esta entrega. Contiene este traspaso y la revisión ORD-01…26 de `PREGUNTAS.md`, que estaba sin confirmar en la copia local. Sale de `main` y no se fusiona.
- `origin/formacion/hotmart-prompteando-videos` (`ac5dff4`, 26-10-2026): solo documentos. Trae las fichas HOT 01 y 02, REF 04, el catálogo de cámara (`docs/formacion/datos/`), el insumo de cámara 3D y las propuestas **18.54–18.65** en el maestro. No tiene código y no está fusionada. Sus propuestas no están aprobadas.
- No hay más ramas ni `stash`.

### ¿La aplicación que usa Juan es el código entregado?
Sí. Lo comprobé el 13-11-2026 contra los contenedores en marcha (`picasso-backend`, `picasso-frontend` y `mongo:7`, levantados con `docker compose` en :3000 y :8001):
- **Backend:** `backend/app` y `backend/data` del contenedor coinciden byte a byte con el repositorio.
- **Frontend:** construí la misma imagen desde el repositorio y comparé el JavaScript. La única diferencia es la URL de la API incrustada al compilar: en la imagen de Juan va `http://localhost:8001/api`, que llega desde el `.env` por `REACT_APP_BACKEND_URL`, y en una compilación sin ese argumento queda `/api`. El código es el mismo.
- Las imágenes son del 22-10-2026 y corresponden al commit `c3451b1`. Entre `c3451b1` y `main` (`205af00`) solo cambian documentos.
- **Datos:** la base `picasso` y los medios viven en los volúmenes de Docker (`datos_mongo`, `datos_medios`), fuera del repositorio. Las entregas van a `~/Movies/Picasso`.

### Pruebas ejecutadas (13-11-2026)
`bash scripts_pruebas/en_docker.sh` corre sobre la base aislada `picasso_pruebas`, con proveedores simulados y sin gasto. Pasan **pytest** y **p1 a p15** (guion, revisión, encargo y serie, asistente, diferencias, hablantes, lienzo, motor, reinicio, voces, pistas, montaje, paquete, imagen y Taller). Son pruebas en simulado: no valen como validación creativa ni prueban los proveedores reales.

### Implementado (en código, con prueba)
- **F1–F6 (Emergent):** espacios, proyectos por tipo y recorrido (§4), Idea (§6.1), elementos con ficha versionada y persona real, guion con revisiones, encargo de imagen, lienzo con planos, dirección (§8), vista previa del prompt y motor con su ciclo (precio, autorización, worker, «incierta», nunca reenviar) y Registro.
- **F7:** voces, montaje y paquete de edición con `timeline.fcpxml`. DaVinci 21 lo importa con los medios enlazados.
- **F9, en parte:**
  - proveedores reales **fal** (Nano Banana Pro para texto y edición; OmniHuman 1.5 y Kling Avatar v2 Pro para personaje hablando), **ElevenLabs** (Multilingual v2 y v3) y **OpenAI** `gpt-6.1-sol`, solo para «Mejorar» del Taller;
  - catálogo con precios verificados.
- **Mejoras construidas:** 18.8 («qué evitar»), 18.20 (cláusula de persona real), 18.22 (referencias numeradas con su uso), 18.29 (el Taller en su versión guiada: carpetas, tres pasos, «Le falta», Mejorar, galería, visor, «Me la quedo», Descartar, nota, «Más como esta» y «reutilizar») y 19.1–19.18, 19.26 y 19.27.
- **Edición desde una toma (§7.6):** existe en el lienzo. Desde Tomas, «Ajustar» prepara un `editar_imagen` con la toma como entrada y crea una toma nueva del mismo plano. La procedencia va por `Toma.operacion_id` y `Operacion.toma_origen_id`. **En el Taller no existe** («Cambiar algo» está marcado como «próximamente»).

### Funciona en parte
- **18.30 (control de ingredientes):** solo en el Taller y con reglas simples (lado corto de la foto y partes del prompt). No hay umbrales por modelo ni revisión del audio.
- **Asistente §10 (Idea, elementos, guion):** en la instalación de Juan responde con el modelo `simulado` (`GET /api/asistente/estado`), porque la implementación de Anthropic depende de la clave universal de Emergent, que no está en el `.env`. Lo único que usa un modelo real es «Mejorar» del Taller (OpenAI).
- **Personaje hablando (fal):** técnicamente funciona, pero Juan lo juzgó pobre (19.25, 19.28).
- **Vista previa del prompt (§8):** las plantillas no compilan las mejoras aprobadas 18.10, 18.15–18.19b ni 18.26–18.28 (ver ORD-11).
- **BytePlus ModelArk:** la clave está en `.env` como `BYTEPLUS_ARK_API_KEY` y responde a una consulta de prueba sin coste, pero **no hay proveedor en código**. El uso de caras reales exige dar de alta el recurso verificado (`asset://`); está pendiente de Juan.

### Sigue siendo propuesta o diseño (sin código)
- **Aprobadas en el maestro y sin construir:** 18.3 y 18.3b, 18.10 y 18.10b, 18.13, 18.15, 18.16, 18.16b, 18.17, 18.18, 18.19, 18.19b, 18.23 (fuera de Explorar), 18.26, 18.27, 18.28 y 18.36–18.38.
- **Sin aprobar:** 18.24, 18.25, 18.31–18.35 y 18.39–18.51, más 18.54–18.65, que solo están en la rama de formación.
- **18.52 (Director) y 18.53 (modo personaje):** decididos por Juan el 24-10-2026, sin código. El SDD (`docs/sdd/SDD-director-de-escena.md`) sigue con el encabezado «borrador».
- **§20 (plan de calentamiento E1–E5):** aprobado, sin ejecutar.
- **F7b (marca del estudio), F8 (impacto) y despliegue en el VPS:** pendientes.

### Fallos conocidos y pendientes de uso
- 19.19–19.25 y 19.29, abiertos: destino «Comunidad», recortar referencias, vista previa que sigue la acción, panel de Voces que se cierra, reloj del personaje hablando, aviso de forma, comparar modelos de personaje y recorrido del Taller.
- **ORD-24** (revisión del 26-10, no la he vuelto a comprobar): los medios enlazados a tomas u operaciones no están protegidos al borrar, y falta separar con claridad el coste estimado del real.
- En el repositorio hay 15 salidas del simulado (`backend/data/simulado/*`), de la época de Emergent. No son privadas; se dejan como están.
- `backend/.env.example` no lista `BYTEPLUS_ARK_API_KEY`.

### Contradicciones con el encargo de reorientación (13-11-2026)
Cada punto separa lo que **ya decidió Juan** de lo que **recomiendo yo**.
1. **El Director como puerta de entrada.** *Decidido:* §1.0 y 18.52, 24-10-2026. *El encargo nuevo dice:* ayuda opcional a demanda, con la interfaz para después. *Recomendación:* que Juan confirme el cambio y anotar en §1.0 y 18.52 que pasa a ayuda opcional, sin borrar la historia (ORD-01).
2. **El alcance de la v1.** *Decidido:* §1.0 dice v1 = foto + clip de escena, con Seedance 2.5 en BytePlus. *El encargo nuevo dice:* el primer módulo es imagen y edición desde resultados, sin vídeo. *Recomendación:* §1.0 pasa a «módulo 1 = imagen + edición». La decisión de proveedor de vídeo y las metas del clip quedan guardadas para el módulo de vídeo.
3. **18.53 (modo personaje).** Juan la aprobó expresamente el 24-10-2026; no está aprobada solo por estar escrita. Pero queda fuera del módulo 1. *Recomendación:* marcarla «aprobada, aplazada».
4. **Propuestas que vienen de la formación.** El encargo nuevo dice que documentar no es aprobar. Las filas «APROBADA» del §18 lo fueron por mensaje expreso de Juan, con fecha. Las 18.54–18.65 de la rama de formación no lo están. *Recomendación:* una tabla de estados única (ORD-03): propuesta, aprobada, construida, probada en simulado y validada por Juan.
5. **El lienzo frente al Taller para el módulo 1.** El encargo pide «trabajar directamente sobre los resultados» en el lienzo, con la procedencia visible. Hoy la edición desde una toma vive en el lienzo de un proyecto y el Taller no la tiene. *Recomendación:* que la asignación diga si el módulo 1 parte del lienzo, del Taller o de los dos.
6. **SDD «borrador» frente a 18.52 «aprobado».** *Recomendación:* corregir el encabezado del SDD cuando se resuelva el punto 1.

### Trabajo pendiente, en orden propuesto (pendiente de la asignación)
1. Que Juan resuelva los puntos 1–6 de arriba y ORD-01 y ORD-03.
2. La asignación acotada del módulo 1 (imagen + edición desde resultados), con su caso de aceptación.
3. Reparaciones de base antes de ampliar: ORD-24.
4. Validación operada por Juan de lo que se entregue.

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
