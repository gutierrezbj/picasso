# PIC-05 · Director de Studio: hoja de personaje

**Estado:** revisión 6, para la revisión del revisor antes de autorizar la construcción aislada. Revisiones anteriores: 1 `0467afb`, 2 `848f754`, 3 `15cc213`, 4 `efbffaa`, 5 `73ca6f9`. **Ni el SDD ni la maqueta están aprobados.** El encargo de construcción está en §11.

**Revisión 6 (22-11-2026): los cuatro puntos pendientes del revisor sobre `73ca6f9`:**
1. **La autorización va atada a la preparación exacta,** no solo al precio: una preparación inmutable con su huella, y un 409 si algo cambió (§4.9a).
2. **«Puede variar» se respeta en la línea de cada referencia.** Solo se pide conservar lo marcado «Se conserva»; lo que puede variar se dice que no se copie (§4.3).
3. **Reserva y posible cargo separados, como en PIC-02:**
   - incierta = reservado;
   - marcada fallida = posible cargo del intento;
   - «No hubo cargo» y «Hubo cargo…» resuelven por intento (§4.9).
4. **Las cajas de recorte se validan en el servidor, y dos peticiones a la vez no duplican nada** (§4.14a).

Puertos propuestos por el revisor para la instancia aislada: **3014** (interfaz) y **8014** (API), a comprobar libres antes de levantarla (§11).

**Revisión 5 (21-11-2026), ajustes del revisor a la revisión 4:**
1. **D13 no se aprueba por silencio.** El recorrido híbrido queda como **provisional en simulado**; se construyen las dos formas y la elección definitiva sale de la comparación real, que decide Juan de forma explícita (§11, D13).
2. **No hace falta fusionar en `main` para empezar.** La rama de construcción parte de esta rama de documentos; la fusión queda para después (§11, SDD-08).
3. **Ajuste manual del corte.** En la vista previa se mueven las líneas de corte antes de recortar; pasar a vistas sueltas queda como último recurso (§4.14a, D16).
4. **Sustituir un recorte por una vista independiente conserva el recorte y su historial.** Solo cambia qué imagen está seleccionada en el borrador, y se puede volver a seleccionar el recorte (§4.14c, H25).

D17–D20 se mantienen como recomendaciones. El ayudante de prompts sigue como siguiente prioridad (§12).

**Revisión 4 (21-11-2026), pedida por el revisor antes de construir:**
- El recorte es local y sin coste (§4.14a).
- La hoja original se conserva (§4.14b).
- Crear una vista independiente no es lo mismo que aumentar la resolución (§4.14c).
- Decisiones nuevas: D17–D20.
- El encargo de construcción, en §11.
- El ayudante de prompts queda como siguiente prioridad del Director (§12).

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

Sin luz verde al código: falta la revisión completa del SDD, el recorrido de la maqueta y la autorización explícita de §11.

**Diseño:** Autorizado redactar el SDD y la maqueta navegable (21-11-2026); ninguno de los dos está aprobado. **No** están autorizados el código funcional, las generaciones de pago, la fusión ni el despliegue. La instalación de Juan no se toca. La maqueta enseña el recorrido; no valida la continuidad del personaje, que solo se demuestra con imágenes reales.

**Origen:** 18.66 (propuesta del 21-11-2026), primer incremento: la receta «Hoja de personaje». Encaja en el lateral único de PIC-01 (D12–D14) y en la regla «en preproducción, lo más barato» del §9.7.

**Identificador:** PIC-05. Libre en `main` (`ddf8637`), en todas las ramas locales y remotas, y en `docs/`. No duplica la 18.53 (modo personaje): la absorbe como método de preguntas (§4.2, D2).

**Maqueta:** `docs/maquetas/pic-05/hoja-de-personaje.html`, autocontenida, con datos simulados. Enlace publicado en `docs/maquetas/pic-05/README.md`.

| Paso | Dónde está | Estado |
|---|---|---|
| SDD-01 Problema | §1 | Escrito |
| SDD-02 Alcance y límites | §2 | Escrito |
| SDD-03 Arquitectura | §3 (qué existe), §4 (diseño), §5 (cambios mínimos) | Escrito |
| SDD-04 Decisiones (ADR) | SDD-04 (tras SDD-07), D1–D20, cada una con recomendación; D13 abierta hasta la prueba real | **Abiertas: las decide Juan** |
| SDD-05 Backlog con criterios | §6 | Escrito |
| SDD-06 Reglas de desarrollo | §7 | Escrito |
| SDD-07 Plan de pruebas | §8 | Escrito |
| SDD-08 Despliegue | SDD-08 y §11 (encargo) | Escrito; **pendiente de autorizar** |

**Pasos pendientes, en orden:** 1) Juan recorre la maqueta y decide D1–D20, salvo D13, que se decide tras la prueba real (§11). 2) Revisión del SDD con sus decisiones. 3) Autorización del código en rama propia e instancia aislada, con el proveedor `simulado`. 4) Validación real con presupuesto aparte, autorizado viendo la cifra. 5) Fusión y despliegue, cada uno con su autorización.

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
5. Dirección de las vistas de referencia: encuadre, ángulo y objetivo por vista; fondo, luz y acabado de la hoja. Cada control con una línea de por qué y editable.
6. Vista previa por generación: texto enviado, imágenes que viajan con su número y su para qué, precio de cada una y total.
7. «Preparar»: deja todo listo y guardado. No genera ni gasta.
8. Generar (con el motor actual, autorizado viendo la cifra), comparar, aprobar y vincular a la ficha con su vista. Historial por resultado.
9. Volver a abrir y recuperar decisiones y trabajo pendiente.

**Fuera:** vídeo; escenas completas; cámara 3D (18.55); extracción automática desde Pinterest u otros enlaces; análisis general de estilos y análisis de estilo desde referencias (18.21, 18.49, 18.58); proveedores nuevos (§9.7 KIE y Google); ficha de dirección visual del proyecto (18.66, segunda receta), aunque la dirección básica de esta hoja sí se guarda; el agente especializado que interpreta la necesidad (§4.6); «Proponer rasgos desde la foto» con visión (18.27, de pago: se presupuesta aparte); la hoja compuesta de la 18.41 como lámina para imprimir (la hoja compuesta para generar vistas sí entra: §4.11 y D13); refuerzo de objeto y de compañero; ficha de voz. Quedan vinculadas en el backlog y conservan su estado.

**Límites que no se negocian:**
- Nada se genera ni se gasta al abrir, preguntar, elegir vistas o pulsar «Preparar».
- Toda llamada de pago, también una asistencia de texto o de visión, muestra su coste y se autoriza por separado.
- No se promete identidad exacta. La interfaz dice: «El modelo puede cambiar la cara: compárala con la referencia principal antes de aprobar».
- La continuidad del personaje no se da por validada con la maqueta.

## SDD-03 · Arquitectura técnica

### 3. Qué existe y qué falta (comprobado en `main`, `ddf8637`)

