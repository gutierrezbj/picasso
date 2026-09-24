# Documento maestro y arquitectura

Versión 0.1 · 24 de septiembre de 2026 · Nombre del producto: pendiente (identificador en código: `studio`)

Documento compañero: `NUEVA-APLICACION-INTENCION-FUNCIONAMIENTO-Y-DISENO.md` (en adelante, **Intención**). Se entregan juntos. La Intención manda sobre el propósito, el recorrido y el diseño; este documento manda sobre el modelo, la arquitectura y el orden de construcción.

---

## 0. Reglas para quien construye (léelas primero)

1. **Construye solo lo que está escrito aquí.** Si una pantalla, entidad, campo, botón, estado o flujo no aparece en este documento o en la Intención, no existe. No lo añadas "porque mejora la experiencia".
2. **Si algo falta o se contradice, no lo resuelvas por tu cuenta.** Apúntalo en `PREGUNTAS.md` en la raíz del repo, deja un marcador visible `PENDIENTE: <pregunta>` en el punto afectado y sigue con lo demás.
3. **Usa el vocabulario del §2 tal cual**, en la interfaz y en el código. No introduzcas sinónimos (ni "asset", "clip", "shot", "board", "workflow"… en la interfaz).
4. **Nada se genera sin que el usuario lo autorice.** Ninguna llamada a un proveedor de pago se dispara al crear, abrir, cambiar un selector o cargar una pantalla.
5. **Nada se crea automáticamente.** Crear un espacio, proyecto o pieza vacío no fabrica idea, guion, personajes, escenas ni material.
6. **No inventes datos de ejemplo** en la experiencia real. Los datos semilla de desarrollo van marcados como `demo` y se pueden borrar con un comando.
7. **No inventes precios ni nombres de modelos.** El catálogo de modelos (§9.3) es un fichero de datos; los valores que no conozcas quedan como `null` y la interfaz muestra "coste sin verificar".
8. **Construye por fases (§14) y en orden.** No empieces una fase sin que la anterior cumpla sus criterios de aceptación.
9. **Modo claro por defecto.** Diseño según los tokens de la Intención §21. La paleta no está fijada: usa neutros claros provisionales centralizados en tokens.
10. **Pruebas sin gastar dinero.** Toda prueba usa el proveedor `simulado`. Ningún test llama a APIs reales.

---

## 1. Propósito en una página

Un estudio propio de desarrollo creativo y producción audiovisual. El usuario trae una idea, la desarrolla, prepara los elementos, escribe y aprueba el guion, dirige visualmente cada plano en un lienzo amplio, produce con proveedores de IA eligiendo modelo y viendo el coste antes, revisa y elige entre versiones, compone la pieza y se lleva el material para acabarlo en DaVinci Resolve o CapCut.

**El problema que resuelve es la coherencia y la dirección, no la generación.** Generar lo hace cualquier API. Lo que falta en el mercado es el recorrido: saber en todo momento para quién se trabaja, qué se ha decidido, con qué material y qué viene después, sin reconstruir el contexto al cambiar de pantalla.

**Papeles:** el usuario concibe, decide, dirige, revisa y elige. La aplicación orienta, ayuda a desarrollar, conserva el contexto y coordina los proveedores. El asistente de IA es opcional y nunca decide por el usuario.

**Qué NO es:**
- No es un generador de "un clic" que produce una pieza entera.
- No es una caja de conectar APIs con nodos genéricos.
- No es un editor de vídeo (el acabado se hace en DaVinci/CapCut).
- No es multiusuario en esta versión: un solo usuario (el director). Los clientes son espacios, no cuentas.

---

## 2. Vocabulario cerrado

| Término | Qué es | Qué no es |
| --- | --- | --- |
| **Estudio** | Todo el trabajo del usuario. La pantalla de entrada. | — |
| **Espacio** | Ámbito de un cliente, marca o trabajo propio. Tiene su biblioteca. | Una carpeta de archivos. |
| **Proyecto** | Un trabajo concreto dentro de un espacio, de un **tipo** fijo. | — |
| **Tipo de proyecto** | `corto`, `anuncio`, `imagen`, `serie`. Se elige al concretar el proyecto y no se vuelve a preguntar. | — |
| **Recorrido** | La secuencia ordenada de pasos que sigue un proyecto según su tipo (§4). Es lo que guía al usuario de la entrada al lienzo. | Un asistente que decide por él. |
| **Paso** | Una parte del recorrido: qué se construye y cuándo está listo. | Una pantalla independiente que obliga a trasladar material. |
| **Pieza** | El entregable. Corto, anuncio e imagen tienen una; una serie tiene una por capítulo. | — |
| **Capítulo** | Una pieza dentro de una serie, con número y título. | — |
| **Desarrollo** | Lo que el usuario ha decidido sobre la idea: intención, premisa, tono, mensaje, etc. | Un prompt. |
| **Formato** | Guía de trabajo opcional que estructura el desarrollo y el guion (preguntas, partes). Es un dato, no código. | Una regla obligatoria. |
| **Elemento** | Personaje, producto, objeto o escenario. Vive en la biblioteca del espacio. | — |
| **Ficha** | Definición versionada de un elemento: rasgos que deben mantenerse, referencias, voz. | — |
| **Referencia** | Imagen (u otro medio) que fija el aspecto de un elemento o de un plano. | — |
| **Reparto** | Elementos que el proyecto usa, elegidos por el usuario de la biblioteca. | Toda la biblioteca. |
| **Guion** | Secuencia de escenas de una pieza, legible para una persona. Tiene estado `borrador` o `aprobado`. | Texto técnico para un proveedor. |
| **Escena** | Unidad narrativa: qué ocurre, qué se ve, quién interviene, qué se dice, qué intención tiene. | — |
| **Plano** | Unidad de producción dentro de una escena: un fragmento concreto con su dirección (encuadre, cámara, luz, duración). | — |
| **Dirección** | Las decisiones visuales de un plano (§8). | — |
| **Operación** | Una petición al motor preparada por el usuario: qué, con qué modelo, con qué entradas, cuánto cuesta. | Una generación ya hecha. |
| **Toma** | Un resultado producido para un plano (o para una ficha). Un plano puede tener varias. | — |
| **Toma elegida** | La que el usuario ha marcado para usar. Solo una por plano. | "La última generada". |
| **Lienzo** | Superficie amplia donde se dirige y produce. Posición en el lienzo ≠ orden narrativo. | — |
| **Montaje** | El orden de las tomas elegidas que forman la pieza. Deriva del orden de escenas y planos. | La posición de las tarjetas. |
| **Paquete de edición** | Lo que se exporta para continuar en DaVinci/CapCut. | Solo un MP4. |
| **Registro** | Historial de operaciones: intentos, estados, costes y resultados. | — |

