# Documento maestro y arquitectura

Versión 0.1 · 24 de septiembre de 2026 · Nombre del producto: Picasso

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
- `fps`: `24` | `25` | `30` (por defecto 25). No se pregunta al crear el proyecto ni en el brief: se cambia en Montaje (P8) y solo en los tipos con vídeo. Es el ritmo del montaje y del paquete de edición: todas las tomas se normalizan a él al exportar (§11).
- `voz_narrador?` `{proveedor, voice_id, ajustes}`: la voz de los diálogos cuyo hablante es "narrador".

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
- `proyecto_id`, `numero?`, `titulo?` y `de_que_va?` (capítulos), `estado`: `desarrollo` | `guion` | `produccion` | `montaje` | `entregada` (derivado, §5).

**Guion**
- `pieza_id`, `estado`: `borrador` | `aprobado`, `aprobado_en?`, `revision` (entero que sube en cada aprobación), `revision_en_curso?` (copia en borrador de las escenas mientras se edita un guion ya aprobado).
- Para tipo `imagen` el guion se sustituye por un **Encargo de imagen** (§4.1, recorrido Imagen), con el mismo ciclo borrador/aprobado.

**Escena**
- `guion_id`, `orden`, `titulo`, `que_ocurre`, `que_se_ve`, `intencion`, `elementos` (ids del reparto), `dialogos` (lista `{id, hablante: elemento_id | "narrador", texto}`; el `elemento_id` es de un elemento de clase personaje que esté en `elementos`; el `id` es estable: se conserva al copiar la escena en una revisión del guion y es lo que ata cada voz a su diálogo), `sonido_previsto?` (texto), `duracion_orientativa_s?`.

**Plano**
- `escena_id` (o `pieza_id` en tipo imagen), `orden`, `descripcion`, `modalidad`: `imagen` | `video`, `duracion_s?`, `elementos` (ids del reparto; subconjunto de la escena), `direccion` (§8), `toma_elegida_id?`, `plano_anterior_encadenado: bool` (usar el último fotograma de la toma elegida del plano anterior como primer fotograma), `correcciones` (lista de Correccion, §7.7d), `prompt_editado_a_mano: bool` y `prompt_manual?` (§8).

**Correccion** (dentro de un Plano, §7.7d)
- `texto` (instrucción en lenguaje llano), `estado`: `pendiente` | `hecha`, `creada_en`, `hecha_en?`, `operacion_id?` y `toma_id?` (Fase 6: la operación que la ejecuta y la toma resultante).

**Operacion**
- `proyecto_id`, `destino`: `{tipo: plano | ficha | medio, id}`, `accion` (§9.2), `modelo` (id del catálogo), `entradas` (prompt construido, referencias, fotogramas, duración, relación de aspecto, voz…), `prompt_visible` (lo que el usuario puede leer y editar), `coste_estimado`, `estado` (§9.4), `clave_idempotencia`, `autorizada_en?`.

**Intento**
- `operacion_id`, `proveedor`, `id_remoto?`, `estado`, `coste_real?`, `error?`, `inicio`, `fin?`, `medios_resultado`.

**Toma**
- `plano_id` (o `ficha_version_id`, o `dialogo_id` en las tomas de voz), `medio_id`, `operacion_id?`, `texto_usado?` (tomas de voz), `numero` (1, 2, 3… por plano o por diálogo), `fichas_usadas` (mapa elemento→versión con que se hizo), `revision_guion` (con qué revisión del guion se hizo), `valoracion?` (`buena` | `descartada` | null), `nota?`.

**Voz** (una por diálogo, §11)
- `dialogo_id`, `escena_origen_id` (la escena aprobada del diálogo), `plano_id?` (el plano donde suena; por defecto, el primero de la escena), `desfase_s` (segundos desde el inicio de ese plano; por defecto 0), `toma_elegida_id?`.
- Las tomas de voz son `Toma` con `dialogo_id` y `texto_usado` (el texto con que se produjo), sin `plano_id`. No compiten con las tomas de imagen o vídeo del plano.
- Una voz está `desactualizada` (derivado) si el `texto_usado` de su toma elegida ya no coincide con el texto del diálogo en el guion aprobado.
- Si el diálogo desaparece en una revisión, su voz se conserva como "voz sin diálogo" hasta que el usuario la borre (igual que los planos sin escena, §13).

**PistaAudio** (por pieza, §11)
- `pieza_id`, `capa`: `musica` | `ambiente`, `medio_id` (audio importado del espacio), `inicio_s` (desde el inicio de la pieza), `volumen_db` (por defecto 0), `nombre`.

**LayoutLienzo** (uno por proyecto)
- `posiciones` (mapa id de tarjeta→`{x, y}`), `grupos_plegados` (lista), `viewport` `{x, y, zoom}`, `seleccion` (lista de ids), `pieza_activa?`.

**Ajustes** (global)
- `moneda`, `presupuesto_por_defecto`, `proveedores_habilitados`, `modelo_asistente`.
- La moneda del presupuesto y del registro es USD, la misma en que cobran los proveedores. Sin conversión a otras monedas en esta versión.

### 3.2 Estados derivados (no se guardan a mano)

- **Plano**: `sin_dirigir` → `dirigido` (tiene qué se muestra y además encuadre, ángulo o composición) → `en_produccion` (operación en curso) → `con_tomas` → `resuelto` (tiene toma elegida) · y además la marca `desactualizado` si su toma elegida usa una ficha o revisión de guion anterior a la vigente.
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
4. **Aprobar la ficha.** Queda congelada como versión; es lo que usará la producción. En personajes y productos hace falta al menos una imagen de referencia para poder aprobar; en escenarios y objetos no se exige.

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
- `Nuevo proyecto`: formulario de una pantalla con solo `nombre` y `tipo` (4 opciones, cada una con una línea que explica su recorrido). El formato y los fps **no** se preguntan aquí: el formato sale del destino, en el brief (§6.1), y los fps se ajustan en Montaje. Al crear, lleva al paso 1. **No** se muestra ninguna elección de "crear un vídeo / crear una imagen / desarrollar un guion".
- Accesos a `Biblioteca` e `Identidad del espacio`.

### 5.3 Navegación dentro de un proyecto

- **Cabecera fija** (altura de referencia 64 px): ubicación `Estudio / Espacio / Proyecto / Pieza`, cada tramo pulsable. A la derecha: indicador de guardado (§12) y gasto del proyecto.
- **Barra del recorrido**: los pasos del tipo de proyecto en orden (p. ej. `Idea · Mundo y escenarios · Personajes · Objetos · Guion · Lienzo · Montaje`). Cada paso muestra su estado con texto e icono: `listo`, `en curso`, `pendiente`, `bloqueado`, `no hace falta`. El paso actual se distingue claramente. Un paso bloqueado se ve y, al pulsarlo, dice qué falta y lleva a ello.
- **Bloque "Siguiente paso"** al pie de cada paso (P4, P5, P6): qué falta para dar este paso por listo y el botón para continuar (`Continuar a Personajes`). Si todo está listo, el botón lleva al siguiente paso.
- No hay otra barra de navegación duplicada.
- "Retomar" y la vuelta a un proyecto llevan a `ultima_ubicacion`.

---

## 6. Idea, elementos y guion

### 6.1 Desarrollo (P4): el brief

*Rediseñado el 07-10-2026 al operarlo Juan. Primera versión: el encargo primero, como en AVB (avb-03). Decisión final de Juan ese mismo día: **primero la idea**, porque quien crea lo suyo empieza por una idea y Picasso le ayuda a desarrollarla; el destino puede salir de la idea, y el asistente puede proponerlo. Cuando el encargo llegue de Obrador vendrá relleno, así que el orden no le afecta. Hasta el lienzo no se produce nada, así que decidir el formato al final de la Idea no tiene coste.* Columna de lectura (máx. ~68 caracteres por línea) en **tres bloques**, en este orden: tu idea → lo que debe provocar → el encargo. Se describen abajo con su numeración original:

1. **El encargo**: las restricciones que vienen de fuera.
   - *¿Dónde se va a publicar?* (`destino`, obligatorio), una de estas opciones: Reels, TikTok o Shorts → 9:16 · Feed de Instagram o Facebook → 4:5 · YouTube o web → 16:9 · Presentación o pantalla → 16:9 · Cine o festival → 16:9 · Varias plataformas, cuadrado → 1:1 · Otro. Al elegirlo, Picasso **propone** el `formato_video` del proyecto y lo aplica; el usuario puede cambiarlo justo debajo. El formato no se puede cambiar si el proyecto ya tiene tomas (409 que lo explica; el impacto completo es cosa de la F8).
   - *¿Dónde exactamente?* (`destino_detalle`, opcional): «portada de jrgblanco.com». Se llamó «Concretando» hasta que Juan preguntó qué era (07-10-2026).
   - *¿Para quién?* (`publico`), en todos los tipos.
   - *Duración*: corto y anuncio, en segundos (`duracion_objetivo_s` del proyecto); serie, la pregunta de capítulos del formato. Imagen no tiene duración.
2. **Tu idea, tal cual** (`notas`, obligatorio): lo que tienes en la cabeza, sin ordenar. Debajo, según el tipo, la idea ordenada: corto con premisa y mundo; serie con premisa, arco general y mundo; anuncio con mensaje.
3. **Lo que debe provocar**: intención (obligatoria), tono (una o dos palabras), **qué evitar** (`que_evitar`, §18.8) y, en anuncio, la llamada a la acción (pregunta del formato).

- El asistente (§10) hace de puente: «Ordenar mi idea» reparte el bloque 2 en el 3 y en la idea ordenada. Siempre propone; nada se escribe sin aceptar.
- Se quitan las preguntas que repetían otra: «¿Para qué se usará la imagen?» y «¿Dónde se va a ver?» son el destino; el «¿Qué quieres que sienta?» del corto es la intención. Las respuestas que ya hubiera se recuperan solas: el uso o el canal pasan a «Concretando» y el objetivo a la intención, si estaba vacía.
- `que_evitar` se suma a los negativos de todos los planos del proyecto (§18.8).
- **El encargo es la puerta de Obrador (Campaign OS):** cuando un encargo llegue de allí, ese bloque vendrá relleno.
- Para dar la Idea por lista: destino, tu idea, intención y los obligatorios propios del tipo (premisa en corto y serie, mensaje en anuncio, arco en serie).
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
- En los diálogos, **quien habla es el narrador o un elemento de clase personaje que esté en los elementos de esa escena**. Si un hablante deja de estar en los elementos de la escena, su texto se conserva marcado con "Ya no está en los elementos de la escena" y `Aprobar guion` / `Aprobar revisión` quedan bloqueados explicando qué diálogo hay que corregir.
- Botón `Aprobar guion`. La primera aprobación abre el lienzo (§4.2).
- **Mínimo para aprobar un guion**: al menos una escena, y cada escena con título y "qué ocurre". En un **encargo de imagen**: "qué se muestra" escrito y un número de imágenes mayor que cero. Cuando falta algo, el botón está desactivado y al lado se explica exactamente qué falta.
- La **pieza única** de un corto, un anuncio o una imagen se crea al abrir el paso del guion: es un contenedor vacío, no contenido (no fabrica idea, escenas ni material). En una **serie** los capítulos los crea siempre el usuario.
- Editar un guion ya aprobado no lo desaprueba: crea una **revisión en curso** en borrador. Mientras exista, el guion aprobado sigue vigente y el lienzo sigue abierto trabajando con él.
- `Aprobar revisión` muestra la lista de escenas añadidas, editadas, eliminadas y reordenadas con sus diferencias. En cada escena editada el usuario marca `Solo texto` o `Afecta a los planos`. Al confirmar, la revisión pasa a ser el guion aprobado y `revision` sube en uno.
- En un **encargo de imagen** la revisión no tiene escenas: muestra los campos que cambian con su antes y después, y se marca **una sola vez** `Solo texto` o `Afecta a las imágenes`.
- `Descartar revisión` vuelve al guion aprobado sin cambios.
- Los **planos no se definen aquí**; se definen en el lienzo.

---

### 6.4 Encargo de imagen (rediseñado el 07-10-2026)