| Pieza | Existe | Dónde | Falta para PIC-05 |
|---|---|---|---|
| Elemento y ficha versionada (rasgos fijos y variables, referencias con rol, persona real, estado borrador/aprobada) | Sí | `backend/app/dominio/modelos.py` (`Elemento` 237, `FichaVersion` 270, `RolReferencia` 56); `api/elementos.py`; `FichaElemento.tsx` | Roles `tres_cuartos`, `cuerpo_entero` y `hoja` (hoy: frontal, perfil, espalda, detalle, entorno, otra). Campo `expresion` aparte del rol. Marca de ancla. Dirección de la hoja guardada |
| Nueva versión de ficha (copia la anterior; 409 si ya hay borrador) y aprobar (exige descripción y una referencia) | Sí | `api/elementos.py:113`, `:166` | Nada |
| Hoja de personaje del paso de elementos | Parcial | `api/motor.py:332` (`VISTAS_POR_CLASE`: frente, perfil, tres cuartos, cuerpo entero), `:506` (`preparar-referencias`); `motor/PanelReferencias.tsx` | Exige `proyecto_id`; texto genérico; no usa `_referencias` (18.22) ni la cláusula de persona real; siempre 1:1; sin expresiones; sin pruebas. **No se reutilizan ni su texto ni su destino:** las tomas caen en la carpeta del personaje en el Taller (D1) |
| Pasar una toma a la ficha | Sí | `api/motor.py:537` | Envía siempre rol «otra» (`PanelReferencias.tsx:252`) y marca `valoracion=buena`. Hay que separar favorita y aprobada (§4.5) y aceptar tomas de carpeta |
| Qué conservar de cada referencia (18.22) y persona real (18.20) | Sí | `dominio/prompt.py:30` (`USO_REFERENCIA` por clase), `:46` (`_referencias`) | Uso por **rol** (vista), por marca de ancla y por expresión (campo aparte) dentro de la clase personaje |
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
| **Ficha del personaje** | Identidad: descripción, rasgos fijos (cara, pelo, piel, complexión, señas con su LADO, «SIEMPRE lleva»), rasgos variables (vestuario, peinado de ocasión), vestuario base, persona real, resumen de rasgos y referencias que se deben conservar, referencias aprobadas con su vista y su expresión | `FichaVersion` (existente) | Juan, en el Director o en la ficha. Publicada (`estado: aprobada` en el código) = inmutable; cambiarla crea vN+1 | Todo el espacio |
| **Dirección visual** | *De la hoja (en PIC-05):* fondo, luz, encuadre por tipo de vista y acabado, iguales en todas las vistas del personaje. *Del proyecto (fuera de PIC-05):* paleta, contraste, textura y composición reutilizables (segunda receta de la 18.66) | La de la hoja: en la sesión mientras se trabaja, y en `FichaVersion.direccion_hoja` al publicar la versión, para que las vistas que se pidan después salgan iguales | Juan, en el paso de Dirección | Todas las vistas de ese personaje |
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
5. **Uso, vistas y forma de generarlas.** El uso propone vistas, y Juan las marca o desmarca. Además elige la forma de generarlas: hoja compuesta o vistas sueltas (§4.11). D13 sigue abierta: la híbrida es la opción por defecto provisional, solo en simulado.
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
- **Toda vista nueva lleva la referencia principal como imagen 1.** La línea que la acompaña **se escribe solo con lo que Juan marcó**. No hay nada que se conserve «siempre»:
  - **Conserva:** solo los campos marcados «Se conserva» que se ven en la foto, con su valor:

    | Campo | Texto |
    |---|---|
    | cara | «su cara y su tono de piel» |
    | pelo | «su pelo» |
    | ojos | «sus ojos» |
    | complexión | «su complexión» |
    | edad aparente | «su edad aparente» |
    | señas | «sus señas, en su lado» |
    | accesorio fijo | «su accesorio: …» |
    | vestuario base | «su ropa: …» |
  - **No copies:** cada campo marcado «Puede variar» que la foto enseña (pelo, ropa, accesorio), más siempre la pose, el encuadre y el fondo. Por ejemplo, con el pelo variable: «No copies de esta imagen su pelo, la pose, el encuadre ni el fondo». El texto de la vista dice el pelo pedido, si lo hay, en «Puede variar: …».
  - **Persona real (18.20):** la cara y el tono de piel se conservan siempre. En la ficha, esa casilla va marcada y bloqueada, con la explicación.
  - **Ninguna línea pide conservar y no copiar lo mismo.** Lo comprueban pytest y la maqueta.

  **Comprobaciones obligatorias** (pytest y maqueta):
  - Pescador con el vestuario conservado: ninguna vista dice «no copies» la ropa, y todas nombran «jersey verde oscuro» y «camisa de cuadros».
  - Pescador con el pelo marcado «Puede variar»: ninguna línea pide conservar el pelo, y todas dicen «no copies» el pelo.
- **Crear completo, adjuntar lo mínimo** (VDLT): la referencia principal suele bastar para perfil, tres cuartos y cuerpo entero (según VDLT; se comprueba en la prueba real). Las expresiones llevan la principal y, si existe, el cuerpo entero aprobado. Nunca más de tres imágenes por generación.
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
| Dónde se guarda | `Toma.valoracion = "buena"` | `Referencia` en la `FichaVersion` en estado `borrador` | La `FichaVersion` pasa a publicada (`estado: aprobada` en el código) y es la vigente |
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
| Resultados | Lista de comprobación fija para comparar con la referencia principal | Lee la toma y señala qué se ha perdido y por qué (18.3) |
| Coste | Ninguno | Cada llamada, presupuestada y autorizada aparte |
| Riesgo | Rígida: lo que no está en la tabla no lo entiende, y lo dice («Esto no lo sé interpretar todavía») | Puede equivocarse con seguridad: sus propuestas se revisan una a una |

La receta deja hecho lo que el agente reutilizará después: la sesión, las fichas, la dirección de la hoja, las propuestas aceptables una a una y la marca «Preparado por el Director». El agente necesita su propio SDD, con modelo, coste, contexto y pruebas. Queda en el backlog (18.66 y 18.52) y no se da por cubierto con PIC-05.

**Para el agente (pendiente, no en PIC-05).** De esta lista, la receta ya usa la tabla cerrada de intenciones, los campos obligatorios y la marca «Preparado por el Director». Lo demás es para el agente:

- **Contexto que recibe:** el elemento y su ficha (versión vigente y borrador), las referencias con su rol y su ancla, la marca de persona real, la sesión de receta, el catálogo (modelo elegido, máximo de referencias y precio con su fecha) y el gasto del Taller. Nunca material de otros espacios.
- **Lo que pregunta si falta:** en la receta, los campos obligatorios de §4.2a (edad aparente, procedencia, cara, pelo y vestuario base). El agente podrá ampliar la lista (vello facial, uso previsto) en su propio SDD.
- **Propuestas que puede preparar:** campos de la ficha, el resumen de lo que se debe conservar, la dirección de la hoja, las vistas y su dirección, y los textos por vista. Llegan marcadas «Preparado por el Director» y se aceptan, editan o descartan una a una. Traduce intenciones con una tabla cerrada (por ejemplo, «más íntimo» → plano más cerrado, 85 mm, luz lateral suave) y explica el efecto en una línea.
- **Lo que necesita autorización aparte:** generar (cada lote, viendo su precio), y cualquier asistencia de pago futura (18.27, extraer rasgos de la foto; una propuesta con modelo de texto). Cada una con su presupuesto previo, como Mejorar en PIC-04.
- **Lo que no hace nunca:** generar al preparar, aprobar en nombre de Juan, cambiar una ficha publicada o reintentar una generación.

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