---

## 3. Modelo de datos

Todas las entidades tienen `id` (UUID), `created_at`, `updated_at`. Los medios binarios no van en la base de datos: se guardan en el almacenamiento de medios y la entidad `Medio` guarda la ruta.

```
Estudio (implícito, uno)
└── Espacio
    ├── Elemento ──< FichaVersion ──< Referencia(Medio)
    ├── Medio (material del espacio: fotos, logos, audios importados)
    └── Proyecto (tipo)
        ├── Desarrollo (uno)
        ├── Reparto ──> Elemento (con versión de ficha fijada)
        ├── LayoutLienzo (uno)
        └── Pieza (1, o N si serie → Capítulo)
            └── Guion (estado)
                └── Escena (orden)
                    └── Plano (orden)
                        ├── Direccion
                        ├── Operacion ──< Intento
                        └── Toma(Medio) ── elegida?
```

### 3.1 Entidades

**Espacio**
- `nombre`, `descripcion?`, `tipo_espacio`: `cliente` | `marca` | `propio`, `portada?` (Medio), `archivado: bool`.
- `identidad?`: `logo?` (Medio), `notas_de_marca?` (texto: tono, qué se puede y qué no), `materiales` (Medios del cliente). Opcional; se rellena al crear el espacio o después.

**Proyecto**
- `espacio_id`, `nombre`, `tipo`: `corto` | `anuncio` | `imagen` | `serie`, `formato_id?`, `formato_video`: relación de aspecto (`9:16`, `16:9`, `1:1`, `4:5`), `duracion_objetivo_s?`, `presupuesto_max?` (en la moneda configurada), `paso_actual` (derivado, §4), `pasos_omitidos` (ids de pasos opcionales que el usuario ha marcado "no hace falta"), `ultimo_acceso`, `ultima_ubicacion` (ruta y selección para "Retomar").

**Desarrollo** (uno por proyecto)
- `intencion` (qué se quiere conseguir), `publico?`, `mensaje?`, `tono?`, `premisa?`, `mundo?`, `notas` (texto libre), `respuestas_formato` (mapa pregunta→respuesta si hay formato), `estado`: `en_curso` | `listo`.
- En serie añade `arco_general?`.

**Formato**
- `nombre`, `tipos_aplicables` (lista de tipos), `preguntas_desarrollo` (lista ordenada de `{clave, pregunta, ayuda}`), `estructura_guion` (lista ordenada de partes `{nombre, descripcion, duracion_orientativa_s?}`), `origen`: `sistema` | `usuario`.
- Semilla: un formato genérico por tipo, sin contenido creativo. Nada más.

**Elemento**
- `espacio_id`, `clase`: `personaje` | `producto` | `objeto` | `escenario`, `nombre`, `ficha_vigente` (número de versión).

**FichaVersion** (inmutable una vez creada; editar = nueva versión)
- `elemento_id`, `version` (1, 2, 3…), `descripcion`, `rasgos_fijos` (lista de textos: lo que nunca debe cambiar), `rasgos_variables` (lista: lo que puede cambiar por contexto, p. ej. vestuario por mundo), `referencias` (lista de `Medio` con rol: `frontal`, `perfil`, `espalda`, `detalle`, `entorno`, `otra`), `personalidad?` (personajes), `voz?` `{proveedor, voice_id, ajustes}` (personajes), `materiales_colores?` (productos), `nota_cambio`.
- Estado de la versión: `borrador` | `aprobada`. Solo una versión aprobada puede usarse en producción.

**Reparto** (tabla de relación)
- `proyecto_id`, `elemento_id`, `version_ficha` (fijada; no sigue automáticamente a la vigente), `papel?`.

**Medio**
- `espacio_id`, `clase`: `imagen` | `video` | `audio` | `documento`, `ruta`, `mime`, `ancho?`, `alto?`, `duracion_s?`, `origen`: `importado` | `generado`, `operacion_id?`, `etiqueta_demo: bool`, `hash`.
- El original nunca se modifica. Una edición produce un Medio nuevo.

**Pieza**
- `proyecto_id`, `numero?` y `titulo?` (capítulos), `estado`: `desarrollo` | `guion` | `produccion` | `montaje` | `entregada` (derivado, §5).

**Guion**
- `pieza_id`, `estado`: `borrador` | `aprobado`, `aprobado_en?`, `revision` (entero que sube en cada aprobación).
- Para tipo `imagen` el guion se sustituye por un **Encargo de imagen** (§4.1, recorrido Imagen), con el mismo ciclo borrador/aprobado.

**Escena**
- `guion_id`, `orden`, `titulo`, `que_ocurre`, `que_se_ve`, `intencion`, `elementos` (ids del reparto), `dialogos` (lista `{hablante: elemento_id | "narrador", texto}`), `sonido_previsto?` (texto), `duracion_orientativa_s?`.

**Plano**
- `escena_id` (o `pieza_id` en tipo imagen), `orden`, `descripcion`, `modalidad`: `imagen` | `video`, `duracion_s?`, `elementos` (ids del reparto; subconjunto de la escena), `direccion` (§8), `toma_elegida_id?`, `plano_anterior_encadenado: bool` (usar el último fotograma de la toma elegida del plano anterior como primer fotograma).

**Operacion**
- `proyecto_id`, `destino`: `{tipo: plano | ficha | medio, id}`, `accion` (§9.2), `modelo` (id del catálogo), `entradas` (prompt construido, referencias, fotogramas, duración, relación de aspecto, voz…), `prompt_visible` (lo que el usuario puede leer y editar), `coste_estimado`, `estado` (§9.4), `clave_idempotencia`, `autorizada_en?`.

**Intento**
- `operacion_id`, `proveedor`, `id_remoto?`, `estado`, `coste_real?`, `error?`, `inicio`, `fin?`, `medios_resultado`.

