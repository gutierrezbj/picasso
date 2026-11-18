# PIC-04 · «Mejorar mi descripción» con su coste delante

**Estado:** borrador, revisión 3 (18-11-2026), en la rama `pic-04/sdd-mejorar`. Sin código y sin autorización para construir. Los puntos **[DECIDIR]** se cierran con Juan y llevan la recomendación entre paréntesis.
- Revisión 1: `2c88289`.
- Revisión 2: correcciones del revisor del 18-11-2026:
  - la reserva no es un máximo;
  - el coste por tokens es un cálculo según tarifa, no un importe informado;
  - la respuesta cortada no se acepta;
  - D3 queda pendiente de verificar;
  - original y propuesta van atados a su borrador;
  - los parámetros son propuestas para probar;
  - 18.29 y 19.29 no se cierran sin demostrarlo.
- Revisión 2: `9d81204`.
- Revisión 3: segunda revisión del revisor del 18-11-2026:
  - un 5xx no demuestra rechazo, así que queda incierta;
  - el coste se lleva por intento y se suma al reintentar;
  - se guarda la tarifa completa aplicada;
  - el borrador es recuperable y «Editar» trabaja sobre una copia;
  - los límites de entrada quedan definidos;
  - se quita la falsa cota de tokens;
  - el cierre del Módulo 1 se separa de PIC-04.

**Origen:** PIC-01 D13 y §13.3: «Mejorar» quedó desactivado en la Mesa hasta poder enseñar su coste antes de usarlo, y la estimación previa con tope exigía volver a verificar la tarifa.

**Fuera de alcance:** el Director de Studio (18.52), otros usos del asistente, «Nombrar lo que salió» (18.24) y cualquier cambio en la generación de imágenes.

## 1. Qué hay hoy (comprobado en `main`, `9d2b07f`)

- **Botón:** `taller-mejorar` en la barra de la Mesa, con `disabled` fijo y el título «desactivado hasta que enseñe su coste antes de usarlo» (`frontend/src/pantallas/Taller.tsx`).
- **Endpoint:** `POST /api/espacios/{e}/taller/mejorar` (`backend/app/api/taller.py`). Llama a OpenAI en el acto y devuelve `{texto, cambios, coste}`.
- **Driver:** `backend/app/asistente/openai_texto.py`.
  - Modelo `gpt-6.1-sol` en la Responses API (`POST /v1/responses`).
  - Tarifa escrita en el código: 2,00 $ entrada y 10,00 $ salida por millón, verificada el 15-10-2026.
  - **No envía `max_output_tokens` ni `reasoning.effort`.** El gasto de una llamada no tiene tope.
- **Gasto:** se guarda en la colección `asistente_usos`, que **nadie lee**.
  - No entra en el Registro, ni en los totales de PIC-02, ni en el CSV.
  - Un error, un tiempo agotado o una respuesta perdida no deja ningún rastro.
  - No hay `id_peticion`: un doble clic hace dos llamadas.
- **Propuesta:** la interfaz **sustituye el texto en el acto** y guarda el anterior solo en memoria del navegador (`mejora.antes`). Al recargar, el original se pierde.
- **Instrucciones:** 1 128 caracteres (1 153 bytes en UTF-8), fijas. Además se envían el texto del usuario, el formato y los rasgos de cada referencia.

## 2. Modelo y tarifa (verificados el 18-11-2026)

| Dato | Valor | Fuente |
|---|---|---|
| Modelo | `gpt-6.1-sol`, único snapshot, sin marca de obsoleto | developers.openai.com/api/docs/models/gpt-6.1-sol |
| Tarifa estándar (contexto ≤ 272K) | 2,00 $ entrada · 0,10 $ entrada en caché · 10,00 $ salida, por millón de tokens | developers.openai.com/api/docs/pricing |
| Otros modos del mismo modelo | Batch y Flex: 1,00 / 0,05 / 5,00. Fast: 4,00 / 0,20 / 20,00. Contexto largo: 4,00 / 0,20 / 15,00. Residencia regional: +10 % | La misma página |
| Razonamiento | Lo admite. `reasoning.effort`: `low`, `medium` (por defecto), `high`, `xhigh`, `max` | Página del modelo |
| Tokens de razonamiento | «se facturan como tokens de salida» | developers.openai.com/api/docs/guides/reasoning |
| `max_output_tokens` | Limita todo lo generado, razonamiento incluido. Si se alcanza, la respuesta queda `incomplete` con `reason: max_output_tokens`, **a veces sin texto visible** | La misma guía |
| Salida máxima del modelo | 128 000 tokens | Página del modelo |