#### 4.9a Preparación inmutable: lo que se autoriza es exactamente lo preparado

Como el presupuesto inmutable de PIC-04, aplicado al lote:
- **«Preparar» crea una `preparacion` inmutable** (colección `preparaciones_director`), que fija:
  - `sesion_id` y la `revision` de la sesión;
  - por cada generación: el texto exacto enviado, las referencias (`medio_id`, número, para qué), la dirección efectiva, el modelo, la relación de aspecto, la resolución y el número de paneles (en la hoja);
  - la tarifa aplicada, con su fecha de verificación, el precio por generación y el total.
- **Huella:** `huella = sha256` del contenido anterior, en forma canónica. La barra y el panel muestran el precio de **esa** preparación.
- **Generar envía `{preparacion_id, huella}`.** Antes de crear nada, el servidor vuelve a calcular la preparación con el estado actual: sesión, ficha, referencias, catálogo y tarifa. Si la huella no coincide, devuelve **409 «La preparación cambió»**, con lo que cambió (texto, referencias, dirección, modelo o precio), y **no crea ni autoriza ninguna operación**.
- **Cambiar algo después de preparar invalida la preparación.** Pasa con un campo, un «Se conserva», la dirección, las vistas, la forma (hoja o sueltas), el modelo o la tarifa del catálogo. La interfaz deja de enseñar «Listo» y vuelve a «Preparar». Con el precio cambiado, el aviso dice «El precio ha cambiado: prepara de nuevo para verlo», y la acción es «Preparar de nuevo», no un «Generar igualmente».
- **Cada `id_peticion` sale de la preparación:** `prep:{preparacion_id}:{n}`. Repetir con la misma preparación devuelve las mismas operaciones. Una preparación nueva da peticiones nuevas.
- **Cada operación guarda su `preparacion_id`,** y en «Detalles técnicos» se ve de qué preparación salió.
- **Confirmación por encima del presupuesto:** va atada a la preparación y a su total. Si la preparación cambia, hay que volver a confirmar.

#### 4.9 Lote, reserva, resultados parciales y recarga

Un lote es lo que se autoriza con un clic: una operación por vista suelta, o una sola operación para la hoja compuesta (`id_peticion = prep:{preparacion_id}:{n}`, §4.9a).

1. **Antes de autorizar.** La barra enseña el precio de cada vista y el total de la preparación (§4.9a). El servidor comprueba la huella y compara el total con el presupuesto restante, que es el presupuesto menos lo gastado, lo reservado y los posibles cargos pendientes (PIC-02). Si lo supera, pide la confirmación de siempre (`confirmado_por_encima_del_presupuesto`), y esa confirmación vale solo para esa preparación y ese total.
2. **Creación en dos fases, sin gasto a medias.**
   - *Fase 1, preparar:* se crean todas las operaciones del lote en estado `preparada`, con el contenido exacto de la preparación. Cada una lleva su `id_peticion = prep:{preparacion_id}:{n}`. Preparar no reserva ni envía nada. Si una no se puede crear (modelo no elegible, referencias de más), el lote no pasa a la fase 2 y las ya creadas quedan como `preparada`, visibles y sin coste.
   - *Fase 2, autorizar:* se autorizan una a una, en orden. **Cada operación reserva su estimación al autorizarse** (la capa «reservado» de PIC-02), y la reserva vive hasta que la operación cierra.
3. **Lote guardado en la sesión.** `lotes[]`: `{id, vistas, id_peticion[], total_autorizado, tarifa y fecha, confirmado_por_encima, creado_en}`. Así se sabe qué se autorizó y por cuánto, aunque el navegador se cierre.
4. **Si solo algunas vistas se generan:**
   - *Completada:* toma por revisar. Cuenta por el importe informado o, si no lo hay, por la estimación con la etiqueta «estimado».
   - *Fallida con rechazo claro del proveedor:* la reserva se libera y la vista vuelve a `fallida`. La barra ofrece «Generar las que faltan · X $», que es un lote nuevo, con su precio y su autorización.
   - *Incierta (sin respuesta):* sigue contando como **reservado**, igual que en PIC-02: la operación incierta es reserva, no posible cargo. Tiene «Comprobar», que pregunta al proveedor y nunca reenvía. No entra en «las que faltan».
   - *Incierta marcada fallida por Juan* («Marcar como fallida», con aviso): la reserva se libera y aparece un **posible cargo sin confirmar en ese intento** (`intento.posible_cargo`, PIC-02), que es una capa distinta del reservado. Desde ese momento la vista sí entra en «las que faltan». El posible cargo **no** desaparece al reintentar: sigue en su intento hasta que Juan lo resuelve con «No hubo cargo» o «Hubo cargo…» (`POST /api/intentos/{id}/cargo`).
   - **Capas en «Detalle de costes»:** informado, estimado, reservado y posible cargo, cada una por separado. El total es la suma, y los cargos se ven por intento.
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
  2. *Ha cambiado el precio* desde que se preparó: la preparación deja de valer (§4.9a) y la acción pasa a «Preparar de nuevo», que enseña el precio nuevo. No hay «Generar igualmente» con un precio distinto del preparado.
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
| Resolución por vista | Imagen 4:5 de ~1 638 × 2 048 (≈3,4 MP) | Panel de ~683 × 1 152 (≈0,8 MP, una cuarta parte) antes del margen; con el margen del 1 %, ~670 × 1 129. En cuerpo entero, la cara queda en unos 100–150 px de alto |
| Continuidad entre vistas | Cada vista se genera aparte, con la misma referencia principal: puede variar de una a otra | Las vistas comparten una sola generación: *puede* que salgan más coherentes entre sí, pero **no está demostrado** con nuestro modelo, y tampoco garantiza parecerse a la referencia principal |
| Corregir una vista | Se edita o regenera solo esa (0,15 $) | Regenerar la hoja cambia también los paneles buenos. Lo práctico es «Crear vista independiente» de esa vista (0,15 $, §4.14c) |
| Uso como referencia posterior | Directo: una vista, una cara | La hoja entera **no** debe viajar como referencia: varias caras en una imagen tienden a promediarse (VDLT). Viajan sus recortes, de menor resolución |
| Riesgos propios | Coste y deriva entre vistas | El modelo puede no respetar los paneles (tamaños distintos, texto, una persona de más); los recortes iguales fallan si la composición no es regular |

**Cómo se elige la referencia principal en la hoja compuesta:** igual que en las sueltas. Desde cero, lo primero es un **retrato individual**, que se elige como referencia principal antes de la hoja, porque necesita resolución completa para viajar como imagen 1 y para comparar. Se puede elegir un recorte de la hoja como principal, pero con aviso de baja resolución y la propuesta de crear antes una vista independiente de ese retrato.