**Toma**
- `plano_id` (o `ficha_version_id`), `medio_id`, `operacion_id?`, `numero` (1, 2, 3… por plano), `fichas_usadas` (mapa elemento→versión con que se hizo), `revision_guion` (con qué revisión del guion se hizo), `valoracion?` (`buena` | `descartada` | null), `nota?`.

**LayoutLienzo** (uno por proyecto)
- `posiciones` (mapa id de tarjeta→`{x, y}`), `grupos_plegados` (lista), `viewport` `{x, y, zoom}`, `seleccion` (lista de ids), `pieza_activa?`.

**Ajustes** (global)
- `moneda`, `presupuesto_por_defecto`, `proveedores_habilitados`, `modelo_asistente`.

### 3.2 Estados derivados (no se guardan a mano)

- **Plano**: `sin_dirigir` → `dirigido` (tiene dirección mínima) → `en_produccion` (operación en curso) → `con_tomas` → `resuelto` (tiene toma elegida) · y además la marca `desactualizado` si su toma elegida usa una ficha o revisión de guion anterior a la vigente.
- **Escena**: `resuelta` si todos sus planos están resueltos.
- **Pieza**: según §5.

---

## 4. El recorrido: de la entrada al lienzo

**Este es el corazón del producto. Quien construye debe entenderlo antes de escribir una línea.**

El usuario no llega al lienzo con una página en blanco. Llega después de haber construido, paso a paso y en orden, todo lo que el trabajo necesita. El recorrido depende del tipo de proyecto: no se prepara igual un corto que un anuncio, una imagen o una serie. La aplicación conoce el recorrido de cada tipo, muestra en qué paso está el usuario, qué lleva construido y qué le falta, y le lleva al siguiente.

```
Apertura del estudio → Espacio → Proyecto (tipo) → paso 1 → paso 2 → … → Guion aprobado → LIENZO → Montaje
```

### 4.1 Recorridos por tipo

Los recorridos se definen en `backend/data/recorridos.yaml` (datos, no código). Estos son los cuatro:

**Corto**

| # | Paso | Qué se construye | Listo cuando | Obligatorio |
| --- | --- | --- | --- | --- |
| 1 | Idea | Desarrollo: intención, premisa, tono, qué se quiere contar. | `intencion` y `premisa` rellenas y el usuario pulsa `Listo`. | Sí |
| 2 | Mundo y escenarios | Descripción del mundo (en el Desarrollo) y elementos de clase `escenario` con su ficha y referencias. | Al menos un escenario con ficha aprobada. | Sí |
| 3 | Personajes | Elementos `personaje`: ficha (aspecto, rasgos fijos y variables, personalidad, voz) y hoja de personaje de referencia. | Al menos un personaje con ficha aprobada. | Sí |
| 4 | Objetos | Elementos `objeto` que deben mantenerse (un arma, un coche, un collar). | Al menos uno aprobado, o marcado "no hace falta". | No |
| 5 | Guion | Escenas en orden con lo que ocurre, se ve y se dice, usando los elementos preparados. | Guion `aprobado`. | Sí |
| 6 | Lienzo | Dirección y producción de planos. | Todos los planos con toma elegida. | — |
| 7 | Montaje | Secuencia y paquete de edición. | Paquete exportado. | — |

**Anuncio**

| # | Paso | Qué se construye | Listo cuando | Obligatorio |
| --- | --- | --- | --- | --- |
| 1 | Idea y mensaje | Intención, mensaje, público, llamada a la acción, tono. | `intencion` y `mensaje` rellenos + `Listo`. | Sí |
| 2 | Producto | Elemento `producto`: ficha (forma, materiales, colores, detalles que no se reinterpretan), **photobook** de referencia (vistas del producto, recorte con fondo limpio). | Un producto con ficha aprobada y al menos una referencia. | Sí |
| 3 | Personajes | Como en el corto (modelo, presentador, usuario del producto). | Al menos uno aprobado, o "no hace falta". | No |
| 4 | Escenario | Como en el corto. | Al menos uno aprobado, o "no hace falta". | No |
| 5 | Guion | Escenas del anuncio. | Guion `aprobado`. | Sí |
| 6 | Lienzo | — | — | — |
| 7 | Montaje | — | — | — |

**Imagen**

| # | Paso | Qué se construye | Listo cuando | Obligatorio |
| --- | --- | --- | --- | --- |
| 1 | Idea | Qué se quiere comunicar y para qué se usará la imagen. | `intencion` rellena + `Listo`. | Sí |
| 2 | Elementos | Los productos, personajes o escenarios que aparecerán, con su ficha. | Al menos un elemento aprobado. | Sí |
| 3 | Encargo de imagen | Qué se muestra, composición, intención, elementos, referencias, número de imágenes. | Encargo `aprobado`. | Sí |
| 4 | Lienzo | Dirección y producción de cada imagen. | Todas con toma elegida. | — |

(Sin montaje: la entrega es exportar las imágenes elegidas con su manifiesto.)

**Serie**

| # | Paso | Qué se construye | Listo cuando | Obligatorio |
| --- | --- | --- | --- | --- |
| 1 | Premisa | Premisa, tono, arco general. | `premisa` y `arco_general` rellenos + `Listo`. | Sí |
| 2 | Mundo y escenarios | Como en el corto, pero compartido por todos los capítulos. | Al menos un escenario aprobado. | Sí |
| 3 | Personajes | Como en el corto, compartidos por todos los capítulos. | Al menos un personaje aprobado. | Sí |
| 4 | Objetos | Como en el corto. | Uno aprobado o "no hace falta". | No |
| 5 | Capítulos | Lista de capítulos (número, título, de qué va). Cada capítulo tiene su guion. | Al menos un capítulo con guion `aprobado`. | Sí |
| 6 | Lienzo | Por capítulo. | — | — |
| 7 | Montaje | Por capítulo. | — | — |

### 4.2 Reglas del recorrido

- **Se avanza en orden, pero se puede volver.** Un paso posterior solo se abre cuando los obligatorios anteriores están listos. Los pasos ya listos se pueden revisar y editar siempre; si el cambio afecta a lo que viene después, se aplica §13.
- **Ir y venir sin perder contexto.** Desde el guion se puede crear un personaje u objeto que falta sin salir: se abre la ficha en un panel, se aprueba y se vuelve a la escena donde se estaba.
- **El lienzo solo se abre con todos los pasos obligatorios listos y el guion (o encargo) aprobado.** Si el usuario intenta entrar antes, ve la lista de lo que falta con un enlace a cada cosa.
- **Nada se rellena solo.** Un paso vacío se muestra vacío con lo que hay que hacer en él. El asistente puede proponer, nunca completar el paso por su cuenta.
- **Pasos opcionales**: se marcan con `No hace falta en este proyecto`; se pueden recuperar después.
- **El tipo no se vuelve a preguntar** dentro del proyecto. Cambiar de tipo es una acción explícita en los ajustes del proyecto, con confirmación.

