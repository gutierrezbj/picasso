# PIC-05 · Director de Studio: hoja de personaje

**Estado:** revisión 3, diseño. Revisión 1: `0467afb`. Revisión 2: `848f754`. **Ni el SDD ni la maqueta están aprobados.**

**Revisión 3 (21-11-2026), tras el recorrido de Juan por la revisión 2.** Lo que encontró: demasiada contabilidad en pantalla y varios momentos en los que no sabía cómo seguir. Cambios:
1. Costes discretos, con «Detalle de costes» y los controles de PIC-02 y PIC-04 intactos (§4.10).
2. Comparativa entre hoja compuesta y vistas sueltas, con recomendación pendiente de decidir (§4.11, D13).
3. Una siguiente acción evidente en cada situación (§4.12).
4. «Referencia principal» en la interfaz; aprobación para el borrador separada de la publicación de la ficha (§4.2, §4.5).
5. Campos del personaje con ejemplos, sin preguntas repetidas y con su nombre (§4.2a).
6. Instrucciones que respetan lo marcado para conservar, con la comprobación del pescador (§4.3).
7. Ayudas visuales escritas como indicaciones, no como verdades (§4.4).
8. Distribución por anchos e inspector compacto (§4.13).

**Lo que el recorrido de Juan demostró y lo que no.**
- *Visto:* referencia principal aprobada, dos vistas completadas, una fallida y el reintento solo de la que faltaba. El total simulado pasó de 0,45 a 0,60 $, sin reserva pendiente.
- *Sin comprobar:* la recuperación al cerrar y volver a abrir, la publicación de la ficha y la continuidad con imágenes reales. Ninguno de los tres se da por validado.

**Revisión 2:** Correcciones del revisor del 21-11-2026, hechas sin que hubiera revisado aún el SDD ni la maqueta:
- La receta por reglas es una primera ayuda guiada, no el agente. Se dice qué acompaña y qué queda pendiente del agente especializado (§4.6).
- La dirección visual básica de la hoja se guarda: fondo, luz, encuadre y acabado (§4.4).
- «Bloqueo de identidad» pasa a ser «rasgos y referencias que se deben conservar». La continuidad se comprueba en los resultados, no se garantiza con una instrucción (§4.2, §4.3).
- «Una cara por imagen» pasa a ser «una vista por imagen». Vista y expresión se identifican por separado (§4.3, §5).
- Lote y presupuesto: cómo se reserva lo autorizado, qué pasa con un lote a medias y qué pasa si se recarga (§4.9).
- Modelo: el más económico que admita las referencias y la edición necesarias, con su calidad validada para este trabajo (D12).

Sin luz verde al código: falta la revisión del SDD y el recorrido visual de la maqueta.

**Diseño:** Autorizados el SDD y la maqueta navegable (21-11-2026). **No** están autorizados el código funcional, las generaciones de pago, la fusión ni el despliegue. La instalación de Juan no se toca. La maqueta enseña el recorrido; no valida la continuidad del personaje, que solo se demuestra con imágenes reales.

**Origen:** 18.66 (propuesta del 21-11-2026), primer incremento: la receta «Hoja de personaje». Encaja en el lateral único de PIC-01 (D12–D14) y en la regla «en preproducción, lo más barato» del §9.7.

**Identificador:** PIC-05. Libre en `main` (`ddf8637`), en todas las ramas locales y remotas, y en `docs/`. No duplica la 18.53 (modo personaje): la absorbe como método de preguntas (§4.2, D2).

**Maqueta:** `docs/maquetas/pic-05/hoja-de-personaje.html`, autocontenida, con datos simulados. Enlace publicado en `docs/maquetas/pic-05/README.md`.

| Paso | Dónde está | Estado |
|---|---|---|
| SDD-01 Problema | §1 | Escrito |
| SDD-02 Alcance y límites | §2 | Escrito |
| SDD-03 Arquitectura | §3 (qué existe), §4 (diseño), §5 (cambios mínimos) | Escrito |
| SDD-04 Decisiones (ADR) | §9, D1–D12, cada una con recomendación | **Abiertas: las decide Juan** |
| SDD-05 Backlog con criterios | §6 | Escrito |
| SDD-06 Reglas de desarrollo | §7 | Escrito |
| SDD-07 Plan de pruebas | §8 | Escrito |
| SDD-08 Despliegue | §10 | Escrito; **pendiente de autorizar** |

**Pasos pendientes, en orden:** 1) Juan recorre la maqueta y decide D1–D12. 2) Revisión del SDD con sus decisiones. 3) Autorización del código en rama propia e instancia aislada, con el proveedor `simulado`. 4) Validación real con presupuesto aparte, autorizado viendo la cifra. 5) Fusión y despliegue, cada uno con su autorización.

---

## SDD-01 · Problema

Juan quiere preparar un personaje y sus vistas con coherencia sin redactar prompts técnicos y sin repetir lo que ya decidió. Hoy:
- La ficha de personaje existe, pero la hoja (`Crear hoja de personaje`) es un botón del paso de elementos dentro de un proyecto. Genera cuatro vistas fijas con un texto genérico y no usa las líneas de qué conservar de cada referencia (18.22) ni la cláusula de persona real (18.20).
- En el Taller, cada imagen se pide desde cero: el texto y las referencias se vuelven a escribir y elegir cada vez.
- El Director de Studio del lateral es un texto fijo: «todavía no está disponible».
- «Pasar a la ficha» marca la toma como favorita y la vincula siempre con el rol «otra»: favorita y referencia aprobada se confunden, y la ficha no sabe qué vista es cada imagen.

**Resultado esperado:** desde la Mesa, Juan abre el Director, elige «Hoja de personaje», parte de una referencia o de una descripción, deja dicho qué se conserva y qué puede variar, elige las vistas que necesita y ve, antes de pagar, qué texto y qué imágenes viajan en cada generación y cuánto cuesta. Después compara, aprueba y vincula las imágenes a la ficha. Al volver, todo sigue donde lo dejó.

## SDD-02 · Alcance y límites

**Dentro:**
1. El Director en el lateral único, con una lista de recetas en la que hoy solo hay una: «Hoja de personaje». Es una **receta guiada por reglas**, no el agente especializado (§4.6).
2. Partir de referencias existentes (ficha aprobada o imágenes de la biblioteca) o de una descripción nueva.
3. Identidad, apariencia y vestuario, separando lo que se conserva de lo que puede variar. Resumen «Rasgos y referencias que se deben conservar», redactado por reglas con el método de la 18.53.
3b. Dirección visual básica de la hoja, guardada: fondo, luz, encuadre por tipo de vista y acabado (§4.4).
4. Preguntas solo por lo que falta, y vistas propuestas según el uso: retrato, cuerpo completo, perfil, tres cuartos y expresiones. Ninguna es obligatoria salvo la referencia principal.
5. Dirección de las vistas de referencia: encuadre, ángulo, objetivo, luz y fondo, con una línea de por qué y controles editables.
6. Vista previa por generación: texto enviado, imágenes que viajan con su número y su para qué, precio de cada una y total.
7. «Preparar»: deja todo listo y guardado. No genera ni gasta.
8. Generar (con el motor actual, autorizado viendo la cifra), comparar, aprobar y vincular a la ficha con su vista. Historial por resultado.
9. Volver a abrir y recuperar decisiones y trabajo pendiente.