**Sin cambios respecto al 15-10-2026.** Picasso usa la tarifa estándar: no pide Fast, Batch, Flex ni residencia regional.

**Caché de la entrada** (developers.openai.com/api/docs/guides/prompt-caching, 18-11-2026):
- `input_tokens` incluye las lecturas de caché (`cached_tokens`) y las escrituras (`cache_write_tokens`). La entrada normal es lo que queda: el ejemplo de la guía resta las dos de `input_tokens`.
- Las lecturas se cobran a la tarifa de entrada en caché.
- Las escrituras se cobran más caras que la entrada normal:
  - 1,25× con la duración por defecto de 30 minutos;
  - 2,5× con la de 12 horas.
- La caché empieza en 1 024 tokens de prompt (GPT-5.6 en adelante).
- En la fila de `gpt-6.1-sol` de la página de precios aparecen 2,50 $ y 5,00 $, que coinciden con 1,25× y 2,5× de 2,00 $. **Falta confirmar las cabeceras de esas columnas antes de implementar.**

**Campos de consumo de la respuesta** (referencia de `POST /v1/responses`, objeto Response, 18-11-2026):
- `usage.input_tokens`, `input_tokens_details.cached_tokens`, `output_tokens`, `output_tokens_details.reasoning_tokens` y `total_tokens`.
- Estados posibles: `completed`, `failed`, `in_progress`, `cancelled`, `queued` e `incomplete`.
- La referencia **no dice** si `output_tokens` ya incluye `reasoning_tokens`. La guía de razonamiento dice que el razonamiento «se factura como tokens de salida», pero no aclara el campo.

**No verificado todavía, y necesario antes de decidir D3:**
- en modo segundo plano, si `GET /v1/responses/{id}` devuelve `usage`, la lista completa de estados (la guía solo nombra `queued` e `in_progress` como no terminales) y cuánto tiempo se puede recuperar una respuesta;
- si contar tokens (`POST /v1/responses/input_tokens`) se cobra. La página no lo dice, y este diseño no depende de ello;
- los valores de `incomplete_details.reason` además de `max_output_tokens`;
- las cabeceras de las columnas de escritura en caché (arriba).

## 3. Reserva estimada antes del clic (no es un máximo)

El botón deja de ser un icono mudo y enseña la cifra: **«Mejorar · ≈ X $ · reserva estimada Y $»**. **No se usa la palabra «máximo».** La entrada no tiene una cota demostrada: que un token de texto ocupe al menos un byte es una propiedad de cómo trocea el texto el modelo, pero OpenAI no la documenta.

**Qué se envía de verdad, y se mide antes de enviar** (`taller.py`, `mejorar`):

| Parte | Tamaño hoy | Límite propuesto |
|---|---|---|
| Instrucciones fijas (`INSTRUCCIONES_MEJORAR`) | 1 153 bytes UTF-8 | Fijas; si cambian, se vuelven a medir |
| «Prompt del usuario: » + texto | Sin límite | **2 000 caracteres.** Por encima, el servidor responde 422 y el botón explica por qué |
| «Formato: » + relación | Unos 15 bytes | Solo los valores de la lista de formatos |
| Número de referencias | Sin límite en Mejorar | **6**, el máximo del catálogo hoy (`fal-nano-banana-pro`), y nunca más de las que admita el modelo elegido. Por encima, 422 |
| Por referencia, nombre | Sin límite | **80 caracteres**. Se recorta con «…» y la vista previa lo muestra |
| Por referencia, rasgos de su ficha | Sin límite. En la base de Juan, el más largo ocupa hoy 112 caracteres | **400 caracteres** unidos con «; ». Se recorta con «…» y la vista previa lo muestra |
| Formato del mensaje que añade la API | Desconocido | **Margen de 256 tokens**, sumado a la entrada. Es una cifra propuesta, no demostrada |