### 4.3 Pasos de elementos (escenarios, personajes, productos, objetos)

Todos los pasos de elementos usan la misma pantalla con la clase correspondiente (§6.2):

1. **Elegir o crear.** Se ve la biblioteca del espacio filtrada por esa clase. El usuario elige elementos existentes (se añaden al reparto con su versión de ficha) o crea uno nuevo. Nunca se muestran elementos de otros espacios.
2. **Definir la ficha.** Descripción, rasgos fijos, rasgos variables, referencias subidas, y según la clase: personalidad y voz (personaje), materiales y colores (producto), ambiente y distribución (escenario).
3. **Preparar las referencias** (opcional, con coste visible): hoja de personaje (varias vistas del mismo personaje), photobook de producto (vistas + recorte), lámina del escenario. Se prepara como operación del motor (§9), se revisan las tomas y el usuario elige cuáles pasan a ser referencias.
4. **Aprobar la ficha.** Queda congelada como versión; es lo que usará la producción.

---

## 5. Pantallas y navegación (lista cerrada)

Estas son **todas** las pantallas. No se crean otras.

| # | Pantalla | Ruta | Qué hace |
| --- | --- | --- | --- |
| P1 | Apertura del estudio | `/` | La entrada: te sitúa y te deja decidir a dónde vas (§5.1). |
| P2 | Espacio | `/e/:espacio` | Proyectos del espacio con su paso actual, crear proyecto, identidad del espacio, biblioteca. |
| P3 | Biblioteca del espacio | `/e/:espacio/biblioteca` | Todos los elementos y medios del espacio, para consultar y ordenar fuera de un proyecto. |
| P4 | Paso · Idea | `/p/:proyecto/idea` | Desarrollo (§6.1). Se llama "Idea", "Idea y mensaje" o "Premisa" según el tipo. |
| P5 | Paso · Elementos | `/p/:proyecto/paso/:paso` | Una sola pantalla para Mundo y escenarios, Personajes, Producto, Objetos y Elementos (§6.2). |
| P6 | Paso · Guion | `/p/:proyecto/guion[/:pieza]` | Escenas (o encargo de imagen, o capítulos en serie) y aprobación (§6.3). |
| P7 | Lienzo | `/p/:proyecto/lienzo[/:pieza]` | Dirigir, producir, comparar y elegir (§7). |
| P8 | Montaje | `/p/:proyecto/montaje[/:pieza]` | Secuencia y paquete de edición (§11). |
| P9 | Registro | `/registro` y pestaña dentro de P7 | Operaciones, intentos, costes y estados. |
| P10 | Ajustes | `/ajustes` | Proveedores, claves (solo presencia), moneda, presupuesto, modelo del asistente. |

### 5.1 Apertura del estudio (P1)

Es la entrada al entorno. Limpia, amplia, sin controles del motor ni estadísticas. Responde a tres preguntas en este orden visual:

1. **¿Dónde lo dejé?** — Arriba, una tarjeta grande `Retomar`: espacio, proyecto, paso en el que está y qué le falta. Ejemplo: *Cliente A · Vídeo de invierno · Paso 3 de 7: Personajes — falta aprobar la ficha del protagonista*. Un clic lleva exactamente a ese punto. Debajo, en pequeño, los otros 3 proyectos con actividad más reciente, cada uno con su paso actual.
2. **¿Dónde trabajo?** — Los espacios como tarjetas grandes y reconocibles (portada o logo, nombre, tipo, número de proyectos y cuántos están en curso). Pulsar entra en el espacio.
3. **¿Algo nuevo?** — `Nuevo espacio`. Formulario corto: nombre, tipo (cliente, marca, propio), portada o logo opcional, notas de marca opcionales. Al crear, entra en el espacio vacío.

No hay más. Un proyecto no aparece repetido en varias listas grandes. Si no hay ningún espacio, la página muestra solo la bienvenida y `Crear tu primer espacio`.

### 5.2 Espacio (P2)

- Cabecera del espacio con su identidad (logo, nombre) visible durante todo el trabajo dentro de él.
- Lista de proyectos: nombre, tipo, **paso actual con su progreso** (p. ej. `Paso 5 de 7 · Guion`) y última actividad.
- `Nuevo proyecto`: formulario de una pantalla con `nombre`, `tipo` (4 opciones, cada una con una línea que explica su recorrido) y `formato_video`. Al crear, lleva al paso 1. **No** se muestra ninguna elección de "crear un vídeo / crear una imagen / desarrollar un guion".
- Accesos a `Biblioteca` e `Identidad del espacio`.

### 5.3 Navegación dentro de un proyecto

- **Cabecera fija** (altura de referencia 64 px): ubicación `Estudio / Espacio / Proyecto / Pieza`, cada tramo pulsable. A la derecha: indicador de guardado (§12) y gasto del proyecto.
- **Barra del recorrido**: los pasos del tipo de proyecto en orden (p. ej. `Idea · Mundo y escenarios · Personajes · Objetos · Guion · Lienzo · Montaje`). Cada paso muestra su estado con texto e icono: `listo`, `en curso`, `pendiente`, `bloqueado`, `no hace falta`. El paso actual se distingue claramente. Un paso bloqueado se ve y, al pulsarlo, dice qué falta y lleva a ello.
- **Bloque "Siguiente paso"** al pie de cada paso (P4, P5, P6): qué falta para dar este paso por listo y el botón para continuar (`Continuar a Personajes`). Si todo está listo, el botón lleva al siguiente paso.
- No hay otra barra de navegación duplicada.
- "Retomar" y la vuelta a un proyecto llevan a `ultima_ubicacion`.

---

## 6. Idea, elementos y guion

### 6.1 Desarrollo (P4)