**Fuera:** vídeo; escenas completas; cámara 3D (18.55); extracción automática desde Pinterest u otros enlaces; análisis general de estilos y análisis de estilo desde referencias (18.21, 18.49, 18.58); proveedores nuevos (§9.7 KIE y Google); ficha de dirección visual del proyecto (18.66, segunda receta), aunque la dirección básica de esta hoja sí se guarda; el agente especializado que interpreta la necesidad (§4.6); «Proponer rasgos desde la foto» con visión (18.27, de pago: se presupuesta aparte); hoja compuesta en un solo lienzo (18.41, ver D3); refuerzo de objeto y de compañero; ficha de voz. Quedan vinculadas en el backlog y conservan su estado.

**Límites que no se negocian:**
- Nada se genera ni se gasta al abrir, preguntar, elegir vistas o pulsar «Preparar».
- Toda llamada de pago, también una asistencia de texto o de visión, muestra su coste y se autoriza por separado.
- No se promete identidad exacta. La interfaz dice: «El modelo puede cambiar la cara: compárala con la referencia principal antes de aprobar».
- La continuidad del personaje no se da por validada con la maqueta.

## SDD-03 · Arquitectura técnica

### 3. Qué existe y qué falta (comprobado en `main`, `ddf8637`)

| Pieza | Existe | Dónde | Falta para PIC-05 |
|---|---|---|---|
| Elemento y ficha versionada (rasgos fijos y variables, referencias con rol, persona real, estado borrador/aprobada) | Sí | `backend/app/dominio/modelos.py` (`Elemento` 237, `FichaVersion` 270, `RolReferencia` 56); `api/elementos.py`; `FichaElemento.tsx` | Roles `tres_cuartos` y `cuerpo_entero` (hoy: frontal, perfil, espalda, detalle, entorno, otra). Campo `expresion` aparte del rol. Marca de ancla. Dirección de la hoja guardada |
| Nueva versión de ficha (copia la anterior; 409 si ya hay borrador) y aprobar (exige descripción y una referencia) | Sí | `api/elementos.py:113`, `:166` | Nada |
| Hoja de personaje del paso de elementos | Parcial | `api/motor.py:332` (`VISTAS_POR_CLASE`: frente, perfil, tres cuartos, cuerpo entero), `:506` (`preparar-referencias`); `motor/PanelReferencias.tsx` | Exige `proyecto_id`; texto genérico; no usa `_referencias` (18.22) ni la cláusula de persona real; siempre 1:1; sin expresiones; sin pruebas. **No se reutiliza su texto; sí su destino `ficha`** (D1) |
| Pasar una toma a la ficha | Sí | `api/motor.py:537` | Envía siempre rol «otra» (`PanelReferencias.tsx:252`) y marca `valoracion=buena`. Hay que separar favorita y aprobada (§4.5) y aceptar tomas de carpeta |
| Qué conservar de cada referencia (18.22) y persona real (18.20) | Sí | `dominio/prompt.py:30` (`USO_REFERENCIA` por clase), `:46` (`_referencias`) | Uso por **rol** dentro de la clase personaje (ancla, perfil, expresión) |
| Taller y Mesa: carpetas, tomas, árbol de versiones, ★, descartar, nota, comparar, «Cómo se hizo» | Sí | `api/taller.py`; `componentes/mesa/*`; `lienzo/ComparadorTomas.tsx`; `PATCH /tomas/{id}` (`motor.py:955`) | Nada |
| Lateral único con pestaña «Director de Studio» | Esqueleto | `componentes/mesa/Lateral.tsx:145-155` | El contenido de la receta |
| Controles de Dirección del Taller (encuadre, ángulo, luz, óptica; 60 caracteres por valor) | Sí | `Taller.tsx:32-37`; `taller.py:35` (`DIRECCION_NUEVA`) | Fondo. Valores por defecto para vistas de referencia |
| Generar en el Taller con `id_peticion`, lote y presupuesto | Sí | `taller.py:294`; índice único `(espacio_id, id_peticion)` en `operaciones.py:329` | Un lote de vistas distintas (cada una con su texto) bajo una sola autorización |
| Costes por intento, tres capas, presupuesto, `PermissionError` | Sí | `motor/operaciones.py` (`coste_de` 125, `presupuesto` 206, `autorizar` 373) | El Taller no tiene presupuesto propio: cae en el global (`proyecto_id="taller:{espacio}"`). Se usa tal cual (D9) |
| Borrador recuperable de la Mesa (PIC-04) | Sí | `api/mejorar.py`, colección `borradores_mesa` | No se reutiliza para la receta: guarda un texto, no un recorrido (D6) |
| Propuestas del asistente aceptables una a una | Sí | `api/asistente.py`, colección `propuestas` | No hay marca «preparado por el Director» |
| Reabrir: `?carpeta=`, borrador y alcance | Sí | `Taller.tsx:121, 161, 262` | Pestaña del lateral y sesión de receta |

**Avisos de lo comprobado:**
- `taller.py:308` recorta en silencio las referencias que pasan del máximo del modelo. PIC-05 no lo hereda: la vista previa avisa y no deja preparar una vista con más imágenes de las que admite el modelo.
- El catálogo solo tiene `fal-nano-banana-pro` (0,15 $, verificado el 14-11-2026, 6 referencias) y los simulados. El precio no bloquea este diseño; la regla de preproducción barata (§9.7) se aplicará cuando haya otro modelo verificado.

### 4. Diseño

#### 4.1 Tres niveles de decisión, separados

| Nivel | Qué guarda | Dónde vive | Quién lo cambia | Alcance |
|---|---|---|---|---|
| **Ficha del personaje** | Identidad: descripción, rasgos fijos (cara, pelo, piel, complexión, señas con su LADO, «SIEMPRE lleva»), rasgos variables (vestuario, peinado de ocasión), vestuario base, persona real, resumen de rasgos y referencias que se deben conservar, referencias aprobadas con su vista y su expresión | `FichaVersion` (existente) | Juan, en el Director o en la ficha. Aprobada = inmutable; cambiarla crea vN+1 | Todo el espacio |
| **Dirección visual** | *De la hoja (en PIC-05):* fondo, luz, encuadre por tipo de vista y acabado, iguales en todas las vistas del personaje. *Del proyecto (fuera de PIC-05):* paleta, contraste, textura y composición reutilizables (segunda receta de la 18.66) | La de la hoja: en la sesión mientras se trabaja, y en `FichaVersion.direccion_hoja` al aprobar la versión, para que las vistas que se pidan después salgan iguales | Juan, en el paso de Dirección | Todas las vistas de ese personaje |
| **Ajustes de la toma** | Ángulo y objetivo de una vista concreta, y excepciones a la dirección de la hoja (por ejemplo, otra luz solo en esa vista) | La sesión de receta, por vista (`vistas[].direccion`, `vistas[].excepciones`) | Juan, por vista, sin tocar la hoja ni la ficha | Esa generación |

Regla: una excepción en una vista no sube a la hoja ni a la ficha. Para cambiar la ficha hay que decirlo («Guardar en la ficha»), y eso abre o usa el borrador vN+1.

#### 4.2 Recorrido

En la interfaz se dice **«referencia principal»**. En el código y en este documento la llamamos «ancla» (`ancla: true`). La primera vez que aparece en pantalla lleva una ayuda: «La imagen con la que se comparan las demás y que viaja como imagen 1».