**Reserva estimada** = (bytes medidos de todo lo anterior + margen) × tarifa de entrada + `max_output_tokens` × tarifa de salida.
- **La parte de salida sí tiene tope:** OpenAI no genera más de `max_output_tokens`, razonamiento incluido (guía de razonamiento).
- **La parte de entrada es una estimación por exceso**, no una garantía.

**Estimación (≈):** cifra típica, también sin garantía. Sale de la entrada medida más una salida típica, y después se ajusta con la media de lo calculado en las últimas llamadas del estudio.

Al pasar el cursor: «Estimación y reserva calculadas por Picasso con la tarifa del DD-MM-AAAA. La salida tiene un tope; la entrada se estima por exceso. Ninguna de las dos es una cifra garantizada por OpenAI».

**Ejemplo de cálculo, no una cota.** Con 300 bytes de texto, dos referencias de unos 150 bytes cada una y `max_output_tokens` = 2 000:
- **Entrada:** 1 153 + 20 + 300 + 300 bytes, más 256 de margen, son unos 2 030 «tokens por exceso» → unos 0,004 $ a la tarifa de entrada normal.
- **Salida:** 2 000 tokens → 0,020 $.
- **Reserva estimada:** unos 0,024 $.

La entrada se mide en cada llamada. Si la caché llegara a escribirse, la entrada podría costar hasta 2,5× (§4.3), y eso la reserva no lo cubre. Es otra razón para no llamarla máximo.

**Parámetros propuestos para probar, sin aprobar** (antes D1 y D2):

| Parámetro | Valor propuesto | Motivo |
|---|---|---|
| `max_output_tokens` | 2 000 | La respuesta visible son unas 110 palabras y 2 a 6 cambios en JSON |
| `reasoning.effort` | `low` | Con `medium`, el valor por defecto, el razonamiento puede comerse el tope y dejar `incomplete` sin texto |
| Longitud del texto | 2 000 caracteres | Que la reserva no se dispare. Por encima, el botón explica por qué no se puede |

Se fijan con lo que salga de las pruebas y de la validación real, y Juan los aprueba entonces.

## 4. Gasto en las capas de PIC-02, sin piezas nuevas de contabilidad

Mejorar pasa a ser **una operación del motor**: acción nueva `mejorar_texto` y proveedor nuevo `openai_texto`. Hereda, con el único cambio en `coste_de` descrito abajo:
- `crear_operacion`;
- `autorizar`;
- el worker;
- los intentos;
- `coste_de`;
- los totales;
- el Registro;
- el CSV;
- «Comprobar»;
- «No hubo cargo» y «Hubo cargo…»;
- `id_peticion`.

`asistente_usos` deja de escribirse. No se migra: tiene los registros antiguos.

**El coste por tokens no es un importe informado.** OpenAI devuelve tokens, no un importe. Picasso los multiplica por la tarifa verificada, y eso sigue siendo **un coste calculado según tarifa**.
- Va a un campo nuevo del intento, `coste_segun_tarifa`, con el desglose de tokens y `tarifa_verificada_en`. Se copia a la operación como su coste.
- `coste_estimado` sigue siendo la foto de la reserva al enviar, como manda PIC-02 §2.1. No se sobrescribe.
- **Único cambio en `coste_de`:** una operación terminada con `coste_segun_tarifa` cuenta ese valor en la capa **estimado**, en lugar de su `coste_estimado`.
- **Nunca** va a `coste_informado`.
- **Nunca** aparece como «cobrado» ni como «informado».
- En el Registro, el Importe dice: «según tarifa: N tokens de entrada y M de salida × tarifa del DD-MM-AAAA (sin importe del proveedor)».
- Pasa a informado solo si Juan apunta un cargo real con «Hubo cargo…», como en PIC-02.

