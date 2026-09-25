# PRD — studio (nombre del producto: PENDIENTE)

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

## Stack (desviaciones acordadas en PREGUNTAS.md)
- Frontend: Create React App + JavaScript + Tailwind (tokens §21) + React Router +
  TanStack Query + lucide-react. (§15 pedía Vite+TS+React19; entorno impone CRA → React 18.)
- Backend: FastAPI + MongoDB (motor async), estructura §15.2 (api → dominio → motor/…).
- Datos de recorrido en `backend/data/recorridos.yaml`.
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

## Backlog (orden del maestro §14)
- P1 FASE 4 — Guion (P6): escenas, aprobación, lectura continua, encargo de imagen, capítulos.
  Incluye la opción (c) «revisiones del guion» que el usuario dejará escrita en §6.3/§13.
- P2 FASE 5 — Lienzo (P7) sin producción (React Flow).
- P2 FASE 6 — Motor con proveedor `simulado` (operaciones, costes, SSE, tomas, registro,
  inciertos) + «Preparar referencias» (hoja de personaje, photobook, lámina).
- P2 FASE 7 — Montaje (P8) + exportación ZIP/FCPXML.
- P2 FASE 8 — Impacto de cambios (§13), incluido el análisis al actualizar versión de ficha.
- P2 FASE 9 — Proveedores reales (fal, kie, openai_images, elevenlabs) + catálogo de voces.

## PENDIENTE (ver PREGUNTAS.md)
- Nombre del producto, tipografía, paleta (a decidir por el usuario).
- §6.3/§13: el usuario escribirá las «revisiones del guion» antes de la Fase 4.
- §3.1 vs §6.2: `ambiente`/`distribucion` de escenario no están en la lista del §3.1.
- Catálogo de voces del personaje (depende de Fase 9).
- El almacén local no está garantizado como persistente en el entorno de previsualización.
