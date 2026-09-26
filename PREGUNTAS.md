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

- **CORRECCIÓN (26-09-2026, exigida por el usuario)**: en este fichero se dio por
  «acordada» una desviación del §15 (React 19 + Vite + TypeScript) que **no estaba
  acordada en esos términos**: la propuso el constructor por comodidad del entorno y el
  usuario solo aceptó arrancar así. El §15 manda. **Migración hecha el 26-09-2026**:
  el frontend es ahora **Vite + React 19 + TypeScript** (`vite.config.ts`, `tsconfig.json`,
  `index.html` en la raíz del frontend, `src/main.tsx`, todo el código en `.ts`/`.tsx`,
  tipos del dominio en `src/tipos.ts` aplicados en la capa de API). Sin cambios de
  funcionalidad ni de aspecto. Las variables siguen llamándose `REACT_APP_*` porque las
  inyecta la plataforma; Vite las lee con `envPrefix`.
  **DEUDA REGISTRADA (honesta)**: el `tsconfig.json` está en modo pragmático
  (`strict: false`, `noImplicitAny: false`). Los tipos del dominio y la capa de API sí
  están tipados; los componentes se tiparon solo donde hacía falta para compilar. Apretar
  el modo estricto fichero a fichero queda pendiente y es un paso aislado y verificable.
- **COMPROMISO DE TIPADO (exigido por el usuario, 26-09-2026)**:
  1. **Todo el código nuevo de la Fase 5 (lienzo) va tipado, sin `any`**: tipos explícitos
     para planos, nodos, aristas, encargos de generación, props y respuestas de API
     (declarados en `frontend/src/tipos.ts` y en los modelos del backend).
  2. **`noImplicitAny: true` se activa antes de empezar la Fase 6**, tipando los ficheros
     heredados de las Fases 1 a 4 que lo necesiten. `yarn build` (que ejecuta
     `tsc --noEmit && vite build`) tiene que pasar sin errores con la bandera puesta.
  3. Mientras esa deuda exista, queda escrita aquí y en `memory/PRD.md`.

- **`noImplicitAny` ACTIVADO (26-09-2026)**. `yarn build` (`tsc --noEmit && vite build`) pasa
  limpio con la bandera puesta. Cómo se ha tipado lo heredado de las Fases 1-4:
  - Props de todos los componentes con interfaces explícitas, usando los tipos del dominio
    (`Escena`, `EntradaReparto`, `Elemento`, `FichaVersion`, `Medio`, `Pieza`, `Proyecto`,
    `Espacio`, `Paso`, `Recorrido`, `Referencia`).
  - Los formularios heredados que guardan sus campos **por clave** (ficha de elemento, tarjeta
    de escena, encargo de imagen, desarrollo) usan `CamposDinamicos = Record<string, any>`, y
    los mapas de etiquetas/ayudas por clave, `Record<string, any>`. Es un `any` **explícito y
    acotado**: queda escrito aquí, no se usa en el código nuevo (Fase 5 en adelante) y se
    cerrará cuando esos formularios pasen a modelos tipados por clase.
  - Algunas devoluciones de llamada heredadas (eventos del DOM en `PanelAsistente`,
    `DialogoRevision`, `Biblioteca`) llevan `any` explícito por el mismo motivo.
  - Lo importante: con la bandera activada **no puede volver a entrar un `any` implícito**.
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

## Fase 4 · Guion (P6)

- **RESUELTO Y ESCRITO EN EL DOCUMENTO (25-09-2026)**: contradicción §14 F4 vs §6.3.
  El usuario ha sustituido el criterio de aceptación de la F4 por su texto literal:
  «✔ Escribir 3 escenas, reordenarlas, leerlas seguidas y aprobar. El lienzo se abre.
  Editar después crea una revisión en curso sin cerrar el lienzo; al aprobarla se marcan
  las escenas editadas (Solo texto / Afecta a los planos); descartarla deja el guion
  aprobado intacto.» Ya no hay contradicción: el §14 y el §6.3 dicen lo mismo.