**Cómo se vincula la hoja a la ficha:**
- La hoja completa se guarda como referencia con rol nuevo `hoja`. Se ve en la ficha, pero **no viaja** a las generaciones.
- «Recortar en vistas» es una acción local, sin coste, con la librería de imágenes que ya usa el backend (PIL). Crea un `Medio` nuevo por panel (`origen: recorte`, `medio_origen_id`, `caja`). Cada recorte es una toma con su vista y se aprueba para el borrador como cualquier otra, con su resolución a la vista.
- Si los paneles no son regulares, se ajustan las líneas de corte en la vista previa (§4.14a). Solo si el ajuste no basta se pasa a vistas sueltas.
- Las vistas sueltas siguen como **vista independiente**: una imagen nueva de esa vista, a resolución completa, para corregir o para tener más detalle. Aumentar la resolución del mismo recorte es otra cosa (§4.14c).

**Recomendación (pendiente de decidir, D13):** recorrido por defecto **híbrido**:
1. Retrato individual → elegir referencia principal.
2. **Hoja compuesta** con las vistas elegidas, para ver de un vistazo el personaje en todas ellas al precio de una imagen.
3. Recortar y aprobar los recortes que valgan.
4. «Crear vista independiente» solo de las que se vayan a usar como referencia de alta resolución o salgan mal.

Desde cero son 0,30 $ en vez de 0,60 $, y el gasto adicional solo va donde hace falta.

La decisión final necesita una prueba corta de pago, que se autoriza aparte. El mismo personaje con la misma referencia principal, generado de las dos formas (retrato, hoja y 3 vistas sueltas: 5 imágenes, unos 0,75 $; §11), y comparado con la lista de §4.7, más la comprobación del vestuario de §4.3. Hasta entonces, la maqueta ofrece las dos formas y marca la recomendada como «Recomendada · provisional hasta la prueba real».

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

- Si lo que la acción abriría ya está abierto, la barra pasa al paso siguiente:
  - con el retrato abierto, «Elegir como referencia principal»;
  - con la hoja abierta, «Recortar en vistas»;
  - con una imagen por revisar abierta, «Aprobar para el borrador» y, como secundaria, «Pasar a la siguiente»;
  - en «Qué se envía» antes de preparar, «Preparar», igual que el panel.
- «No queda ninguna vista por generar» solo aparece cuando es verdad. Si hay vistas esperando la referencia principal, el mensaje dice eso.
- La misma tabla vale para la hoja compuesta, con sus filas «Hoja lista» y «Recortar».

#### 4.13 Distribución y tamaño

- **Ancho ≥ 1 024 px:** Mesa y panel del Director uno al lado del otro (panel de 360–400 px).
- **De 700 a 1 023 px:** el panel se abre **superpuesto** sobre la Mesa, por la derecha, con «Cerrar». La Mesa sigue detrás, y la barra queda visible.
- **Menos de 700 px:** el panel ocupa la pantalla, con «Volver a la Mesa».
- **Los textos no dicen dónde está el panel** («en el lateral», «debajo»). Dicen «el panel del Director», que es cierto en los tres casos.
- **Inspector de una imagen:** la imagen se ajusta al espacio, con una altura máxima de un 45 % de la ventana y sin recortar. Las acciones (elegir o aprobar, ★, comparar, descartar) van justo debajo, sin desplazarse.
- **Resumen legible por vista** (vista, expresión, encuadre, imágenes que viajan y precio). El texto completo, los identificadores (`id_peticion`, lote) y el historial técnico van en desplegables («Ver el texto completo», «Detalles técnicos»).

#### 4.14 Recorte, hoja original, vista independiente y aumento de resolución

##### a) Recorte local, sin coste

- **No es una operación del motor.** No hay proveedor, ni precio, ni reserva, ni presupuesto. No aparece en «Detalle de costes» salvo como nota («Los recortes son locales y no cuestan»).
- **Dónde se hace:** en el backend, con PIL, que ya usan `api/medios.py` y `proveedores/fal.py`. No hace falta ninguna dependencia nueva y funciona igual en el VPS Linux.
- **Endpoint:** `POST /api/tomas/{id}/recortar`.
  - Solo acepta una toma de tipo hoja.
  - Recibe `{cajas?: [[x,y,ancho,alto], …]}`. Sin cajas, divide la imagen en tantas columnas iguales como paneles pidió la hoja (`paneles` de la operación), con un margen interior del 1 % por lado.
- **Antes de cortar, vista previa con ajuste manual.**
  - El panel enseña la hoja con las líneas de corte.
  - Cada línea entre paneles se puede mover a izquierda y derecha, con un control deslizante, el ratón o las flechas del teclado.
  - Un margen superior e inferior común recorta el borde vacío.
  - Debajo se ve la resolución resultante de cada panel.
  - «Restablecer» vuelve a columnas iguales.
  - Límites: las líneas no se cruzan, y ningún panel baja del 10 % del ancho.
  - Se confirma con «Recortar (sin coste)». Las cajas elegidas viajan en `cajas` y se guardan en cada recorte.
  - Picasso **no** detecta solo si los paneles son regulares: lo decide Juan viendo las líneas.
  - Si un panel no se puede separar con cortes verticales (personas solapadas, paneles en dos filas), queda la salida secundaria «Generar estas vistas por separado» (D16).
- **Píxeles intactos.** Se corta sin reescalar ni comprimir: PNG sin pérdida, con los píxeles del original. La resolución real (ancho × alto) se guarda y se enseña.
- **Lo que deja:**
  - por cada panel, un `Medio` nuevo, con `origen: recorte`, `medio_origen_id` (la hoja), `caja`, `ancho` y `alto`;
  - y una `Toma` en la carpeta del personaje, con `toma_origen_id` (la toma de la hoja), `accion: recorte`, vista y expresión del panel. Sin `operacion_id`.
- **Validación de las cajas en el servidor.** No se confía en la interfaz. Se rechaza con 422, sin crear nada, si falla cualquiera de estas reglas:
  - números enteros en píxeles;
  - `x ≥ 0`, `y ≥ 0`, `x + ancho ≤ ancho de la hoja` y `y + alto ≤ alto de la hoja`;
  - `ancho ≥ 10 %` del ancho de la hoja, `alto ≥ 50 %` del alto y como mínimo 64 px por lado;
  - tantas cajas como paneles tiene la hoja, en orden de izquierda a derecha;
  - ninguna se solapa con otra (área común cero).

  El 422 dice qué caja falla y por qué.
- **Idempotente, también con peticiones simultáneas:**
  - **Clave del recorte:** `sha256(medio_origen_id + cajas normalizadas)`. Se guarda en una colección `recortes` con **índice único** en esa clave.
  - La primera petición inserta el registro en estado `en_curso`, escribe los ficheros con un nombre fijo derivado de la clave (fichero temporal más renombrado atómico) y crea los medios y las tomas. Al terminar, pasa a `hecho`.
  - Una segunda petición con la misma clave choca con el índice único. Si el registro está `hecho`, devuelve los mismos recortes. Si está `en_curso`, devuelve **409 «Recorte en curso»** y la interfaz vuelve a consultar.
  - Además, `medios` tiene un índice único parcial en `(medio_origen_id, caja)` para los de `origen: recorte`, así que ningún panel se crea dos veces aunque algo falle a mitad.
  - Si el proceso se corta, un registro `en_curso` de más de 5 minutos se puede reanudar: los ficheros ya escritos se reutilizan y los medios que faltan se crean.
  - En la interfaz, «Recortar (sin coste)» se desactiva al pulsarlo.