1. **Abrir.** Botón «Director de Studio» de la Mesa → lista de recetas → «Hoja de personaje». El panel dice sobre qué trabaja («Ramón · borrador v1»). Los textos no dicen dónde está el panel (§4.13).
2. **Origen.** Dos caminos:
   - *Desde referencias:* elegir un personaje existente (su ficha publicada) o imágenes de la biblioteca. Su referencia principal es la que tenga marcada la ficha.
   - *Desde una descripción:* crear el personaje con su **nombre** (obligatorio, y se ve en todo el recorrido) y los campos de §4.2a. No hay referencia principal todavía: lo primero que se genera es un retrato para elegirla (18.28).
   - *Persona real (18.20):* su foto es la referencia principal y no se genera un retrato inventado. El texto lo explica así: «Su foto es la referencia de la cara. Los modelos pueden alterarla: revisa cada resultado».
3. **Identidad, apariencia y vestuario.** Campos estructurados (§4.2a). Cada uno se marca «Se conserva» o «Puede variar». Debajo va el resumen «Rasgos y referencias que se deben conservar», compuesto desde los campos. Si no hay nada, dice «Se completará con lo que rellenes», nunca «Preparado por el Director» sobre un campo vacío.
4. **Lo que falta.** Solo pregunta por campos *obligatorios* vacíos: edad aparente, procedencia, cara, pelo y vestuario base. Nunca pregunta un dato que ya tiene. Lo opcional se puede omitir.
5. **Uso, vistas y forma de generarlas.** El uso propone vistas, y Juan las marca o desmarca. Además elige la forma de generarlas: hoja compuesta o vistas sueltas (§4.11; la forma por defecto está pendiente, D13).
6. **Dirección.** Dirección de la hoja (se guarda) y ajustes por vista (§4.4). Cada control trae una línea de ayuda, escrita como indicación y no como promesa.
7. **Qué se enviará.** Un resumen legible por generación: vista, expresión, encuadre, imágenes que viajan y precio. El texto completo y los identificadores van en «Ver el texto completo».
8. **Preparar.** El panel pasa a **«Listo para generar»** y su acción principal es la misma que la de la barra: «Generar 3 vistas · 0,45 $», o «Generar hoja · 0,15 $». «Editar preparación» queda como acción secundaria (§4.12).
9. **Generar.** El botón con cantidad y precio es la autorización. Reserva, lote a medias y recarga: §4.9. La presentación del coste: §4.10.
10. **Revisar.**
    - El primer retrato de un personaje desde cero se revisa con «Elegir como referencia principal», «Generar otro» o «Descartar». No hay «Comparar con la referencia principal» porque todavía no existe.
    - Las demás vistas se revisan con «Comparar con la referencia principal», ★, «Aprobar para el borrador» o «No mantiene la identidad».
11. **Publicar la ficha.** Aprobar una imagen la añade al **borrador**; publicar convierte el borrador en la versión vigente (§4.5). Cuando no queda nada por revisar, la acción principal es «Revisar y publicar la ficha v2».
12. **Volver.** Al reabrir, la receta vuelve al paso en que estaba, con su siguiente acción (§4.12).

#### 4.2a Campos del personaje (estructura por reglas)

La receta no interpreta texto libre. Guarda cada dato en su campo y lo coloca en el texto con una plantilla fija. Si Juan escribe algo propio, se copia tal cual en ese campo; no se reparte entre otros ni se deduce nada de él.

| Campo | Obligatorio | Se conserva por defecto | Ejemplos a un clic | Respuesta propia |
|---|---|---|---|---|
| Nombre | Sí | — | — | Sí |
| Edad aparente | Sí | Sí | 25, 40, 65 | Sí, un número |
| Procedencia | Sí | Sí | Mediterráneo, norte de Europa, latinoamericano, África occidental | Sí |
| Complexión y altura | No | Sí | Delgada 1,70 m; robusta 1,80 m | Sí |
| Cara (3–4 palabras) | Sí | Sí | Alargada, nariz recta, labios finos; cuadrada, mandíbula ancha | Sí |
| Pelo | Sí | Sí | Canoso, corto y peinado hacia atrás | Sí |
| Ojos | No | Sí | Verde oliva (NO marrones) | Sí |
| Señas (con su LADO) | No | Sí | Cicatriz en la ceja IZQUIERDA | Sí |
| Vestuario base | Sí | Lo decide Juan | Jersey verde oscuro y camisa de cuadros | Sí |
| Accesorio fijo | No | Sí («SIEMPRE lleva») | Gorra de lana azul | Sí |

- El estado de cada campo se guarda en la sesión. Las preguntas del paso 4 salen de esta tabla, no de una lista aparte: si la edad ya está (65), no se pregunta.
- La edad y la procedencia van en campos separados.
- La receta no entiende una frase como «un pescador curtido de la costa». Si Juan la escribe en la descripción, se guarda como descripción y se envía tal cual. La receta no la convierte en campos. Eso queda para el agente (§4.6).

#### 4.3 Cómo se conserva la referencia principal

- **La referencia principal** (ancla en el código) es una referencia de la ficha con rol `frontal` y `ancla: true`. Hay una por versión: un retrato frontal, expresión neutra, cabeza y pelo enteros, cara grande y centrada.
- **Toda vista nueva lleva la referencia principal como imagen 1.** La línea que la acompaña **se escribe a partir de lo que Juan marcó para conservar**, sin contradecirlo:
  - siempre: «conserva su cara, pelo, tono de piel y complexión»;
  - si el vestuario base está marcado «Se conserva»: «y su ropa: jersey verde oscuro y camisa de cuadros». En ese caso la línea no lleva «no copies la ropa»;
  - si el vestuario está marcado «Puede variar»: «no copies su ropa»;
  - en todos los casos: «no copies la pose, el encuadre ni el fondo».

  Comprobación obligatoria (pytest y maqueta): con el pescador de vestuario conservado, **ninguna** de las vistas lleva «no copies la ropa» ni «no copies […] la ropa», y todas nombran «jersey verde oscuro» y «camisa de cuadros».
- **Crear completo, adjuntar lo mínimo** (VDLT): con la referencia principal basta para perfil, tres cuartos y cuerpo entero. Las expresiones llevan la principal y, si existe, el cuerpo entero aprobado. Nunca más de tres imágenes por generación.
- **Una vista por imagen** en las vistas sueltas. La hoja compuesta junta varias vistas en una generación (§4.11).
- **Vista y expresión por separado:** la vista dice desde dónde se ve; la expresión, qué gesto hace.
- **Conservar no es garantizar.** El texto pide conservar; si se ha conservado se ve al comparar (§4.7). Guardar la dirección permite reutilizar decisiones, pero no asegura que las imágenes salgan iguales.
- **Persona real:** el texto no describe su cara; solo su rasgo firma y la cláusula de la 18.20.
- **Si la ficha cambia** (otra versión), las vistas aprobadas antes quedan marcadas «hechas con v1» y la receta propone rehacer las afectadas. No se rehacen solas.

#### 4.4 Dirección de las vistas de referencia (valores por defecto, editables)

Son indicaciones visuales para el modelo, no garantías. La ayuda de cada control dice lo que *suele* conseguir, y el resultado se revisa.

| Vista | Encuadre | Ángulo | Objetivo | Ayuda que se muestra |
|---|---|---|---|---|
| Retrato (referencia principal) | Primer plano, cabeza y pelo enteros | Frontal, a la altura de los ojos | 85 mm | «Un teleobjetivo corto suele deformar menos la cara que un angular» |
| Tres cuartos | Plano medio corto | Tres cuartos, hacia el lado de su seña | 85 mm | «Girar hacia la seña ayuda a que aparezca en su lado» |
| Perfil | Plano medio corto | Perfil al mismo lado | 85 mm | «De lado y muy cerca, los modelos tienden a inventar más: mejor algo más abierto» |
| Cuerpo entero | De pies a cabeza | Frontal | 50 mm | «Para ver proporciones y vestuario» |
| Expresiones (1 a 3) | Plano medio corto | Frontal | 85 mm | «Una expresión por imagen» |