*Juan llegó operando a un lienzo vacío: el encargo de imagen nunca se había conectado con los planos, porque el lienzo solo se validó con el corto de Marta. Este apartado cierra ese hueco y las fricciones 19.7–19.10.*

**Pantalla del encargo**
- *Contexto del brief* (solo lectura, arriba): intención, tono, qué evitar y destino del Desarrollo, con un enlace para editarlos allí. La intención no se vuelve a pedir; el campo *Intención propia* es opcional y solo para cuando una imagen persigue algo distinto de lo que dice el brief (19.7).
- *Qué se muestra*, *Composición* (punto de partida para dirigir: encuadre, punto de vista, luz), *Elementos* (del reparto), *Referencias* y *Número de imágenes*.
- *Referencias* (19.10): se ven solo las elegidas, como en la ficha. «Traer de la biblioteca» abre el selector aparte. Las referencias de las fichas de los elementos elegidos salen como **sugeridas** y se añaden con un clic. La identidad del espacio (logo y portada) no aparece como referencia.
- El asistente, en un proyecto de imagen, no habla de escenas ni de guion: ofrece «Proponer qué se muestra» y «Detectar elementos» (19.9).
- Las menciones `@` (18.6) llegan después, sobre esta misma pantalla.

**Del encargo al lienzo**
- Con el encargo aprobado, el lienzo tiene **un plano de imagen por cada imagen pedida**, agrupados bajo un rótulo «Imágenes del encargo» (no «sin escena») y etiquetados I1, I2…
- Cada plano nace con *qué se muestra*, *elementos* y la *composición* del encargo (campo de dirección `composicion`, editable en el plano, que va al prompt justo después de «qué se muestra»).
- Las referencias del encargo viajan a cada operación de esos planos, sumadas a las de las fichas.
- **Sincronización:** al abrir el lienzo con el encargo aprobado, se crean los planos que falten. Si el número de imágenes baja, se quitan los sobrantes **sin tomas**; los que ya tienen tomas se quedan y se avisa. Al aprobar una revisión del encargo, los planos todavía sin tomas se ponen al día con los nuevos textos; los que tienen tomas no se tocan (el impacto completo es de la F8).
- Batería de pruebas: un proyecto de imagen recorrido de punta a punta, desde la idea hasta un plano con toma elegida.

### 6.5 El Taller (18.29, aprobado el 15-10-2026 sobre la maqueta «4 · Todo en una pantalla»)

*Lo exprés en una pantalla. Nace de comparar el corto de Tania (veinte pasos) con OpenArt (un prompt, ajustar y a la carpeta). Maqueta aprobada: https://claude.ai/artifact/9sKRMtyLSwpq171yPR6mfG.*

**Dónde.** Es la pestaña **Taller** del espacio (`/e/{espacio}/taller`), junto a Proyectos, y aparece la primera.

**Tres columnas, una pantalla.**
1. **Lo que pides (izquierda).**
   - Modelo, con su precio.
   - Campo de prompt con las **referencias dentro**: pastillas `@nombre · uso`, sacadas de las fichas validadas del espacio o de la biblioteca. El uso es identidad, lugar, producto o estilo y sale de la clase del elemento (18.22).
   - **Mejorar** reescribe en el propio campo con el asistente real (OpenAI `gpt-6.1-sol`, 2 $ y 10 $ por millón de tokens, verificado el 15-10-2026): seis partes, luz por su fuente, realismo sin palabras de pulido, identidad primero y nada que contradiga los rasgos de la ficha. Lo añadido sale resaltado, con «Deshacer» y «Por qué».
   - **Ingredientes** en una línea (18.30), en verde, ámbar o rojo: resolución de cada referencia y partes del prompt.
   - Formato, calidad, cuántas (1–4) y **Generar · precio**. Pulsar ese botón es la autorización, con la cifra delante, igual que en Producir.
2. **Lo que sale (centro).** **Carpetas** del espacio y la cuadrícula de la carpeta abierta: lo que se está generando (con reloj), lo elegido (★) y lo descartado (atenuado).
3. **La imagen que pulsas (derecha).**
   - Miniatura, **Elegir** o **Descartar**, modelo, ajustes, coste y fecha.
   - El prompt enviado, con «usarlo arriba».
   - Una nota.
   - **Seguir desde aquí.** En la primera versión solo funcionan Variaciones (repite el mismo encargo) y usar el prompt arriba. Cambiar ángulo, editar zona, ampliar, pasar a vídeo, hacer que hable, ¿por qué salió así? y subir resolución aparecen con «próximamente».
   - **Usar en una ficha** y **Llevar a un plano**, también «próximamente».

**Por dentro.**
- Una operación del Taller tiene como destino `{tipo: "taller", id: carpeta}` y como `proyecto_id` el espacio en forma `taller:{espacio}`, para que el gasto y el presupuesto lleven su propia cuenta.
- Cada imagen es una **Toma** con `carpeta_id`.
- El prompt enviado es el texto del campo, más las líneas de referencias (18.22) y de persona real (18.20), más los negativos por defecto de foto.
- Precio, autorización, «no reenviar nunca» y registro son los de siempre.
- Las carpetas (`Carpeta`: espacio, nombre, orden) se crean desde la propia pantalla; la primera, «General», se crea sola.

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

### 7.7 El lienzo como mesa de dirección (valor diferencial del producto)

a) **Estructurar.** En el lienzo se crean, duplican, dividen y borran planos dentro de cada escena, se ordenan con "Mover antes/después" y se encadenan con el plano anterior. Las escenas no se crean en el lienzo: "Editar en el guion" abre una revisión (§6.3).

b) **Leer.** La tarjeta de un elemento abre su ficha contextual en modo lectura: versión usada, rasgos fijos, rasgos variables, personalidad y referencias a tamaño completo, con "Editar en su paso" para cambiarla. La ficha del plano tiene una pestaña "Continuidad": por cada elemento del plano muestra sus rasgos fijos, los rasgos variables que aplican en este plano y las referencias que se enviarán al producir.

c) **Ángulos.** La tarjeta del plano muestra el resumen de su dirección (encuadre · ángulo · movimiento · duración). En un plano de vídeo, la dirección tiene encuadre y ángulo de inicio, encuadre y ángulo de final, y el movimiento entre ambos. Cada escena tiene la vista "Guion gráfico": la tira de sus planos en orden, con miniatura o hueco y su resumen de dirección, para leer la secuencia de ángulos de un vistazo.

d) **Corregir y mejorar por segmento.** Cada plano tiene "Corregir": una instrucción en lenguaje llano sobre ese plano ("que no gire la cabeza", "más luz en la cara"). En la Fase 5 se guarda como corrección pendiente, visible en la tarjeta. En la Fase 6 se convierte en una operación con coste (editar imagen, o volver a producir el plano con la toma como referencia); el resultado es una toma nueva, la original se conserva y se comparan lado a lado antes de elegir.

Reglas de detalle acordadas con el usuario (26-09-2026):

- **Dividir un plano** crea un plano nuevo justo detrás, con la misma dirección y los mismos elementos, la duración partida a la mitad y "qué se muestra" vacío. El nuevo queda **encadenado con el anterior**; en vídeo, su encuadre y ángulo de inicio son los de final del original y su final queda por definir. El original conserva su toma.
- **Correcciones**: lista por plano. Las marcadas `Hecha` no desaparecen, pasan a un historial plegado; `Borrar` solo para las pendientes. Cada corrección puede enlazar la operación que la ejecuta y la toma resultante (Fase 6); al elegir esa toma se marca `Hecha` sola. En la Fase 5, `Hecha` es manual.
- **Guion gráfico**: se abre desde la tarjeta de escena, a pantalla completa sobre el lienzo. Pulsar un plano de la tira lo cierra y deja ese plano seleccionado en el lienzo con su ficha abierta. Tiene `Escena anterior` y `Escena siguiente` para leer la secuencia completa sin cerrarlo.

---

## 8. Dirección de un plano (caja de herramientas del director)

Pestaña **Dirección** de la ficha de plano. Cada campo es un selector con opciones en lenguaje llano + campo libre opcional. Ningún campo es obligatorio salvo `que_se_muestra`.

| Campo | Opciones de ejemplo (lista cerrada inicial, editable en un fichero de datos) |
| --- | --- |
| `que_se_muestra` | Texto libre (obligatorio). |
| `protagonista_visual` | Un elemento del reparto, el escenario, o "el entorno". |
| `encuadre` | Gran plano general, plano general, plano medio, primer plano, detalle. En **vídeo** son dos: `encuadre_inicio` y `encuadre_final`. |
| `angulo` | A la altura de los ojos, picado, contrapicado, cenital, a ras de suelo. En **vídeo** son dos: `angulo_inicio` y `angulo_final`. |
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

Detalle de la vista previa (acordado el 26-09-2026): la plantilla vive en `backend/data/plantillas_prompt.yaml`, una por modalidad (imagen / vídeo), editable sin tocar código. Incluye los rasgos fijos y los **rasgos variables que aplican en ese plano**, y los **negativos**; en vídeo, encuadre y ángulo de inicio, de final y el movimiento entre ambos. Nunca incluye texto ni rótulos. Junto a la vista previa se ve **qué versión de cada ficha** se ha usado para construirla.

Cambiar de modalidad no pierde nada sin avisar: al pasar de imagen a vídeo, el encuadre y el ángulo pasan a ser los de inicio y los de final arrancan iguales (plano fijo); al pasar de vídeo a imagen, el encuadre y el ángulo toman los de inicio, y los de final y el movimiento se guardan sin mostrarse y reaparecen si se vuelve a vídeo.

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

La moneda del presupuesto y del registro es USD, la misma en que cobran los proveedores. Sin conversión a otras monedas en esta versión.

### 9.5 Registro (P9)

Tabla filtrable por espacio, proyecto, estado y fecha: acción, modelo, proveedor, destino (enlace al plano/ficha), coste estimado, coste real, estado, intentos. Totales por proyecto y por espacio. Exportable a CSV.

---

### 9.6 Detalle acordado del motor (26-09-2026)

- **Contrato**: `estimar` devuelve `Decimal | None` (`None` = «coste sin verificar»,
  nunca 0 por desconocido). `consultar` solo lee: nunca crea ni reenvía. El estado
  «incierto» no lo da el proveedor: lo decide el motor cuando enviar o consultar no
  contestan. `EntradaOperacion` valida, por acción, qué campos exige y cuáles no le tocan.
  `simular_resultado` (`normal | fallo | incierto | timeout`) solo lo acepta el proveedor
  `simulado`; cualquier otro lo rechaza.
- **Idempotencia**: clave = hash(`operacion_id` + número de intento + entradas). Antes de
  enviar, el motor busca un intento con esa misma clave y no envía dos veces. «Producir
  otra toma» es otra operación y «Reintentar» es otro intento: esos sí se envían, con
  autorización nueva.
- **Transiciones**: solo las del diagrama del §9.4; cualquier otra se rechaza con 409
  diciendo en qué estado está la operación.
- **Dinero**: al autorizar se reserva el coste estimado; al completar, la reserva se
  sustituye por el coste real; si falla sin cobro, se libera. El gasto de la cabecera es
  real + reservado, y lo dice.
- **Reinicio**: el worker retoma desde la base de datos. Las operaciones con `id_remoto`
  se vuelven a consultar; una enviada sin `id_remoto` pasa a «incierta». Nunca se reenvía
  nada al arrancar.
- **Cola**: concurrencia 2 por proveedor, con la posición visible («en cola, posición 3»).
- **Catálogo**: se valida al arrancar (acción desconocida, proveedor inexistente, unidad
  distinta de `imagen | segundo | caracter | operacion` o moneda distinta de USD impiden
  arrancar, diciendo qué entrada falla). Los modelos de los proveedores reales quedan como
  **plantillas** (`plantilla: true`) y no son elegibles hasta que el usuario las rellene.
  Los modelos simulados llevan `verificado: false` y la interfaz dice «precio simulado».
- **Lámina de encuadres (§8)**: una sola operación con N variantes (4 por defecto), coste
  N × precio unitario y autorización única. Las variantes que fallan no se cobran y se
  reintentan sueltas con su propia autorización. Las tomas de exploración van aparte de
  las tomas del plano: `Fijar` escribe el encuadre y el ángulo en la dirección (inicio o
  final en vídeo) y `Usar como toma del plano` crea una toma de verdad.