- Con cajas distintas se crean recortes nuevos. Los anteriores se conservan, con su historial.

##### b) Conservación de la hoja original

- **La hoja no se toca.** Su `Medio` es inmutable (§3 del maestro). Recortar solo crea medios nuevos.
- **Protección contra el borrado (PIC-02 R1).** `usos_de_medio` añade dos usos nuevos:
  - «origen de N recortes» (medios con `medio_origen_id` igual a la hoja);
  - la referencia con rol `hoja` en una ficha.

  Mientras tenga cualquiera de los dos, `DELETE /api/medios/{id}` devuelve 409, como con los demás usos.
- **Trazabilidad en la ficha.** Al aprobar el primer recorte de una hoja para el borrador, la hoja entra en esa versión como referencia con rol `hoja`. Se ve en la ficha y **no viaja** a las generaciones. Así, la versión publicada dice de qué hoja sale cada recorte.
- **Descartar la hoja** la atenúa en la Mesa. No borra su medio ni sus recortes, y los recortes aprobados siguen en el borrador.
- **Recortes en la ficha:** su línea muestra la resolución (por ejemplo, «recorte de 670 × 1 129 px» con el margen por defecto) y la hoja de origen.

##### c) «Crear vista independiente» frente a «Aumentar resolución»

| | Crear vista independiente | Aumentar resolución |
|---|---|---|
| Qué hace | Una **imagen nueva** de esa vista y expresión, a resolución completa | **La misma imagen** con más píxeles |
| Cómo | `imagen_con_referencias`, con la referencia principal como imagen 1 y la dirección de la vista. El recorte **no** viaja, para no meter una cara de más | Acción `escalar` de la 18.13 (aprobada y aplazada), con un modelo de escalado |
| Resultado | Puede salir distinta del recorte (pose, gesto, detalle). Se revisa y se aprueba aparte. Si se aprueba, pasa a ser la **seleccionada** en el borrador para esa vista y expresión. El recorte **se conserva**, con su medio, su toma y su historial («Ya no está seleccionado en el borrador: lo sustituye T6»). Se puede volver a seleccionar con «Seleccionar para el borrador» | Suele parecerse al recorte, pero puede inventar detalle al escalar. También se revisa |
| Coste | Una imagen: 0,15 $ con el catálogo actual | El del modelo de escalado: **sin catálogo ni precio verificado** |
| En PIC-05 | **Sí** | **No.** El botón no aparece en la construcción. La maqueta lo enseña desactivado («Próximamente»), con su explicación |

Textos de la interfaz:
- «Crear vista independiente · 0,15 $»: «Una imagen nueva de esta vista, con la referencia principal. Puede salir distinta del recorte».
- «Aumentar resolución» (desactivado): «Mantiene esta misma imagen con más píxeles. Llegará cuando haya un modelo de escalado verificado».

### 5. Cambios mínimos

**Datos:**
- `RolReferencia` gana `tres_cuartos`, `cuerpo_entero` y `hoja` (la hoja compuesta: se ve en la ficha y no viaja). El rol sigue siendo la vista.
- `Medio` gana `origen: recorte`, `medio_origen_id` y `caja` para los recortes de una hoja (§4.14a). El recorte es local, con PIL, y no tiene coste.
- Campos del personaje (§4.2a) en la sesión mientras se trabaja y en la `FichaVersion` al publicar: `nombre` (en `Elemento`), `edad_aparente`, `procedencia`, `complexion`, `cara`, `pelo`, `ojos`, `senas`, `vestuario_base`, `accesorio_fijo`, cada uno con `conservar: bool`.
- `Referencia` gana `ancla: bool = False` y `expresion?`, una lista cerrada que va aparte del rol: neutra, sonrisa_amplia, risa, sorpresa, seria y pensativa.
- `FichaVersion` gana `direccion_hoja?` `{fondo, luz, acabado, encuadres_por_vista}`.
- `Toma` gana `motivo_descarte?` (`identidad` | null).
- Colecciones nuevas: `sesiones_director`, `preparaciones_director` (inmutable, con `huella`) y `recortes` (con índice único en la clave del recorte). Índice único parcial en `medios (medio_origen_id, caja)` para `origen: recorte`.
- Operación: `origen_receta?` `{sesion_id, vista, expresion?}`; en la hoja, `{sesion_id, vista: "hoja", paneles: [{vista, expresion}]}` fuera de `entradas`, para no cambiar la clave de idempotencia.

**Motor:**
- Ninguno en el ciclo. Las vistas se generan con `imagen_con_referencias`, una operación por vista suelta (o una para la hoja), con `id_peticion = prep:{preparacion_id}:{n}` (§4.9a). Un doble clic no duplica.
- El lote sigue §4.9: total comprobado en el servidor, creación en dos fases (preparar todas, autorizar una a una) y reserva por operación al autorizarse. Para eso se usan `crear_operacion` y `autorizar`, que ya existen; el `generar` del Taller hace las dos cosas en una sola llamada y no sirve para un lote.
- `USO_REFERENCIA` del personaje distingue por rol (vista), por `ancla` y por `expresion` (§4.3). Lo prueba pytest.

**API:**
- `GET/POST /api/espacios/{e}/director/sesiones`, `GET/PUT /api/director/sesiones/{id}`.
- `POST /api/director/sesiones/{id}/preparar`: rehace los textos y devuelve las tarjetas con precio. No crea operaciones.
- `POST /api/director/sesiones/{id}/preparaciones`: crea la preparación inmutable con su huella y su total (§4.9a). No crea operaciones.
- `POST /api/director/sesiones/{id}/lotes` `{preparacion_id, huella, confirmado_por_encima}`: recalcula y compara la huella (409 si cambió), comprueba el presupuesto, guarda el lote y hace las dos fases (§4.9).
- `GET /api/director/sesiones/{id}/lotes/{lote}`: estado por vista, con la reserva y el gasto de cada una.
- `POST /api/tomas/{id}/pasar-a-ficha` acepta tomas de carpeta y recibe `rol`, `ancla` y `expresion`. Ya no toca `valoracion`.
- `POST /api/fichas/{id}/seleccion` `{vista, expresion, medio_id}`: cambia la imagen seleccionada en el borrador para esa vista y expresión, sin borrar la anterior ni su toma (§4.14c). Publicar usa el aprobar que ya existe (`api/elementos.py:166`).

**Interfaz:**
- Contenido de la pestaña Director (`Lateral.tsx`): lista de recetas, marcada como «Receta guiada», y la tarjeta del agente como «Próximamente».
- Controles «Fondo» y «Acabado» en Dirección. Bloque «Dirección de la hoja» guardado.
- Estado del lote en la barra y en la sesión: completada, fallida, sin confirmar y preparada sin autorizar.
- En la tarjeta de la toma: «Aprobada · borrador vN» (o «En la ficha vN» tras publicar), «Comparar con la referencia principal», «No mantiene la identidad», «Seleccionar para el borrador».
- Paleta oscura aprobada (PIC-01 D11). Sin dependencias nuevas.

**No cambia:** el ciclo del motor, el Registro, los costes por intento, el borrado protegido, el comparador, el árbol de versiones ni la hoja del paso de elementos (se deja como está; D1 propone su retirada más adelante).