| Momento | Qué queda | Capa en PIC-02 |
|---|---|---|
| Al pulsar | Operación `autorizada`, con `coste_estimado` = **reserva estimada** y `tarifa_verificada_en` | reservado |
| Enviada | `enviada` / `en_curso` | reservado |
| Completa | `coste_segun_tarifa` = tokens de `usage` × tarifa, con el desglose | estimado |
| Cortada (`incomplete`, `max_output_tokens`) | Igual, con el consumo que traiga `usage`. El intento guarda el motivo y el texto parcial | estimado |
| Rechazo 4xx de la petición (clave, modelo, parámetros o formato) | `fallida`. OpenAI no aceptó el trabajo. Si la respuesta trae `usage`, se apunta como estimado | nada, o estimado |
| Error 5xx al crear | **`incierta`**: un 5xx no demuestra que no se procesara (la lección de PIC-03). Nunca `fallida` sin más | reservado, y al marcarla fallida, posible cargo |
| Respuesta con estado `failed` o `cancelled` y su `usage` | `fallida`, con el consumo que traiga apuntado como estimado | estimado |
| Sin respuesta después de enviar (tiempo agotado o corte) | `incierta` (§4.1) | reservado, y al marcarla fallida, posible cargo |
| Doble clic o recarga | Mismo `id_peticion` → la misma operación (PIC-03) | — |

**Cómo se habla con OpenAI: D3 queda pendiente.** No se decide hasta verificar lo que falta en §2: recuperación, estados y consumo de la respuesta en segundo plano.
- **Opción A, segundo plano (`background: true`):** `enviar` devuelve el id de la respuesta y `consultar` hace `GET /v1/responses/{id}`. Encaja en el contrato del worker.
- **Opción B, llamada directa** como hoy, con un tiempo de espera largo.

### 4.1 Respuesta perdida o 5xx
- **Opción A, se pierde la respuesta inicial antes de guardar el id** (corte de red, tiempo agotado o caída del backend entre el POST y la escritura en la base):
  - OpenAI puede haber aceptado el trabajo y Picasso no tiene con qué consultarlo, ni conoce ninguna forma de buscarlo sin el id (la guía no menciona metadatos ni claves de idempotencia);
  - la operación queda `incierta`, sin id remoto, y «Comprobar» dice «no se puede consultar: no llegó el identificador»;
  - marcada fallida, el posible cargo es **la reserva estimada**;
  - se resuelve a mano con «No hubo cargo» o «Hubo cargo…», mirando el panel de uso de OpenAI;
  - el texto, si llegó a generarse, se da por perdido;
  - no se reenvía nada solo.
- **Opción A, con el id guardado y sin poder consultar:** queda `incierta` y «Comprobar» lo reintenta cuando Juan lo pide.
- **Opción B, cualquier corte o 5xx después de enviar:** igual que el primer caso de la opción A.
- **5xx en una consulta (`GET`) con el id guardado:** no cambia nada. La operación sigue en curso o `incierta`, y «Comprobar» lo vuelve a intentar cuando Juan lo pide.

### 4.2 Coste por intento y reintentos

**Cada intento lleva su propio consumo, y ninguno se borra ni se sustituye** (PIC-02 §2.2).

| Campo del intento | Qué guarda |
|---|---|
| `coste_estimado` | La reserva estimada al enviar ese intento. Es una foto fija |
| `consumo` | Los tokens de `usage` tal como llegan: entrada, lecturas de caché, escrituras de caché, salida, razonamiento y total |
| `tarifa_aplicada` | La tarifa completa usada en el cálculo (§4.3) |
| `coste_segun_tarifa` | El resultado de ese cálculo, solo si hubo `usage` |
| `estado_respuesta` | `completed`, `incomplete` (con su `reason`), `failed` o `cancelled` |

**Reintentar** es un clic nuevo de Juan sobre la operación: «Volver a pedir · reserva estimada Y $». Nunca es automático.
- Se ofrece tras una respuesta `incomplete`, `failed`, `cancelled` o `incierta` marcada fallida.
- Crea un intento nuevo en la misma operación, con su reserva, y queda atado al mismo borrador (§5).

**Coste de la operación** = suma de `coste_segun_tarifa` de **todos** sus intentos, más los cargos de PIC-02.
- Un intento `incomplete` que consumió tokens sigue sumando aunque el siguiente termine bien.

**Cambio en `coste_de` (PIC-02 §2.3), el único:**
- una operación terminada cuyos intentos tengan `coste_segun_tarifa` cuenta la suma en **estimado**, en lugar de su `coste_estimado`;
- los intentos sin `usage` siguen el camino de PIC-02: reserva mientras está en curso y posible cargo si se marca fallida;
- las demás operaciones no cambian.