- **Correcciones (§7.7d)**: en imagen, `editar_imagen` sobre la toma elegida con la
  corrección como instrucción; en vídeo, volver a producir el plano con la toma elegida
  como referencia y la corrección sumada al prompt, visible y editable antes de autorizar.
  Si el plano no tiene toma todavía, la corrección se suma al prompt de la primera
  producción.
- **Planos sin escena (§13)**: fila al final del lienzo, con `Mover a escena…` y `Borrar`.
  No entran en el montaje hasta que tengan escena.
- **Registro**: el mismo dato por tres puertas: la pantalla global (§9.5), un panel en el
  lienzo filtrado al proyecto y las operaciones de cada plano en su pestaña `Producir`.
  `GET /eventos` emite solo los eventos del proyecto que se está viendo.
- **Proveedor simulado**: ficheros reales con ffmpeg (PNG, MP4 H.264, WAV) marcados
  «SIMULADO», con contador de fotogramas y timecode en vídeo, formatos variados por modelo
  (24 o 30 fps, 44,1 o 48 kHz, resoluciones distintas) y siempre en la relación del
  proyecto. Cada fichero escribe el plano, la acción, el encuadre y el ángulo pedidos, la
  variante y las miniaturas de las referencias recibidas. Determinista por clave de
  idempotencia.

### 9.7 Plan de la Fase 9: proveedores reales (04-10-2026)

Objetivo: que Picasso produzca de verdad. Usaremos como ejercicio guiado los cursos gratuitos de Higgsfield Academy, en este orden: 1) "Blockbuster 4K" (el recorrido completo de un corto); 2) "Crea un cortometraje animado" (un personaje en ocho estilos, para probar las versiones de ficha); 3) "Santiago: dirigir un cortometraje emocional" (la mesa de dirección, toma a toma); 4) "Anuncio cinematográfico E2E" (el tipo anuncio, con el producto como ficha). Antes de Santiago veremos "Cómo evaluar demos de cine con IA", para fijar los criterios con los que se comparan tomas y se escriben correcciones. Cada lección se hace **dentro de Picasso**, y lo que la máquina no sepa hacer se apunta como mejora; no se resuelve a mano por fuera.

- **Orden de activación**, una modalidad cada vez y comprobada antes de pasar a la siguiente:
  1. `elevenlabs`: voz. Es la más barata, y con ella comprobamos el ciclo completo con dinero real.
  2. `kie`: imagen (fichas y planos de imagen).
  3. `kie` / `fal`: vídeo, con primer y último fotograma.
  4. `openai_images`: editar con referencias y correcciones.
- **Modelos**: los que pida cada lección del curso, no un catálogo exhaustivo. Cada entrada del catálogo se verifica el mismo día contra la documentación del proveedor: endpoint, parámetros, duraciones, relaciones y precio. La entrada lleva `fuente` (URL) y `verificado_el` (fecha). Sin verificar no se puede elegir.
- **Referencia**: los drivers de Escenda (`~/dev/escenda-studio`) ya hablaron con estas APIs de verdad. Se consultan como documentación de endpoints y trampas conocidas, pero el código se escribe nuevo sobre el contrato del §9.1.
- **Claves**: se copian al `.env` local de Picasso desde la configuración de Escenda. Nunca van al repositorio. Sin clave, el proveedor aparece como "no configurado".
- **Dinero**: el proyecto del curso arranca con un presupuesto explícito. El primer envío real de cada modelo lo autoriza Juan desde la interfaz, viendo la cifra. El coste real es el que devuelva el proveedor; si no lo devuelve, se registra el estimado y se marca como estimado.
- **Pruebas**: hay tests de integración marcados `real` que no corren por defecto. La batería aislada sigue usando `simulado`.
- **Resultados**: se descargan como `Medio` y la exportación los normaliza (§11.3). Formatos raros o duraciones distintas a las pedidas se avisan, no se corrigen en silencio.
- **Antes del primer envío real (aprobado el 07-10-2026)**: se completan las plantillas de prompt (§18.10 y su ajuste §18.10b: con fotograma de inicio, el vídeo solo describe movimiento; texturas y realismo en imagen; movimiento del sujeto y del entorno, cambios de luz y sonido en vídeo; negativos por defecto por modalidad, editables en Ajustes) se alinea la dirección del plano con las seis partes (§18.16: fuente de luz, tono, estilo opcional y nuevas opciones de cámara), la escena gana entorno explícito (§18.17), la vista previa revisa el prompt en seis partes (§18.15) y se añade a Desarrollo el campo **«Qué evitar»** (§18.8), que se suma a los negativos de todos los planos del proyecto. La vista previa del prompt (§8) muestra de dónde sale cada negativo: del proyecto, del plano o por defecto.
- **Referencias y tomas (aprobado el 08-10-2026)**: cada referencia dice para qué está y qué hay que conservar (§18.22, junto a la cláusula de persona real de la §18.20), y la línea va en la vista previa antes del primer envío real. Producir puede pedir varias tomas del mismo prompt, con el precio por n delante (§18.23), cuando el catálogo real confirme cómo cobra cada proveedor las salidas múltiples.
- **Primer proveedor real de imagen: fal · Nano Banana Pro (decidido el 13-10-2026).** Juan eligió fal después de comparar Nano Banana Pro con ChatGPT con la misma descripción: Nano Pro da el retrato ancla más natural y es el modelo del reto EVA. Verificado en fal.ai el 13-10-2026:
  - **Puntos de llamada.** `fal-ai/nano-banana-pro` (de texto) y `fal-ai/nano-banana-pro/edit` (con referencias en `image_urls`, hasta 14).
  - **Precio.** 0,15 $ por imagen; 4K al doble (0,30 $). La página avisa de que el precio puede cambiar.
  - **Entrada.** `prompt`, `num_images`, `aspect_ratio` (incluye 16:9, 9:16, 1:1 y 4:5), `resolution` (1K/2K/4K), `output_format` y `safety_tolerance`. No hay negativos aparte: van en el texto, en la línea «Sin: …».
  - **Salida.** `images[].url`.
  - **Cola REST.** `POST https://queue.fal.run/{modelo}` con `Authorization: Key $FAL_KEY`, y luego `status_url` y `response_url` (estados IN_QUEUE, IN_PROGRESS y COMPLETED, con `error` si falla). Acepta referencias como data URI.
  - **En Picasso.** Entrada nueva en el catálogo «Nano Banana Pro (fal)», a 2K (precio estándar) y con un máximo de 6 referencias. El proveedor `fal` cumple el contrato del §9.1. Antes de enviar guarda el envío en la base. Como fal no documenta idempotencia en el envío, si un envío se quedó sin respuesta **nunca se reenvía**: Comprobar solo pregunta por lo que tiene `id_remoto`. Las referencias viajan como JPEG de 2048 px de lado largo. Consulta cada 2 s, hasta 5 min. El coste real es la tarifa publicada por imagen recibida. Los medios generados no llevan la marca de demo.
  - **Lo que entra antes del primer envío.** La 18.22 (qué conservar de cada referencia, numerada en el mismo orden en que viajan) y la 18.20. La marca «persona real» va en el **elemento**, no en la versión de la ficha: es un hecho de la persona y no obliga a crear otra versión. El resto del primer paso (18.10, 18.15–18.18) sigue después, sin bloquear el reto.
- **Primer proveedor real de voz: ElevenLabs (14-10-2026).** Se construye para el corto «Disculpa de Tania»: la profesora del reto EVA dio su permiso por escrito para clonar su voz para ese vídeo, y Juan guarda la captura en el proyecto. La voz se crea **fuera**, en ElevenLabs (Instant Voice Clone, con la casilla de consentimiento). Picasso solo la usa: su identificador va en el bloque *Voz* de la ficha (`proveedor: elevenlabs`, `voice_id`). Verificado en elevenlabs.io el 14-10-2026:
  - **Llamada.** `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}` con `xi-api-key`. Cuerpo: `text`, `model_id` y `voice_settings` opcionales. Devuelve MP3 44,1 kHz.
  - **Precio.** 0,08 $ por 1.000 caracteres en Eleven v3 y en Multilingual v2, igual en todos los planes.
  - **En Picasso.** Dos entradas de catálogo, «ElevenLabs · Multilingual v2» y «ElevenLabs · v3 (más expresiva)», cobradas por carácter. La llamada es síncrona: el proveedor guarda el audio, lo pasa a WAV 44,1 kHz y lo entrega como toma de voz del diálogo (§11.1). Una clave que ya se intentó y no tuvo respuesta nunca se reenvía. Si el hablante no tiene `voice_id` en su ficha, la operación falla con un mensaje que dice dónde ponerlo.
- **Personaje que habla, ruta B (foto + voz), con fal · OmniHuman 1.5 (14-10-2026).** Es la última pieza del corto de Tania. Verificado en fal.ai el 14-10-2026:
  - **Punto de llamada.** `fal-ai/bytedance/omnihuman/v1.5`. Entrada: `image_url`, `audio_url`, `prompt` (opcional), `resolution` (720p o 1080p), `turbo_mode`. Salida: `video.url` y `duration`, que es la duración que se cobra.
  - **Precio y límites.** 0,16 $ por segundo. El audio tiene que durar menos de 60 s a 720p y menos de 30 s a 1080p.
  - **En Picasso, el plano de vídeo produce en dos pasos (adelanto de la 18.2).** Primero, **la foto de partida**: Producir ofrece en un plano de vídeo también «Imagen con referencias» y «Generar imagen», con la plantilla de imagen y el encuadre y ángulo *de inicio*. Después, **«Personaje hablando»**: se elige una toma de imagen del plano como foto de partida, y la voz es la **toma elegida del diálogo que suena en ese plano** (pestaña Voces, §11.1). La duración, y con ella el precio, la da ese audio. Si no hay voz elegida, Producir lo dice y no deja continuar.
  - **Proveedor fal.** Sube la foto y el audio a su almacén con el cliente oficial `fal-client` 1.0.3, que es dependencia nueva: OmniHuman no garantiza aceptar data URI. Pide 720p, devuelve el MP4 como toma del plano y sigue sin reenviar nunca un envío sin respuesta.
  - **Pendiente para el montaje.** El vídeo ya trae la voz dentro. En el paquete, la pista de voz del diálogo sonaría dos veces: de momento se silencia en DaVinci, y se apunta como fricción para el montaje.
  - **Persona real: la foto de partida es su foto (14-10-2026).** En la primera toma real de Tania, Nano Banana Pro regeneró la cara y no se parecía. El texto decía «pelo largo» y la foto lo muestra por los hombros; además, el modelo recrea la cara cuando se le pide una escena entera. Se aplica la ley de Escenda: **la cara se conserva, no se genera.** Desde ahora, «Personaje hablando» acepta como foto de partida, además de una toma de imagen del plano, **una referencia de imagen de la ficha de un personaje del plano**, es decir, su foto real. Si el personaje está marcado como persona real, esa es la opción que se propone primero.
- **Diagnóstico de tomas (§18.3, aprobado el 07-10-2026)**: entra en esta fase porque, con dinero real, regenerar a ciegas cuesta. Para ello se hace real el asistente (§10). **Proveedor de texto: OpenAI** (`OPENAI_API_KEY`, la que ya existe; decisión de Juan del 07-10-2026). La clave se comprobó ese día: responde y ofrece, entre otros, `gpt-5.5` y `gpt-5.4-mini`. El modelo de cada tarea y su precio se fijan al construir, verificados contra la documentación de OpenAI: uno con visión y de calidad para diagnosticar, y uno barato para Desarrollo. `ProveedorTexto` sigue siendo intercambiable: Anthropic queda como segunda implementación cuando haya `ANTHROPIC_API_KEY`. Se usa para esta tarea y para las de **Desarrollo** (`hacer_preguntas`, `ordenar_notas` y `proponer_campo`), más el «director creativo» de la 18.11 en Idea. Esto se aprobó el 07-10-2026, cuando Juan lo necesitó operando: «describo lo que tengo en la cabeza y Picasso me ayuda a rellenar lo que falta». El resto de tareas del asistente siguen en `simulado` hasta su turno.
  - **Qué recibe**: la toma (la imagen, o 4 fotogramas espaciados si es vídeo, extraídos con ffmpeg), el prompt exacto enviado, el modelo, la dirección del plano, las fichas usadas con su versión, las tomas descartadas de ese plano con su nota, el fallo marcado por el director (tipificado o con sus palabras) y los negativos del proyecto.
  - **Qué devuelve**: una `Propuesta` con causa probable (qué partes del prompt o de la dirección la provocan), qué falta y una corrección concreta. Se acepta, se edita o se descarta. Aceptada, queda como corrección del plano (§7.7d) y se produce de nuevo con autorización y precio, como siempre.
  - **Coste**: la llamada al asistente también cuesta. Se estima y se muestra antes, y queda en el Registro como cualquier operación (acción `diagnosticar`, proveedor `anthropic`).
  - **Aprendizaje**: si la toma producida tras la corrección se elige, el par fallo → corrección queda guardado como criterio del proyecto, consultable en los diagnósticos siguientes. Es el germen de las Recetas (§18.5).

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