- Columna de lectura (máx. ~68 caracteres por línea) con los campos del Desarrollo como bloques de texto con etiqueta visible.
- Si hay formato, sus preguntas aparecen como bloques adicionales en su orden.
- Panel lateral plegable **Asistente** (§10). Todo lo que proponga llega como propuesta con `Aceptar` / `Editar` / `Descartar`; nada se escribe en el Desarrollo sin aceptar.
- Botón `Marcar desarrollo como listo`. Se puede volver a editar después.

### 6.2 Paso de elementos (P5)

Una misma pantalla para cada paso de elementos, filtrada por la clase del paso (§4.3).

- **Izquierda**: los elementos de esa clase ya en el proyecto, como tarjetas con su referencia principal, nombre, versión y estado de la ficha (`borrador`, `aprobada`).
- **Centro**: la ficha del elemento seleccionado: descripción, rasgos fijos, rasgos variables, referencias, y los campos propios de su clase. `Aprobar versión` la congela.
- **Añadir**: `Traer de la biblioteca` (solo elementos del espacio de esa clase) o `Crear nuevo`. Traer fija la versión vigente; si luego aparece una versión nueva, se muestra "hay versión N+1" con `Actualizar a vN+1`, que abre el análisis de impacto (§13).
- **Preparar referencias**: `Crear hoja de personaje`, `Crear photobook del producto` o `Crear lámina del escenario` preparan una operación (§9) con coste visible. Las tomas se revisan y el usuario elige cuáles pasan a la ficha.
- Asistente disponible con `detectar_elementos` (propone los de esta clase que la idea menciona y no están).
- Pie: bloque "Siguiente paso". En pasos opcionales, además `No hace falta en este proyecto`.

### 6.3 Guion (P6)

- Lista vertical de escenas en tarjetas legibles; se reordenan arrastrando o con botones `Subir`/`Bajar` (accesibles por teclado).
- Cada escena muestra y edita: título, qué ocurre, qué se ve, intención, elementos (chips del reparto), diálogos (hablante + texto), sonido previsto, duración orientativa.
- Vista `Leer guion completo`: el guion como documento continuo, solo lectura, para comprobar que tiene sentido.
- Asistente disponible igual que en Desarrollo (puede proponer escenas, reescribir una escena, detectar elementos que faltan en el reparto). Propuestas siempre aceptables una a una.
- Botón `Aprobar guion`. Si luego se edita un guion aprobado, pasa a `borrador` y se muestra el impacto (§13). Para volver al lienzo hay que aprobarlo de nuevo.
- Los **planos no se definen aquí**; se definen en el lienzo.

---

## 7. Lienzo (P7)

Librería: **React Flow (`@xyflow/react`)**. Ocupa todo el ancho y alto disponibles bajo la cabecera y la barra del recorrido.

### 7.1 Estructura

Al abrir el lienzo de una pieza por primera vez, se colocan automáticamente (una sola vez; después manda el LayoutLienzo guardado):

- Una **columna de reparto** a la izquierda: una tarjeta por elemento del reparto (imagen de referencia principal, nombre, versión de ficha).
- Una **fila por escena** en orden del guion: una tarjeta de escena (título, qué ocurre en dos líneas, estado) seguida de sus tarjetas de plano.
- Si una escena aún no tiene planos, su tarjeta muestra `Añadir plano`.

Las **conexiones** se dibujan del elemento a los planos que lo usan, y del plano a su toma elegida. Se pueden ocultar por tipo (`Mostrar conexiones de reparto`).

Cada escena es un **grupo plegable**: plegada muestra solo la tarjeta de escena con un contador de planos y su estado; desplegada muestra sus planos. Los grupos plegados se guardan.

### 7.2 Tarjetas

| Tarjeta | Muestra | Acciones visibles |
| --- | --- | --- |
| Elemento | Referencia principal (sin recortar caras), nombre, clase, vN | `Abrir ficha` |
| Escena | Título, resumen, nº planos, estado | `Plegar/Desplegar`, `Añadir plano`, `Ver en guion` |
| Plano | Toma elegida (o hueco con "sin toma"), número `E2·P3`, modalidad, duración, estado, nº de tomas, aviso si desactualizado | `Dirigir`, `Producir`, `Tomas (n)` |
| Medio suelto | Miniatura y nombre | `Abrir`, `Usar como referencia en…` |

Selección, toma elegida y estado se distinguen por texto/forma/icono, no solo por color.

### 7.3 Ficha contextual

- Se abre junto a la tarjeta (ancho de referencia 320–400 px), sin mover el viewport. Si no cabe, se recoloca; en pantallas estrechas pasa a una bandeja inferior.
- Pestañas de la ficha de plano: **Dirección** (§8) · **Producir** (§9) · **Tomas** (comparar y elegir).
- Cerrar la ficha devuelve exactamente al mismo encuadre y selección.
- Todas las acciones tienen botón visible y atajo de teclado. Nada depende solo del doble clic.

### 7.4 Posición ≠ orden

- Mover tarjetas solo cambia `LayoutLienzo`. El orden narrativo se cambia únicamente con `Mover antes`/`Mover después` en la ficha del plano, o en P6 para escenas.
- `Recolocar` (botón explícito) vuelve a la disposición automática, con confirmación.

### 7.5 Persistencia del lienzo

Posiciones, grupos plegados, viewport y selección se guardan al terminar cada interacción (con debounce de 500 ms) y se restauran al volver.

### 7.6 Trabajar sobre una toma

Desde `Tomas`, sobre una imagen: `Ajustar` abre un campo de instrucción ("baja la saturación", "quita las personas del fondo", "más profundidad de campo") que prepara una operación `editar_imagen` con la toma como entrada. El resultado es una **toma nueva** del mismo plano; la original se conserva.

---

## 8. Dirección de un plano (caja de herramientas del director)

Pestaña **Dirección** de la ficha de plano. Cada campo es un selector con opciones en lenguaje llano + campo libre opcional. Ningún campo es obligatorio salvo `que_se_muestra`.