**Registro:** una línea por intento bajo la fila de la operación. Por ejemplo:
- «Intento 1: incompleta (`max_output_tokens`) · según tarifa 0,021 $»;
- «Intento 2: completa · según tarifa 0,012 $».

**CSV:** columnas nuevas por operación:
- `coste_segun_tarifa`, que es la suma;
- `intentos_con_consumo`;
- `tokens_entrada`, `tokens_cache_lectura`, `tokens_cache_escritura`, `tokens_salida` y `tokens_razonamiento`, sumados.

La tarifa aplicada va por intento en un CSV de intentos, o en una columna JSON. Se decide al implementar, sin cambiar las columnas de PIC-02.

### 4.3 Tarifa aplicada, completa e inmutable

**Cada intento guarda la tarifa entera con la que se calculó**, no solo su fecha:
- modelo;
- moneda;
- unidad (por millón de tokens);
- entrada normal;
- entrada en caché (lectura);
- escritura en caché a 30 minutos y a 12 horas;
- salida;
- nivel de servicio (estándar);
- fecha de verificación;
- URL de la fuente.

Nunca se recalcula con una tarifa posterior.

**Cálculo:**
- entrada normal = `input_tokens` − `cached_tokens` − `cache_write_tokens`, a la tarifa de entrada;
- lecturas de caché = `cached_tokens`, a la tarifa de caché;
- escrituras de caché = `cache_write_tokens`, a su tarifa según la duración (`cache_write_tokens_details`);
- salida = `output_tokens`, a la tarifa de salida.

**Los tokens de razonamiento no se suman aparte.** `reasoning_tokens` se guarda solo como desglose. Como la referencia no dice si `output_tokens` ya los incluye, cada respuesta se comprueba:
- **si `total_tokens` = `input_tokens` + `output_tokens`:** el razonamiento ya está dentro de `output_tokens`;
- **si no cuadra:** el intento se marca «consumo sin cuadrar», el cálculo **no** suma el razonamiento por su cuenta y el caso se revisa antes de seguir. Así no se cuenta dos veces.

**Si llega un campo de `usage` que Picasso no conoce:** el intento lo guarda tal cual y queda marcado «consumo con campos desconocidos». Esto evita calcular a ciegas.

## 5. La propuesta: revisar, aceptar o descartar, atada a su borrador

### 5.1 Dónde vive el borrador

**Colección nueva `borradores_mesa` en el servidor**, para poder recuperarlo tras recargar o desde otro navegador.

| Campo | Qué es |
|---|---|
| `id` | Identificador del borrador |
| `espacio_id`, `carpeta_id` | Dónde se trabaja |
| `alcance` | `{tipo: "nueva"}` o `{tipo: "editar", toma_id}` |
| `revision` | Entero que sube con cada cambio guardado del texto |
| `texto` | El texto de la barra en esa revisión |
| `mejoras` | Lista de `{operacion_id, revision}`: cada Mejorar pedido y la revisión a la que respondía |
| `copia_propuesta` | `{operacion_id, texto}`: la copia de la propuesta que se está editando, si la hay |
| `actualizado_en` | Fecha del último cambio |
| `cerrado_en` | Cuándo se generó con él; desde entonces no admite cambios |

**Cómo se usa:**
- **Al escribir,** la barra guarda el texto con `PUT /api/borradores/{id}`, con un retraso corto y enviando la revisión que tiene. Si el servidor ya tiene una revisión mayor, responde 409 y la barra no pisa nada.
- **El navegador recuerda** el `id` del borrador activo por espacio y carpeta en `localStorage`, como ya hace con la petición pendiente (PIC-03).
  - Si se pierde, se recupera el borrador más reciente de esa carpeta y ese alcance con `GET /api/espacios/{e}/borradores?carpeta_id=…&alcance=…`.
- **Al pulsar Mejorar,** la petición lleva `borrador_id` y `revision`. La operación guarda en su entrada, que es inmutable:
  - `borrador_id`;
  - `revision`;
  - `carpeta_id`;
  - `alcance`;
  - el texto original.

  El borrador apunta la operación en `mejoras`.