### 11.1 Voces

- Cada diálogo del guion aprobado tiene su **Voz** (§3.1). Se produce con la acción `generar_voz` sobre ese diálogo: el texto es el del diálogo y la voz, la de la ficha del hablante (o la del narrador del proyecto). Coste visible y `Producir por X $`, como cualquier operación (§9.4).
- En el lienzo, la ficha del plano tiene la pestaña **Voces**: los diálogos de su escena, con su texto, hablante, tomas de voz, la elegida, el plano donde suena y el desfase. Desde ahí se produce, se compara (escuchar una tras otra) y se elige.
- Si una voz dura más que el plano donde suena (desde su desfase), se avisa en la pestaña Voces y en el montaje, con opciones: alargar el plano, mover la voz a otro plano o cambiar el desfase. No se acelera ni se recorta nada en silencio.

### 11.2 Pantalla de montaje (P8)

- Tira horizontal con las tomas elegidas en orden de escena y plano, a escala de duración real. Los planos sin toma aparecen como hueco con su número (`E2·P1 · sin toma`).
- `Reproducir secuencia`: reproduce en el navegador las tomas consecutivas (sin render), con las voces en su sitio.
- Debajo, tres pistas: **Voces** (colocadas en su plano con su desfase), **Música** y **Ambiente** (importadas del espacio, con inicio y volumen). No hay edición de corte fino: eso se hace en el editor.
- Cada toma muestra su número de toma y `Ir al plano` (abre el lienzo con ese plano seleccionado).
- Avisos visibles antes de exportar: huecos, voces más largas que su plano, voces o tomas desactualizadas. Se puede exportar con avisos; quedan listados en el paquete (`LEEME.md`).
- En proyectos de tipo `imagen` no hay montaje: `Exportar paquete` saca las imágenes elegidas con su manifiesto.

### 11.3 Paquete de edición

`Exportar paquete de edición` es un trabajo en segundo plano con progreso visible (no tiene coste). Genera un ZIP ordenado por tipo de material, nunca un cajón mezclado:

```
<proyecto>_<pieza>_<fecha>/
├── video/          E01_P01_t3.mp4 … tomas elegidas, normalizadas, en orden de montaje
├── imagen/         E01_P02_t1.png … planos de imagen
├── audio/
│   ├── voces/      E01_P01_marta.wav … una por diálogo: escena, plano y hablante
│   ├── musica/     pistas importadas
│   └── ambiente/   pistas importadas
├── fichas/         una carpeta por elemento usado (marta_v1/, taller-de-ceramica_v1/) con ficha.md (rasgos fijos, variables, personalidad) y sus referencias
├── alternativas/   (opcional, casilla al exportar) tomas no elegidas y originales sin normalizar: E01_P01_t1.mp4, E01_P01_t2.mp4…
├── timeline.fcpxml DaVinci Resolve: vídeo y cada capa de audio en su propia pista, en orden
├── previo.mp4      concatenado rápido con ffmpeg, con las voces, solo para ver
├── guion.md        guion aprobado legible, con su número de revisión
├── LEEME.md        cómo importar en DaVinci y en CapCut, y los avisos del montaje
└── manifiesto.json planos, tomas, voces, modelos, fichas usadas (versión), correcciones aplicadas y costes
```

Reglas:
- **Nombres**: siempre `Exx_Pyy_tz` (escena, plano, toma); las voces `Exx_Pyy_<hablante>` y, si hay varias en el mismo plano, `Exx_Pyy_<hablante>_2`. Sin espacios ni tildes, para que ordenen igual en cualquier sistema.
- **Normalización**: cada toma de vídeo se convierte al formato del proyecto con ffmpeg: `fps` del proyecto, resolución según `formato_video` (1080×1920, 1920×1080, 1080×1080 o 1080×1350), H.264 yuv420p. Si la toma no tiene la relación de aspecto del proyecto, se encaja sin recortar (bandas) y se avisa. El original sin tocar va en `alternativas/` si se marca la casilla.
- **Audio**: WAV PCM 16 bits a 48 kHz, mono para voces. Voces, música y ambiente nunca se mezclan en un archivo.
- **FCPXML**: duraciones y posiciones en fotogramas exactos del `fps` del proyecto; el formato de la secuencia (incluido vertical) declarado en la cabecera; vídeo en la pista principal; voces, música y ambiente como pistas separadas debajo. Las voces van enganchadas a su clip, para que se muevan con él en el editor.
- **Rutas**: DaVinci Resolve 21 no importa un FCPXML con rutas relativas (comprobado el 03-10) y con absolutas enlaza todo. Por eso, si hay **carpeta de entregas** (`ENTREGAS_HOST`, por ejemplo `~/Movies/Picasso`, montada en el contenedor), el valor por defecto es absolutas a esa carpeta y el paquete se guarda ya descomprimido en `<entregas>/<proyecto>/<paquete>/`, listo para importar a mano o desde el MCP de DaVinci. Sin carpeta de entregas (VPS), el valor por defecto son relativas, para CapCut o para mover la carpeta. El ZIP de descarga siempre lleva dentro `<proyecto>/<paquete>/`: descomprimido en la carpeta base, las rutas absolutas cuadran.
- **Comprobación automática** tras generar: carpetas, nombres, que cada fichero exista y dure lo que dice el manifiesto (±1 fotograma), y que el FCPXML sea XML válido y su duración total cuadre. Si falla, no se entrega el ZIP y se dice qué falló.
- Para CapCut se usan las carpetas numeradas y el `previo.mp4`; no se promete importar la línea de tiempo en CapCut.

### 11.4 Proyectos de referencia

- `docs/referencias/` guarda proyectos de referencia descritos en texto (idea, fichas, escenas, planos con su dirección, diálogos). Sirven para recrear siempre el mismo caso y comparar el paquete entre versiones.
- El primero es el corto de Marta (`corto-marta.md`), construido durante la validación de las Fases 1 a 6.

### 11.5 Marca del estudio

- El Estudio guarda una marca: sello o logo (SVG o PNG con transparencia, en versión clara y oscura), color de fondo, color de tinta y web. Se sube una vez en P10 y vale para todos los espacios.
- Al exportar, casilla "Añadir cierre con la marca" (y, aparte, "Añadir portada"): una tarjeta de 3 s con el sello centrado y la web debajo, que entra con un fundido de 0,5 s. Se genera con ffmpeg a los `fps`, la resolución y el formato del proyecto, como un clip más (`video/99_cierre.mp4`) al final de la línea de tiempo y del `previo.mp4`.
- La marca no se pone nunca encima de los planos (ni esquinas ni marcas de agua propias): solo en portada y cierre.
- Origen: la presentación y el vídeo de OverWatch para Dubái (01-10), donde el cierre con el sello sobre el color de fondo funcionó y el logo en cada esquina se veía feo.

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
| Aprobar una revisión del guion | Escenas marcadas `Afecta a los planos`: sus planos con toma pasan a `desactualizado`. Escenas marcadas `Solo texto`: nada. Escenas eliminadas: sus planos pasan a "sin escena" (se conservan hasta que el usuario los borre). Escenas reordenadas: solo cambia el montaje. |
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
✔ Escribir 3 escenas, reordenarlas, leerlas seguidas y aprobar. El lienzo se abre. Editar después crea una revisión en curso sin cerrar el lienzo; al aprobarla se marcan las escenas editadas (Solo texto / Afecta a los planos); descartarla deja el guion aprobado intacto.

**F5 · Lienzo**
P7 sin producción: estructura desde el guion, grupos, fichas contextuales, dirección, vista previa del prompt, persistencia del layout, y el §7.7 (estructurar, leer, ángulos y correcciones por segmento).
✔ Abrir el lienzo, plegar una escena, mover tarjetas, dirigir un plano, cerrar la ficha sin perder el sitio, salir y volver con todo igual. Mover una tarjeta no cambia el orden del montaje.
✔ Crear, duplicar, dividir y reordenar planos. Abrir la ficha de un elemento desde el lienzo y leerla sin salir. Ver la pestaña Continuidad de un plano. Dirigir un plano de vídeo con ángulo de inicio y de final y verlo resumido en la tarjeta y en el Guion gráfico. Dejar una corrección y verla pendiente en la tarjeta.

**F6 · Motor con proveedor simulado**
Operaciones, catálogo, costes, SSE, tomas, comparación, elegir toma, editar imagen, registro, estados inciertos.
✔ Producir un plano, ver coste antes, obtener 2 tomas, compararlas, elegir la segunda. Provocar un `incierto` y recuperarlo desde el Registro sin que se cree un segundo envío.

**F7 · Montaje y exportación** (se construye fuera de Emergent)
Voces por diálogo (§11.1), `fps` del proyecto, pistas de música y ambiente, P8 (§11.2) y paquete de edición (§11.3).
✔ En un proyecto nuevo creado por la interfaz: producir voces de dos diálogos, importar una música, exportar el paquete y abrir `timeline.fcpxml` en DaVinci Resolve en el Mac de Juan: cada clip y cada voz en su pista, en su sitio y con la duración correcta. La fase no se cierra hasta que Juan lo confirme en su DaVinci.
✔ La comprobación automática del paquete pasa en la base de pruebas.

**F7b · Marca del estudio** (§11.5)
✔ Subir el kit en P10, exportar con cierre y portada y ver las dos tarjetas en el `previo.mp4` y en DaVinci, a los fps y el formato del proyecto, sin nada encima de los planos.

**F8 · Impacto**
Todas las reglas del §13.
✔ Cambiar una ficha usada y ver los planos marcados; editar una escena producida y ver sus planos desactualizados.

**F9 · Proveedores reales**
`fal`, `kie`, `openai_images`, `elevenlabs`, con claves por entorno. Pruebas de integración marcadas y excluidas del test por defecto.
✔ Una operación real de cada tipo lanzada desde la interfaz con el coste mostrado y registrado.
✔ Diagnosticar una toma real que salió mal: ver la causa y la corrección propuestas, aceptarla, producir de nuevo y comprobar en el Registro el coste del diagnóstico y el de la nueva toma.

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
- Quitar marcas de agua de material de terceros (se hizo a mano para OverWatch; no es función del producto).

---

## 17. Preguntas abiertas (no las resuelvas; déjalas marcadas)

1. Nombre del producto y familia tipográfica.
2. Paleta de color.
3. Modelos y precios reales del catálogo.
4. Si la música se genera o solo se importa (en esta versión: solo se importa).
5. Duración máxima por plano según modelo (la fija el catálogo).

---

## 18. Mejoras propuestas desde la formación (sin aprobar)

Salen de `docs/formacion/`. Ninguna se construye hasta que Juan la apruebe y quede diseñada en su sección.