**Dirección de la hoja (se guarda).** Fondo, luz y acabado son de la hoja: todas las vistas los comparten, salvo una excepción expresa. Valores por defecto:
- **Fondo:** gris claro liso. Ayuda: «Un fondo neutro facilita ver el contorno; con pelo muy claro, prueba un gris más oscuro».
- **Luz:** ventana lateral suave. Ayuda: «Da algo de volumen a la cara sin sombras duras».
- **Acabado:** foto natural, colores sin editar y grano fino. Otras: «estudio limpio» e «ilustración».

Se guarda en la sesión y en `FichaVersion.direccion_hoja` al publicar la versión. Reutiliza decisiones; no asegura resultados iguales. Se evita «8K», «hiperrealista» y «character sheet» en el texto (18.15).

#### 4.5 Favorita, aprobada para el borrador y publicada en la ficha

| | Favorita (★) | Aprobada para el borrador | Publicada en la ficha |
|---|---|---|---|
| Qué significa | «Me gusta» | «Esta imagen debe ser referencia de esta vista» | La versión de la ficha que usan las generaciones |
| Dónde se guarda | `Toma.valoracion = "buena"` | `Referencia` en la `FichaVersion` en estado `borrador` | La `FichaVersion` pasa a `aprobada` y es la vigente |
| Etiqueta en la toma | ★ | «Aprobada · borrador v2» | «En la ficha v2» |
| Cabecera | — | «Ficha de Ramón: borrador v1 sin publicar» o «v1 publicada · borrador v2» | «Ficha de Ramón: v2 publicada» |
| Se deshace | Quitando la ★ | «Quitar del borrador» | No: se crea otra versión |

- Una toma nunca dice «En la ficha v2» mientras la v2 siga en borrador. Eso es lo que se vio en la revisión 2 y lo que se corrige.
- En un personaje nuevo no hay versión publicada: la cabecera dice «borrador v1 sin publicar» hasta que se publique.
- Vincular deja de marcar ★ (§5).

#### 4.6 El agente: contexto, propuestas y autorizaciones

**En PIC-05 hay una receta guiada por reglas, no el agente.** No son equivalentes, y la interfaz no los presenta como tales: la pestaña dice «Receta guiada», y la tarjeta del agente aparece como «Próximamente».

| | Receta guiada (PIC-05) | Agente especializado (pendiente) |
|---|---|---|
| Entrada | Pasos fijos, opciones cerradas y campos | Lo que Juan cuente con sus palabras, imágenes incluidas |
| Qué entiende | Lo que encaja en sus tablas (usos, vistas, rasgos que faltan, «más íntimo» y una decena de intenciones más) | La necesidad: para qué es, qué no le convence, qué se parece a qué |
| Qué orienta | Propone vistas y dirección según el uso, explica cada control en una línea y pregunta solo los campos vacíos | Propone enfoques que no están en las tablas, discute alternativas y explica el porqué con el contexto de Juan |
| Resultados | Lista de comprobación fija para comparar con el ancla | Lee la toma y señala qué se ha perdido y por qué (18.3) |
| Coste | Ninguno | Cada llamada, presupuestada y autorizada aparte |
| Riesgo | Rígida: lo que no está en la tabla no lo entiende, y lo dice («Esto no lo sé interpretar todavía») | Puede equivocarse con seguridad: sus propuestas se revisan una a una |

La receta deja hecho lo que el agente reutilizará después: la sesión, las fichas, la dirección de la hoja, las propuestas aceptables una a una y la marca «Preparado por el Director». El agente necesita su propio SDD, con modelo, coste, contexto y pruebas. Queda en el backlog (18.66 y 18.52) y no se da por cubierto con PIC-05.

- **Contexto que recibe:** el elemento y su ficha (versión vigente y borrador), las referencias con su rol y su ancla, la marca de persona real, la sesión de receta, el catálogo (modelo elegido, máximo de referencias y precio con su fecha) y el gasto del Taller. Nunca material de otros espacios.
- **Lista cerrada de lo que pregunta si falta:** edad aparente, origen, complexión, forma de la cara (3–4 palabras), pelo, ojos, vello facial, 1–2 señas con su LADO, accesorio fijo, vestuario base, uso previsto.
- **Propuestas que puede preparar:** campos de la ficha, el resumen de lo que se debe conservar, la dirección de la hoja, las vistas y su dirección, y los textos por vista. Llegan marcadas «Preparado por el Director» y se aceptan, editan o descartan una a una. Traduce intenciones con una tabla cerrada (por ejemplo, «más íntimo» → plano más cerrado, 85 mm, luz lateral suave) y explica el efecto en una línea.
- **Lo que necesita autorización aparte:** generar (cada lote, viendo su precio), y cualquier asistencia de pago futura (18.27, extraer rasgos de la foto; una propuesta con modelo de texto). Cada una con su presupuesto previo, como Mejorar en PIC-04.
- **Lo que no hace nunca:** generar al preparar, aprobar en nombre de Juan, cambiar una ficha aprobada o reintentar una generación.

#### 4.7 Resultados que no mantienen la identidad

- «No mantiene la identidad» descarta la toma con motivo `identidad` y una nota opcional («la nariz cambia», «parece más joven»). El medio no se borra.
- El Director ofrece, sin ejecutar: 1) **corregir editando** sobre esa toma con el ancla y «cambia solo…» (Ajustar, existente), con su precio; 2) **revisar la dirección** de la vista (por ejemplo, de perfil a tres cuartos); 3) **volver a generar** con su precio. El orden es ese: no se regenera a ciegas.
- La lista de comprobación se enseña al comparar, en este orden: forma de la cara, ojos y color, cejas, nariz y boca, pelo, señas en su lado, edad aparente.
- Dos descartes por identidad en la misma vista disparan el aviso: «Prueba con otra referencia o con otra vista; este modelo no la está manteniendo».

#### 4.8 Guardado, recuperación y cambios de decisión

- **Sesión de receta** (colección nueva `sesiones_director`, D6). Campos:
  - `espacio_id`, `elemento_id`, `ficha_borrador_id`, `receta: "hoja_personaje"`, `paso`, `origen`, `uso`;
  - `preguntas`: respondidas, omitidas o pendientes;
  - `direccion_hoja`: `{fondo, luz, acabado, encuadres_por_vista}`;
  - `vistas[]`: `clave` (vista + expresión), `vista`, `expresion?`, `marcada`, `direccion`, `excepciones`, `texto_preparado`, `referencias` con su para qué, `estado` (`pendiente | preparada | generando | por_revisar | aprobada | descartada | fallida`), `toma_ids`;
  - `lotes[]` (§4.9), `revision`, `updated_at`.
- Se guarda en cada cambio, con `revision` contra escrituras cruzadas (como `borradores_mesa`).
- **Cambiar de decisión:** si cambia un rasgo fijo, las vistas preparadas que lo usan vuelven a «preparada» con su texto rehecho y un aviso. Las ya aprobadas quedan marcadas «hechas antes del cambio», sin borrarse.
- **Reabrir:** la última sesión abierta por espacio se recupera desde la base. El navegador recuerda la pestaña del lateral (comodidad).
- **Operaciones en marcha** al cerrar: se recuperan por `id_peticion` como en PIC-03 (§4.9).

