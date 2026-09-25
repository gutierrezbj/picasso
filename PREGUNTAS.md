# PREGUNTAS.md

Marcadores de lo que falta, es ambiguo o se contradice. No se resuelve por cuenta
del constructor (§0.2 del maestro). Cada punto queda con `PENDIENTE`.

## Preguntas abiertas del propio documento (§17)

1. **RESUELTO por el usuario (25-09-2026)**: Nombre del producto: **Picasso**, ya escrito
   en la cabecera del documento maestro. Identificador en código: `studio`.
   **PENDIENTE**: familia tipográfica. Provisional: `Mulish` (sans humanista) para
   `font.ui` e `IBM Plex Mono` para `font.technical`. A confirmar por el usuario.
2. **PENDIENTE**: Paleta de color. Se usan neutros claros provisionales,
   centralizados en tokens (`frontend/src/index.css`). Modo claro.
3. **PENDIENTE**: Modelos y precios reales del catálogo. Quedan `null` →
   "coste sin verificar" (Fase 6/9).
4. **PENDIENTE**: Música ¿se genera o solo se importa? En esta versión: solo se
   importa (§16, §17.4).
5. **PENDIENTE**: Duración máxima por plano según modelo (la fija el catálogo).

## Desviaciones de entorno (con motivo, acordadas con el usuario)

- **DESVIACIÓN (acordada)**: El §15 pide React 19 + Vite + TypeScript. El usuario
  aceptó **Create React App + JavaScript** para este entorno. Motivo: es el
  arranque que soporta la plataforma de previsualización. Nota honesta: CRA
  (`react-scripts`) no da soporte oficial a React 19, por lo que se usa **React 18**.
  El resto del §15 se mantiene (FastAPI, MongoDB, React Flow en Fase 5, SSE en
  Fase 6, ffmpeg en Fase 7).
- **DESVIACIÓN (acordada)**: En previsualización los servicios los lanza supervisor,
  no `docker-compose`. El `docker-compose.yml` y los Dockerfiles del §15 se añadirán
  para el despliegue en la infraestructura propia del usuario. Ninguna lógica de la
  aplicación depende de supervisor; toda la configuración va por variables de entorno
  (`.env.example`, §15.4). Se añade `DB_NAME` a las variables por requisito de la
  plataforma (el §15.4 no lo listaba).

## Fase 2 · Desarrollo y asistente

- **PENDIENTE (§10)**: Conexión del asistente a un modelo real
  (`ProveedorTexto`, §10) para uso por defecto. Por decisión del usuario el asistente
  se mantiene en **`simulado`** durante la revisión; las propuestas simuladas se
  muestran como tales ("Propuesta simulada para <campo>", texto de relleno evidente).
  El criterio de la Fase 2 "con Claude" queda **aplazado** hasta que el usuario lo
  active. La ruta Anthropic (`claude-sonnet-5` vía Universal Key) está implementada y
  verificada una vez; el valor por defecto de `modelo_asistente` es ahora `simulado`
  (el §10 fija Claude por defecto → desviación temporal registrada aquí).
- **CORRECCIÓN de un resumen anterior**: se dijo que el asistente muestra el coste
  antes de ejecutar. **No lo hace y el documento no lo pide**: el §10 no habla de
  coste; el coste visible antes de ejecutar es del **motor** (§9, Fase 6) y de
  "Preparar referencias" (§4.3.3, Fase 6). El asistente solo avisa de que el
  proveedor es `simulado`.

- **RESUELTO Y ESCRITO EN EL DOCUMENTO (25-09-2026)**: Edición de un guion aprobado.
  El usuario ha escrito en el documento maestro la opción **(c) revisiones del guion**:
  §3.1 (entidad `Guion` con `revision_en_curso?`), §6.3 (`Aprobar guion`, revisión en
  curso, `Aprobar revisión` con la lista de escenas añadidas/editadas/eliminadas/
  reordenadas y la marca `Solo texto` / `Afecta a los planos`, `Descartar revisión`) y
  §13 (fila «Aprobar una revisión del guion»). Se construirá en la **Fase 4** exactamente
  así. Ya no hay nada que decidir aquí.

- **RESUELTO por el usuario (25-09-2026)**: Moneda. El documento (§3.1 Ajustes y §9.4)
  fija **USD sin conversión**. El selector de moneda se ha quitado de la pantalla P10:
  ahora «Moneda: USD» es un dato fijo. El campo `moneda` sigue existiendo en la entidad
  `Ajustes` porque el §3.1 lo lista, y se guarda siempre como `USD`.

- **PENDIENTE (cosmético)**: Etiqueta del estado `guion` de la Pieza en proyectos de
  tipo `imagen`. Resuelto por el usuario: el paso y su estado se llaman
  "Encargo de imagen", nunca "Guion". Aplicado en `recorridos.yaml`.

## Fase 3 · Pasos de elementos, fichas, biblioteca y medios