| # | Mejora | Origen | Fase sugerida |
| --- | --- | --- | --- |
| 18.1 | **Catálogo con fortalezas y uso.** Cada modelo declara `bueno_para` (rostros realistas, estilizado, cinematográfico, lipsync, producto…) y `uso: exploracion | final`. Producir recomienda según el plano (personaje que habla, producto, estilo), sin elegir por el usuario. | AVB 01, regla 2 | F9 |
| 18.2 | **Imagen antes que vídeo.** Por defecto, el plano de vídeo produce el fotograma de inicio en imagen, lo aprueba el director y solo entonces se anima. Se puede saltar. | AVB 01, reglas 3–4 | F9 |
| 18.3 | **Diagnóstico de tomas.** Con el asistente real, «¿Por qué no funciona?» sobre una toma: mira la toma, el prompt enviado y la dirección del plano, y propone una corrección (§7.7d) que el director acepta, edita o descarta. Ofrece fallos tipificados como atajos (parece falso o plástico, le falta realismo, movimiento raro o gomoso, predecible, suena robótico). «Reintentar» ofrece primero «Diagnosticar»: no se regenera a ciegas. | AVB 01, regla 5; AVB 02, reglas 6–7 | **APROBADA el 07-10-2026: se construye con la F9** |
| 18.4 | **Capa de efectos de sonido.** Cuarta capa de audio enganchada al plano igual que la voz (desfase dentro del plano), importada o generada. En el paquete va en `audio/efectos/` y en su propia pista del FCPXML. | AVB 01, regla 6 | Con F7b |
| 18.5 | **Recetas.** «Guardar como receta» sobre una toma elegida: dirección, prompt resultante, modelo, ajustes y coste. Se reutilizan en otros planos y proyectos del estudio, y se adaptan antes de producir. Es el primer escalón del método Manual → Receta → Agente. | AVB 01, regla 7 | Tras F9 |
| 18.6 | **Mencionar con `@` (ampliada el 07-10-2026 con la idea de Juan).** En «Qué se muestra», en la dirección del plano y en las correcciones, `@` abre una lista con miniaturas: elementos del reparto y también imágenes de la biblioteca, con buscador. Lo elegido queda en el texto como una pastilla con miniatura, que se amplía al pasar el ratón. **La mención es el vínculo:** mencionar a un elemento lo añade al encargo o al plano con su versión validada y sus referencias; mencionar una imagen la añade a las referencias; borrar la mención la quita. «Traer de la biblioteca» se mantiene como alternativa. | AVB 01, regla 8; idea de Juan operando el encargo | Rediseño del encargo (junto con 19.7–19.10) |
| 18.7 | **Formato por destino y versiones de formato.** Al crear el proyecto se pregunta «¿dónde se publica?» (Reels/TikTok/Shorts → 9:16; feed y anuncio estático → 4:5; seguro y multiplataforma → 1:1; YouTube/web/cine → 16:9) y se propone la relación, que el usuario puede cambiar. Después: generar una versión de la pieza en otra relación, con reencuadre o nueva toma por plano y su coste por delante, y un paquete por versión. | AVB 01, regla 10 | Proponer en la creación: inmediato. Versiones: tras F9 |
| 18.8 | **Contexto automático en cuatro partes.** Toda petición al asistente se compone así: *contexto* (tipo, canal, público y desarrollo), *objetivo* (objetivo e intención de la pieza), *detalles* (fichas, escena y dirección del plano) y *formato de salida* (el de la tarea cerrada). Campo nuevo en Desarrollo: **«Qué evitar»** (estilos, tonos o recursos que no queremos), que se suma a los negativos de todos los planos del proyecto. | AVB 02, reglas 2–4 | **Campo «Qué evitar»: APROBADO el 07-10-2026, primer paso de la F9.** Resto, con el asistente real |
| 18.9 | **Órdenes de refinado.** Botones de un clic sobre cualquier propuesta del asistente y sobre el prompt de un plano antes de producir: más específico, menos genérico, 5 versiones más fuertes, más cinematográfico, más realista, más natural, gancho más fuerte, recortar un 30 % y «¿qué es débil?». Cada orden da una propuesta nueva; nada se aplica sin aceptarlo. | AVB 02, regla 5 | Asistente real |
| 18.10 | **Plantillas de prompt más completas.** Imagen: línea de texturas y detalles de realismo (imperfecciones naturales). Vídeo: separar movimiento del sujeto y del entorno, cambios de luz y dirección de sonido (para modelos con audio). Negativos por defecto por modalidad, editables en Ajustes. Imagen: brillante, plástico, sobrepulido, aspecto de IA. Vídeo: cámara lenta falsa, caras deformadas, movimiento gomoso, cámara imposible. | AVB 02, reglas 8–9 | **APROBADA el 07-10-2026: primer paso de la F9, antes del primer envío real** |
| 18.11 | **Tareas nuevas del asistente, por paso** (siguen siendo tareas cerradas, sin chat libre). Idea: «director creativo» (qué es débil y 5–10 versiones más fuertes). Desarrollo, en anuncios: «investigación de público» (dolores, deseos, objeciones y frases reales). Guion: «ganchos» para la apertura, por tipos; «doctor de guion» (dónde pierde energía, qué suena robótico, qué cortar); «guion UGC» (gancho → problema → descubrimiento → beneficio → detalle → llamada a la acción); «crítico implacable» antes de aprobar. Producir: «revisar el prompt antes de gastar», opcional. | AVB 02, regla 10 | Asistente real |
| 18.10b | **Ajuste a la 18.10: el vídeo con fotograma de inicio solo describe movimiento.** Cuando el plano de vídeo lleva imagen de inicio, la plantilla no vuelve a describir la escena (el modelo ya la ve). Solo envía cámara, sujeto, entorno, cambios de luz, duración, sonido y negativos. Sin imagen de inicio (texto a vídeo) se mantiene la plantilla completa. | AVB 03, regla 7 | **APROBADA el 07-10-2026: con la 18.10, primer paso de la F9** |
| 18.12 | **Control de calidad del fotograma de inicio.** Antes de animar, una comprobación de cinco puntos sobre la imagen elegida: coherente con los demás planos de la escena (Continuidad), luz acorde al tono, personaje o producto creíble, relación de aspecto correcta y sin brillo plástico. El director los marca; si alguno falla, Picasso ofrece «Diagnosticar» (§18.3) en lugar de animar. Queda registrado en la toma. | AVB 03, regla 4 | Con la 18.2 (F9) |
| 18.13 | **Escalar y decidir entre editar o volver a dirigir.** Acción nueva del motor `escalar` (imagen, y vídeo cuando el catálogo lo tenga), con su precio, recomendada antes de animar. El diagnóstico (§18.3) clasifica el fallo: *arreglable con edición* (fondo, luz, manos, vestuario, etiqueta, piel demasiado lisa → `editar_imagen`) o *de raíz* (composición, personaje, concepto, ángulo → corregir la dirección y regenerar). No se pule lo que está mal de raíz. | AVB 03, reglas 5–6 | `escalar`: F9. Clasificación: con el diagnóstico |
| 18.14 | **Subtítulos en el paquete.** Un `subtitulos.srt` (y por idioma si un día hay varios) generado a partir de los diálogos con voz elegida y su posición en la línea de tiempo (§11.1). DaVinci y CapCut lo importan como pista de subtítulos. | AVB 03, regla 9 | Con F7b |
| 18.15 | **Revisión del prompt en seis partes.** La vista previa del prompt (§8) marca, con reglas fijas y sin IA, lo que falta o está débil: sujeto vago, sin entorno, sin cámara, luz sin fuente, tono de más de dos palabras, y un estilo con palabras que dan aspecto de IA (obra maestra, hiperdetallado, ultrabrillante, iluminación perfecta, premiado). Avisa, no bloquea, y se ve antes de autorizar. La lista de palabras de pulido se edita en YAML y puede variar por modelo: son muletillas de modelos antiguos, y los actuales sacan el realismo sin ellas (Juan, 13-10-2026). | AVB 04, reglas 3 y 11 | **APROBADA el 07-10-2026: primer paso de la F9** |
| 18.16 | **Dirección alineada con las seis partes.** *Luz*: campo nuevo **«Fuente de luz»** (qué la da, dónde está y cómo es: «lámpara cálida a la izquierda, suave»), que va antes de dirección, calidad y momento. *Tono* (antes «Ambiente»): con la pauta de una o dos palabras. *Estilo* (antes «Acabado»): opcional, con sugerencias realistas (foto 35 mm realista, iPhone con flash, producto en estudio) y el aviso de la 18.15. *Cámara*: nuevas opciones de encuadre «Plano medio corto», «Por encima del hombro» y «Subjetivo (POV)», y de movimiento «Órbita» y «Acercamiento lento». Las opciones se cambian en `opciones_direccion.yaml`, sin tocar código. | AVB 04, reglas 6–9 | **APROBADA el 07-10-2026: primer paso de la F9** |
| 18.17 | **Entorno explícito.** La escena gana campos opcionales: lugar, momento del día y clima. La plantilla monta la línea *Entorno* con ellos, más los rasgos del escenario del reparto y el «qué se ve» de la escena, que hoy no llega al prompt. | AVB 04, regla 5 | **APROBADA el 07-10-2026: primer paso de la F9** |
| 18.3b | **Diagnóstico que señala el campo.** Ajuste a la 18.3 (aprobada). Cada fallo tipificado se relaciona con una parte del marco de seis y con el campo concreto del plano: genérico → sujeto o entorno; falso → estilo o luz, con pistas de realismo; la luz no convence → fuente de luz; composición aburrida → encuadre y ángulo; ignoró algo → orden del prompt; demasiado cargado → simplificar «qué se muestra» o los elementos. La corrección propuesta edita esos campos de la dirección, no un texto suelto. | AVB 05, regla 4 | **APROBADA el 07-10-2026: Con la 18.3 (F9)** |
| 18.16b | **Pistas de realismo.** Ajuste a la 18.16 (aprobada). Dentro de *Estilo*, pistas a un clic: piel con textura natural, encuadre imperfecto, foto espontánea de móvil, luz irregular, ligero desenfoque de movimiento compresión realista y, desde EVA 01, asimetría natural de la cara, tono de piel que varía por zonas, mechones sueltos y luz direccional con sombra real. Se editan en `opciones_direccion.yaml`. | AVB 05, regla 5 | **APROBADA el 07-10-2026: Con la 18.16 (F9)** |
| 18.18 | **Orden y formato del prompt.** *Orden*: lo imprescindible va primero; la plantilla abre con «qué se muestra» y el protagonista visual, y la vista previa avisa si el prompt es tan largo que lo importante queda al final. *Formato*: cada modelo del catálogo declara `formato_prompt: texto | json`; para los de JSON, la misma dirección se envía en secciones con etiqueta (sujeto, entorno, cámara, luz, tono, estilo, movimiento, negativos). | AVB 05, reglas 4 y 6 | **APROBADA el 07-10-2026: F9, al rellenar el catálogo** |
| 18.19 | **Vocabulario de dirección ampliado.** En `opciones_direccion.yaml`, sin tocar código. *Fuente de luz* (sugerencias de la 18.16): contraluz con halo, luz a través de persianas, luz a través de hojas o encaje, dos fuentes opuestas fría y cálida, claroscuro con fuente lateral única, neón monocromático, halo circular detrás, ventana lateral, día nublado difuso, hora dorada, cenital dirigida. *Óptica*: se añaden focales (18 mm gran angular, 35 mm, 50 mm, 85 mm retrato, macro). Campo nuevo *Punto de enfoque* (texto: «en el ojo visible», «en la mano»). Campo nuevo *Recurso de composición*: perspectiva forzada, elemento hacia cámara, líneas guía, marco dentro del cuadro, medio oculto tras una superficie, nítido entre multitud en movimiento. Campo nuevo *Gradación de color*: verde azulado y naranja, monocromo azul, blanco y negro de alto contraste, desaturado gris-azul, cálidos ámbar. *Pistas de realismo* (18.16b): grano analógico, fuga de luz, destello natural. | REF 01 (EterniCodia), en la línea de AVB 04 | **APROBADA el 07-10-2026: Con la 18.16 (F9)** |
| 18.20 | **Cláusula de identidad para personas reales.** Las fichas de personaje llevan una marca «persona real». Si un plano la usa, el prompt incluye automáticamente la instrucción de mantener la identidad facial sin alterar rasgos, edad ni proporciones, y la vista previa lo muestra. No sustituye a partir de foto real (la cara se conserva, no se genera). | REF 01 | **APROBADA el 07-10-2026: F9** |
| 18.19b | **Ampliación de la 18.19 (aprobada), con el resto de EterniCodia.** *Fuente de luz* suma esquemas de estudio: tres puntos (principal, relleno y recorte), lateral a 45°, envolvente suave, clave baja, clave alta, foco circular detrás, haces volumétricos a contraluz, prisma o arcoíris y proyección de patrones. Campo nuevo *Fondo* (sobre todo para imagen, anuncio y producto): liso monocromático, degradado, texturizado pictórico, color saturado plano. *Negativos por defecto* (18.10): se añaden piel plástica, extremidades de más y sobreprocesado. *Pistas de realismo* (18.16b): poros visibles, vello facial fino e imperfecciones sutiles. *Recurso de composición*: manos que forman un marco, cenital, gran angular deformado y simetría estricta. | REF 01 | **APROBADA el 07-10-2026: con la 18.19 (F9)** |
| 18.21 | **Catálogo de estilos (looks).** Cada estilo es una descripción reutilizable de rasgos visuales (trazo, paleta, materiales, luz típica, acabado), sin nombres de marcas, estudios ni artistas. Se aplica a una escena o se usa para crear una versión de ficha: el mismo personaje en otro estilo, conservando sus rasgos fijos. Semilla: ilustración 3D entre caricatura y realismo, ilustración de videojuego años 80, cubismo geométrico, pintura acrílica u óleo, collage gráfico, cyberpunk de neón, épica medieval realista, fantasía naturalista. Se edita en un YAML y lo amplía el usuario. | REF 01, punto 14; curso Higgsfield «Corto animado» | **Aplazada por decisión de Juan (07-10-2026): se aprueba y diseña justo antes del curso 2 (Corto animado)** |
| 18.21b | **Ajuste a la 18.21: el estilo en tres capas.** Cada estilo del catálogo pertenece a una capa: *maquetación* (movimientos de diseño), *imagen* (movimientos artísticos) o *acabado* (técnicas de impresión y reproducción). Se puede combinar uno de cada en la línea de estilo. Los estilos que traen su rotulación o su textura propias lo declaran, y entonces la plantilla no les impone tipografía ni añade «textura desgastada» a los negativos. Las descripciones son nuestras y sin nombres de artistas. | REF 02, regla 6 | Con la 18.21, antes del curso 2 |
| 18.22 | **Qué conservar de cada referencia.** Cada referencia que viaja a una operación lleva un *para qué*: identidad, vestuario, pose, producto, lugar o estilo. Tiene valor por defecto según la clase y el rol: personaje frontal o perfil → identidad; producto → producto; escenario → lugar. En las del encargo lo elige el director al añadirlas. La plantilla añade una línea por referencia, por ejemplo «Imagen 1 (Juan, Capitán): referencia de identidad; conserva cara, pelo, tono de piel y complexión; no copies la pose ni el fondo». La vista previa la muestra. Se combina con la 18.20 (persona real). | AVB 06, reglas 6–7 | **APROBADA el 08-10-2026: F9** |
| 18.23 | **Varias tomas del mismo prompt.** En Producir, «Cuántas tomas» (de 1 a 4) con la misma dirección. El precio por n se ve antes de autorizar y todas caen en Tomas para elegir la mejor. Es distinto de «Explorar encuadres», que cambia encuadre y ángulo. | AVB 06, regla 5 | **APROBADA el 08-10-2026: F9** |
| 18.24 | **Nombrar lo que salió.** Sobre una toma, con el asistente real: «¿Qué ha puesto que no pedí?». Devuelve los elementos y adornos con su nombre (por ejemplo «pinceladas secas detrás del titular», «iconos de calendario») y cada uno se añade con un clic a los negativos del plano o a *Qué evitar* del proyecto. Así los tópicos de cada tipo de pieza se descubren con una toma testigo barata y se quitan por su nombre. Amplía la 18.3. | REF 02, reglas 2, 3 y 5 | Sin aprobar |
| 18.25 | **Explorar estilos.** Igual que Explorar encuadres, pero lo que cambia es la línea de estilo: la misma dirección con 2 a 4 estilos del catálogo (18.21), cada uno en una operación limpia y con su precio. Elegir una toma fija ese estilo en el plano. | REF 02, reglas 6–7 | Sin aprobar; va con la 18.21 |
| 18.26 | **Texto exacto en piezas gráficas.** Hoy es ley que nunca se pide texto al modelo y los rótulos van en DaVinci. Propuesta: en un encargo de imagen, y solo si el director lo activa por imagen, un campo *Texto exacto* (cada texto entre comillas) que la plantilla envía con la coletilla «y ningún otro texto», en lugar de «Sin texto ni rótulos». Los planos de vídeo mantienen la ley. La toma se revisa letra a letra antes de elegirla. | REF 02, reglas 4 y 8 | **APROBADA el 12-10-2026 (Juan: «en arte y diseño no se puede ser tan estricto»): F9** |
| 18.27 | **Extraer rasgos de la foto.** En la ficha de personaje, con una referencia frontal subida, «Proponer rasgos desde la foto» (asistente real con visión). Devuelve edad aparente, estructura facial (mandíbula, mentón, pómulos), ojos, labios, pelo (color, textura y peinado), tono de piel, señas particulares (pecas, lunares, gafas) y complexión. Todo como propuesta de rasgos fijos que el director acepta, edita o descarta uno a uno antes de validar. Nunca inventa lo que no se ve. | EVA 01, reglas 3, 4 y 8 | **APROBADA el 13-10-2026: F9** |
| 18.28 | **Explorar el personaje antes de validar.** En una ficha sin validar, «Explorar» genera de 2 a 4 retratos ancla desde la descripción (primer plano de frente, expresión neutra, fondo blanco, luz suave y pareja, sin vestuario), con precio delante. Con «Usar como referencia frontal» uno pasa a ser la referencia de la ficha. Luego se valida. Si es persona real, no aplica: la cara se conserva y no se genera. | EVA 01, reglas 1–2 | **APROBADA el 13-10-2026: F9** |
| 18.29 | **El Taller: generar en una pantalla (rediseño del 14-10-2026; sustituye al «encargo rápido»).** Cada espacio tiene un **Taller** que es la entrada por defecto. A la izquierda: - modelo; - referencias, que se mencionan con `@` y se traen de las fichas o de la biblioteca (18.6); - un prompt grande, con **«Mejorar»** (el asistente lo reescribe con las reglas aprendidas en los cursos, como 18.10 y 18.15–18.22, y enseña qué cambió) y con el **control de ingredientes** (18.30); - formato, calidad y cuántas; - precio delante y **Generar**. A la derecha, la cuadrícula de resultados ordenada en **carpetas** (por día, por proyecto o como quieras). Al pulsar una imagen se abre su ficha: prompt, referencias, ajustes, coste y fecha, más las acciones siguientes: - crear variaciones, cambiar el ángulo, ampliar, mejorar resolución y editar; - llevarla a vídeo o hacerla hablar; - **«Usar como referencia de una ficha»** y **«Llevar a un plano»**. Todo pasa por el mismo motor (precio, autorización, nunca envíos duplicados, registro). Dirigir un proyecto completo (Idea → Elementos → Guion → Lienzo → Montaje) sigue existiendo para piezas con varias escenas, personajes que deben mantenerse iguales y paquete para DaVinci, y bebe de lo que sale del Taller. | Juan, 14-10-2026: tras los «20 pasos» del corto de Tania, hizo en OpenArt (Nano Banana Pro, la misma) una tarea que pensaba hacer en Picasso: «aquí un prompt, ajustamos y bum, una carpetita para archivar y listo; le das un clic a la imagen, cero drama». Se roba la idea, no la piel | **APROBADA el 15-10-2026: es lo primero. Antes de tocar código, Juan ve y aprueba una maqueta (mock) del Taller y de la ficha de la imagen** **Primera versión construida el 15-10-2026 (§6.5):** carpetas, referencias, Mejorar con OpenAI, ingredientes, generar, Elegir, Descartar, nota, variaciones y «usar arriba». Prueba `p15_taller`. |
| 18.30 | **Control de ingredientes.** Antes de gastar, Picasso revisa lo que le das y lo dice claro, igual que avisa del precio. - **Imagen de referencia o foto de partida:** resolución, tamaño de la cara en píxeles, compresión y desenfoque. También si es una captura con interfaz o marcos, si tiene manos u objetos delante de la cara, y si su forma no es la del proyecto. - **Audio de muestra y voz:** duración, ruido, reverberación, saturación y si viene de un micro de solapa o de una llamada. Cada ingrediente sale en **verde, ámbar o rojo**, con el motivo y cómo arreglarlo, por ejemplo «la cara mide 250 px: con menos de 512 px el lipsync sale chicloso; usa un fotograma nítido de frente». Con un ingrediente en rojo, Producir lo avisa delante del precio («vas a gastar 2,21 $ con una foto de partida en rojo»). No bloquea: decide el director. | Juan, 14-10-2026, tras el corto de Tania: «es como querer hacer un plato espectacular con ingredientes de baja calidad; si la imagen inicial no es, Picasso TIENE que decirlo» | **Decidido por Juan (14-10-2026); falta diseñar los umbrales por tipo de modelo** |
| 18.31 | **Conflicto y tema en el Desarrollo.** Campos nuevos: *Conflicto* (quién quiere qué, qué lo impide y qué se pierde si falla; externo, interno o ideológico) y *Tema* (qué significa, no qué pasa). El *estilo visual* se elige en tres ejes: oscuro o claro, calmo o dinámico, crudo o limpio. Entran en el contexto del asistente y en el prompt. | IDALL 01, regla 1 | Sin aprobar |
| 18.32 | **Interpretación en el plano.** En los planos de vídeo y de personaje que habla: emoción, intención, un microgesto (mirada, parpadeo, mandíbula, respiración), una pausa y la mirada. Con eso se escribe la parte de interpretación del prompt («emoción + intención = movimiento; quietud, movimiento, quietud»). Se escribe en músculos (mandíbula, respiración, mirada) y en emociones en capas («amenaza contenida, diversión sutil»), nunca con una sola palabra emocional, que da una mueca de teatro. | IDALL 01, regla 2 y vídeos L9–L10; fracaso del corto de Tania | Sin aprobar |
| 18.33 | **Planos de una escena con la estructura de 9.** «Proponer planos» parte la escena en pulsos (planteamiento, acción, revelación, emoción, escalada, remate) y propone hasta 9 planos con su papel: establecimiento, movimiento, revelación, interacción, inserto, reacción, escalada, decisión y remate. El director acepta uno a uno. El lienzo avisa si hay tres planos del mismo tamaño seguidos. | IDALL 01, regla 4 | Sin aprobar |
| 18.34 | **Primero la emoción.** Campo «¿Qué debe sentir el público?» en el plano. Sugiere tamaño, ángulo y óptica en mm según la tabla de cámara (establecimiento 18–28 mm, acción 28–35, aislamiento 18–24, amenaza 40–50, inserto 65–85, emocional 50–65). Sugiere, no impone. | IDALL 01, regla 5 | Sin aprobar |
| 18.35 | **Composición como lista cerrada.** Las 10 técnicas (tercios, líneas guía, simetría, centro, marco dentro del marco, espacio negativo, profundidad en tres capas, equilibrio, diagonales y contraste), con su emoción, en `opciones_direccion.yaml`. Se suman al texto libre de composición del encargo. | IDALL 01, regla 6 | Sin aprobar |
| 18.36 | **Referencia de emociones.** Rol nuevo en la ficha: «emociones», una hoja de expresiones del personaje, distinta de la de identidad. En vídeo, el prompt dice «imagen 1 = identidad (huesos y rasgos), imagen 2 = emociones (arrugas, mirada, cejas)», para que la cara no se quede congelada. En el vídeo de varios planos, reglas de continuidad por defecto: sin reinicio visual, sin movimientos repetidos y el movimiento sigue a través de los cortes. | IDALL 01, regla 9 | **APROBADA el 22-10-2026: F9; prueba de control = repetir el corto de Tania** |
| 18.37 | **Seedance para escenas con diálogo.** Antes de seguir con la ruta B, comprobar en fal o KIE el vídeo con diálogo generado desde referencias (Seedance), con su precio verificado, dentro de la prueba de control de la 19.28. | IDALL 01, regla 9; 19.28 | **APROBADA el 22-10-2026: F9; prueba de control = repetir el corto de Tania** |
| 18.38 | **Escena con diálogo como bloque (fórmula base × restricciones).** Un plano de vídeo con diálogo lleva su base (lugar, referencias, estilo, personajes y tiempos) y unas restricciones que Picasso escribe solo: - eje de 180° (quién está a la izquierda y quién a la derecha de pantalla, sin cruzar); - sin reinicio entre cortes; - voz fijada desde la ficha (registro en Hz y volumen en dB); - cámara motivada con grados («arco sutil de unos 10°, nada vistoso»); - silencio pedido en positivo (el ambiente concreto) y pausas. Se produce en bloques de 15 s y se montan los mejores cortes. | IDALL 01, vídeo L10 | **APROBADA el 22-10-2026: F9; prueba de control = repetir el corto de Tania** |
| 18.39 | **Escena con objetivo, obstáculo y cambios.** La escena del guion gana objetivo, obstáculo, cambio emocional y cambio de conducta. El asistente avisa cuando una escena solo funciona por el diálogo y propone subtexto (lo que se dice frente a lo que se quiere decir). | IDALL 01, vídeo L2 | Sin aprobar |
| 18.40 | **Moodboard del proyecto.** En «Mundo y escenarios»: secciones (mundo, personajes, vestuario, luz, sensación de cámara, objetos, emoción y paleta) con 3–5 referencias cada una, y la paleta de 3–5 colores sacada de la imagen clave. Hay uno maestro y otros por escena. Sus decisiones entran en los prompts. Si falta una referencia, el Taller la genera como provisional. | IDALL 01, vídeo L3–4 | Sin aprobar |
| 18.41 | **Hoja principal de una sola cara + refuerzos aparte (corrige la 19.6).** La hoja principal lleva la cara de frente y grande a la izquierda y el cuerpo de frente y de espaldas del cuello hacia abajo, sobre gris claro, con la ropa de siempre. Una hoja con muchas caras hace que la IA las promedie y la cara deriva. Las hojas de refuerzo son aparte: ángulos (tres cuartos, perfil y nuca hacia el mismo lado), actuación (expresiones y posturas, que es la «referencia de emociones» de la 18.36), objeto (cinco vistas) y compañero (con su medida y una hoja de dúo). Se comprueba en orden (forma, ojos, cejas, nariz y boca, pelo, marcas en su lado, edad) y se corrige sin repetir. Las marcas van con su lado en MAYÚSCULAS. | VDLT 01, reglas 2, 5 y 6 | Sin aprobar |
| 18.42 | **Hojas por plano, automáticas.** Picasso elige qué hojas viajan con cada plano: la principal siempre y la primera; la de ángulos si el plano gira o se ve de perfil o de espaldas; la de actuación si hay emoción fuerte; la imagen de arranque, la última. El prompt dice qué es cada imagen por su número. Cada imagen de más es una cara de más. | VDLT 01, regla 13 | Sin aprobar |
| 18.43 | **Ruta B en Picasso: personaje que habla con su voz y en movimiento.** Seedance (vídeo desde referencias) con la imagen de arranque, la hoja principal y la toma de voz elegida del diálogo. Picasso pone la duración del clip (voz + 1 s), el formato de audio que no se salta palabras y los cinco candados: palabra por palabra con la frase escrita, una sola vez, solo ese idioma, solo ese audio, y boca cerrada al acabar. Sustituye a la ruta D (foto + audio) para cualquier plano con acción. | VDLT 01, regla 18 B; fracaso de Tania | Sin aprobar |
| 18.44 | **Ficha de voz en el elemento.** Edad, acento exacto, energía, tres adjetivos, ritmo, cómo NO puede sonar y una frase propia del personaje. Sirve para describir la voz en la ruta A, para elegir o diseñar la voz (prueba de tres con los ojos cerrados) y como «voz fijada» de la 18.38. | VDLT 01, reglas 15–16 | Sin aprobar |
| 18.45 | **Ruta A con minutaje automático.** Cuando la voz la pone el modelo de vídeo, Picasso escribe el bloque de voz desde la ficha de voz y el minutaje: 0–1 s en silencio con la boca cerrada; la frase una sola vez, a unas 2,5 palabras por segundo; y boca cerrada hasta el final. La frase aparece una sola vez en todo el prompt. | VDLT 01, regla 18 A | Sin aprobar |
| 18.46 | **Conversaciones de dos o más.** Miradas automáticas según el lado de cada personaje («EYELINES… nadie mira a cámara»), objetos con «quién lo tiene después» (un pase por clip), planos dentro del clip («SHOT 1 (0–5 s)… CUT…», repitiendo las miradas en cada plano) y el que escucha con la boca cerrada. Lo largo, por tramos de 20 s o menos cortados en silencios, con la misma imagen de arranque, y se unen dejando 0,5 s. Diálogo medido a dos palabras por segundo y frases de 8 palabras como mucho. Completa la 18.38. | VDLT 01, reglas 19–21 | Sin aprobar |
| 18.47 | **Look de cámara y acción, no pose.** Campo «Look de cámara» en la dirección (móvil frontal, selfie con flash, vlog en mano, cámara de fotos, 35 mm, desechable, Polaroid, VHS, editorial…), que se elige por pieza y nunca toca la cara. La vista previa avisa si el plano describe una pose sin acción y propone el instante intermedio («la tapa a medio levantar»). | VDLT 01, reglas 10–11 | Sin aprobar |
| 18.48 | **Auditoría única antes de gastar, con severidad.** Junta la 18.15 (seis partes), la 18.30 (ingredientes) y la 19.17 (choques) en una revisión con tres niveles. *Bloqueante*: lo que el modelo no admite según nuestro catálogo (duración, formato, número de referencias, negativos, audio). *Importante*: instrucciones que chocan, palabras vacías, luz sin dirección. *Mejorable*: coherencia entre tono, luz y óptica. Se ve junto al precio, y lo bloqueante impide autorizar. Es también el último paso de «Mejorar». | REF 03 (Lyra), auditor | Sin aprobar |
| 18.49 | **Analizar una referencia.** Sobre una imagen (de la biblioteca, del moodboard o de otra toma), el asistente con visión devuelve una base estructurada: composición, luz (dirección, proporción de relleno, temperatura), paleta en hex aproximado, óptica y profundidad deducidas, estilo, y un apartado «no visible o ambiguo» para no inventar. Se aplica con un clic a la dirección del plano o al moodboard (18.40). | REF 03 (Lyra), analizador | Sin aprobar |
| 18.50 | **Sonido en cuatro capas en el vídeo.** El prompt de vídeo describe por separado el diálogo (o la voz de referencia, 18.43), los efectos con su segundo, el ambiente (siempre en positivo) y la música, o su ausencia explícita. Sale de «Sonido previsto» de la escena y de la dirección del plano. | REF 03 (Lyra), audio por capas; 18.38 | Sin aprobar |
| 18.51 | **Negativos por tipo de pieza y texto en imagen por modelo.** Biblioteca curada por nosotros (personas, producto, comida, arquitectura, texto en imagen, vídeo con diálogo…), sin palabras vacías. El catálogo dice si cada modelo los recibe como parámetro o como «Evita…» dentro del texto. La 18.26 (texto exacto) usa la sintaxis del modelo: texto literal entre comillas, tipografía, tamaño, color y posición. | REF 03 (Lyra); 18.10; 18.26 | Sin aprobar |