#### 4.9 Lote, reserva, resultados parciales y recarga

Un lote es lo que se autoriza con un clic: varias vistas, una operación por vista.

1. **Antes de autorizar.** La barra enseña el precio de cada vista y el total. El servidor vuelve a calcular el total con la tarifa del catálogo y lo compara con el presupuesto restante (gasto + reservado). Si lo supera, pide la confirmación de siempre (`confirmado_por_encima_del_presupuesto`). Esa confirmación vale para ese lote y ese total, no para otro.
2. **Creación en dos fases, sin gasto a medias.**
   - *Fase 1, preparar:* se crean todas las operaciones del lote en estado `preparada`. Cada una lleva su `id_peticion = sesion:{id}:{vista}:{expresion}:{revision}`. Preparar no reserva ni envía nada. Si una no se puede crear (modelo no elegible, referencias de más), el lote no pasa a la fase 2 y las ya creadas quedan como `preparada`, visibles y sin coste.
   - *Fase 2, autorizar:* se autorizan una a una, en orden. **Cada operación reserva su estimación al autorizarse** (la capa «reservado» de PIC-02), y la reserva vive hasta que la operación cierra.
3. **Lote guardado en la sesión.** `lotes[]`: `{id, vistas, id_peticion[], total_autorizado, tarifa y fecha, confirmado_por_encima, creado_en}`. Así se sabe qué se autorizó y por cuánto, aunque el navegador se cierre.
4. **Si solo algunas vistas se generan:**
   - *Completada:* toma por revisar. Cuenta por el importe informado o, si no lo hay, por la estimación con la etiqueta «estimado».
   - *Fallida con rechazo claro del proveedor:* la reserva se libera y la vista vuelve a `fallida`. La barra ofrece «Generar las que faltan · X $», que es un lote nuevo, con su precio y su autorización.
   - *Incierta (sin respuesta):* la reserva **no** se libera. Queda «posible cargo sin confirmar» (regla de PIC-02), con «Comprobar», que nunca reenvía. No entra en «las que faltan» hasta que se resuelva.
   - La sesión enseña el estado de cada vista del lote. El total del lote nunca se presenta como gastado si no lo está.
5. **Recarga a mitad:**
   - *Durante la fase 1:* al volver, la sesión enseña las operaciones `preparada` del lote. No se autorizan solas: Juan vuelve a pulsar, con el precio delante.
   - *Durante la fase 2:* las que ya estaban autorizadas siguen su curso en el worker. Las que no, siguen `preparada` y se autorizan con un clic nuevo, viendo el precio de lo que falta.
   - *Reenviar el mismo lote* (doble clic o recarga y repetir): cada `id_peticion` ya existe, así que el servidor devuelve la operación que hay y no crea otra (índice único de PIC-03).
   - *Reconciliar:* al abrir, la sesión consulta `GET /espacios/{e}/peticiones/{id_peticion}` por cada vista en curso y pone su estado.

#### 4.10 Cómo se enseña el coste (discreto, sin quitar controles)

El trabajo creativo va delante. La contabilidad está a un clic, pero no ocupa la pantalla.

- **En el botón de generar:** la cantidad y el precio («Generar 3 vistas · 0,45 $»). Es el único precio siempre visible. En cada tarjeta de «Qué se enviará» va el precio de esa generación, en pequeño.
- **Gasto acumulado:** una pastilla discreta en la cabecera («0,60 $»). Al pulsarla se abre **«Detalle de costes»**, que reúne:
  - estimado, reservado e informado;
  - lotes con su total autorizado;
  - intentos y cargos por operación;
  - tarifa y fecha;
  - posibles cargos sin confirmar.
- **Solo se destaca lo que exige decidir:**
  1. *Supera el presupuesto:* el botón de generar abre una confirmación con el total y lo que queda.
  2. *Ha cambiado el precio* desde que se preparó: la tarjeta y el botón enseñan el precio nuevo y piden confirmarlo.
  3. *Petición sin confirmar:* un aviso en la Mesa con «Comprobar», que nunca reenvía.
- **No se repite** «no genera», «no gasta» ni «pulsar es la autorización» en cada paso. Se dice una sola vez, en la primera apertura de la receta («Preparar no gasta. Generar cobra lo que indica el botón»), y queda en la ayuda.
- **Controles que no cambian** (PIC-02 y PIC-04):
  - presupuesto y confirmación por encima de él;
  - reserva al autorizar;
  - coste por intento;
  - posible cargo de la operación incierta;
  - nunca reenviar sin respuesta;
  - `id_peticion` y la tarifa fechada.

  Lo que cambia es dónde se enseñan, no si existen.
- **Maqueta:** la cabecera lleva la etiqueta «Simulación · sin gasto». Los controles para provocar fallos están en una sección plegable «Pruebas».

#### 4.11 Hoja compuesta frente a vistas sueltas

**Hoja compuesta:** una sola generación con varias vistas de la misma persona en paneles iguales («una sola fotografía dividida en 3 paneles iguales en fila, fondo gris claro, sin texto ni números: 1) tres cuartos… 2) perfil… 3) cuerpo entero…»), con la referencia principal como imagen 1.

**Comparativa** (cálculos con el catálogo actual: Nano Banana Pro en fal, 0,15 $ por imagen, lado largo declarado de 2 048 px; **no medido en resultados reales**):

| Criterio | Vistas sueltas (3) | Hoja compuesta (3 paneles) |
|---|---|---|
| Coste previsto | 3 × 0,15 = **0,45 $** | **0,15 $** (más un recorte local, gratis) |
| Resolución por vista | Imagen 4:5 de ~1 638 × 2 048 (≈3,4 MP) | Panel de ~682 × 1 152 (≈0,8 MP, una cuarta parte), menos márgenes. En cuerpo entero, la cara queda en unos 100–150 px de alto |
| Continuidad entre vistas | Cada vista se genera aparte, con la misma referencia principal: puede variar de una a otra | Las vistas comparten una sola generación: *puede* que salgan más coherentes entre sí, pero **no está demostrado** con nuestro modelo, y tampoco garantiza parecerse a la referencia principal |
| Corregir una vista | Se edita o regenera solo esa (0,15 $) | Regenerar la hoja cambia también los paneles buenos. Lo práctico es «Ampliar o corregir esta vista» como vista suelta (0,15 $) |
| Uso como referencia posterior | Directo: una vista, una cara | La hoja entera **no** debe viajar como referencia: varias caras en una imagen tienden a promediarse (VDLT). Viajan sus recortes, de menor resolución |
| Riesgos propios | Coste y deriva entre vistas | El modelo puede no respetar los paneles (tamaños distintos, texto, una persona de más); los recortes iguales fallan si la composición no es regular |

**Cómo se elige la referencia principal en la hoja compuesta:** igual que en las sueltas. Desde cero, lo primero es un **retrato individual**, que se elige como referencia principal antes de la hoja, porque necesita resolución completa para viajar como imagen 1 y para comparar. Se puede elegir un recorte de la hoja como principal, pero con aviso de baja resolución y la propuesta de ampliarlo antes.

**Cómo se vincula la hoja a la ficha:**
- La hoja completa se guarda como referencia con rol nuevo `hoja`. Se ve en la ficha, pero **no viaja** a las generaciones.
- «Recortar en vistas» es una acción local, sin coste, con la librería de imágenes que ya usa el backend (PIL). Crea un `Medio` nuevo por panel (`origen: recorte`, `medio_origen_id`, `caja`). Cada recorte es una toma con su vista y se aprueba para el borrador como cualquier otra, con su resolución a la vista.
- Si los paneles no son regulares, la maqueta lo avisa («La hoja no tiene paneles iguales») y propone vistas sueltas. El ajuste manual del recorte queda fuera de PIC-05.
- Las vistas sueltas siguen para **ampliar** (más resolución de una vista) o **corregir** (una vista que no se parece).

