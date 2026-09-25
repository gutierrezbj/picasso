# PRD — Picasso (identificador en código: `studio`)

## Problema y propósito
Estudio propio de desarrollo creativo y producción audiovisual para un único
director. El valor es EL RECORRIDO y LA COHERENCIA, no la generación. El usuario
entra, se ubica, elige espacio (cliente/marca/propio) y proyecto; recorre paso a
paso (según tipo: corto, anuncio, imagen, serie) la construcción de idea, mundo,
personajes, productos, objetos y guion aprobado; solo entonces llega al lienzo,
dirige y produce cada plano con IA viendo el coste antes; monta y exporta para
DaVinci Resolve o CapCut.

## Fuente de verdad
- `NUEVA-APLICACION-INTENCION-FUNCIONAMIENTO-Y-DISENO.md` (QUÉ / PARA QUÉ / diseño).
- `DOCUMENTO-MAESTRO-Y-ARQUITECTURA.md` (CÓMO: modelo, pantallas, motor, fases).
- Reglas no negociables: construir solo lo escrito; vocabulario §2 verbatim; nada
  automático; nada de pago sin autorización con precio; pruebas con proveedor
  `simulado`; catálogo con `null` y "coste sin verificar"; modo claro, tokens §21;
  dudas en `PREGUNTAS.md`.

## Stack (§15 cumplido tras la migración del 26-09-2026)
- Frontend: **Vite + React 19 + TypeScript** + Tailwind (tokens §21) + React Router 7 +
  TanStack Query + lucide-react. Tipos del dominio en `frontend/src/tipos.ts`, aplicados en
  la capa de API. `tsconfig.json` en modo pragmático (`strict: false`): apretar el modo
  estricto fichero a fichero queda como deuda registrada en PREGUNTAS.md.
- Backend: FastAPI + MongoDB (motor async), estructura §15.2 (api → dominio → motor/…).
- Datos de recorrido en `backend/data/recorridos.yaml`.
- Pruebas de backend **aisladas**: `python3 scripts_pruebas/ejecutar.py` levanta una segunda
  instancia en el puerto 8002 con la base `picasso_pruebas` y el almacén `/tmp/picasso_pruebas`,
  ejecuta pytest + p1…p6 y borra la base. `GET /api/entorno` + cerrojos hacen que ninguna
  prueba pueda escribir en la base de la previsualización.
- En preview lo lanza supervisor; docker-compose se añadirá para infra propia.

## Persona
- Director único (no multiusuario, sin cuentas). Los clientes son espacios.

## Construcción por fases (§14)
Se entrega una fase cada vez; el usuario la recorre y la da por buena antes de la siguiente.

### ✅ FASE 1 — Base, estudio y espacios (COMPLETADA · 24-09-2026)
Implementado y validado (testing agent: backend 14/14, frontend 100%):
- Tokens de diseño centralizados (`frontend/src/index.css`), modo claro, fuente Mulish (PENDIENTE).
- Cabecera: ubicación pulsable (Estudio/Espacio/Proyecto), indicador de guardado (§12),
  gasto SOLO dentro de proyecto y siempre visible ("Gasto: 0,00 $").
- P1 Apertura del estudio (Retomar + recientes + espacios + Nuevo espacio).
- P2 Espacio (lista de proyectos con paso actual, Nuevo proyecto, accesos Biblioteca/Identidad).
- Creación de espacios y proyectos (4 tipos). Recorrido correcto por tipo desde `recorridos.yaml`.
- Barra del recorrido + bloque "Siguiente paso"; pantallas de paso MÍNIMAS ("se construye en la Fase N").
- Retomar → ultima_ubicacion real. P10 Ajustes sin proveedores (moneda + presupuesto).
- Nada se crea automáticamente.