- **La propuesta** se guarda en el resultado de la operación. El borrador no la copia.
- **Al generar,** el borrador se cierra (`cerrado_en`) y la barra empieza uno nuevo.

### 5.2 Una respuesta tardía nunca sustituye nada
- **Si al llegar la propuesta** el borrador sigue en la misma `revision` y con el mismo alcance: se enseña al lado del original.
- **Si la revisión o el alcance han cambiado:**
  - la propuesta **no se aplica ni se ofrece en la barra**;
  - aparece como «propuesta para un texto anterior (revisión N)», con el original al que respondía, y se puede abrir, copiar o descartar;
  - Aceptarla pide confirmar: «Sustituirá lo que tienes ahora».
- **Tras recargar,** pasa lo mismo, comparando la `revision` guardada en la operación con la del borrador.

### 5.3 Revisar, editar y aceptar

**En el lateral**, propuesta y original van juntos, con:
- los cambios resaltados;
- la lista «qué cambió y por qué» de 2 a 6 puntos;
- su coste según tarifa.

**Botones:**
- **Aceptar:** el texto propuesto, o su copia editada, pasa a la barra como **una revisión nueva** del borrador. «Deshacer» vuelve al texto anterior, que es otra revisión, hasta que se genera.
- **Descartar:** la barra queda como estaba. El coste sigue contado.
- **Editar antes de aceptar:** se edita **una copia** de la propuesta en el lateral, guardada en `copia_propuesta`. La barra no cambia hasta Aceptar. La propuesta original de la operación no se toca nunca.

**Respuesta cortada** (`incomplete`) o sin JSON válido:
- se apunta el consumo disponible (§4);
- el aviso «propuesta incompleta: el modelo se quedó sin margen»;
- si hay texto parcial, se puede ver, pero **no hay Aceptar directo**: solo «Editar antes de aceptar» o Descartar;
- si no hay texto: «no hubo propuesta; coste según tarifa X $»;
- **no se repite la llamada.**

**Después de recargar**, el borrador se recupera (§5.1) con su texto, sus mejoras y la copia que se estuviera editando. Cada propuesta se lee de su operación.

## 6. Tarifa cambiada o coste por encima de lo mostrado

**Nada se repite solo.** Ni el worker ni la interfaz relanzan una mejora. Cada nueva llamada es un clic nuevo con su cifra delante.

**Si el coste según tarifa supera la reserva estimada mostrada:**
- la operación se marca «superó la reserva estimada (X $ > Y $)» en la Mesa y en el Registro;
- Mejorar queda desactivado con ese motivo hasta que Juan lo revise. Se reactiva con un clic explícito: «Entendido, seguir»;
- el caso indica que el cálculo de la reserva falla, y se revisa antes de seguir.

**Si supera solo la estimación (≈)**, sin pasar de la reserva: se anota en la fila y no se bloquea nada.

**Cambio de tarifa:** Picasso no puede detectarlo solo, porque la tarifa está escrita en el código.
- **[DECIDIR] D4. Recomendación:** si la tarifa tiene más de 30 días, el botón dice «tarifa sin verificar desde DD-MM-AAAA». Mejorar sigue disponible, pero la confirmación lo repite.
- Al volver a verificarla, se cambian la tarifa y la fecha en el código, con la fuente en el commit.
- Los costes antiguos conservan la tarifa y la fecha con las que se calcularon.

**Modelo retirado o rechazado** (4xx de modelo): la operación queda fallida, Mejorar se desactiva con el mensaje del proveedor y no se cambia de modelo en silencio (§9.4 del maestro).

## 7. Pruebas

**En aislado, sin gasto:** la imagen `picasso-pruebas-backend`, la base `picasso_pruebas` o una instancia propia, la clave vacía y el dominio de OpenAI bloqueado. El proveedor simulado gana el caso `mejorar_texto`, con los resultados `normal`, `incompleta`, `rechazada`, `incierta`, `incierta_sin_id`, `error_5xx` y `supera_reserva`.

El proveedor simulado devuelve también `usage`, para poder probar el cálculo según tarifa.