**Recomendación (pendiente de decidir, D13):** recorrido por defecto **híbrido**:
1. Retrato individual → elegir referencia principal.
2. **Hoja compuesta** con las vistas elegidas, para ver de un vistazo el personaje en todas ellas al precio de una imagen.
3. Recortar y aprobar los recortes que valgan.
4. «Ampliar» como vista suelta solo las que se vayan a usar como referencia de alta resolución o salgan mal.

Desde cero son 0,30 $ en vez de 0,60 $, y el gasto adicional solo va donde hace falta.

La decisión final necesita una prueba corta de pago, que se autoriza aparte. El mismo personaje con la misma referencia principal, generado de las dos formas (hoja y 3 vistas sueltas, unos 0,60 $), y comparado con la lista de §4.7, más la comprobación del vestuario de §4.3. Hasta entonces, la maqueta ofrece las dos formas y marca la recomendada como «recomendada, pendiente de prueba».

#### 4.12 Siguiente acción evidente

Siempre hay **una** acción principal, la misma en el panel del Director y en la barra. Nunca queda un botón genérico desactivado como única opción.

| Situación | Mensaje | Acción principal | Secundarias |
|---|---|---|---|
| Receta sin empezar | «Elige qué quieres preparar» | Abrir «Hoja de personaje» | — |
| Pasos 2–7 sin preparar | Nombre del paso siguiente | «Seguir: [paso]» en el panel; la barra muestra el paso, sin botón | Volver a un paso |
| Preparado (desde cero) | «Listo: retrato para elegir la referencia principal» | «Generar retrato · 0,15 $» | Editar preparación |
| Preparado (vistas) | «Listo para generar» | «Generar 3 vistas · 0,45 $» o «Generar hoja · 0,15 $» | Editar preparación |
| Generando | «Generando 3 vistas…» | — (estado, sin botón) | Detalle de costes |
| Retrato listo, sin elegir | «Revisa y elige la referencia principal para continuar» | «Ver el retrato» → «Elegir como referencia principal» | Generar otro · Descartar |
| Referencia principal elegida | «Referencia principal elegida. Faltan 3 vistas» | «Continuar con las vistas pendientes» | Publicar ya el borrador |
| Hoja lista | «Revisa la hoja y recórtala en vistas» | «Recortar en vistas» | Generar otra hoja · Vistas sueltas |
| Imágenes por revisar | «Revisa 2 imágenes» | «Revisar la siguiente» | — |
| Alguna falló | «1 vista falló» | «Generar la que falta · 0,15 $» | Detalle de costes |
| Sin confirmar | «1 petición sin confirmar» | «Comprobar» | — |
| Todo revisado, borrador con imágenes | «Todo revisado» | «Revisar y publicar la ficha v2» | Preparar más vistas |
| Ficha publicada | «Ficha de Ramón v2 publicada» | «Preparar otra vista» | Cerrar receta |

- «No queda ninguna vista por generar» solo aparece cuando es verdad. Si hay vistas esperando la referencia principal, el mensaje dice eso.
- La misma tabla vale para la hoja compuesta, con sus filas «Hoja lista» y «Recortar».

#### 4.13 Distribución y tamaño

- **Ancho ≥ 1 024 px:** Mesa y panel del Director uno al lado del otro (panel de 360–400 px).
- **De 700 a 1 023 px:** el panel se abre **superpuesto** sobre la Mesa, por la derecha, con «Cerrar». La Mesa sigue detrás, y la barra queda visible.
- **Menos de 700 px:** el panel ocupa la pantalla, con «Volver a la Mesa».
- **Los textos no dicen dónde está el panel** («en el lateral», «debajo»). Dicen «el panel del Director», que es cierto en los tres casos.
- **Inspector de una imagen:** la imagen se ajusta al espacio, con una altura máxima de un 45 % de la ventana y sin recortar. Las acciones (elegir o aprobar, ★, comparar, descartar) van justo debajo, sin desplazarse.
- **Resumen legible por vista** (vista, expresión, encuadre, imágenes que viajan y precio). El texto completo, los identificadores (`id_peticion`, lote) y el historial técnico van en desplegables («Ver el texto completo», «Detalles técnicos»).

### 5. Cambios mínimos

**Datos:**
- `RolReferencia` gana `tres_cuartos`, `cuerpo_entero` y `hoja` (la hoja compuesta: se ve en la ficha y no viaja). El rol sigue siendo la vista.
- `Medio` gana `origen: recorte`, `medio_origen_id` y `caja` para los recortes de una hoja (§4.11). El recorte es local, con PIL, y no tiene coste.
- Campos del personaje (§4.2a) en la sesión mientras se trabaja y en la `FichaVersion` al publicar: `nombre` (en `Elemento`), `edad_aparente`, `procedencia`, `complexion`, `cara`, `pelo`, `ojos`, `senas`, `vestuario_base`, `accesorio_fijo`, cada uno con `conservar: bool`.
- `Referencia` gana `ancla: bool = False` y `expresion?`, una lista cerrada que va aparte del rol: neutra, sonrisa_amplia, risa, sorpresa, seria y pensativa.
- `FichaVersion` gana `direccion_hoja?` `{fondo, luz, acabado, encuadres_por_vista}`.
- `Toma` gana `motivo_descarte?` (`identidad` | null).
- Colección nueva `sesiones_director`.
- Operación: `origen_receta?` `{sesion_id, vista}` fuera de `entradas`, para no cambiar la clave de idempotencia.

**Motor:**
- Ninguno en el ciclo. Las vistas se generan con `imagen_con_referencias`, una operación por vista, con `id_peticion = sesion:{id}:{vista}:{expresion}:{revision}`. Un doble clic no duplica.
- El lote sigue §4.9: total comprobado en el servidor, creación en dos fases (preparar todas, autorizar una a una) y reserva por operación al autorizarse. Para eso se usan `crear_operacion` y `autorizar`, que ya existen; el `generar` del Taller hace las dos cosas en una sola llamada y no sirve para un lote.
- `USO_REFERENCIA` del personaje distingue el ancla y las expresiones por rol (§4.3). Lo prueba pytest.

**API:**
- `GET/POST /api/espacios/{e}/director/sesiones`, `GET/PUT /api/director/sesiones/{id}`.
- `POST /api/director/sesiones/{id}/preparar`: rehace los textos y devuelve las tarjetas con precio. No crea operaciones.
- `POST /api/director/sesiones/{id}/lotes` `{vistas, total_visto, confirmado_por_encima}`: comprueba el total, guarda el lote y hace las dos fases (§4.9). Si el total del servidor no coincide con el visto, devuelve 409 y no autoriza nada.
- `GET /api/director/sesiones/{id}/lotes/{lote}`: estado por vista, con la reserva y el gasto de cada una.
- `POST /api/tomas/{id}/pasar-a-ficha` acepta tomas de carpeta y recibe `rol`, `ancla` y `expresion`. Ya no toca `valoracion`.