- **PENDIENTE (§3.1, `revision_en_curso?`)**: El documento dice que es «copia en borrador
  de las escenas mientras se edita un guion ya aprobado», pero no dice dónde vive esa
  copia. Implementado así: las escenas son siempre filas de la colección `escenas` con un
  campo `borrador`. Con `borrador: False` son las escenas del guion aprobado (intocables,
  las que usará el lienzo); con `borrador: True` son la copia de la revisión en curso, y
  cada copia guarda `origen_id` para poder calcular las diferencias. En el `Guion`,
  `revision_en_curso` guarda solo `{creada_en}`.

- **PENDIENTE (§3.1 Pieza vs §4.1 serie)**: El §4.1 pide que un capítulo tenga «número,
  título y **de qué va**», pero el §3.1 solo define `numero?` y `titulo?`. Se ha añadido
  `de_que_va?` a `Pieza`. Falta corregir uno de los dos apartados.

- **RESUELTO por el usuario y ESCRITO EN EL §6.3 (25-09-2026)**: requisitos mínimos para
  aprobar un guion. Al menos una escena, y cada escena con título y «qué ocurre». Para un
  **encargo de imagen**: «qué se muestra» escrito y un número de imágenes mayor que cero.
  Cuando falta algo, el botón está desactivado y al lado se explica exactamente qué falta.

- **RESUELTO por el usuario y ESCRITO EN EL §6.3 (25-09-2026)**: revisiones de un **encargo
  de imagen**. No tiene escenas: la revisión muestra los campos que cambian con su antes y
  después y se marca **una sola vez** («Solo texto» / «Afecta a las imágenes»).

- **PENDIENTE (§13, aplazado a la Fase 8)**: Al aprobar una revisión, los efectos del §13
  todavía **no se aplican** porque no existen planos ni tomas hasta las Fases 5 y 6. Lo que
  sí se hace ya es **guardar las marcas** de cada escena editada en
  `guion.historial_revisiones`, para que la Fase 8 pueda aplicar las reglas sin volver a
  preguntar. La interfaz del diálogo de revisión avisa de qué pasará con las escenas
  eliminadas y reordenadas.

- **RESUELTO por el usuario y ESCRITO EN EL §6.3 (25-09-2026)**: la lectura es correcta.
  Un corto, un anuncio y una imagen tienen **una** pieza (§2), creada al abrir el paso del
  guion porque es un contenedor vacío, no contenido: no fabrica idea, escenas ni material.
  En una **serie** los capítulos los crea siempre el usuario.

- **RESUELTO por el usuario y ESCRITO EN EL §3.1 y §6.3 (25-09-2026)**: quién puede hablar
  en un diálogo. Es «narrador» o un elemento de **clase personaje** que esté en los
  **elementos de esa escena**. El desplegable solo ofrece esos. Si un hablante deja de estar
  en los elementos de la escena, el texto **se conserva**, marcado con «Ya no está en los
  elementos de la escena», y `Aprobar guion` / `Aprobar revisión` quedan **bloqueados**
  explicando qué diálogo hay que corregir.

- **PENDIENTE (§3.1, incoherencia menor)**: En `Escena`, `elementos` son «ids del reparto»
  (la fila de la tabla de relación) pero `dialogos.hablante` es un «elemento_id». Se ha
  seguido el documento **al pie de la letra**, así que la pantalla resuelve las dos cosas
  contra el reparto. Sería más limpio usar el mismo tipo de id en los dos sitios.

- **PENDIENTE**: El `Encargo de imagen` (§4.1) pide «elementos» sin decir de qué tipo de id.
  Se usan **ids del reparto**, igual que en `Escena`.

- **Decisión de implementación**: al aprobar una revisión, cada escena que ya existía
  **conserva su id**; solo las añadidas reciben uno nuevo. Así los planos que se construyan
  en la Fase 5 seguirán apuntando a la misma escena después de cada revisión.

- **PENDIENTE (§10, `proponer_escenas` con proveedor simulado)**: El proveedor simulado no
  escribe guion. Propone escenas con un título marcado como simulado y, al aceptarlas, crea
  la escena **vacía** para que la escribas tú. `reescribir_escena` devuelve un texto de
  relleno evidente. El trabajo de verdad lo hará el proveedor real (§10) cuando lo actives.

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