## SDD-05 · Backlog con criterios de aceptación

| # | Historia | Criterio verificable |
|---|---|---|
| H1 | Abrir el Director y elegir la receta | Con la Mesa abierta, la pestaña Director lista «Hoja de personaje». Abrirla no crea operaciones (el Registro no cambia) |
| H2 | Partir de referencias o de una descripción | Desde referencias, la referencia principal marcada en la ficha publicada aparece como tal. Desde descripción, lo primero que se propone es el retrato para elegir la referencia principal. Con persona real no se ofrece generar la cara |
| H3 | Conservar y variar | Cada rasgo está en una sola columna; moverlo cambia el resumen «Rasgos y referencias que se deben conservar», que nombra también las referencias que viajan. Ningún texto de la interfaz promete que la identidad se mantenga |
| H3b | Dirección de la hoja guardada | Fondo, luz, encuadre por vista y acabado se guardan en la sesión, se recuperan al reabrir y pasan a `direccion_hoja` al publicar la ficha. Una excepción en una vista no cambia la hoja |
| H4 | Preguntar solo lo que falta | Con la ficha completa, no hay preguntas. Con tres campos vacíos, pregunta esos tres y nada más. «Omitir» lo deja «sin decidir» |
| H5 | Vistas según el uso | Cada uso marca un conjunto distinto; desmarcar una vista la quita del total. El ancla no se puede desmarcar si no existe |
| H6 | Dirección explicada y editable | Cada vista enseña encuadre, ángulo y objetivo con una línea de por qué, y permite una excepción de luz y fondo. Cambiar uno cambia el texto de esa vista y no la hoja ni la ficha |
| H7 | Qué se envía y cuánto cuesta | Cada tarjeta muestra texto exacto, imágenes numeradas con su para qué, modelo y precio; el total es la suma. Con más referencias que el máximo del modelo, la tarjeta se bloquea con aviso |
| H8 | Preparar no gasta | Tras «Preparar», cero operaciones nuevas y la sesión guardada |
| H9 | Generar con una autorización | Un clic crea una operación por vista suelta marcada (o una sola para la hoja), todas con `id_peticion` distinto y estable. Un doble clic no crea más. Por encima del presupuesto pide confirmación. Cada operación reserva su estimación al autorizarse |
| H9b | Lote a medias y recarga | Con una vista fallida, su reserva se libera y la barra ofrece «Generar las que faltan» con su precio. Una incierta cuenta como reservado y no se reofrece. Si se marca fallida, pasa a posible cargo de su intento, deja de estar reservada y sí se reofrece. Reintentar no borra ese posible cargo, y «No hubo cargo» o «Hubo cargo…» lo resuelven solo en su intento. Si se recarga entre fases, las `preparada` no se autorizan solas. Repetir el lote no crea operaciones nuevas |
| H10 | Comparar y aprobar | «Aprobar para el borrador» añade la referencia con su vista y su expresión al borrador; no marca ★; la ★ no vincula. La toma muestra «Aprobada · borrador vN» |
| H11 | Identidad perdida | «No mantiene la identidad» descarta sin borrar y ofrece corregir editando, revisar la dirección o regenerar, cada una con precio y sin ejecutarse |
| H12 | Reabrir | Cerrar y volver recupera paso, vistas y su estado. Una generación en curso al cerrar se reconcilia sin duplicarse |
| H13 | Recorrido de aceptación de la 18.66, en su versión básica | Crear un personaje, aprobar su ancla y la dirección de la hoja, y preparar tres vistas distintas sin volver a escribir sus rasgos ni perder lo decidido. La estética del proyecto completa queda para la segunda receta |
| H14 | Vista y expresión por separado | Una referencia «frontal + sonrisa amplia» y otra «perfil + neutra» se distinguen en la ficha y en la barra; el texto de «cuerpo entero» pide de pies a cabeza y una sola persona; en la imagen se comprueba en la prueba real |
| H15 | Siguiente acción | En cada fila de §4.12 hay una sola acción principal, igual en el panel y en la barra. Nunca se queda solo un botón desactivado. Con vistas esperando la referencia principal no aparece «No queda ninguna vista por generar» |
| H16 | Referencia principal desde cero | El primer retrato ofrece «Elegir como referencia principal», «Generar otro» y «Descartar», sin «Comparar». Tras elegir, la acción es «Continuar con las vistas pendientes» |
| H17 | Borrador y publicación | Una imagen aprobada dice «Aprobada · borrador v2» hasta publicar. Solo después dice «En la ficha v2». La cabecera nunca contradice a la toma |
| H18 | Campos y preguntas | Con edad 65 y procedencia rellenas no se pregunta ninguna de las dos. El nombre se ve en la cabecera, la carpeta y el panel. Se puede responder con texto propio |
| H19 | Coherencia de lo que se conserva | Pescador con «jersey verde oscuro y camisa de cuadros» marcado «Se conserva»: todas las vistas lo nombran, y ninguna dice «no copies la ropa» |
| H20 | Costes discretos | El precio solo está en el botón y en cada tarjeta. El detalle se abre desde la pastilla de gasto. Solo se destacan: supera el presupuesto, cambio de precio y petición sin confirmar |
| H21 | Distribución | A 1 280 px, panel al lado; a ~900 px, panel superpuesto; a 390 px, panel a pantalla completa. El inspector deja ver las acciones sin desplazarse |
| H22 | Hoja compuesta | «Generar hoja · 0,15 $» → «Recortar en vistas» (vista previa de los cortes, sin coste) → tres recortes con su vista y resolución → aprobar o «Crear vista independiente · 0,15 $». La hoja sigue intacta |
| H23 | Recorte sin coste, ajustable y validado | Recortar no crea operaciones ni cambia el gasto. Las líneas de corte se mueven en la vista previa, sin cruzarse y sin bajar del 10 % del ancho. El servidor rechaza con 422 cajas fuera de la hoja, solapadas, demasiado pequeñas o en número distinto al de paneles. Dos peticiones simultáneas con las mismas cajas dejan un solo juego de recortes. La resolución mostrada coincide con la de cada recorte. Los recortes son PNG con los píxeles del original. Recortar dos veces con las mismas cajas no duplica |
| H24 | Hoja conservada | Después de recortar, el hash del medio de la hoja no cambia. Borrar la hoja con recortes devuelve 409. Al aprobar un recorte, la hoja entra en el borrador con rol `hoja` y no viaja en la siguiente generación |
| H25 | Vista independiente | «Crear vista independiente» genera con la referencia principal y sin el recorte. Si se aprueba, pasa a ser la seleccionada en el borrador. El recorte sigue en la Mesa, con su medio, su toma y su historial, y se puede volver a seleccionar. «Aumentar resolución» no aparece en la construcción |

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
   - H23: recortar no crea operaciones; PNG sin reescalar; las mismas cajas no duplican; cada regla de las cajas devuelve su 422; dos peticiones lanzadas a la vez (`asyncio.gather`) dejan un juego de medios y tomas; un `en_curso` cortado se reanuda.
   - §4.9a: preparar, cambiar un campo o el precio del catálogo y generar devuelve 409 sin crear operaciones; la misma preparación dos veces no duplica.
   - PIC-02 en el lote: incierta = reservado; marcada fallida = posible cargo del intento; reintento autorizado = reserva nueva más el posible cargo anterior; «No hubo cargo» solo en su intento.
   - H24: el hash de la hoja no cambia; borrarla devuelve 409; el rol `hoja` no viaja.
   - H25: la vista independiente sale sin el recorte; la selección en el borrador es reversible y no borra nada.
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
   - H19: pescador con el vestuario conservado: ninguna línea dice «no copies la ropa». Con el pelo «Puede variar»: ninguna línea pide conservar el pelo y todas dicen «no copies» el pelo. Con persona real, la cara se conserva siempre.
   - H18: las preguntas salen de los campos obligatorios vacíos, nunca de los rellenos.
   - H14: vista y expresión se guardan en campos separados.