---

## 19. Mejoras de uso detectadas al operar (sin aprobar)

Lo que Juan encuentra usando Picasso de verdad. Se arreglan en bloque o con la fase que toque.

| # | Dónde | Qué pasó | Arreglo propuesto |
| --- | --- | --- | --- |
| 19.1 | Crear espacio (07-10-2026, espacio «JRGB») | Al crear el espacio con su imagen tardó un rato sin ninguna señal. Son tres pasos seguidos: crear el espacio, subir la imagen y guardarla en él. Juan no sabía si debía esperar. | El botón pasa a «Creando el espacio…» y luego a «Subiendo la imagen…», desactivado mientras dura. Si la subida falla, el espacio queda creado y se avisa de que la imagen no entró, con «Reintentar». Mismo patrón en todas las altas con subida de archivos (proyecto, fichas, biblioteca). |
| 19.2 | Espacio → proyectos (07-10-2026) | Juan creó «Navegante» como corto en vez de imagen. El tipo no se puede cambiar y la interfaz no permitía borrar el proyecto (la API sí podía). | **Hecho (07-10-2026):** papelera en cada tarjeta de proyecto, con confirmación que dice qué se borra (idea, guion, planos y lienzo) y qué se conserva (biblioteca y registro de gastos). Pendiente de valorar: permitir cambiar el tipo mientras el proyecto siga en el paso Idea. |
| 19.3 | Idea / Desarrollo (07-10-2026) | Las notas, que es por donde se empieza («lo que tengo en la cabeza»), salían en tercer lugar, después de Intención y Tono. | **Hecho (07-10-2026):** en todos los tipos, el primer campo es «Tu idea, tal cual» (las notas), con una ayuda que explica que luego se reparte en los campos de abajo o con «Ordenar mis notas». La intención sigue siendo obligatoria. |
| 19.4 | Crear proyecto + Idea (07-10-2026) | Al crear el proyecto se pedían formato y fps antes de saber dónde se publica, y a una imagen se le pedían fps. Las preguntas del brief se repetían y estaban en un orden que no seguía el trabajo real. | **Hecho (07-10-2026):** el brief rediseñado del §6.1. Crear pide solo nombre y tipo. En Idea van el encargo (destino → formato propuesto, concretando, público, duración), luego tu idea y lo que debe provocar (intención, tono, qué evitar). Las preguntas repetidas desaparecen y sus respuestas se recuperan solas. El formato no se cambia si hay tomas (409). `que_evitar` se suma a los negativos del prompt. La imagen no muestra fps. Batería en verde. |
| 19.5 | Ficha de elemento (07-10-2026) | «Aprobar versión» sin haber generado nada confundió a Juan: ¿qué apruebo? Se aprueba la definición (así es el elemento), no una imagen generada. | **Hecho (07-10-2026):** el botón dice **«Validar vN»** (nombre elegido por Juan) y el aviso explica que fija descripción, rasgos y referencias, que no hace falta generar nada, que queda congelada para la producción y que un cambio posterior crea otra versión. |
| 19.6 | Hoja de personaje (07-10-2026) | Juan preguntó si «Crear hoja de personaje» es la *bible sheet*. La parte escrita de la biblia es la ficha. La hoja genera «varias vistas» sin decir cuáles. | **Pendiente (F9, cuando genere de verdad):** vistas con nombre (frente, tres cuartos, perfil, espalda), con expresiones (seria, sonriendo, otra a elegir) y vestuarios opcionales (de los rasgos variables) como filas separadas. Cada toma queda etiquetada con su vista para usarla después como referencia del ángulo correcto. **Ampliada el 13-10-2026 (EVA 01):** la hoja sigue un orden. Primero el retrato ancla limpio (si no existe ya), después el perfil en primer plano y luego el cuerpo en una sola imagen de 4 paneles a la misma escala (frente, perfil, espalda y tres cuartos), de pies a cabeza y con ropa neutra y ajustada. Las expresiones van al final. Cada paso lleva el bloqueo de cara (18.20 y 18.22) y usa como referencia las vistas ya elegidas. |
| 19.7 | Encargo de imagen (07-10-2026) | *Intención* se vuelve a pedir, y con una ayuda equivocada («Para qué se usará la imagen»): repite la intención y el destino que ya están en el brief. | **Hecho (07-10-2026)** con el rediseño del encargo (§6.4). |
| 19.8 | Encargo de imagen (07-10-2026) | *Composición* (encuadre, punto de vista, luz) en texto libre se solapa con la dirección del plano del lienzo, que ya tiene encuadre, ángulo, luz… (y la fuente de luz que viene en la F9). Dirigir dos veces lo mismo confunde. | **Decidido y hecho (07-10-2026):** la composición del encargo es el punto de partida de la dirección de cada plano (campo `composicion`, editable en el plano y presente en el prompt) (§6.4). |
| 19.9 | Encargo de imagen (07-10-2026) | El asistente habla de «escenas» y «guion» («Proponer escenas», «0 escenas en el guion») en un proyecto de imagen: el encargo usa por dentro la pantalla de guion y se le ve la costura. | **Hecho (07-10-2026)** con el rediseño del encargo (§6.4). |
| 19.10 | Encargo de imagen → referencias (07-10-2026) | Las referencias muestran toda la biblioteca del espacio, incluido el logo de la identidad del espacio, junto a la foto de Juan. No queda claro cuáles van a la operación. | **Hecho (07-10-2026)** con el rediseño del encargo (§6.4). |
| 19.11 | Lienzo de imagen (07-10-2026) | El encargo de imagen nunca se conectó con los planos: Juan llegó a un lienzo con «0 escenas · 0 planos» y sin forma de crear ninguno. Ni las pruebas ni el maestro lo cubrían. | **Hecho (07-10-2026):** §6.4. Hay un plano de imagen por cada imagen pedida (I1, I2…, grupo «Imágenes del encargo»), con qué se muestra, elementos (todo el reparto si no se eligen), composición y referencias del encargo, y se sincroniza al cambiar el número o la revisión. Prueba nueva `p14_imagen` de punta a punta. |
| 19.12 | Lienzo de imagen (07-10-2026) | La caja «Imágenes del encargo» se monta encima de I1 y tapa su cabecera y su miniatura. A Juan le gusta como puerta de vuelta al encargo, pero se queda torpe en la pantalla. | **Hecho (07-10-2026):** el solape lo dejaba el arrastre a mano; la disposición automática ya no solapa. Ahora, al arrastrar el grupo del encargo o una escena, sus planos se mueven con él y se guardan juntos. |
| 19.13 | Lienzo → plano (07-10-2026) | «Dirigir» y «Producir» aparecen juntos y sin orden: Juan no sabe qué es cada uno ni cuál va primero. | **Hecho (07-10-2026):** botones «1 Dirigir» y «2 Producir». Mientras el plano está sin dirigir, Producir se ve apagado y debajo aparece la ayuda «Primero dirige… Después produce…». Producir avisa si el plano va sin dirigir, pero no lo bloquea. La composición cuenta como dirección (§3.2). |
| 19.14 | Lienzo → tarjeta y ficha de elemento (07-10-2026) | La tarjeta I1 dice «sin dirigir» dos veces. En la ficha de elemento, cada referencia sale a tamaño completo y con varias referencias la ficha se hace interminable. | **Hecho (07-10-2026):** la tarjeta muestra un solo estado; el resumen de dirección solo aparece si lo hay. Las referencias de la ficha van en miniaturas de 80 px que se amplían al pulsarlas. |
| 19.15 | Lienzo → ficha abierta (07-10-2026) | Con el ratón encima de la ficha, la rueda hace zoom al lienzo en vez de desplazar la ficha. Juan tuvo que pulsar en la tarjeta para que dejara de moverse. | **Hecho (07-10-2026):** la causa era que la ficha se salía por abajo de la pantalla. Ahora se ajusta al alto disponible, el scroll no se escapa al lienzo (`nowheel` y `overscroll-contain`) y la ficha de plano mide 460 px. |
| 19.16 | Ficha de plano en un proyecto de imagen (07-10-2026) | Se ven las costuras del vídeo: Duración (s), Movimiento de cámara, la pestaña Voces, «Encadenado con el plano anterior… de la escena», «Subconjunto de los de la escena» y una referencia interna («§8») a la vista del usuario. | **Hecho (07-10-2026):** en un encargo de imagen se ocultan modalidad, duración, la pestaña Voces y el encadenado; Movimiento de cámara se oculta en cualquier plano de imagen. Los textos hablan de «quién sale en la imagen». Se han quitado todas las referencias «§» visibles en la interfaz. |
| 19.17 | Dirección del plano (07-10-2026) | Composición del encargo: «Plano medio en tres cuartos». Juan elige además Encuadre «Gran plano general». El prompt lleva dos órdenes que se contradicen, justo el fallo que el AVB señala como causa de resultados malos. El selector corta el texto («Gran plano ge…»). | **Hecho (07-10-2026):** si la composición menciona otro encuadre, ángulo u óptica distinto del elegido, aparece un aviso con dos botones: «manda el campo» reescribe la composición y «manda la composición» cambia el campo. Los selectores de dirección son compactos y se leen enteros. |
| 19.18 | Lienzo → Producir (07-10-2026) | Juan pulsó Producir dos veces porque nada indicaba que estuviera trabajando, y salieron dos tomas. Además, el botón Producir quedaba a mitad del panel, antes de Explorar encuadres, cuando es el cierre. | **Hecho (07-10-2026):** mientras haya una operación del plano autorizada, enviada o en curso, el botón dice «Produciendo…» con un indicador, queda bloqueado y explica que no hace falta volver a pulsar; el panel se refresca cada 1,5 s. Nuevo orden: qué se produce → modelo → explorar encuadres → coste → **Producir** (cierre) → historial de operaciones. |
| 19.19 | Idea → destino (14-10-2026) | No hay destino para comunidades y grupos (Skool, Discord, WhatsApp): Juan tuvo que elegir «Otro». | **Pendiente:** destino «Comunidad o grupo» (16:9 por defecto), editable en la lista de destinos. |
| 19.20 | Ficha → referencias (14-10-2026) | Las referencias casi siempre vienen de capturas (con interfaz, marcos y manos delante) y Picasso no deja recortarlas al subirlas: Juan tuvo que recortar en Vista Previa. | **Pendiente:** recortar al subir o desde la miniatura, y guardar el recorte como medio nuevo sin tocar el original. |
| 19.21 | Plano de vídeo → vista previa (14-10-2026) | Al producir la foto de partida de un plano de vídeo, la vista previa enseña la plantilla de vídeo («Inicio — encuadre…»), pero se envía la de imagen. Lo que se ve no es lo que se manda. | **Pendiente:** la vista previa sigue a «Qué se produce» y muestra exactamente el prompt de esa acción, el mismo que se ve antes de autorizar. |
| 19.22 | Plano → Voces (14-10-2026) | Al pulsar «Producir voz», el panel se cierra y desaparece. La voz sí se produjo, pero Juan no sabe qué ha pasado. En Producir, en cambio, el botón se pone en gris con un indicador, y eso se entiende mejor. | **Pendiente:** el panel se queda abierto en Voces y el botón muestra «Produciendo…» con su indicador, como en la 19.18, hasta que aparece la toma con su reproductor. |
| 19.23 | Producir → personaje hablando (14-10-2026) | Mientras OmniHuman trabaja (unos 3 min), el botón gris sigue diciendo «Preparar y ver el precio». Juan no sabía si se había colgado. | **Pendiente:** «Produciendo… 1:42» con un reloj que avanza y el tiempo típico del modelo («suele tardar 2–4 min»). |
| 19.24 | Personaje hablando → formato (14-10-2026) | OmniHuman devuelve el vídeo con la forma de la foto de partida. La foto real de Tania era cuadrada, así que salió a 960×960 en un proyecto 16:9. | **Pendiente:** al elegir la foto de partida, aviso si su forma no es la del proyecto. Con persona real: ampliar los lados (outpaint) conservando la persona tal cual, nunca regenerarla. |
| 19.25 | Coste y calidad del personaje hablando (14-10-2026) | Veredicto de Juan sobre el primer OmniHuman real: «muy caro para el resultado; la boca pegajosa, se desfasa la articulación; yo no postearía esa vaina en ninguna parte». Fueron 2,21 $ por 14 s. | **Pendiente (prioridad):** antes de volver a gastar, comparar los modelos de personaje que habla y de lipsync de fal y KIE, con precios y límites verificados, usando la misma foto y la misma voz de prueba. Decide Juan viendo los resultados y las cifras. Mientras tanto, OmniHuman no es el modelo por defecto. |
| 19.26 | Personaje hablando → el prompt (14-10-2026) | Lectura de Juan: «los modelos son los mismos; lo que hace falta es el generador de prompts que le pida al modelo qué hacer; lo que me mató fue lo que salió después de 20 pasos». Comprobado: a OmniHuman se le envió **sin prompt**. Picasso le prohíbe `prompt` a «personaje hablando», aunque el modelo lo acepta para guiar la interpretación. | **Construido el 14-10-2026 por la noche:** «personaje hablando» lleva prompt, construido a partir de la dirección del plano y del brief: expresión y emoción (tono e intención), gestos y manos, mirada, articulación clara y labios sincronizados con la voz, sin movimientos exagerados, y lo que hay que evitar. Se ve y se edita en la operación preparada antes de autorizar. Además entra un segundo modelo para comparar: **Kling AI Avatar v2 Pro (fal)**, a 0,115 $/s (verificado en fal.ai el 14-10-2026), que admite `prompt`. El valor de Picasso está en **cómo se le pide al modelo**, no en el modelo. |
| 19.27 | Seguimiento de fal (14-10-2026) | Kling AI Avatar tardó unos 7 minutos, y Picasso dejó la operación «incierta» a los 5 (su límite de seguimiento). No se reenvió nada y con «Comprobar» se recuperó, pero asusta. | **Hecho (14-10-2026):** el seguimiento de fal pasa a 15 minutos. Pendiente, con la 19.23: un tiempo típico por modelo, y que el aviso de «incierta» diga que el trabajo sigue en el proveedor. |
| 19.28 | Veredicto del personaje hablando (14-10-2026) | Kling AI Avatar v2 Pro con prompt (1,59 $): Juan: «muy pobres resultados… boca chiclosa, dientes gigantes, desfase de labios: es de generaciones atrás; si esto es lo que podemos sacar, yo no saco nada». | **Siguiente paso, antes de gastar más:** separar las tres causas. (1) Entradas: la cara venía de una captura de vídeo de baja resolución y la voz de un clon de 26 s de una clase. (2) Método: animar una foto fija con audio encima frente a modelos que generan vídeo y habla a la vez. (3) Modelo. Prueba de control: Juan elige un resultado de Higgsfield que le parezca bueno, con su modelo y sus ajustes, y se reproduce tal cual en Picasso con una foto y una voz de calidad. El resultado decide. |
| 19.29 | Taller (15-10-2026) | Primera reacción de Juan al Taller construido: «no lo entiendo». | **Pendiente:** recorrerlo juntos, apuntar dónde se pierde y corregir antes de seguir con lo marcado como «próximamente». |