| Campo | Opciones de ejemplo (lista cerrada inicial, editable en un fichero de datos) |
| --- | --- |
| `que_se_muestra` | Texto libre (obligatorio). |
| `protagonista_visual` | Un elemento del reparto, el escenario, o "el entorno". |
| `encuadre` | Gran plano general, plano general, plano medio, primer plano, detalle. |
| `angulo` | A la altura de los ojos, picado, contrapicado, cenital, a ras de suelo. |
| `movimiento_camara` | Fija, travelling adelante/atrás, lateral, panorámica, grúa, cámara en mano, dron. |
| `optica` | Angular, normal, teleobjetivo; profundidad de campo: amplia / reducida. |
| `luz` | Dirección (frontal, lateral, contraluz, cenital), calidad (dura/suave), momento (día, hora dorada, noche, interior). |
| `temperatura_color` | Cálida, neutra, fría. |
| `ambiente` | Texto libre (escenario y distribución de elementos). |
| `vestuario_y_variables` | Por cada elemento del plano: qué rasgos variables aplican aquí. |
| `acabado` | Texto libre (color, textura, grano). |
| `accion` | Qué ocurre durante el plano (vídeo). |
| `negativos` | Lo que no debe aparecer. |

Debajo, **Vista previa del prompt**: el texto que se enviará, construido a partir de la dirección + rasgos fijos de las fichas + desarrollo. Se muestra y puede editarse; si se edita a mano, se marca "prompt editado a mano" y deja de regenerarse automáticamente hasta pulsar `Reconstruir desde la dirección`.

**Lámina de encuadres** (opcional): botón `Explorar encuadres` prepara una operación que genera N imágenes (N elegido por el usuario, por defecto 4) del mismo plano variando solo encuadre/ángulo. Son tomas de exploración; elegir una fija esos valores de dirección. No se genera sin autorización.

Texto y rótulos: **nunca** se piden al modelo (no se incluyen letras en el prompt). Van en la edición final.

---

## 9. Motor de producción

El motor es un módulo del backend independiente de las pantallas. Las pantallas solo hablan con el motor a través de `Operacion`.

### 9.1 Contrato de proveedor

Cada proveedor implementa esta interfaz (Python, asíncrona):

```python
class Proveedor(Protocol):
    id: str
    def modelos(self) -> list[str]: ...
    def estimar(self, op: EntradaOperacion) -> Decimal | None: ...
    async def enviar(self, op: EntradaOperacion, clave_idempotencia: str) -> str: ...   # devuelve id_remoto
    async def consultar(self, id_remoto: str) -> EstadoRemoto: ...   # en_cola | en_curso | completado(urls) | fallido(error)
    async def descargar(self, url: str) -> bytes: ...
```

Proveedores a implementar:

| id | Fase | Uso |
| --- | --- | --- |
| `simulado` | 6 | Por defecto en desarrollo y tests. Devuelve imágenes/vídeos/audios de placeholder generados localmente, con latencia configurable y fallos provocables (`fallo`, `timeout`, `incierto`). Coste simulado según catálogo. |
| `fal` | 9 | Imagen, vídeo, lipsync, foto+audio→personaje hablando (cola `queue.fal.run`). |
| `kie` | 9 | Imagen y vídeo (agregador). |
| `openai_images` | 9 | Imagen y edición de imagen con referencias. |
| `elevenlabs` | 9 | Voz. |

Las claves se leen de variables de entorno. Si falta una clave, ese proveedor aparece como "no configurado" y sus modelos no se pueden elegir.

### 9.2 Acciones

`generar_imagen`, `editar_imagen` (imagen de entrada + instrucción), `imagen_con_referencias` (una o varias referencias de identidad), `generar_video` (texto→vídeo o imagen→vídeo con primer y opcional último fotograma), `generar_voz`, `sincronizar_labios` (vídeo + audio), `personaje_hablando` (retrato + audio → vídeo).

### 9.3 Catálogo de modelos

Fichero `backend/data/catalogo_modelos.yaml`, editable sin tocar código:

```yaml
- id: ejemplo-modelo-video
  nombre_visible: "Ejemplo vídeo"
  acciones: [generar_video]
  proveedores: [fal, kie]          # orden de preferencia
  admite: {primer_fotograma: true, ultimo_fotograma: false, referencias: 0, audio: false}
  duraciones_s: [5, 10]
  relaciones: ["9:16", "16:9"]
  coste: {unidad: segundo, valor: null, moneda: USD, verificado: false}
```

El constructor deja el catálogo con entradas del proveedor `simulado` y **plantillas vacías** para los reales. El usuario rellena modelos y precios reales.

### 9.4 Ciclo de una operación

```
preparada → presupuestada → autorizada → enviada → en_curso → completada
                                            │           │
                                            └→ incierta ←┘ (timeout o respuesta perdida)
                                                        └→ fallida
```

1. **Preparar**: el usuario elige acción y modelo en la pestaña Producir. Cambiar modelo solo recalcula el coste; no envía nada.
2. **Presupuestar**: se muestra coste estimado de esta operación, gasto acumulado del proyecto y presupuesto restante. Si el coste es `null`, se muestra "coste sin verificar".
3. **Autorizar**: botón con verbo y cifra: `Producir por 0,40 $`. Si supera el presupuesto restante, pide confirmación explícita.
4. **Enviar**: con `clave_idempotencia` = hash de (operación, entradas). Se crea un `Intento`.
5. **Seguir**: un worker consulta el estado; la interfaz lo recibe por SSE.
6. **Completar**: se descargan los resultados, se crean `Medio` y `Toma` (sin elegir) y aparecen en la tarjeta del plano.
7. **Incierta**: si el envío no confirmó o el seguimiento se perdió, la operación queda `incierta` y visible en el Registro con `Comprobar` (vuelve a consultar por `id_remoto`) y `Marcar como fallida`. **Nunca se reenvía sola.**
8. **Fallida**: se muestra el error. `Reintentar` crea un intento nuevo y exige autorizar otra vez.

Router: con el modelo elegido, usa el primer proveedor de la lista que esté configurado. Si falla antes de enviar (proveedor caído, sin saldo), propone el siguiente y pide autorización de nuevo mostrando el nuevo coste. No cambia de proveedor en silencio.

Concurrencia máxima por proveedor configurable (por defecto 2).

### 9.5 Registro (P9)

Tabla filtrable por espacio, proyecto, estado y fecha: acción, modelo, proveedor, destino (enlace al plano/ficha), coste estimado, coste real, estado, intentos. Totales por proyecto y por espacio. Exportable a CSV.

---

## 10. Asistente