3. **Frontend (`node --test`):** preguntas que faltan, vistas por uso, total previsto, recuperación de la sesión, la siguiente acción para cada fila de §4.12 (H15), el primer retrato sin «Comparar» (H16) y las líneas de corte de la vista previa (H23).
3b. **Recorrido visual** a 1 280, ~900 y 390 px (H21).
4. **Validación de Juan en la interfaz:** el recorrido H13 en una instancia aislada, primero con `simulado`.
5. **Validación real (aparte y autorizada):** la prueba de D13 de §11: el mismo personaje inventado y la misma referencia principal, con retrato, hoja de 3 paneles y 3 vistas sueltas (5 imágenes, unos 0,75 $ al precio verificado ese día). Decide D13 y D12. Es la única prueba que dice algo de la continuidad.

## SDD-04 · Decisiones pendientes (cada una con recomendación)

| # | Decisión | Recomendación |
|---|---|---|
| D1 | ¿Dónde caen las tomas: carpeta del Taller o destino `ficha`? | **Carpeta del personaje en el Taller** («Personaje · Marta»). Así se reutilizan Mesa, versiones, comparar, ★ y Ajustar. La ficha recibe solo lo aprobado. La hoja del paso de elementos se deja como está y se retira cuando PIC-05 esté validado |
| D2 | ¿Relación con la 18.53 (modo personaje, aprobada y aplazada)? | **PIC-05 toma su método** (preguntas de dos en dos, la cara al final, rasgos que se conservan con su LADO) en versión por reglas. La 18.53 sigue aplazada para la entrevista de carácter y mundo |
| D3 | ¿Vistas sueltas o hoja compuesta de la 18.41? | **Sustituida por D13, que sigue abierta.** Se construyen las dos formas; las vistas sueltas siguen disponibles y además sirven como vista independiente para corregir o tener más detalle |
| D4 | Fondo y luz por defecto (EVA: blanco y estudio; VDLT: gris claro y ventana lateral) | **Gris claro y ventana lateral suave**, editables. Es lo que proponen las guías VDLT; se revisa en los resultados de la prueba de D13 |
| D5 | ¿El Director usa un modelo de texto en PIC-05? | **No en este incremento, y se dice claro:** PIC-05 entrega una *receta guiada por reglas* y no el agente que interpreta la necesidad (§4.6). El agente especializado sigue pendiente, con su propio SDD (modelo, coste por llamada, contexto y pruebas). Recomiendo abrirlo justo después de validar PIC-05, para que use la sesión y las fichas que deja hechas |
| D6 | ¿Colección nueva o reutilizar `borradores_mesa`? | **Colección nueva `sesiones_director`.** El borrador guarda un texto; la receta guarda un recorrido |
| D7 | ¿El ancla se marca o se deduce? | **Se marca (`ancla: true`)**, una por versión. Deducirla de «la primera frontal» se rompe al reordenar |
| D8 | ¿Cuántas expresiones? | **De 1 a 3, una por imagen,** elegidas de seis (neutra, sonrisa amplia, risa, sorpresa, seria, pensativa). Más se hace en otra ronda |
| D9 | ¿Presupuesto del Taller y del lote? | **El global, como hoy, con el lote de §4.9:** el servidor comprueba el total, se crea en dos fases y cada operación reserva al autorizarse. Lo que falla con rechazo se libera, lo incierto queda como posible cargo y nada se reautoriza solo. Un presupuesto por espacio queda propuesto aparte |
| D10 | ¿Vincular a la ficha marca favorita? | **No.** Se separan; las tomas ya vinculadas con ★ la conservan |
| D11 | ¿Aprobar una vista exige comparar antes? | **No obliga, pero lo propone:** «Aprobar para el borrador» abre la comparación con la referencia principal. No aplica al primer retrato, que todavía no tiene con qué compararse |
| D12 | ¿Modelo para la hoja? | **El más económico que cumpla tres condiciones:** 1) admite las referencias que necesita la vista (hasta 3); 2) admite edición, para «corregir editando» (§4.7); 3) su calidad está **validada para este trabajo**, con una prueba corta autorizada (el mismo ancla y las mismas tres vistas, comparadas con la lista de §4.7). El precio solo decide entre los que cumplen las tres. Hoy solo cumple las dos primeras Nano Banana Pro en fal (6 referencias, con edición), y su calidad para hojas está sin validar. Los candidatos baratos del §9.7 pasan por la misma prueba antes de ser el modelo por defecto |
| D13 | ¿Recorrido por defecto: hoja compuesta, vistas sueltas o híbrido? | **Sin decidir, y no se decide por silencio.** Recomendación: híbrido (§4.11). En la construcción se hacen **las dos formas**, con la híbrida como opción por defecto **provisional y solo en simulado**. La elección definitiva la toma Juan, de forma explícita, después de la prueba real de §11 (unos 0,75 $). Hasta entonces, la interfaz marca la opción como «provisional» |
| D14 | ¿Se conserva el término «ancla»? | **En la interfaz no: «referencia principal»,** con su ayuda la primera vez. «Ancla» queda en el código y en este documento |
| D15 | ¿Dónde está el gasto? | **Una pastilla discreta en la cabecera con «Detalle de costes».** El precio se ve en el botón; los avisos solo aparecen cuando hay que decidir (§4.10) |
| D16 | ¿Qué pasa si la hoja no sale en paneles iguales? | **Ajustar las líneas de corte en la vista previa** (§4.14a): mover cada línea y el margen superior e inferior, viendo la resolución resultante. Generar por separado solo si los paneles no se pueden separar con cortes verticales. Sin detección automática |
| D17 | ¿El recorte es una operación del motor? | **No:** es una acción local, sin coste, con su traza en `Medio` y `Toma` (§4.14a) |
| D18 | ¿La hoja entra en la ficha? | **Sí, con rol `hoja`, que no viaja,** al aprobar el primer recorte. Queda protegida contra el borrado mientras tenga recortes o esté en una ficha (§4.14b) |
| D19 | ¿Viaja el recorte al crear una vista independiente? | **No.** Solo la referencia principal y la dirección; el recorte añadiría una cara más |
| D20 | ¿«Aumentar resolución» en PIC-05? | **No.** Queda para la 18.13, con un modelo y un precio verificados. En la maqueta aparece desactivado |

## SDD-08 · Despliegue

- Rama `pic-05/sdd-hoja-personaje`: solo documentación y maqueta. Sin fusionar.
- El código, cuando se autorice, va en `pic-05/director-hoja`, creada desde esa rama sin pasar por `main`, y en una instancia aislada (`picasso_pic05`, `simulado`), igual que PIC-04.
- Fusión y despliegue con respaldo de base y medios, etiquetas `antes-pic05` y vuelta atrás, cada paso con autorización de Juan.