- **RESUELTO por el usuario (25-09-2026) · cambio del §4.3**: Para **aprobar** una
  `FichaVersion` se exige **descripción no vacía** siempre y, además, **al menos una imagen
  de referencia en personajes y productos**. Escenarios y objetos no la exigen. Escrito en
  el §4.3 punto 4 del documento maestro. Cuando falta algo, el botón `Aprobar versión` está
  desactivado y al lado se explica exactamente qué falta.

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

- **DECISIONES DE LA FASE 5 (26-09-2026)**, tomadas donde el documento no lo fija:
  - La **modalidad por defecto** de un plano nuevo es `video`, salvo en los proyectos de
    tipo `imagen`, donde es `imagen`. El documento no lo dice; se cambia en la ficha del
    plano con un selector.
  - Un plano nuevo **hereda los elementos de su escena** (§3.1: «subconjunto de la
    escena»), y se quitan a mano en la ficha.
  - Los planos cuya escena desaparece en una revisión **se conservan** (§13) y el lienzo los
    devuelve aparte, en `planos_sin_escena`; la fila «sin escena» del lienzo se dibujará
    cuando haga falta (hoy solo se conservan en datos, no se pierden).
  - La disposición automática (§7.1) se aplica **por nodo**: cada tarjeta sin posición
    guardada recibe la automática, y las guardadas mandan siempre. Así los planos nuevos
    aparecen colocados sin recolocar todo.
  - `GET /api/escenas/{id}` se ha añadido para poder **sobrescribir** una escena tras un
    conflicto 409 (§12).

- **NORMA DE PRUEBAS (impuesta por el usuario, 26-09-2026)**: ninguna prueba ni script
  del constructor escribe en la base de datos de la previsualización. Las pruebas de
  backend (pytest + `scripts_pruebas/p1…p6`) se lanzan con
  `python3 scripts_pruebas/ejecutar.py`, que levanta una **segunda instancia del backend**
  en el puerto 8002 con su propia base (`DB_NAME_PRUEBAS=picasso_pruebas`) y su propio
  almacén (`/tmp/picasso_pruebas`), y la borra al terminar. `GET /api/entorno` dice a qué
  base apunta cada instancia y **todas las pruebas abortan** si no es la de pruebas
  (`scripts_pruebas/comun.py` y `backend/tests/conftest.py`).
  Las pruebas **de interfaz** sí usan la previsualización (la base del usuario) y por eso
  se hacen **solo** dentro del espacio «Pruebas del constructor».

- **NORMA DE TRABAJO (impuesta por el usuario, 25-09-2026)**: Las pruebas del constructor
  y cualquier dato simulado van **solo** en el espacio **«Pruebas del constructor»**. Los
  espacios del usuario no se tocan. Al terminar de probar, el `ultimo_acceso` de los
  proyectos de prueba se deja anterior al del usuario para que «Retomar» refleje la última
  visita del usuario y no la del constructor.

- **NORMA ABSOLUTA (impuesta por el usuario, 26-09-2026 · sin excepciones)**:
  **Nunca escribes, modificas ni borras nada fuera de «Pruebas del constructor», por
  ningún motivo. Si algo del usuario te parece que sobra, se lo preguntas.**
  Contexto: el 25-09-2026 el usuario pidió dejar limpio «Espacio 1 · Proyecto 1» para
  quitar datos de prueba del constructor; era una orden **de una sola vez**, no un estado
  que mantener. El constructor la aplicó como regla permanente y borró el recorrido de
  Fase 3 que el usuario había hecho en ese proyecto (desarrollo, reparto, fichas y
  medios). No fue un reinicio del entorno: fue un borrado en la base de datos, y no era
  recuperable. Qué persiste en la previsualización: **MongoDB persiste** entre reinicios
  de servicio y entre sesiones (lo que desaparece es porque se ha borrado); los
  **ficheros subidos** viven en el disco del contenedor, sobreviven a reinicios de
  servicio pero el entorno no garantiza el disco a largo plazo (ver la desviación del
  almacén, más abajo).

- **PENDIENTE (§22)**: El documento no dice cómo se ve una referencia a tamaño completo.
  Decisión del usuario: la miniatura puede recortarse, pero al pulsarla se abre la imagen
  completa **sin recortar**. Construido como visor sobre la pantalla.