### ✅ FASE 2 — Desarrollo y asistente (COMPLETADA · 25-09-2026)
Validada por testing agent (backend 30/30, frontend 100%):
- P4 Desarrollo (`/p/:id/idea`): campos por tipo (obligatorios marcados *), columna de lectura ~68ch, autoguardado (§12), «Marcar desarrollo como listo» (habilitado al rellenar obligatorios) que desbloquea el recorrido (Idea→listo, siguiente→en curso).
- Formatos: semilla genérica por tipo (`formatos_semilla.yaml`); sus preguntas aparecen como bloques y persisten en `respuestas_formato`.
- Asistente (§10): proveedor `simulado` (sin coste) y **Claude `claude-sonnet-5` vía Universal Key** (verificado en vivo). Tareas `hacer_preguntas`, `proponer_campo`, `ordenar_notas`. Propuestas Aceptar/Editar/Descartar una a una; **nada se escribe sin aceptar**. Selector de modelo + estado en Ajustes.
- Bugs corregidos: `/api/estudio` (await en genexpr) y `id` de propuesta.

### ✅ FASE 3 — Pasos de elementos, fichas, biblioteca y medios (COMPLETADA · 25-09-2026)
Validada por testing agent (iteration_3: frontend 100%, sin fallos) + verificación backend con curl:
- **P5 Paso de elementos** (`/p/:id/paso/:clave`), una sola pantalla para todas las clases
  (escenario, personaje, producto, objeto y «Elementos» sin clase en tipo imagen):
  izquierda lista del reparto con miniatura/versión/estado, centro la ficha, pie «Siguiente paso».
- **Elegir o crear**: `Crear nuevo` y `Traer de la biblioteca` (solo elementos del mismo espacio
  y de esa clase; traer fija la versión vigente).
- **Fichas versionadas**: `FichaVersion` inmutable al aprobarse; editar = `Crear versión nueva`
  (auto-seleccionada). Campos por clase: personalidad y voz (personaje), materiales y colores
  (producto), ambiente y distribución (escenario). Autoguardado (§12) con 409 por conflicto.
- **Aviso de versión nueva** en el reparto («hay vN») con `Actualizar a vN` (el análisis de
  impacto §13 llega en Fase 8, así indicado en la interfaz).
- **Medios**: interfaz `Almacen` + `AlmacenLocal` en `DATA_DIR/media/<espacio>/<medio_id>.<ext>`;
  subida con progreso por fichero (máx. 25 MB), 4 clases en la biblioteca, solo imágenes como
  referencias de ficha. Borrado bloqueado si el medio está en uso.
- **P3 Biblioteca del espacio**: pestañas Elementos/Medios con recuentos, filtro por clase,
  orden por nombre o recientes, uso («En: proyecto», «Usado en: elemento»), subida y borrado.
- **Pasos opcionales**: `No hace falta en este proyecto` / `Recuperar este paso`; el recorrido
  avanza saltando el paso omitido.
- **Portada y logo del espacio** (pendiente desde Fase 1): se suben en `Identidad del espacio`
  y en `Nuevo espacio`; se ven en la cabecera del espacio y en las tarjetas de la Apertura.
- **Preparar referencias NO construido a propósito**: botón desactivado con el texto
  «Disponible cuando esté el motor (Fase 6)».
- Asistente: nueva tarea `detectar_elementos` (propone elementos de esa clase que el desarrollo
  menciona y no están; aceptar crea el elemento y lo mete en el reparto con ficha v1 en borrador).
- Ajustes pedidos por el usuario: «Responder en» incluye también las preguntas del formato
  (destinos `formato:<clave>`); la barra del recorrido queda fija bajo la cabecera.
- Bug corregido: TDZ en `Desarrollo.jsx` («Cannot access 'recorrido' before initialization»).

### Revisión de la Fase 3 por el usuario (25-09-2026 · verificada en iteration_4, 5/5)
- **Aislamiento de datos**: las pruebas del constructor van solo en el espacio
  «Pruebas del constructor». «Espacio 1 · Proyecto 1» queda limpio (Paso 1 · Idea, sin
  elementos, sin versiones, sin medios) y «Retomar» refleja la última visita del usuario.
  Borrado «Espacio SIM 2». Ids en `memory/test_credentials.md`.