- Interfaz `ProveedorTexto` en el backend con un único método `proponer(contexto, tarea) -> Propuesta`. Modelo configurable en Ajustes.
- Implementación por defecto: **Anthropic Claude** vía API (`ANTHROPIC_API_KEY`), modelo por defecto `claude-sonnet-5`. Implementación `simulado` para tests. Si no hay clave, el asistente aparece desactivado con el motivo.
- **Contexto** que recibe siempre: tipo de proyecto, desarrollo, formato (si hay), reparto con fichas aprobadas, guion actual. Nunca material de otros espacios.
- **Tareas cerradas** (no hay chat libre que escriba en el proyecto):
  - En Desarrollo: `hacer_preguntas` (devuelve preguntas para aclarar la idea), `proponer_campo` (propone texto para un campo concreto), `ordenar_notas` (propone repartir las notas libres en los campos).
  - En pasos de elementos: `detectar_elementos` (propone elementos de esa clase que el desarrollo menciona y no están en el proyecto).
  - En Guion: `proponer_escenas` (según formato y duración objetivo), `reescribir_escena` (con instrucción del usuario), `revisar_coherencia` (lista de problemas, sin cambiar nada).
- Toda salida es una `Propuesta` con partes aceptables una a una. Se guarda el historial de propuestas y cuáles se aceptaron.
- El asistente **no** define planos, encuadres ni protagonismo visual, ni lanza operaciones del motor.

---

## 11. Montaje y paquete de edición (P8)

- Tira horizontal con las tomas elegidas en orden de escena y plano. Los planos sin toma aparecen como hueco con su número.
- `Reproducir secuencia`: reproduce en el navegador las tomas consecutivas (sin render).
- Pistas de audio simples debajo: voces generadas colocadas en su plano, y música/ambiente importados (inicio y volumen). No hay edición de corte fino.
- Cada toma muestra qué versión es y permite `Ir al plano` (abre el lienzo con ese plano seleccionado).
- `Exportar paquete de edición` genera un ZIP:

```
<proyecto>_<pieza>_<fecha>/
├── video/      E01_P01_t3.mp4 … (tomas elegidas, originales, numeradas en orden)
├── imagen/     (si el plano es imagen)
├── audio/      voces por plano y música/ambiente
├── timeline.fcpxml     (DaVinci Resolve: clips y audios colocados en orden)
├── previo.mp4          (concatenado rápido con ffmpeg, solo para ver)
├── guion.md            (guion aprobado legible)
└── manifiesto.json     (planos, tomas, modelos, fichas usadas, costes)
```

Para CapCut se usa la carpeta numerada y el `previo.mp4`; no se promete importación de línea de tiempo en CapCut.

---

## 12. Guardado

- Toda edición de texto se guarda automáticamente (debounce 800 ms) y al perder el foco.
- Indicador en la cabecera con tres estados de texto: `Guardando…`, `Guardado`, `No se ha podido guardar — Reintentar`. Un fallo nunca se muestra como guardado.
- Si hay cambios sin guardar al salir de la página, aviso del navegador.
- Conflicto de versión (dos pestañas): el servidor rechaza con 409 y la interfaz ofrece recargar o sobrescribir.

---

## 13. Impacto de los cambios

Cuando el usuario cambia algo compartido, antes de confirmar se muestra una lista de lo afectado y se decide. No se borra ni regenera nada automáticamente.

| Cambio | Qué se marca |
| --- | --- |
| Editar un guion aprobado | Guion vuelve a `borrador`. Al reaprobar: escenas editadas o eliminadas → sus planos con toma se marcan `desactualizado`. Escenas eliminadas: sus planos pasan a "sin escena" (se conservan hasta que el usuario los borre). |
| Actualizar la versión de ficha en el reparto | Planos cuya toma elegida usa la versión anterior → `desactualizado`, con la lista visible. |
| Reordenar escenas o planos | Solo cambia el montaje; nada se invalida. Si un plano estaba encadenado al anterior, se avisa. |
| Borrar un elemento del reparto | Bloqueado si algún plano lo usa; se listan los planos. |

`Desactualizado` no impide montar ni exportar; se muestra en el plano, en el montaje y en el paquete (manifiesto).

---

## 14. Orden de construcción y criterios de aceptación

Cada fase se entrega completa y se valida **recorriéndola a mano en la interfaz**, no solo con tests.

**F1 · Base, estudio y espacios**
Stack montado, tokens de diseño, cabecera, P1, P2, P10 (sin proveedores), guardado con indicador.
Incluye la Apertura del estudio (§5.1), la barra del recorrido y el bloque "Siguiente paso" (§5.3) leyendo `recorridos.yaml`.
✔ Crear espacio, crear un proyecto de cada tipo y ver en cada uno su recorrido correcto. Salir, volver y que `Retomar` lleve al mismo punto. Ningún contenido creado automáticamente.

**F2 · Desarrollo y asistente**
P4, formatos (solo semilla genérica), asistente con `simulado` y con Claude.
✔ Escribir un desarrollo a mano sin asistente. Pedir preguntas y propuestas, aceptar una y descartar otra; verificar que solo lo aceptado queda.

**F3 · Pasos de elementos y biblioteca**
P3, P5 para todas las clases, versiones de ficha, subida de medios, pasos opcionales.
✔ En un corto: crear un escenario y un personaje con tres referencias, aprobar v1, marcar Objetos como "no hace falta" y ver que el recorrido avanza hasta Guion. Crear v2 del personaje y ver el aviso de versión nueva. En un anuncio: crear el producto con su ficha. Un elemento de otro espacio no aparece.

**F4 · Guion**
P6, aprobación, lectura continua, encargo de imagen, capítulos.
✔ Escribir 3 escenas, reordenarlas, leerlas seguidas, aprobar. Editar después → vuelve a borrador. El lienzo está bloqueado mientras esté en borrador y explica por qué.

**F5 · Lienzo**
P7 sin producción: estructura desde el guion, grupos, fichas contextuales, dirección, vista previa del prompt, persistencia del layout.
✔ Abrir el lienzo, plegar una escena, mover tarjetas, dirigir un plano, cerrar la ficha sin perder el sitio, salir y volver con todo igual. Mover una tarjeta no cambia el orden del montaje.

**F6 · Motor con proveedor simulado**
Operaciones, catálogo, costes, SSE, tomas, comparación, elegir toma, editar imagen, registro, estados inciertos.
✔ Producir un plano, ver coste antes, obtener 2 tomas, compararlas, elegir la segunda. Provocar un `incierto` y recuperarlo desde el Registro sin que se cree un segundo envío.