Casos nuevos en `p18_mejorar`:
1. El botón enseña estimación y reserva estimada, calculadas con todo lo enviado (instrucciones, texto y referencias con sus rasgos). Por encima del límite de texto, el botón queda desactivado y explica por qué.
2. Doble clic y recarga → una operación y una propuesta, que se recupera.
3. `normal` → coste según tarifa en la capa **estimado**, nunca en informado; la propuesta al lado y el original intacto. Aceptar, Descartar y Deshacer.
3b. Respuesta tardía con el borrador en otra revisión o con otro alcance → «propuesta para un texto anterior»; la barra no cambia.
3c. «Editar antes de aceptar» modifica la copia y la barra no cambia. Al recargar se recuperan el borrador, la propuesta y la copia. Una revisión antigua en `PUT` → 409.
4. `incompleta` → consumo apuntado como estimado y aviso; sin Aceptar directo; ninguna llamada nueva.
5. `rechazada` (4xx) → fallida, con o sin consumo según `usage`.
5b. `error_5xx` al crear → `incierta`, nunca `fallida`, y la reserva se mantiene.
6. `incierta` e `incierta_sin_id` → al marcarlas fallidas, posible cargo = reserva estimada. «Comprobar» sin id lo explica. «No hubo cargo» y «Hubo cargo…» lo resuelven.
7. `supera_reserva` → marca, bloqueo y reactivación explícita.
8. **Dos intentos con consumo:** el intento 1 es `incompleta` con `usage` (a $) y el intento 2, reintentado a mano, es `normal` (b $). La operación cuenta a + b en estimado. Registro (dos líneas de intento), totales de la Mesa y CSV dan lo mismo.
9. **Tarifa:** el cálculo separa la entrada normal, las lecturas y escrituras de caché y la salida, con un `usage` simulado que trae las cuatro. El razonamiento no se suma dos veces. Un `usage` que no cuadra queda marcado y no se calcula a ciegas.
10. **Tarifa inmutable:** al cambiar la tarifa del código, los intentos antiguos conservan su `tarifa_aplicada` y su coste.
11. Registro, totales de la Mesa y CSV coinciden. Ninguna llamada se repite sola.

Además, toda la batería: pytest, p1–p17 y las pruebas del frontend.

**Validación real con presupuesto aparte. D5: pendiente de autorización de Juan; no se gasta nada sin ella.**
- **Propuesta:** tope de 0,20 $ en la instalación de Juan, en el espacio «Pruebas del constructor».
  - Unas seis mejoras de unos 0,03 $ de reserva estimada cada una.
  - Se usan para comparar la estimación y la reserva con el coste según tarifa, ver el `usage` real de OpenAI y probar una propuesta aceptada y otra descartada.
  - Al final, se contrasta el total con el panel de uso de OpenAI.
- No se fuerza ningún caso de error con dinero real: esos casos se validan en aislado.

## 8. Contraste con el maestro: qué queda de verdad del Módulo 1

**Este apartado es contexto y no forma parte del alcance de PIC-04.** Lo que se decida aquí no amplía PIC-04: se trata aparte cuando PIC-04 esté cerrado.

Leído en §21 y en el SDD PIC-01 el 18-11-2026. Esto no declara nada pendiente: separa lo cerrado de lo que el maestro aún no da por validado, y señala lo que puede haber quedado superado. **Lo decide Juan.**