- **§4.3 (cambio escrito por decisión del usuario)**: para aprobar una versión de ficha,
  personajes y productos exigen al menos una imagen de referencia; escenarios y objetos no.
  El botón `Aprobar versión` queda desactivado y al lado se explica qué falta.
- **§5.3**: el paso que se está viendo lleva el marcador fuerte «Estás aquí»; el paso actual
  del proyecto se distingue solo por su estado «En curso».
- **§22**: la miniatura de una referencia puede recortarse, pero al pulsarla se abre la
  imagen completa sin recortar en un visor.
- Biblioteca: título de pestaña «Biblioteca · <espacio> · Picasso» y plural «versiones».

### ✅ FASE 4 — Guion (P6) (COMPLETADA · 25-09-2026)
Validada por testing agent (iteration_5: 13/13 flujos; iteration_6: retest de 2 correcciones, 0 fallos)
+ backend verificado de extremo a extremo con los scripts de `/app/scripts_pruebas`.
- **Texto del usuario aplicado al documento maestro** (§3.1 `Guion` con `revision_en_curso?`,
  §6.3 revisiones, §13 «Aprobar una revisión del guion», moneda USD en §3.1 Ajustes y §9.4,
  «Nombre del producto: Picasso» en la cabecera). Además se quitó el selector de moneda de
  Ajustes: «Moneda · USD» como dato fijo.
- **P6 Guion** (`/p/:proyecto/guion[/:pieza]`): lista vertical de escenas editables en sitio con
  autoguardado; título, qué ocurre, qué se ve, intención, sonido previsto, duración orientativa.
- **Reordenar** arrastrando o con `Subir`/`Bajar` (accesibles por teclado); la numeración se recalcula.
- **Elementos de la escena**: chips del reparto del proyecto y nada más. **Diálogos**: hablante
  (narrador o elemento del reparto) + texto.
- **Leer guion completo**: el guion como documento continuo, solo lectura.
- **Aprobación y revisiones (§6.3)**: la primera aprobación abre el lienzo. Editar un guion aprobado
  NO lo desaprueba: `Editar el guion` abre una **revisión en curso** (copia en borrador de las
  escenas) y el guion aprobado sigue vigente. `Aprobar revisión` lista escenas añadidas, editadas,
  eliminadas y reordenadas con sus diferencias y exige marcar en cada escena editada `Solo texto`
  o `Afecta a los planos`; al confirmar, `revision` sube en uno y las marcas quedan guardadas en
  `historial_revisiones` para la Fase 8. `Descartar revisión` vuelve al guion aprobado.
- **Encargo de imagen** (tipo imagen): mismo ciclo borrador/aprobado, con qué se muestra,
  composición, intención, elementos del reparto, referencias y número de imágenes.
- **Capítulos** (serie): lista de capítulos (número, título, de qué va), cada uno con su guion;
  el paso queda listo con un capítulo aprobado.
- **Crear un elemento que falta sin salir del guion (§4.2)**: panel con clase, nombre, descripción
  y referencias; se aprueba su ficha v1 y entra en el reparto.
- **Lienzo bloqueado y explicado (§4.2)**: lista de lo que falta con un enlace a cada paso.
- **Asistente del guion (§10)**: `proponer_escenas` y `reescribir_escena` (además de
  `detectar_elementos`), aceptables una a una. El proveedor simulado no escribe guion.
- Los planos NO se definen aquí (llegan en el lienzo, Fase 5).

### Respuestas del usuario a PREGUNTAS.md (26-09-2026) — APLICADAS
- **§14 F4**: criterio de aceptación sustituido por el texto literal del usuario (revisión en
  curso sin cerrar el lienzo, marcas al aprobar, descartar deja el guion intacto).
- **§6.3**: escritos el mínimo para aprobar un guion (≥1 escena con título y «qué ocurre»;
  encargo: «qué se muestra» + número de imágenes), la revisión de un encargo con **una sola
  marca**, y que la **pieza única** se crea al abrir el guion como contenedor vacío.