## 11. Encargo de construcción (preparado; no empieza sin la autorización de Juan)

**Puerta para empezar.** Juan revisa el SDD completo y la maqueta, y autoriza de forma explícita la construcción aislada, con las recomendaciones de D1–D20 o con sus cambios. **D13 queda abierta:** se construyen las dos formas (hoja y vistas sueltas), con la híbrida como opción por defecto provisional, solo en simulado. Nada de esto vale como aprobación de D13. Se decide después de la prueba real.

**Dónde.**
- Rama `pic-05/director-hoja`, creada desde `pic-05/sdd-hoja-personaje`, que ya contiene el `main` actual y los documentos revisados. **No hace falta fusionar nada en `main` para empezar.** La fusión de documentos y de código se hará al final, con la autorización de Juan.
- Instancia aislada, como en PIC-04:
  - proyecto de compose propio, con base `picasso_pic05` y `DB_NAME_PRUEBAS=picasso_pic05`;
  - imágenes y volumen de medios propios;
  - **puertos 3014 (interfaz) y 8014 (API)**, propuestos por el revisor. Antes de levantarla se comprueba que estén libres. Si no lo están, se para y se consulta.
- Sin claves de proveedores en la instancia: `FAL_KEY` y `OPENAI_API_KEY` vacías. Solo el proveedor `simulado`.
- La instalación de Juan no se toca.

**Fases**, cada una con sus pruebas en verde antes de la siguiente:

| Fase | Qué | Pruebas que la cierran |
|---|---|---|
| B1 · Datos | Roles `tres_cuartos`, `cuerpo_entero` y `hoja`; `ancla`; `expresion`; `direccion_hoja`; campos del personaje (§4.2a); `Medio.origen=recorte`, `medio_origen_id`, `caja`; `Toma.motivo_descarte`; colección `sesiones_director` | pytest de modelos; las fichas existentes se leen igual (compatibilidad) |
| B2 · Textos | Plantillas de retrato, vista y hoja; línea de la referencia principal según lo conservado; resumen de lo que se conserva; persona real | pytest, incluida la comprobación del pescador (H19) |
| B3 · Lote | Preparación inmutable con huella (409 si cambió), total comprobado en el servidor, dos fases, incierta como reservado y fallida marcada como posible cargo del intento, reserva por operación, `id_peticion` por vista, repetir sin duplicar, reconciliar | `p19_director_hoja.py`: H8, H9, H9b |
| B4 · Recorte y ficha | Vista previa con líneas ajustables y `cajas`; validación de cajas (422); `recortar` idempotente con índice único y peticiones simultáneas; PIL sin reescalar; selección en el borrador que conserva lo sustituido; usos nuevos en R1, hoja con rol `hoja`, `pasar-a-ficha` con rol, ancla y expresión y sin tocar ★, publicar | p19: H10, H17, H23, H24, H25; p16 sigue en verde |
| B5 · Interfaz | Panel del Director con la receta; barra con la siguiente acción (§4.12); inspector compacto; costes discretos (§4.10); distribución por anchos (§4.13) | `node --test` de la siguiente acción y de las preguntas; batería completa |
| B6 · Recorrido | Juan recorre la instancia aislada con `simulado`: desde cero hasta publicar, más recarga, fallo y sin confirmar | Validación de Juan en la interfaz (H13, H15, H16, H18, H21) |

**Entrega de la construcción:**
- commits de la rama;
- batería completa en verde (`scripts_pruebas/en_docker.sh`, pytest y `node --test`);
- capturas o grabación del recorrido en `~/dev/picasso-evidencias/pic05-…`;
- lista de lo que queda sin validar.

Sin fusión ni despliegue.

**Fuera de la construcción:**
- aumentar resolución (18.13);
- el agente del Director;
- el ayudante de prompts (§12);
- extracción desde Pinterest;
- análisis de estilos;
- proveedores nuevos (§9.7);
- la hoja compuesta de la 18.41 como lámina para imprimir.

**Prueba real (aparte, con su presupuesto).** Cuando B6 esté cerrado, Picasso prepara la prueba de D13: el mismo personaje inventado y la misma referencia principal, con una hoja de 3 paneles y 3 vistas sueltas. Son 4 imágenes más el retrato, unos 0,75 $ al precio verificado ese día. Antes de cada envío se enseña el precio, y lo autoriza Juan. Sirve para decidir D13 y la calidad del modelo para hojas (D12). Es la única prueba que dice algo de la continuidad.

## 12. Siguiente prioridad del Director: el ayudante de prompts

Después de PIC-05, el Director sigue con el **ayudante de prompts**, que reutiliza lo que deja esta receta:
- los campos del personaje (§4.2a);
- lo que se conserva y lo que varía;
- la dirección de la hoja y de cada vista;
- vista y expresión;
- la referencia principal;
- las plantillas de B2.

Se apoya en la 18.52 (prompt verificado, revisión con severidad) y en la 18.66 (Director). Necesita su propio SDD. Queda anotado en el backlog (§21 del maestro) sin aprobar.

## Mapa de reutilización

| Necesidad | Se reutiliza | Cambio |
|---|---|---|
| Superficie | Mesa y lateral único (PIC-03) | Contenido de la pestaña Director |
| Personaje | `Elemento`, `FichaVersion`, versiones y aprobación | Dos roles, `ancla`, `expresion`, `direccion_hoja` |
| Referencias | Biblioteca, `SubidorMedios`, `_referencias` (18.22, 18.20), protección de medios (R1) | Uso por rol |
| Generar | `crear_operacion` y `autorizar`, `id_peticion`, catálogo | Lote de vistas en dos fases (§4.9) |
| Coste | Tres capas, reserva al autorizar, costes por intento, posible cargo, presupuesto, `PermissionError` | Total del lote en el servidor y estado por vista |
| Revisar | Comparador, ★, descartar, nota, «Cómo se hizo», Ajustar | «Comparar con la referencia principal», motivo `identidad`, «Seleccionar para el borrador» |
| Vincular | `pasar-a-ficha` | Acepta carpeta, rol y ancla; deja de marcar ★ |
| Dirección | Controles del Taller | «Fondo» y «Acabado», dirección de la hoja guardada, excepciones por vista |
| Reabrir | `?carpeta=`, `id_peticion`, patrón de `borradores_mesa` | `sesiones_director` |
| Método | Guías VDLT (hoja principal, refuerzos), EVA (ancla), Arquitecto de Personaje (rasgos que se conservan), 18.20, 18.22, 18.27, 18.28, 18.36, 18.41, 18.42 | Se toma el método, no el texto |

## Vinculadas en el backlog (conservan su estado)

18.66 (madre), 18.53 y 18.52 (aplazadas), 18.27, 18.28 y 18.36 (aprobadas y aplazadas), 18.41 y 18.42 (propuestas), 19.6 (pendiente), 18.20 y 18.22 (construidas), 18.21, 18.40, 18.49 y 18.58 (estética y análisis, fuera), 18.55 (cámara 3D, fuera), §9.7 (proveedores, fuera).