**F7 · Montaje y exportación**
P8, reproducción de la secuencia, audio simple, ZIP con FCPXML.
✔ Exportar, abrir `timeline.fcpxml` en DaVinci Resolve y ver los clips en orden.

**F8 · Impacto**
Todas las reglas del §13.
✔ Cambiar una ficha usada y ver los planos marcados; editar una escena producida y ver sus planos desactualizados.

**F9 · Proveedores reales**
`fal`, `kie`, `openai_images`, `elevenlabs`, con claves por entorno. Pruebas de integración marcadas y excluidas del test por defecto.
✔ Una operación real de cada tipo lanzada desde la interfaz con el coste mostrado y registrado.

---

## 15. Arquitectura técnica

### 15.1 Stack

| Capa | Elección |
| --- | --- |
| Frontend | React 19 + Vite + TypeScript, Tailwind con los tokens de la Intención §21, componentes Radix/shadcn, TanStack Query, React Router, `@xyflow/react` para el lienzo. |
| Backend | Python 3.11+, FastAPI, Pydantic v2, httpx, SSE para estados en vivo. |
| Base de datos | MongoDB (colecciones por entidad del §3). |
| Trabajos en segundo plano | Worker asíncrono en el mismo proceso de FastAPI (tarea de fondo con cola en MongoDB). Sin Celery ni Redis en esta versión. |
| Medios | Sistema de ficheros bajo `DATA_DIR/media/<espacio>/<medio_id>.<ext>`, servidos por el backend. Diseñado tras una interfaz `Almacen` para cambiar a S3 compatible más adelante. |
| Vídeo | ffmpeg (miniaturas, último fotograma para encadenar, `previo.mp4`). |
| Despliegue | `docker-compose` (frontend, backend, mongo). Debe funcionar igual en macOS y en un VPS Linux; nada exclusivo de Mac. |

### 15.2 Estructura del repositorio

```
/frontend
  /src
    /tokens          (tokens de diseño; única fuente)
    /componentes     (base: Boton, Campo, Tarjeta, Ficha, IndicadorGuardado…)
    /pantallas       (P1…P10, una carpeta por pantalla)
    /lienzo          (nodos, conexiones, layout, ficha contextual)
    /api             (cliente y tipos generados del OpenAPI)
/backend
  /app
    /api             (routers FastAPI por recurso)
    /dominio         (modelos Pydantic del §3 y reglas: puertas, estados derivados, impacto)
    /motor           (operaciones, router, registro, worker, proveedores/*)
    /asistente       (ProveedorTexto, tareas, prompts en ficheros de texto)
    /exportar        (paquete, fcpxml)
    /almacen
  /data              (recorridos.yaml, catalogo_modelos.yaml, opciones_direccion.yaml, formatos_semilla.yaml)
  /tests
PREGUNTAS.md
docker-compose.yml
.env.example
```

Regla de capas: `api` → `dominio` → (`motor`, `asistente`, `almacen`). El frontend no conoce proveedores ni modelos más allá de lo que expone la API.

### 15.3 API (REST, prefijo `/api`)

```
GET/POST        /espacios                 GET/PATCH/DELETE /espacios/{id}
GET/POST        /espacios/{id}/proyectos  GET/PATCH/DELETE /proyectos/{id}
GET/POST        /espacios/{id}/elementos  GET/PATCH        /elementos/{id}
POST            /elementos/{id}/fichas    PATCH /fichas/{id}   POST /fichas/{id}/aprobar
POST/DELETE     /espacios/{id}/medios     GET /medios/{id}/archivo
GET/PUT         /proyectos/{id}/desarrollo
GET/POST/DELETE /proyectos/{id}/reparto
GET/POST        /proyectos/{id}/piezas
GET/PUT         /piezas/{id}/guion        POST /piezas/{id}/guion/aprobar
POST/PATCH/DEL  /escenas…  /planos…       POST /planos/{id}/mover
GET/PUT         /proyectos/{id}/lienzo
POST            /operaciones              (preparar; devuelve presupuesto)
POST            /operaciones/{id}/autorizar
POST            /operaciones/{id}/comprobar   POST /operaciones/{id}/marcar-fallida
GET             /operaciones?filtros      GET /registro/totales
POST            /tomas/{id}/elegir        PATCH /tomas/{id}
POST            /asistente/{tarea}        POST /propuestas/{id}/aceptar
GET             /impacto?cambio=…         (previsualiza el impacto del §13)
POST            /piezas/{id}/exportar     GET /exportaciones/{id}/archivo
GET             /eventos                  (SSE: operaciones y guardado)
GET/PUT         /ajustes                  GET /catalogo
```

Todas las escrituras llevan `updated_at` esperado para detectar conflictos (409).

### 15.4 Configuración

`.env.example`: `MONGO_URL`, `DATA_DIR`, `ANTHROPIC_API_KEY`, `FAL_KEY`, `KIE_API_KEY`, `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `MONEDA`, `PRESUPUESTO_POR_DEFECTO`. Las claves nunca se muestran en la interfaz ni se guardan en MongoDB.

### 15.5 Pruebas

- Backend: pytest, proveedor `simulado`, tests de puertas, estados derivados, impacto, ciclo de operación (incluido `incierto` sin reenvío) e idempotencia.
- Frontend: tests de componentes base y del guardado.
- Ningún test llama a APIs reales. Las pruebas de integración reales llevan marca `integracion` y se ejecutan a mano.

---

## 16. Fuera de alcance (no construir)

- Cuentas de usuario, acceso de clientes, permisos, colaboración.
- Chat libre con el asistente que modifique el proyecto.
- Generación automática de una pieza completa.
- Editor de vídeo con cortes, transiciones o subtítulos.
- Rótulos o texto dentro de las imágenes generadas.
- Publicación en redes.
- Facturación, pagos o planes.
- Formatos predefinidos más allá del genérico por tipo.
- Plantillas, galerías de inspiración o contenido de ejemplo.
- Modo oscuro (se valorará después).

---

## 17. Preguntas abiertas (no las resuelvas; déjalas marcadas)

1. Nombre del producto y familia tipográfica.
2. Paleta de color.
3. Modelos y precios reales del catálogo.
4. Si la música se genera o solo se importa (en esta versión: solo se importa).
5. Duración máxima por plano según modelo (la fija el catálogo).