- **PENDIENTE (§5.3)**: El documento dice "el paso actual se distingue claramente", sin
  separar «el paso que estoy viendo» de «el paso actual del proyecto». Decisión del usuario:
  el paso que se está viendo lleva el marcador fuerte **«Estás aquí»** (recuadro y nombre en
  negrita) y el paso actual del proyecto se distingue solo por su estado **«En curso»**.

- **NO CONSTRUIDO A PROPÓSITO (Fase 6)**: `Preparar referencias` (hoja de personaje,
  photobook del producto, lámina del escenario, §4.3.3 y §6.2). El botón se muestra
  desactivado con el texto "Disponible cuando esté el motor (Fase 6)" y nada más, por
  indicación del usuario.

## Fase 6 · Motor con proveedor simulado (26-09-2026)

### DEUDA DE TIPADO, escrita como exigió el usuario
- **El código del motor va con CERO `any`**, ni implícito ni escrito a mano:
  `backend/app/motor/*` (contrato, catálogo, estados, operaciones, worker, ficheros,
  proveedores/simulado) usa modelos Pydantic v2 inmutables (`frozen=True`) y
  `dict[str, Any]` solo para documentos de MongoDB en los bordes; y en el frontend
  `componentes/motor/*`, `componentes/lienzo/PanelProducir.tsx`,
  `PanelTomas.tsx` y `pantallas/Registro.tsx` no tienen ni un `any`.
- **Quedan 70 apariciones de `any` en el código heredado de las Fases 1 a 4** (deuda
  registrada, no se amplía). `noImplicitAny: true` sigue activado, así que ninguno es
  implícito: todos están escritos a mano y acotados. Reparto por fichero:

  | Fichero | `any` |
  | --- | --- |
  | `frontend/src/api/cliente.ts` | 11 |
  | `frontend/src/componentes/PanelAsistente.tsx` | 10 |
  | `frontend/src/pantallas/Desarrollo.tsx` | 9 |
  | `frontend/src/componentes/DialogoRevision.tsx` | 8 |
  | `frontend/src/componentes/TarjetaEscena.tsx` | 6 |
  | `frontend/src/pantallas/PasoElementos.tsx` | 4 |
  | `frontend/src/pantallas/Guion.tsx` | 4 |
  | `frontend/src/pantallas/Biblioteca.tsx` | 4 |
  | `frontend/src/lib/campos.ts` | 4 |
  | `frontend/src/pantallas/Apertura.tsx` | 3 |
  | `frontend/src/componentes/FichaElemento.tsx` | 3 |
  | `frontend/src/tipos.ts` | 2 |
  | `frontend/src/pantallas/Espacio.tsx` | 1 |
  | `frontend/src/estado/useAutoguardado.ts` | 1 |

  Casi todos son `CamposDinamicos = Record<string, any>` (formularios heredados que
  guardan por clave), respuestas sin tipar en la capa de API y eventos del DOM. Se
  cerrarán cuando esos formularios pasen a modelos tipados por clase.

### Decisiones tomadas con el usuario (aplicadas literalmente)
- **Contrato (§9.1)**: `estimar` devuelve `Decimal | None` (`None` = «coste sin
  verificar», nunca 0 por desconocido); `consultar` **solo lee**; el estado
  «incierto» **no** está en `EstadoRemoto`: lo decide el motor cuando enviar o
  consultar no contestan (`SinRespuesta`). `EntradaOperacion` valida por acción qué
  campos exige y cuáles no le tocan.
- **Idempotencia**: clave = `hash(operacion_id + número de intento + entradas)`.
  Antes de enviar, el motor busca un intento con esa misma clave y no envía otra vez.
  «Producir otra toma» es otra operación y «Reintentar» es otro intento: esos sí se
  envían, con autorización nueva.
- **Catálogo (§9.3)**: se valida al arrancar (acción desconocida, proveedor que no
  existe, unidad inválida o moneda distinta de USD → no arranca, diciendo qué entrada
  falla). Modelos simulados: `sim-imagen` 0,04 $/imagen · `sim-editar` 0,03 $/operación ·
  `sim-video` 0,25 $/s (24 fps) · `sim-video-cine` 3 $/s (30 fps, 1920) ·
  `sim-voz` 0,002 $/carácter (44,1 kHz) · `sim-personaje-hablando` (48 kHz) ·
  `sim-sin-precio` (coste `null`) · `sim-inestable` («Simulado · falla»). Todos con
  `verificado: false` → la interfaz dice **«precio simulado»**. Los proveedores reales
  quedan como **plantillas** (`plantilla: true`, «Plantilla · rellenar»): no son
  elegibles hasta que el usuario las rellene y quite la marca.