| Pieza | Aprobada | Construida | Validada por Juan | Lectura |
|---|---|---|---|---|
| PIC-01 / PIC-03: la Mesa | Sí (14-11) | Sí | Sí (14-11, V1–V4, 0,60 $) | **Cerrada.** No se reabre |
| PIC-02: medios y costes | Sí (14-11) | Sí | Sí (16-11 aislada, 18-11 instalación) | **Cerrada** |
| §7.6 Ajustar una toma | Sí (24-09) | Sí, en el lienzo y en la Mesa | En la Mesa sí; en el lienzo de un plano, no | En la Mesa, cerrada. **Queda el lienzo de un plano** |
| F9 Nano Banana Pro | Sí (04-10) | Sí | Sí (imagen) | **Cerrada** para el Módulo 1 |
| 18.20 Persona real | Sí (07-10) | Sí (en el prompt) | No consta | **Abierta.** El SDD PIC-01 no recoge que V1–V4 usaran una ficha marcada como persona real (en la base, solo «Tania» la lleva) |
| 18.22 Qué conservar de cada referencia | Sí (08-10) | Sí en el prompt (`dominio/prompt.py`); en la Mesa no hay control para elegirlo | No consta | **Abierta.** Además hay que decidir si la Mesa necesita el control o basta con el valor por defecto |
| 18.23 Varias tomas | Sí (08-10) | Sí en la Mesa («cuántas» de 1 a 4, `max_lote` en el servidor, p17) | No consta con más de una | **Abierta**, pequeña |
| 18.29 Taller guiado y 19.29 «no lo entiendo» | Sí (15 y 22-10) | La Mesa sustituyó la interfaz (PIC-01 §2: «la Mesa es la superficie principal»), pero no todas las acciones (§8.1) | La Mesa sí; 18.29 y 19.29, no | **Abiertas.** No se cierran sin comprobar qué necesidad resolvían y demostrar que la Mesa la cubre (§8.1) |
| 18.30 Control de ingredientes | Decidida (14-10) | Parcial (reglas simples; la Mesa lo consulta) | No consta | **Abierta** «en lo que hay», sin ampliar |
| 19.20 Recortar referencias al subir | Detectada | No | — | Toca al Taller; **sin aprobar** como trabajo del Módulo 1 |
| 19.19, 19.21–19.25 | Detectadas | No | — | No son del Taller (Idea, vídeo, voz, personaje que habla). **Fuera del Módulo 1** |
| §20 E1 | Aprobado (23-10) | No | — | El maestro dice «encaja en el 1», pero no está construido ni pedido. **Lo decide Juan** |

**Lectura para cerrar el Módulo 1:**
- PIC-04;
- un recorrido corto de lo abierto: 18.20, 18.22, 18.23 y 18.30, más Ajustar desde el lienzo de un plano;
- comprobar 18.29 y 19.29 contra la Mesa (§8.1);
- decidir si E1 y 19.20 entran o se aplazan.

**[DECIDIR] D6:** confirmar esta lectura antes de cerrar el Módulo 1. Hasta entonces, la tabla §21 del maestro no se toca.

### 8.1 Qué resolvían 18.29 y 19.29, y qué cubre hoy la Mesa

**Necesidad de 18.29** (Juan, 14-10-2026, tras los «20 pasos» del corto de Tania): generar en una pantalla, «aquí un prompt, ajustamos y bum, una carpetita para archivar», y un clic en la imagen para ver su ficha y seguir desde ella.

**Necesidad de 19.29:** que Juan entienda el Taller sin ayuda. Era su primera reacción: «no lo entiendo».

**Primera comprobación, solo en el código:** búsqueda de textos en `frontend/src/pantallas/Taller.tsx` en `main` (`9d2b07f`), el 18-11-2026. Es una pista, no una prueba.

| Lo que pedía 18.29 | En la Mesa hoy |
|---|---|
| Modelo, referencias con `@`, prompt grande | Hay modelo y referencias. Falta comprobar la mención con `@` |
| «Mejorar» | Desactivado: es PIC-04 |
| Control de ingredientes | Hay (se consulta al escribir) |
| Formato, calidad y cuántas | Hay formato y cuántas. Falta comprobar la calidad |
| Precio delante y Generar | Hay |
| Carpetas | Hay |
| Ficha de la imagen: prompt, referencias, ajustes, coste y fecha | Hay un lateral. Falta comprobar qué campos enseña |
| Variaciones y otro ángulo | Hay «Otra como esta» y ángulo en Dirección |
| Editar | Hay (Ajustar, validado en PIC-03) |
| Ampliar y mejorar resolución | No aparece |
| Llevarla a vídeo o hacerla hablar | No aparece. Es vídeo, aplazado |
| «Usar como referencia de una ficha» | No aparece |
| «Llevar a un plano» | No aparece |

**Para cerrarlas hace falta:**
1. Comprobar en la interfaz, no solo en el código, cada fila marcada como «Hay» o «Falta comprobar».
2. Que Juan decida qué hacer con cada fila «No aparece»: entra en el Módulo 1, se aplaza o deja de hacer falta.
3. Para 19.29: un recorrido de Juan en la Mesa sin ayuda, apuntando dónde se pierde. Se cierra solo si no se pierde, o cuando se corrija lo que apunte.