**Interfaz:**
- Contenido de la pestaña Director (`Lateral.tsx`): lista de recetas, marcada como «Receta guiada», y la tarjeta del agente como «Próximamente».
- Controles «Fondo» y «Acabado» en Dirección. Bloque «Dirección de la hoja» guardado.
- Estado del lote en la barra y en la sesión: completada, fallida, sin confirmar y preparada sin autorizar.
- En la tarjeta de la toma: «En la ficha · vN · vista», «Comparar con el ancla», «No mantiene la identidad».
- Paleta oscura aprobada (PIC-01 D11). Sin dependencias nuevas.

**No cambia:** el ciclo del motor, el Registro, los costes por intento, el borrado protegido, el comparador, el árbol de versiones ni la hoja del paso de elementos (se deja como está; D1 propone su retirada más adelante).

## SDD-05 · Backlog con criterios de aceptación

| # | Historia | Criterio verificable |
|---|---|---|
| H1 | Abrir el Director y elegir la receta | Con la Mesa abierta, la pestaña Director lista «Hoja de personaje». Abrirla no crea operaciones (el Registro no cambia) |
| H2 | Partir de referencias o de una descripción | Desde referencias, la frontal de la ficha aprobada aparece como candidata a ancla. Desde descripción, la primera vista propuesta es «Retrato ancla». Con persona real no se ofrece generar la cara |
| H3 | Conservar y variar | Cada rasgo está en una sola columna; moverlo cambia el resumen «Rasgos y referencias que se deben conservar», que nombra también las referencias que viajan. Ningún texto de la interfaz promete que la identidad se mantenga |
| H3b | Dirección de la hoja guardada | Fondo, luz, encuadre por vista y acabado se guardan en la sesión, se recuperan al reabrir y pasan a `direccion_hoja` al aprobar la ficha. Una excepción en una vista no cambia la hoja |
| H4 | Preguntar solo lo que falta | Con la ficha completa, no hay preguntas. Con tres campos vacíos, pregunta esos tres y nada más. «Omitir» lo deja «sin decidir» |
| H5 | Vistas según el uso | Cada uso marca un conjunto distinto; desmarcar una vista la quita del total. El ancla no se puede desmarcar si no existe |
| H6 | Dirección explicada y editable | Cada vista enseña sus cinco controles con una línea de por qué. Cambiar uno cambia el texto de esa vista y no la ficha |
| H7 | Qué se envía y cuánto cuesta | Cada tarjeta muestra texto exacto, imágenes numeradas con su para qué, modelo y precio; el total es la suma. Con más referencias que el máximo del modelo, la tarjeta se bloquea con aviso |
| H8 | Preparar no gasta | Tras «Preparar», cero operaciones nuevas y la sesión guardada |
| H9 | Generar con una autorización | Un clic crea una operación por vista marcada, todas con `id_peticion` distinto y estable. Un doble clic no crea más. Por encima del presupuesto pide confirmación. Cada operación reserva su estimación al autorizarse |
| H9b | Lote a medias y recarga | Con una vista fallida, su reserva se libera y la barra ofrece «Generar las que faltan» con su precio. Una incierta mantiene la reserva y no se reofrece. Si se recarga entre fases, las `preparada` no se autorizan solas. Repetir el lote no crea operaciones nuevas |
| H10 | Comparar y aprobar | «Aprobar para la ficha» añade la referencia con su rol al borrador; no marca ★; la ★ no vincula. La toma muestra «En la ficha · vN · vista» |
| H11 | Identidad perdida | «No mantiene la identidad» descarta sin borrar y ofrece corregir editando, revisar la dirección o regenerar, cada una con precio y sin ejecutarse |
| H12 | Reabrir | Cerrar y volver recupera paso, vistas y su estado. Una generación en curso al cerrar se reconcilia sin duplicarse |
| H13 | Recorrido de aceptación de la 18.66, en su versión básica | Crear un personaje, aprobar su ancla y la dirección de la hoja, y preparar tres vistas distintas sin volver a escribir sus rasgos ni perder lo decidido. La estética del proyecto completa queda para la segunda receta |
| H15 | Siguiente acción | En cada fila de §4.12 hay una sola acción principal, igual en el panel y en la barra. Nunca se queda solo un botón desactivado. Con vistas esperando la referencia principal no aparece «No queda ninguna vista por generar» |
| H16 | Referencia principal desde cero | El primer retrato ofrece «Elegir como referencia principal», «Generar otro» y «Descartar», sin «Comparar». Tras elegir, la acción es «Continuar con las vistas pendientes» |
| H17 | Borrador y publicación | Una imagen aprobada dice «Aprobada · borrador v2» hasta publicar. Solo después dice «En la ficha v2». La cabecera nunca contradice a la toma |
| H18 | Campos y preguntas | Con edad 65 y procedencia rellenas no se pregunta ninguna de las dos. El nombre se ve en la cabecera, la carpeta y el panel. Se puede responder con texto propio |
| H19 | Coherencia del vestuario | Pescador con «jersey verde oscuro y camisa de cuadros» marcado «Se conserva»: todas las vistas lo nombran, y ninguna dice «no copies la ropa» |
| H20 | Costes discretos | El precio solo está en el botón y en cada tarjeta. El detalle se abre desde la pastilla de gasto. Solo se destacan: supera el presupuesto, cambio de precio y petición sin confirmar |
| H21 | Distribución | A 1 280 px, panel al lado; a ~900 px, panel superpuesto; a 390 px, panel a pantalla completa. El inspector deja ver las acciones sin desplazarse |
| H22 | Hoja compuesta | «Generar hoja · 0,15 $» → «Recortar en vistas» → tres recortes con su vista y resolución → aprobar o «Ampliar esta vista · 0,15 $» |
| H14 | Vista y expresión por separado | Una referencia «frontal + sonrisa amplia» y otra «perfil + neutra» se distinguen en la ficha y en la barra; «cuerpo entero» es una vista de pies a cabeza con una sola persona |

## SDD-06 · Reglas de desarrollo

- CLAUDE.md del proyecto y §0 del maestro. Vocabulario del §2: elemento, ficha, referencia, toma, operación.
- Sin dependencias nuevas. Paleta oscura en tokens.
- Sin claves en el repositorio. Pruebas solo con `simulado` y en la base aislada.
- Nada de cambios fuera de §5 sin volver al SDD.

## SDD-07 · Plan de pruebas

1. **Motor y API (simulado), `scripts_pruebas/p19_director_hoja.py`:**
   - H1, H2 y H8.
   - H9: doble clic, presupuesto y total distinto del visto (409).
   - H9b:
     - una de tres falla con rechazo: su reserva se libera y las otras siguen;
     - una incierta conserva su reserva;
     - reinicio del backend entre fases: las `preparada` no se autorizan;
     - repetir el lote no crea operaciones.
   - H10: favorita y aprobada separadas; 409 si la ficha está aprobada.
   - H11 y H12.
   - H3b: `direccion_hoja` guardada y recuperada.
   - H17: aprobar no publica; publicar crea la versión vigente.
   - H22: la hoja se guarda con rol `hoja`, que no viaja, y el recorte crea medios `recorte` sin coste.
2. **pytest:**
   - Texto de cada vista:
     - el ancla como imagen 1;
     - la línea de uso por rol;
     - persona real sin describir la cara;
     - sin palabras vetadas;
     - máximo de referencias;
     - la dirección de la hoja aplicada, con las excepciones solo en su vista.
   - Resumen de lo que se conserva: LADO en mayúsculas, «SIEMPRE lleva» y referencias nombradas.
   - Vista y expresión: se generan como campos separados.
   - H19: pescador con el vestuario conservado; ninguna línea dice «no copies la ropa».
   - H18: las preguntas salen de los campos obligatorios vacíos, nunca de los rellenos.