- **Dinero**: al autorizar se **reserva** el coste estimado; al completar, la reserva se
  sustituye por el coste real; al fallar sin cobro se libera. El gasto de la cabecera es
  **real + reservado** y lo dice («incluye X reservado»).
- **Reinicio del backend**: el worker retoma desde la base. Las operaciones con
  `id_remoto` se vuelven a consultar; una enviada sin `id_remoto` pasa a **incierta**.
  **Nunca se reenvía nada al arrancar.**
- **Router**: primer proveedor configurado del modelo; si falla **antes** de enviar,
  propone el siguiente con su coste y exige autorizar otra vez. Concurrencia 2 por
  proveedor con posición de cola visible.
- **Exploración (§8)**: una sola operación, N=4 por defecto, coste = N × precio
  unitario con autorización única. Las variantes que fallan no se cobran (se cobra solo
  lo producido) y se pueden reintentar sueltas. Las tomas de exploración van aparte;
  «Fijar» escribe encuadre/ángulo (inicio o final en vídeo) y «Usar como toma del
  plano» crea una toma de verdad.
- **Correcciones (§7.7d)**: en imagen, `editar_imagen` sobre la toma elegida con la
  corrección como instrucción; en vídeo, volver a producir con la toma elegida como
  referencia y la corrección **sumada al prompt** (visible y editable antes de
  autorizar). Si el plano no tiene toma, la corrección se suma al prompt de la primera
  producción. Al elegir la toma resultante, la corrección se marca «Hecha» sola.
- **Planos sin escena (§13)**: fila al final del lienzo, con «Mover a escena…» y
  «Borrar», y el aviso de que no entran en el montaje hasta que tengan escena.
- **Registro (§9.5)**: el mismo dato por tres puertas: pantalla global `/registro`
  (filtros espacio/proyecto/estado/fecha, totales por espacio y por proyecto, CSV),
  panel «Registro» en el lienzo filtrado al proyecto, y las operaciones de cada plano
  en su pestaña «Producir». `/api/eventos` emite **solo** los eventos del proyecto que
  se está viendo.
- **Proveedor simulado**: ficheros reales con ffmpeg, formatos variados según el modelo
  (24 o 30 fps, resoluciones distintas, 44,1 o 48 kHz), siempre en la relación del
  proyecto; duración exacta y voces a 15 caracteres por segundo; cada fichero escribe el
  plano (E1·P2), la acción, el encuadre y el ángulo (inicio → final en vídeo), la
  variante y las miniaturas de las referencias recibidas en una esquina; `editar_imagen`
  parte de la imagen de entrada y sobreimprime «editado: <instrucción>»;
  `personaje_hablando` y `sincronizar_labios` devuelven MP4 con la pista de audio
  recibida. Todo determinista por clave de idempotencia. `coste_real` = la estimación
  (y `null` en el modelo sin precio).

### PENDIENTE (no entra en la Fase 6 acordada)
- **`Preparar referencias`** (hoja de personaje, photobook del producto, lámina del
  escenario; §4.3.3 y §6.2) **no se ha construido**: el usuario no lo incluyó en el
  alcance de la Fase 6. El botón sigue desactivado y ahora lo dice así. Falta decidir
  cuándo se construye.
- **Despliegue**: `docker-compose.yml`, `backend/Dockerfile` (con **ffmpeg** declarado)
  y `frontend/Dockerfile` están escritos, pero **no se han probado fuera de este
  entorno**. Queda anotado en `TRASPASO.md`.

- **Detalle menor (26-09-2026)**: los filtros de fecha de `/registro` usan el selector de
  fecha nativo del navegador, que muestra el formato de la configuración del navegador
  (en inglés puede verse «mm/dd/yyyy») aunque la aplicación esté en español. Debajo de
  cada campo se indica **día/mes/año**. Cambiarlo del todo exigiría un selector de fecha
  propio; queda anotado, no construido.