## 20. Plan de calentamiento: ejercicios de todas las capacidades (aprobado el 23-10-2026)

*Juan: «vamos a poner FINO a Picasso, que ya es hora». En vez de repetir a Tania, una batería de ejercicios, uno por tipo de pieza. Cada ejercicio decide qué se construye justo antes (solo lo que pide), lo opera Juan y se cierra con su veredicto y sus fricciones en el §19. El método sale de la formación: AVB, beailabs, EVA, IDALL, VDLT y Lyra.*

**Tope de gasto de toda la batería: 20 $.** Siempre en borrador o a 480p primero, y la calidad final solo para la toma buena. El reparto orientativo y el gasto real de cada ejercicio quedan en el registro.

| # | Ejercicio | Qué pone a prueba | Se construye antes | Tope |
|---|---|---|---|---|
| E1 | **Foto de marca para JRGB** | Taller, Mejorar, referencias, negativos, texto en imagen | Taller guiado según la maqueta 5, cuando Juan la apruebe | 1 $ |
| E2 | **Avatar de JRGB, de cero** (inventado; será un activo de trabajo) | Ficha con defecto y detalle que se reconoce, explorar la cara, hoja principal de una sola cara, refuerzos y ficha de voz con su voz | 18.41 (hoja) · 18.44 (ficha de voz) · 18.28 (explorar) | 3 $ |
| E3 | **UGC: el avatar habla a cámara, 8–10 s** | Ruta B con Seedance, su voz de ElevenLabs, los cinco candados y el clip de voz + 1 s | 18.42 (hojas por plano) · 18.43 (ruta B) | 3 $ |
| E4 | **Escena con diálogo: dos personajes, 10–15 s** | Eje de 180° y miradas, interpretación por músculos, cámara motivada, sonido en capas | 18.38 · 18.46 · 18.32 · 18.50 | 5 $ |
| E5 | **Microcorto: 3–4 planos con historia** | Logline y conflicto, planos por emoción, storyboard, montaje y paquete para DaVinci | 18.31 · 18.33 · 18.34 (lo mínimo) | 8 $ |

Orden: E1 → E5. Un ejercicio no empieza hasta que el anterior se cierra con el veredicto de Juan.