3. **Frontend (`node --test`):** preguntas que faltan, vistas por uso, total previsto, recuperación de la sesión, y la siguiente acción para cada fila de §4.12 (H15).
3b. **Recorrido visual** a 1 280, ~900 y 390 px (H21).
4. **Validación de Juan en la interfaz:** el recorrido H13 en una instancia aislada, primero con `simulado`.
5. **Validación real (aparte y autorizada):** tres vistas de un personaje inventado con su ancla. Presupuesto = vistas × precio verificado ese día. Es la única prueba que dice algo de la continuidad.

## SDD-04 · Decisiones pendientes (cada una con recomendación)

| # | Decisión | Recomendación |
|---|---|---|
| D1 | ¿Dónde caen las tomas: carpeta del Taller o destino `ficha`? | **Carpeta del personaje en el Taller** («Personaje · Marta»). Así se reutilizan Mesa, versiones, comparar, ★ y Ajustar. La ficha recibe solo lo aprobado. La hoja del paso de elementos se deja como está y se retira cuando PIC-05 esté validado |
| D2 | ¿Relación con la 18.53 (modo personaje, aprobada y aplazada)? | **PIC-05 toma su método** (preguntas de dos en dos, la cara al final, rasgos que se conservan con su LADO) en versión por reglas. La 18.53 sigue aplazada para la entrevista de carácter y mundo |
| D3 | ¿Vistas sueltas o hoja compuesta de la 18.41? | **Sustituida por D13.** Las vistas sueltas dejan de ser el recorrido por defecto aprobado; se mantienen para ampliar y corregir |
| D4 | Fondo y luz por defecto (EVA: blanco y estudio; VDLT: gris claro y ventana lateral) | **Gris claro y ventana lateral suave**, editables. Es lo que proponen las guías VDLT; se revisa en los resultados de la prueba de D13 |
| D5 | ¿El Director usa un modelo de texto en PIC-05? | **No en este incremento, y se dice claro:** PIC-05 entrega una *receta guiada por reglas* y no el agente que interpreta la necesidad (§4.6). El agente especializado sigue pendiente, con su propio SDD (modelo, coste por llamada, contexto y pruebas). Recomiendo abrirlo justo después de validar PIC-05, para que use la sesión y las fichas que deja hechas |
| D6 | ¿Colección nueva o reutilizar `borradores_mesa`? | **Colección nueva `sesiones_director`.** El borrador guarda un texto; la receta guarda un recorrido |
| D7 | ¿El ancla se marca o se deduce? | **Se marca (`ancla: true`)**, una por versión. Deducirla de «la primera frontal» se rompe al reordenar |
| D8 | ¿Cuántas expresiones? | **De 1 a 3, una por imagen,** elegidas de seis (neutra, sonrisa amplia, risa, sorpresa, seria, pensativa). Más se hace en otra ronda |
| D9 | ¿Presupuesto del Taller y del lote? | **El global, como hoy, con el lote de §4.9:** el servidor comprueba el total, se crea en dos fases y cada operación reserva al autorizarse. Lo que falla con rechazo se libera, lo incierto queda como posible cargo y nada se reautoriza solo. Un presupuesto por espacio queda propuesto aparte |
| D10 | ¿Vincular a la ficha marca favorita? | **No.** Se separan; las tomas ya vinculadas con ★ la conservan |
| D11 | ¿Aprobar una vista exige comparar antes? | **No obliga, pero lo propone:** «Aprobar para el borrador» abre la comparación con la referencia principal. No aplica al primer retrato, que todavía no tiene con qué compararse |
| D13 | ¿Recorrido por defecto: hoja compuesta, vistas sueltas o híbrido? | **Recomendación: híbrido** (§4.11). Retrato individual para la referencia principal; después, una hoja compuesta con las vistas; luego recortar, aprobar y ampliar solo lo necesario. **Pendiente de decidir** tras una prueba de pago autorizada aparte (unos 0,60 $), con la misma referencia principal en las dos formas |
| D14 | ¿Se conserva el término «ancla»? | **En la interfaz no: «referencia principal»,** con su ayuda la primera vez. «Ancla» queda en el código y en este documento |
| D15 | ¿Dónde está el gasto? | **Una pastilla discreta en la cabecera con «Detalle de costes».** El precio se ve en el botón; los avisos solo aparecen cuando hay que decidir (§4.10) |
| D16 | ¿Qué pasa si la hoja no sale en paneles iguales? | **Avisar y proponer vistas sueltas.** El ajuste manual del recorte queda para más adelante |
| D12 | ¿Modelo para la hoja? | **El más económico que cumpla tres condiciones:** 1) admite las referencias que necesita la vista (hasta 3); 2) admite edición, para «corregir editando» (§4.7); 3) su calidad está **validada para este trabajo**, con una prueba corta autorizada (el mismo ancla y las mismas tres vistas, comparadas con la lista de §4.7). El precio solo decide entre los que cumplen las tres. Hoy solo cumple las dos primeras Nano Banana Pro en fal (6 referencias, con edición), y su calidad para hojas está sin validar. Los candidatos baratos del §9.7 pasan por la misma prueba antes de ser el modelo por defecto |

## SDD-08 · Despliegue

- Rama `pic-05/sdd-hoja-personaje`: solo documentación y maqueta. Sin fusionar.
- El código, cuando se autorice, va en una rama `pic-05/director-hoja` e instancia aislada (`picasso_pic05`, `simulado`), igual que PIC-04.
- Fusión y despliegue con respaldo de base y medios, etiquetas `antes-pic05` y vuelta atrás, cada paso con autorización de Juan.

## Mapa de reutilización

| Necesidad | Se reutiliza | Cambio |
|---|---|---|
| Superficie | Mesa y lateral único (PIC-03) | Contenido de la pestaña Director |
| Personaje | `Elemento`, `FichaVersion`, versiones y aprobación | Dos roles, `ancla`, `expresion`, `direccion_hoja` |
| Referencias | Biblioteca, `SubidorMedios`, `_referencias` (18.22, 18.20), protección de medios (R1) | Uso por rol |
| Generar | `crear_operacion` y `autorizar`, `id_peticion`, catálogo | Lote de vistas en dos fases (§4.9) |
| Coste | Tres capas, reserva al autorizar, costes por intento, posible cargo, presupuesto, `PermissionError` | Total del lote en el servidor y estado por vista |
| Revisar | Comparador, ★, descartar, nota, «Cómo se hizo», Ajustar | «Comparar con el ancla», motivo `identidad` |
| Vincular | `pasar-a-ficha` | Acepta carpeta, rol y ancla; deja de marcar ★ |
| Dirección | Controles del Taller | «Fondo» y «Acabado», dirección de la hoja guardada, excepciones por vista |
| Reabrir | `?carpeta=`, `id_peticion`, patrón de `borradores_mesa` | `sesiones_director` |
| Método | Guías VDLT (hoja principal, refuerzos), EVA (ancla), Arquitecto de Personaje (rasgos que se conservan), 18.20, 18.22, 18.27, 18.28, 18.36, 18.41, 18.42 | Se toma el método, no el texto |

## Vinculadas en el backlog (conservan su estado)

18.66 (madre), 18.53 y 18.52 (aplazadas), 18.27, 18.28 y 18.36 (aprobadas y aplazadas), 18.41 y 18.42 (propuestas), 19.6 (pendiente), 18.20 y 18.22 (construidas), 18.21, 18.40, 18.49 y 18.58 (estética y análisis, fuera), 18.55 (cámara 3D, fuera), §9.7 (proveedores, fuera).