- **§3.1 / §6.3 · diálogos (cambio de código)**: el hablante es «narrador» o un elemento de
  **clase personaje que esté en los elementos de esa escena**. El desplegable solo ofrece
  esos; si un hablante deja de estar en la escena el texto se conserva marcado con «Ya no
  está en los elementos de la escena» y `Aprobar guion` / `Aprobar revisión` se bloquean
  explicando qué diálogo corregir (`guiones.py::_personajes_del_proyecto`,
  `_falta_para_aprobar`; `TarjetaEscena.jsx`; `Guion.jsx`).
  Verificado con `scripts_pruebas/p6_hablantes.py` (11/11) y recorrido de interfaz en
  «Pruebas del constructor».
- **NORMA ABSOLUTA**: nunca se escribe, modifica ni borra nada fuera de «Pruebas del
  constructor». Escrita en `PREGUNTAS.md` y en `memory/test_credentials.md`.
  Antecedente: el 25-09 el constructor borró el recorrido de Fase 3 que el usuario había
  hecho en «Espacio 1 · Proyecto 1» al tomar como permanente una orden de limpieza única.

### Revisión del código pedida por el usuario (26-09-2026) — APLICADA
Validada por el agente de pruebas (iteration_7: 9/9 flujos de interfaz, 0 fallos) y por las
pruebas de backend aisladas (pytest 31 OK + 1 marcada `integracion` omitida; scripts p1…p6 OK).
1. **Pruebas aisladas**: `GET /api/entorno` (`{db_name, es_pruebas}`), `DB_NAME_PRUEBAS`,
   `scripts_pruebas/ejecutar.py` (segunda instancia en :8002, base `picasso_pruebas`, almacén
   `/tmp/picasso_pruebas`, se borra al terminar), cerrojos en `scripts_pruebas/comun.py` y
   `backend/tests/conftest.py`, scripts p1…p6 con semilla propia. La prueba que llamaba a
   Claude de verdad pasa a `@pytest.mark.integracion` (§15.5), solo con `PRUEBAS_INTEGRACION=1`.
2. **Stack**: migración real a **Vite + React 19 + TypeScript** (sin cambios de funcionalidad
   ni de aspecto) y corrección en `PREGUNTAS.md` de la falsa «desviación acordada».
3. **Repositorio**: `backend/.env.example` con §15.4 + `DB_NAME`/`DB_NAME_PRUEBAS`, excepción
   en `.gitignore` para `*.env.example` y `frontend/yarn.lock` ya versionable.
4. **Desarrollo (Idea) con sello de versión**: `PUT /api/proyectos/{id}/desarrollo` responde
   **409** si el `updated_at` no coincide; la cabecera muestra «Se ha modificado en otro sitio»
   con **Recargar** / **Sobrescribir** (§12) y nunca muestra «Guardado» tras un fallo. El mismo
   mecanismo se aplicó a escenas y fichas (`GET /api/escenas/{id}` nuevo para poder sobrescribir).

## Backlog (orden del maestro §14)
- P1 FASE 5 — Lienzo (P7) sin producción (React Flow): estructura desde el guion, grupos,
  fichas contextuales, dirección, vista previa del prompt, persistencia del layout.
- P2 FASE 6 — Motor con proveedor `simulado` (operaciones, costes, SSE, tomas, registro,
  inciertos) + «Preparar referencias» (hoja de personaje, photobook, lámina).
- P2 FASE 7 — Montaje (P8) + exportación ZIP/FCPXML.
- P2 FASE 8 — Impacto de cambios (§13), incluido el análisis al actualizar versión de ficha.
- P2 FASE 9 — Proveedores reales (fal, kie, openai_images, elevenlabs) + catálogo de voces.

## PENDIENTE (ver PREGUNTAS.md)
- Tipografía y paleta (a decidir por el usuario). Nombre decidido: **Picasso** (25-09-2026).
- Catálogo de voces del personaje (depende de Fase 9).
- El almacén local no está garantizado como persistente en el entorno de previsualización.
- §3.1 vs §6.2: `ambiente`/`distribucion` de escenario no están en la lista del §3.1.
- §3.1: en `Escena`, `elementos` son ids del reparto y `dialogos.hablante` es un
  `elemento_id`; sería más limpio un único tipo de id.
