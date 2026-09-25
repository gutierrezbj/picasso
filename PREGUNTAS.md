# PREGUNTAS.md

Marcadores de lo que falta, es ambiguo o se contradice. No se resuelve por cuenta
del constructor (§0.2 del maestro). Cada punto queda con `PENDIENTE`.

## Preguntas abiertas del propio documento (§17)

1. **PENDIENTE**: Nombre del producto y familia tipográfica. En código se usa el
   identificador `studio`. Tipografía provisional: `Mulish` (sans humanista) para
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

- **PENDIENTE (Fase 2, §10)**: Conexión del asistente a un modelo real
  (`ProveedorTexto`, §10) para uso por defecto. Por decisión del usuario el asistente
  se mantiene en **`simulado`** durante la revisión; las propuestas simuladas se
  muestran como tales ("Propuesta simulada para <campo>", texto de relleno evidente).
  El criterio de la Fase 2 "con Claude" queda **aplazado** hasta que el usuario lo
  active. La ruta Anthropic (`claude-sonnet-5` vía Universal Key) está implementada y
  verificada una vez; el valor por defecto de `modelo_asistente` es ahora `simulado`
  (el §10 fija Claude por defecto → desviación temporal registrada aquí).

- **PENDIENTE (Fase 3)**: Portada/logo del espacio. El formulario de "Nuevo espacio"
  (§5.1) menciona "portada o logo opcional" y las tarjetas de espacio (P1) muestran
  "portada o logo". Pero la subida de medios (entidad `Medio` + almacén) está en la
  **Fase 3**. Decisión tomada para no construir medios fuera de su fase: en Fase 1 el
  espacio se crea con nombre, tipo y notas de marca; la portada/logo llega con el
  subsistema de medios en la Fase 3. Las tarjetas muestran una superficie neutra con
  la inicial del nombre mientras tanto.

- **RESUELTO por el usuario (a construir en Fase 4, §6.3 y §13)**: Edición de un guion
  aprobado. No es (a) literal ni (b) corrección menor. La decisión es la opción **(c)
  revisiones del guion**: el usuario la dejará escrita en el documento maestro (§6.3 y
  §13) y se construirá en la **Fase 4** exactamente según lo que diga el documento. No
  se implementa nada de esto por adelantado ni por cuenta del constructor.

- **PENDIENTE (cosmético)**: Etiqueta del estado `guion` de la Pieza en proyectos de
  tipo `imagen`. Resuelto por el usuario: el paso y su estado se llaman
  "Encargo de imagen", nunca "Guion". Aplicado en `recorridos.yaml`.