- **RESUELTO por el usuario (Fase 1 → hecho en Fase 3)**: Portada y logo del espacio.
  Quedó aplazado porque dependía del subsistema de medios. Ya está construido: se
  suben desde `Identidad del espacio` (P2) y desde el formulario de `Nuevo espacio`
  (P1). Las tarjetas de espacio muestran la portada o, si no hay, el logo; la cabecera
  del espacio muestra el logo o, si no hay, la portada.

- **DESVIACIÓN (acordada, decisión del usuario)**: El §15.1 fija el almacén de medios
  en sistema de ficheros bajo `DATA_DIR/media/<espacio>/<medio_id>.<ext>`. Se construye
  así, detrás de la interfaz `Almacen` (`backend/app/almacen/`), con una única
  implementación `AlmacenLocal`. **Aviso honesto**: en el entorno de previsualización
  el disco del contenedor no está garantizado como persistente, así que los archivos
  subidos pueden desaparecer en un reinicio. El usuario asume que en su
  infraestructura el volumen sí persiste. Cambiar a S3 compatible es añadir otra
  implementación de `Almacen`; nada más del código cambia.

- **PENDIENTE (§3.1 vs §6.2)**: El §3.1 define `FichaVersion` con
  `materiales_colores?` para productos, pero **no** lista campos para escenario,
  mientras que el §6.2 sí pide "ambiente y distribución (escenario)". Se han añadido
  `ambiente?` y `distribucion?` a `FichaVersion` para poder cumplir el §6.2. Si el
  §3.1 es la lista cerrada, habría que corregir uno de los dos apartados.

- **PENDIENTE (§3.1)**: `voz` de un personaje es `{proveedor, voice_id, ajustes}`,
  pero el catálogo de voces depende de los proveedores reales (ElevenLabs, §9.3,
  Fase 9). En Fase 3 `proveedor` y `voice_id` son dos campos de texto libres y la
  ayuda del campo lo dice. Falta decidir de dónde sale la lista de voces elegibles.

- **RESUELTO por el usuario**: Paso «Mundo y escenarios». El §4.1 dice que en ese paso
  se construye "Descripción del mundo (**en el Desarrollo**) y los escenarios". Decisión
  del usuario: el campo «Mundo» se **muestra y edita también en la pantalla del paso**,
  además de en Idea. Implementado como dato, no como código: el paso lleva
  `campo_desarrollo: mundo` en `recorridos.yaml` (corto y serie).

- **RESUELTO por el usuario**: `Actualizar a vN+1` (§6.2) dice que abre el análisis de
  impacto del §13, pero el §13 se construye en la **Fase 8** y en Fase 3 todavía no hay
  guion ni planos que invalidar. Decisión del usuario: en Fase 3 el botón **actualiza la
  versión de ficha fijada en el reparto** y la interfaz avisa de que el análisis de
  impacto llega en la Fase 8.

- **PENDIENTE (§4.1, anuncio)**: El paso `Producto` está listo "con ficha aprobada **y al
  menos una referencia**", condición que ningún otro paso de elementos tiene. Se ha
  modelado como dato (`requiere_referencia: true` en `recorridos.yaml`) para no meter
  una excepción en el código. Falta confirmar si es solo del anuncio o debería aplicarse
  a más pasos.

- **PENDIENTE**: El documento no dice qué pasa al **borrar un Medio que se usa como
  referencia** en una ficha. Decisión, por coherencia con el §13 ("Borrar un elemento
  del reparto: bloqueado si algún plano lo usa"): se **bloquea** y se listan los
  elementos que lo usan. Igual con **borrar un Elemento** que está en algún reparto.

- **PENDIENTE**: El documento no fija **requisitos mínimos para aprobar** una
  `FichaVersion`. Decisión: se exige **descripción no vacía**; el resto de campos son
  opcionales. Si debe exigirse más (por ejemplo una referencia en todas las clases),
  hay que escribirlo.

- **PENDIENTE (§10, `detectar_elementos`)**: Con el proveedor `simulado` la tarea no
  puede "entender" el desarrollo: extrae **literalmente** las palabras con mayúscula
  inicial que el usuario ha escrito y que no están ya en el proyecto, y las propone con
  el aviso de que son propuestas simuladas. Por eso puede proponer ruido (por ejemplo
  un verbo al principio de una frase). El trabajo de verdad lo hace el proveedor real
  (§10) cuando el usuario lo active.

- **PENDIENTE (§5, P3)**: La Biblioteca del espacio es "para consultar y **ordenar**
  fuera de un proyecto". Interpretado como **filtrar por clase y ordenar** (por nombre o
  por más recientes). No hay reordenación manual porque el documento no define ningún
  orden que se guarde ni carpetas ni etiquetas.

- **PENDIENTE**: El documento no fija un **tamaño máximo** por archivo subido. Límite
  puesto en 25 MB por archivo, con error claro al superarlo.

- **NO CONSTRUIDO A PROPÓSITO (Fase 6)**: `Preparar referencias` (hoja de personaje,
  photobook del producto, lámina del escenario, §4.3.3 y §6.2). El botón se muestra
  desactivado con el texto "Disponible cuando esté el motor (Fase 6)" y nada más, por
  indicación del usuario.
