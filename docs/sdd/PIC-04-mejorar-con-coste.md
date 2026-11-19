# PIC-04 · «Mejorar mi descripción» con su coste delante

**Estado:** diseño aprobado en la revisión 5 (`cd9a4aa`, 19-11-2026). Construcción autorizada por Juan el 19-11-2026 en la rama `pic-04/mejorar` y en una instancia aislada, sin claves reales y con OpenAI bloqueado. Sin gasto, fusión ni despliegue. Los 0,20 $ de validación real (D5) siguen sin autorizar.

**Decisiones de Juan (19-11-2026):**
- **D3 aprobado:** segundo plano con `store: true` (§4.4), aceptando la conservación descrita del texto enviado, los rasgos de las referencias y la propuesta.
- **D4 aprobado:** aviso visible cuando la tarifa pase de 30 días sin verificar, repetido en la confirmación. Mejorar sigue disponible (§6).
- **Parámetros:** las pruebas simuladas usan los propuestos en §3. Cualquier ajuste posterior que cambie el coste se refleja en el presupuesto mostrado.
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
- Revisión 3: `184a23d`.
- Revisión 4: tercera revisión del revisor del 18-11-2026:
  - el consumo de los intentos anteriores sigue visible mientras corre el siguiente (§4.2);
  - la revisión del borrador se guarda y se confirma antes de presupuestar y de enviar (§5.1);
  - la reserva incluye la escritura en caché de la configuración elegida (§3);
  - fuentes oficiales de las columnas de caché, de la salida con el razonamiento dentro y de los motivos de respuesta incompleta, con un mensaje por motivo (§2, §5.3);
  - D3 se concreta: segundo plano y consulta por identificador, con caducidad y respuesta sin consumo, que nunca valen coste cero (§4.4);
  - contar tokens con otra llamada queda fuera de PIC-04.
- Revisión 4: `7a9f1f1`.
- Revisión 5: cuarta revisión del revisor del 19-11-2026:
  - la autorización va atada a un presupuesto inmutable que fija importe, tarifa y configuración, y se comprueba antes de crear la operación (§5.1);
  - la calidad de la propuesta se separa de su contabilidad, y el consumo ausente se distingue del consumo válido a cero (§4.4, §5.3);
  - D3 corregido: el segundo plano no exige conservar 30 días y la llamada directa no implica ausencia de retención (§4.4).

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

**Columnas de caché en la página de precios** (developers.openai.com/api/docs/pricing, tabla estándar, 18-11-2026). Cabeceras literales y fila de `gpt-6.1-sol`:

| Short context input | Short context output | Short context cached input | Short context 30m write | Short context 12h write |
|---|---|---|---|---|
| 2,00 $ | 10,00 $ | 0,10 $ | **2,50 $** | **5,00 $** |

- Nota de la página: «Short context» es ≤ 272K tokens de entrada. Las columnas de contexto largo (4,00 / 15,00 / 0,20 / 5,00 / 10,00) no aplican: Mejorar no pasa de unos miles.
- Confirma lo que la revisión 3 dejaba pendiente: 2,50 $ es la escritura a 30 minutos y 5,00 $ la de 12 horas.

**Caché de la entrada** (developers.openai.com/api/docs/guides/prompt-caching y referencia de `POST /v1/responses`, 18-11-2026):
- `cached_tokens` cuenta las lecturas cobradas y excluye lo que se cobra como escritura. La entrada normal es `input_tokens` − `cached_tokens` − `cache_write_tokens` (ejemplo de la guía: 12 000 − 4 000 − 7 000 = 1 000).
- `input_tokens_details.cache_write_tokens_details` reparte las escrituras en `ttl_30m_tokens` y `ttl_12h_tokens`, que no se solapan y suman `cache_write_tokens`.
- Parámetro `prompt_cache_options` (gpt-5.6 en adelante):
  - `mode`: `implicit` (por defecto) o `explicit`. En `implicit`, OpenAI pone un punto de caché al final del último mensaje apto, y la primera petición **escribe** ese prefijo;
  - `ttl`: `30m` (por defecto) o `12h`;
  - en `explicit`, la guía dice que, sin puntos de caché marcados, la petición no usa caché ni crea escrituras.
- La caché empieza en 1 024 tokens de prompt (GPT-5.6 en adelante). La entrada de Mejorar puede pasar de esa cifra (§3).

**Campos de consumo de la respuesta** (referencia de `POST /v1/responses`, objeto Response, 18-11-2026):
- `usage.input_tokens`, `input_tokens_details.cached_tokens`, `input_tokens_details.cache_write_tokens`, `cache_write_tokens_details` (opcional), `output_tokens`, `output_tokens_details.reasoning_tokens` y `total_tokens`.
- Estados de la respuesta: `completed`, `failed`, `in_progress`, `cancelled`, `queued` e `incomplete`.

**La salida incluye el razonamiento** (developers.openai.com/api/docs/guides/reasoning, 18-11-2026):
- La guía dice que los tokens de razonamiento «se facturan como» tokens de salida y que `max_output_tokens` limita todo lo generado, razonamiento incluido.
- Su ejemplo de `usage` trae `input_tokens` 75, `output_tokens` 1 186, `reasoning_tokens` 1 024 y `total_tokens` 1 261. Como 75 + 1 186 = 1 261, el razonamiento está **dentro** de `output_tokens`: si se sumara aparte, el total sería 2 285.
- La guía no lo dice con una frase. Por eso se mantiene la comprobación de §4.3 en cada respuesta.
- La guía recomienda reservar al principio al menos 25 000 tokens para razonamiento y salida. El `max_output_tokens` propuesto (2 000, §3) es mucho menor; las pruebas reales dirán si basta con `low`.

**Motivos de respuesta incompleta** (referencia, `incomplete_details.reason`, 18-11-2026): `max_output_tokens`, `max_messages`, `content_filter` y `steered`. Este último solo se da tras un evento `response.steer` por WebSocket, que Picasso no usa. El mensaje de cada uno está en §5.3.

**Segundo plano** (developers.openai.com/api/docs/guides/background y guides/your-data, 18-11-2026):
- `background: true` y consulta con `GET /v1/responses/{id}` mientras el estado sea `queued` o `in_progress`.
- **Caducidad:** con la ventana por defecto, la respuesta se guarda en disco «unos 10 minutos» y, si `store` falta o es `false`, se borra al terminar ese plazo. Con `store: true` sigue la retención normal de la Responses API: al menos 30 días.
- Cancelar dos veces es idempotente y devuelve el objeto final. La guía no dice si una respuesta cancelada se cobra.
- **No documentado:** si la consulta devuelve `usage` siempre, ni ninguna clave de idempotencia o búsqueda sin el id. El diseño (§4.4) no da nada de eso por hecho.

**Fuera de PIC-04:** contar tokens con otra llamada (`POST /v1/responses/input_tokens`). La entrada se estima por bytes (§3).

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

**Configuración de caché propuesta:** `prompt_cache_options: {mode: "explicit", ttl: "30m"}`, sin puntos de caché marcados. Según la guía (§2), así la petición no usa caché ni escribe. Mejorar no gana nada con la caché: cada texto es distinto y las instrucciones fijas (1 153 bytes) no llegan a los 1 024 tokens.

**Reserva estimada** = (bytes medidos de todo lo anterior + margen) × **tarifa de escritura de la `ttl` elegida** + `max_output_tokens` × tarifa de salida.
- **La entrada se reserva a la tarifa de escritura a 30 minutos (2,50 $), no a la normal (2,00 $).** Es lo más caro que la configuración elegida puede cobrar por un token de entrada. Así la reserva cubre la escritura aunque OpenAI llegara a escribir pese a no haber puntos de caché.
- Si Juan prefiriera otra configuración, la reserva cambia con ella: `ttl: "12h"` se reserva a 5,00 $. La reserva siempre usa la tarifa de escritura de la `ttl` que se envía.
- Si una respuesta trae `cache_write_tokens` > 0 con la configuración propuesta, el intento se marca «escritura en caché no esperada» y se trata como «superó la reserva» (§6): queda contado y Mejorar se bloquea hasta revisarlo.
- **La parte de salida sí tiene tope:** OpenAI no genera más de `max_output_tokens`, razonamiento incluido (guía de razonamiento).
- **La parte de entrada es una estimación por exceso**, no una garantía.
- **La reserva se calcula en el servidor**, con el texto de la revisión guardada y confirmada del borrador (§5.1), nunca con lo que mande el navegador.

**Estimación (≈):** cifra típica, también sin garantía. Sale de la entrada medida más una salida típica, y después se ajusta con la media de lo calculado en las últimas llamadas del estudio.

Al pasar el cursor: «Estimación y reserva calculadas por Picasso con la tarifa del DD-MM-AAAA. La salida tiene un tope; la entrada se estima por exceso. Ninguna de las dos es una cifra garantizada por OpenAI».

**Ejemplo de cálculo, no una cota.** Con 300 bytes de texto, dos referencias de unos 150 bytes cada una y `max_output_tokens` = 2 000:
- **Entrada:** 1 153 + 20 + 300 + 300 bytes, más 256 de margen, son unos 2 030 «tokens por exceso» → unos 0,005 $ a la tarifa de escritura a 30 minutos (2,50 $).
- **Salida:** 2 000 tokens → 0,020 $.
- **Reserva estimada:** unos 0,025 $.

La entrada se mide en cada llamada. Sigue sin ser un máximo: la cota de un token por byte no está documentada.

**Parámetros propuestos para probar, sin aprobar** (antes D1 y D2):

| Parámetro | Valor propuesto | Motivo |
|---|---|---|
| `max_output_tokens` | 2 000 | La respuesta visible son unas 110 palabras y 2 a 6 cambios en JSON. La guía recomienda empezar con 25 000 (§2); si 2 000 deja demasiadas `incomplete`, se sube con su nueva reserva delante |
| `prompt_cache_options` | `mode: "explicit"`, `ttl: "30m"`, sin puntos de caché | Sin caché ni escrituras según la guía; la reserva cubre la escritura a 30 minutos igualmente |
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
| Al pulsar, con el presupuesto comprobado (§5.1) | Operación `autorizada`, con `presupuesto_id`, `coste_estimado` = **reserva estimada** del presupuesto y `tarifa_verificada_en` | reservado |
| Al pulsar, con el presupuesto cambiado | Ninguna operación. Presupuesto nuevo y otro clic | nada |
| Enviada | `enviada` / `en_curso` | reservado |
| Completa | `coste_segun_tarifa` = tokens de `usage` × tarifa, con el desglose | estimado |
| Cortada (`incomplete`, `max_output_tokens`) | Igual, con el consumo que traiga `usage`. El intento guarda el motivo y el texto parcial | estimado |
| Rechazo 4xx de la petición (clave, modelo, parámetros o formato) | `fallida`. OpenAI no aceptó el trabajo. Si la respuesta trae `usage`, se apunta como estimado | nada, o estimado |
| Error 5xx al crear | **`incierta`**: un 5xx no demuestra que no se procesara (la lección de PIC-03). Nunca `fallida` sin más | reservado, y al marcarla fallida, posible cargo |
| Respuesta con estado `failed` o `cancelled` y su `usage` | `fallida`, con el consumo que traiga apuntado como estimado | estimado |
| Respuesta terminada **sin `usage`** (ausente, `null` o sin los campos de tokens) | «consumo ausente» (§4.4). **No es coste cero** | posible cargo = reserva estimada, hasta que Juan lo resuelva |
| Respuesta terminada con `usage` válido a cero tokens | Consumo válido de 0 tokens (§4.4) | estimado, 0 $ según tarifa |
| Respuesta caducada o no encontrada al consultar (§4.4) | `incierta`, «respuesta caducada o no encontrada». **No es coste cero** | reservado, y al marcarla fallida, posible cargo |
| Sin respuesta después de enviar (tiempo agotado o corte) | `incierta` (§4.1) | reservado, y al marcarla fallida, posible cargo |
| Doble clic o recarga | Mismo `id_peticion` → la misma operación (PIC-03) | — |

**Cómo se habla con OpenAI: D3, aprobado por Juan el 19-11-2026: opción A**, concretada en §4.4.
- **Opción A, segundo plano (`background: true`, `store: true`):** `enviar` devuelve el id de la respuesta y `consultar` hace `GET /v1/responses/{id}`. Encaja en el contrato del worker. `store: true` permite recuperar el resultado tras un corte más allá del almacenamiento temporal del segundo plano.
- **Opción B, llamada directa** como hoy, con un tiempo de espera largo. Cualquier corte deja la operación incierta sin forma de consultar. **No implica ausencia de retención** en OpenAI (§4.4).

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

**Mientras corre un intento nuevo, lo anterior no desaparece.** La operación enseña a la vez:
- en **estimado**, la suma de `coste_segun_tarifa` de los intentos anteriores ya terminados;
- en **reservado**, la reserva estimada del intento en curso.

Por ejemplo, con el intento 1 `incomplete` a 0,021 $ y el intento 2 en curso con 0,025 $ de reserva: estimado 0,021 $ + reservado 0,025 $. Al terminar el intento 2, su reserva se sustituye por su coste según tarifa y el estimado pasa a 0,021 $ + b $.

**Cambio en `coste_de` (PIC-02 §2.3), el único:** para las operaciones `mejorar_texto`, el coste se calcula **por intento**:
- cada intento terminado con `coste_segun_tarifa` cuenta ese valor en **estimado**, esté la operación terminada o en curso;
- el intento en curso cuenta su `coste_estimado` en **reservado**;
- los intentos sin consumo `valido` siguen el camino de PIC-02: reserva mientras está en curso y posible cargo si se marca fallida o termina con consumo `ausente` o `sin_cuadrar` (§4.4), sea cual sea el estado de su propuesta;
- las demás operaciones no cambian.

**Registro:** una línea por intento bajo la fila de la operación. Por ejemplo:
- «Intento 1: incompleta (`max_output_tokens`) · según tarifa 0,021 $»;
- «Intento 2: en curso · reserva estimada 0,025 $», que al terminar pasa a «Intento 2: completa · según tarifa 0,012 $».

**Mesa:** el lateral de la propuesta y los totales del espacio enseñan las mismas dos cifras que el Registro mientras el intento corre.

**CSV:** columnas nuevas por operación:
- `coste_segun_tarifa`, que es la suma de los intentos terminados;
- `reserva_en_curso`, la reserva del intento que siga en marcha al exportar (vacía si no hay);
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

**Los tokens de razonamiento no se suman aparte.** `reasoning_tokens` se guarda solo como desglose: el ejemplo oficial de la guía de razonamiento los trae dentro de `output_tokens` (§2). Como la guía no lo afirma con una frase, cada respuesta se comprueba:
- **si `total_tokens` = `input_tokens` + `output_tokens`** y `reasoning_tokens` ≤ `output_tokens`: el razonamiento ya está dentro de `output_tokens`;
- **si no cuadra:** el intento se marca «consumo sin cuadrar», el cálculo **no** suma el razonamiento por su cuenta y el caso se revisa antes de seguir. Así no se cuenta dos veces.

**Si llega un campo de `usage` que Picasso no conoce:** el intento lo guarda tal cual y queda marcado «consumo con campos desconocidos». Esto evita calcular a ciegas.

### 4.4 D3: segundo plano y consulta por identificador (aprobado el 19-11-2026)

**Petición:** `POST /v1/responses` con:
- `background: true`;
- `store: true`, para poder recuperar la respuesta más allá del almacenamiento temporal del segundo plano (unos 10 minutos con la ventana por defecto, §2). El segundo plano funciona sin él; lo que no permite sin él es recuperar la respuesta pasado ese plazo;
- `max_output_tokens`, `reasoning.effort` y `prompt_cache_options` de §3.

**Retención** (developers.openai.com/api/docs/guides/your-data#v1responses, 19-11-2026):
- **Con `store: true`:** la Responses API guarda el estado de la aplicación (petición y respuesta) **al menos 30 días**. Es lo que permite recuperarla después.
- **Sin `store: true`, en segundo plano:** la respuesta se guarda temporalmente para ejecutarla y recuperarla, y se borra al terminar ese plazo.
- **En llamada directa (opción B) con `store: false`:** no se guarda estado de la aplicación salvo las excepciones que lista la página (entre ellas, la caché de prompt local a la GPU, hasta 24 horas). **No es ausencia de retención:** los registros de vigilancia de abusos se generan en todo uso de la API y se conservan hasta 30 días por defecto, salvo controles aprobados (Zero Data Retention o vigilancia modificada).

**Lo que decide Juan en D3:** con la opción A recomendada, el texto enviado (con los rasgos de las referencias, incluidas las de persona real) y la propuesta quedan como estado recuperable en OpenAI al menos 30 días, además de los registros de abusos que hay en cualquier opción. Si no lo acepta, D3 pasa a la opción B, sin recuperación tras un corte.

**Secuencia en el worker:**
1. `enviar`: hace el POST y guarda el id remoto en el intento **antes** de cualquier otra cosa. Si el POST no devuelve el id, se aplica §4.1 (incierta sin id).
2. `consultar`: `GET /v1/responses/{id}` cada 2 segundos, como los ejemplos de la guía, mientras el estado sea `queued` o `in_progress`.
3. Estado final:
   - la **propuesta** se juzga por su estado y su contenido (§5.3), y el **consumo** por `usage` (abajo). Son dos evaluaciones separadas: ninguna decide la otra;
   - `failed` o `cancelled` → `fallida`, con el consumo que corresponda según `usage`.
4. Picasso **no cancela** respuestas en esta fase.

**Plazo propio de Picasso:** si a los **15 minutos** (propuesto) la respuesta sigue en `queued` o `in_progress`, el worker deja de consultar y la operación queda `incierta`, «sin final de OpenAI en 15 minutos». «Comprobar» vuelve a consultar cuando Juan lo pide.

**Caducidad o respuesta no encontrada** (la consulta devuelve 404, o la respuesta ya no existe):
- la operación queda `incierta`, «respuesta caducada o no encontrada», con el id guardado;
- **no es coste cero:** OpenAI pudo procesarla y cobrarla;
- marcada fallida, el posible cargo es la reserva estimada del intento;
- se resuelve a mano con «No hubo cargo» o «Hubo cargo…», mirando el panel de uso de OpenAI.

**Consumo: ausente no es lo mismo que cero.** Cada intento guarda `estado_consumo` con uno de tres valores:

| `estado_consumo` | Cuándo | Coste |
|---|---|---|
| `valido` | `usage` presente, con `input_tokens`, `output_tokens` y `total_tokens` enteros ≥ 0, y cuadra (§4.3) | Según tarifa, en estimado. **Si los tokens son cero, el coste según tarifa es 0 $**: es un dato del proveedor, no una suposición |
| `ausente` | `usage` falta, es `null` o le faltan esos campos | **No es coste cero.** Sin `coste_segun_tarifa`; posible cargo = reserva estimada del intento, hasta que Juan lo resuelva con «No hubo cargo» o «Hubo cargo…» |
| `sin_cuadrar` | `usage` presente pero con valores no enteros, negativos o que no cuadran (§4.3) | Igual que `ausente`, y marcado para revisar |

**La propuesta no depende del consumo.** Una respuesta `completed` con propuesta completa y JSON válido se ofrece con Aceptar **aunque el consumo sea `ausente` o `sin_cuadrar`**:
- el lateral avisa: «Coste sin informar por OpenAI: posible cargo pendiente de X $ (reserva estimada)»;
- aceptarla o descartarla **no cambia** el posible cargo, que sigue pendiente en Registro, Mesa y CSV hasta que Juan lo resuelva;
- al revés, un consumo `valido` no hace aceptable una propuesta incompleta o ilegible (§5.3).

**Nada de lo anterior relanza la petición.** Cada nuevo intento es un clic de Juan (§4.2).

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
- **Antes de presupuestar:** la cifra del botón sale de la **revisión guardada y confirmada** por el servidor.
  - Mientras la barra tenga cambios sin guardar, el botón dice «guardando…» y no se puede pulsar.
  - Con la revisión confirmada, el servidor emite un **presupuesto**: `POST /api/borradores/{id}/mejorar/presupuesto` con `{revision}`. Si la revisión ya no es la actual, responde 409 y el botón vuelve a «guardando…».
- **El presupuesto** se guarda en el servidor, en la colección `presupuestos_mejorar`, y no se modifica nunca:

| Campo | Qué fija |
|---|---|
| `presupuesto_id` | Identificador que viaja con la autorización |
| `borrador_id`, `revision` | El texto exacto que se va a enviar |
| `estimacion`, `reserva_estimada` | Los importes que enseña el botón |
| `tarifa` | La tarifa completa de §4.3 con la que se calcularon |
| `configuracion` | Modelo, `max_output_tokens`, `reasoning.effort`, `prompt_cache_options`, `background` y `store` |
| `huella_entrada` | Resumen (SHA-256) de todo lo que se enviará: instrucciones, texto, formato y referencias con sus rasgos ya recortados |
| `emitido_en`, `usado_por` | Cuándo se emitió y qué operación lo usó, si alguna |

  El botón enseña las cifras **de ese presupuesto**, y solo de él.
- **Al pulsar Mejorar:**
  1. la barra fuerza el guardado pendiente y espera la confirmación con su número de revisión;
  2. la petición lleva `presupuesto_id` e `id_peticion`, **sin texto ni importe**: el servidor lee todo del presupuesto;
  3. **antes de crear la operación o reservar nada**, el servidor recalcula el presupuesto con el estado actual (revisión del borrador, referencias y rasgos, tarifa y configuración del código) y lo compara con el guardado: importes, tarifa, configuración y huella deben coincidir, la revisión debe ser la actual, el borrador no puede estar cerrado y el presupuesto no puede estar ya usado por otra operación;
  4. **si todo coincide**, crea la operación con esa reserva, apunta `usado_por` y sigue. Un doble clic con el mismo `id_peticion` devuelve la misma operación (PIC-03);
  5. **si algo cambió** (otra tarifa, otra configuración, otra reserva, una referencia editada): responde 409 con un **presupuesto nuevo**. No se crea operación, no se reserva nada y **no se llama al proveedor**. El botón enseña el precio nuevo y hace falta otro clic;
  6. **si hay conflicto de revisión** (409 al guardar, revisión que no es la actual o borrador cerrado): lo mismo, y el texto de la barra se conserva tal cual. La barra explica «el borrador cambió en otra ventana; revisa antes de mejorar» y ofrece recargar la revisión del servidor sin pisar la suya hasta que Juan elija.

  Un reintento (§4.2) pide su propio presupuesto, con el mismo flujo.

  La operación guarda en su entrada, que es inmutable:
  - `presupuesto_id`;
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

**Qué se puede aceptar lo decide solo la propuesta:** Aceptar directo exige estado `completed` y JSON válido con texto y cambios. El estado del consumo (§4.4) no lo habilita ni lo impide; si falta, el lateral enseña el posible cargo pendiente.

**Botones:**
- **Aceptar:** el texto propuesto, o su copia editada, pasa a la barra como **una revisión nueva** del borrador. «Deshacer» vuelve al texto anterior, que es otra revisión, hasta que se genera.
- **Descartar:** la barra queda como estaba. El coste sigue contado.
- **Editar antes de aceptar:** se edita **una copia** de la propuesta en el lateral, guardada en `copia_propuesta`. La barra no cambia hasta Aceptar. La propuesta original de la operación no se toca nunca.

**Respuesta cortada** (`incomplete`) o sin JSON válido:
- se apunta el consumo disponible (§4);
- el aviso corresponde al motivo recibido en `incomplete_details.reason`:

| Motivo | Aviso |
|---|---|
| `max_output_tokens` | «Propuesta incompleta: el modelo llegó al límite de salida (N tokens)» |
| `content_filter` | «Propuesta incompleta: el filtro de contenido de OpenAI cortó la respuesta» |
| `max_messages` | «Propuesta incompleta: OpenAI alcanzó su límite de mensajes». No debería darse con un solo mensaje; se marca para revisar |
| `steered` | «Propuesta incompleta por un motivo no esperado (`steered`)». Picasso no usa WebSocket; se marca para revisar y no se espera ninguna respuesta sucesora |
| Otro o ninguno | «Propuesta incompleta: motivo «…» de OpenAI», con el valor literal, marcado para revisar |
| Sin JSON válido | «La respuesta no trae una propuesta legible» |

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
- **D4, aprobado por Juan el 19-11-2026:** si la tarifa tiene más de 30 días, el botón dice «tarifa sin verificar desde DD-MM-AAAA». Mejorar sigue disponible, pero la confirmación lo repite.
- Al volver a verificarla, se cambian la tarifa y la fecha en el código, con la fuente en el commit.
- Los costes antiguos conservan la tarifa y la fecha con las que se calcularon.

**Modelo retirado o rechazado** (4xx de modelo): la operación queda fallida, Mejorar se desactiva con el mensaje del proveedor y no se cambia de modelo en silencio (§9.4 del maestro).

## 7. Pruebas

**En aislado, sin gasto:** la imagen `picasso-pruebas-backend`, la base `picasso_pruebas` o una instancia propia, la clave vacía y el dominio de OpenAI bloqueado. El proveedor simulado gana el caso `mejorar_texto`, con los resultados `normal`, `incompleta` (con cada `reason`: `max_output_tokens`, `content_filter`, `max_messages`, `steered` y uno desconocido), `rechazada`, `incierta`, `incierta_sin_id`, `error_5xx`, `supera_reserva`, `escritura_cache`, `sin_consumo`, `caducada` y `sin_final`. El simulado lleva un contador de llamadas, para comprobar cuántas veces se habló con el «proveedor».

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

Casos añadidos en la revisión 4, con su criterio de aprobado:

12. **Consumo anterior visible con el intento en curso.** Intento 1 `incompleta` con a $; intento 2 lanzado a mano y detenido en `in_progress`, con reserva r $.
    - Pasa si el Registro enseña dos líneas («según tarifa a $» y «en curso · reserva estimada r $»), la Mesa enseña estimado a $ + reservado r $, y el CSV exportado en ese momento trae `coste_segun_tarifa` = a y `reserva_en_curso` = r.
    - Al terminar el intento 2 con b $: estimado a + b, reservado 0, `reserva_en_curso` vacía. Las tres vistas coinciden en cada momento.
13. **Revisión confirmada antes de presupuestar.** Con cambios sin guardar, el botón dice «guardando…» y no se puede pulsar. Tras guardar, la cifra corresponde a la revisión confirmada.
    - Pasa si las cifras del botón son las del presupuesto emitido para esa revisión y la operación creada guarda ese `presupuesto_id`, esa revisión y esa reserva.
13b. **Presupuesto que cambia antes de crear la operación.** Con un presupuesto emitido, se cambia por separado: la tarifa del código, `max_output_tokens`, `prompt_cache_options` y los rasgos de una referencia. Después se pulsa Mejorar con el presupuesto viejo.
    - Pasa si en cada caso hay 409 con un presupuesto nuevo, **no se crea operación ni reserva**, el contador del proveedor simulado no sube y el botón enseña el precio nuevo.
    - Un segundo clic con el presupuesto nuevo crea la operación con esa reserva.
    - Un presupuesto ya usado por otra operación no crea una segunda; el mismo `id_peticion` devuelve la misma operación.
14. **Conflicto de revisión al pulsar.** Otra ventana guarda una revisión mayor; la primera pulsa Mejorar.
    - Pasa si hay 409, **no se crea operación**, el contador del proveedor simulado sigue igual y el texto de la barra no cambia.
    - Lo mismo con el borrador cerrado y con una reserva recalculada distinta de la mostrada (esta última exige otro clic, sin llamada).
15. **Escritura en caché en la reserva.** Con la configuración propuesta, la reserva usa 2,50 $ por millón en la entrada; con `ttl: "12h"`, 5,00 $.
    - Pasa si las cifras coinciden con el cálculo a mano.
    - `escritura_cache` (respuesta con `cache_write_tokens` > 0) → coste según tarifa con la escritura a su tarifa, marca «escritura en caché no esperada» y bloqueo como `supera_reserva`.
16. **Motivo de respuesta incompleta.** Cada `reason` simulado da su aviso de §5.3, y ninguno ofrece Aceptar directo ni lanza otra llamada.
    - Pasa si el texto del aviso es el de la tabla para cada motivo y el desconocido enseña su valor literal.
17. **Razonamiento dentro de la salida.** Un `usage` como el del ejemplo oficial (75 / 1 186 / 1 024 / 1 261) da 75 tokens a entrada y 1 186 a salida, sin sumar los 1 024.
    - Un `usage` con `total_tokens` distinto de entrada + salida queda «consumo sin cuadrar».
18. **Segundo plano (D3, opción A).**
    - La petición simulada lleva `background: true` y `store: true`, y el id se guarda en el intento antes de consultar.
    - `sin_final`: a los 15 minutos simulados, `incierta` «sin final de OpenAI», y el worker deja de consultar.
    - `caducada` (404 al consultar): `incierta` «respuesta caducada o no encontrada»; marcada fallida, posible cargo = reserva estimada. **Nunca coste cero.**
    - `sin_consumo` (estado final sin `usage`): consumo `ausente`, posible cargo = reserva estimada. **Nunca coste cero.**
    - Pasa si en los tres casos el contador del proveedor no sube por sí solo, y Registro, Mesa y CSV dan las mismas cifras.
    - «No hubo cargo» deja el coste en 0 solo tras ese clic de Juan, y «Hubo cargo…» lo lleva a informado, como en PIC-02.
    - La petición de la opción B no se prueba como «sin retención»: ninguna prueba ni texto de la interfaz lo afirma.
19. **Propuesta válida sin consumo.** `completed` con propuesta completa y JSON válido, sin `usage`.
    - Pasa si Aceptar está disponible, el lateral avisa del posible cargo pendiente de la reserva, y tras Aceptar (y por separado tras Descartar) Registro, Mesa y CSV siguen enseñando ese posible cargo hasta «No hubo cargo» o «Hubo cargo…».
    - Con `incomplete` y consumo `valido`, en cambio, no hay Aceptar directo.
20. **Consumo ausente frente a consumo cero.** Tres respuestas `completed` con la misma propuesta: sin `usage`; con `usage` todo a 0 y cuadrado; con `usage` a `null`.
    - Pasa si la de ceros queda `valido` con 0 $ según tarifa en estimado y sin posible cargo, y las otras dos quedan `ausente` con posible cargo = reserva estimada.
    - Un `usage` con un valor negativo o no entero queda `sin_cuadrar`, con posible cargo.

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

## 9. Construcción en aislado (19-11-2026, rama `pic-04/mejorar`)

Sin claves reales, sin gasto, sin fusión ni despliegue. Pendiente de revisión.

**Dónde está:**
- `backend/app/mejorar/`: tarifa, configuración, límites y cálculos (`calculo.py`), proveedor real y simulado (`proveedores.py`) y el flujo de segundo plano (`flujo.py`).
- `backend/app/api/mejorar.py`: borradores, presupuestos, Mejorar, reintento, aceptar, descartar y copia.
- El motor cambia en tres sitios: el worker deriva `mejorar_texto` a su flujo, `coste_de` calcula por intento y el Registro y el CSV llevan las columnas nuevas.
- `POST /espacios/{e}/taller/mejorar` (la llamada directa sin tope) desaparece; `asistente_usos` ya no se escribe.
- Mesa: `PanelMejora` y la barra de `Taller.tsx`.

**Decisiones de implementación para revisar:**
- El presupuesto se compara por huella, proveedor, tarifa, configuración y reserva estimada. La estimación (≈) no entra: cambia con la media de las últimas mejoras y provocaría un 409 en cada clic.
- Las referencias y el formato no viven en el borrador: viajan en la petición de presupuesto y quedan fijados en él.
- Un 4xx con fallo de conexión antes de enviar (`ConnectError`) se trata como rechazo sin cargo: la petición no salió.
- Una respuesta incompleta o ilegible deja la operación `fallida` para poder volver a pedirla; su consumo sigue contando.
- El reintento y la autorización genéricos del motor (`/operaciones/{id}/reintentar` y `/autorizar`) devuelven 409 para una mejora: solo se pide desde la Mesa, con su presupuesto.
- Dos rutas solo de pruebas, que responden 403 fuera de la base de pruebas: `/api/pruebas/mejorar/parametros` (cambiar tarifa o configuración en memoria) y `/api/pruebas/mejorar/envios` (contador del simulado).
- Plazo, intervalo y retención del simulado se leen de `MEJORAR_PLAZO_S` (900), `MEJORAR_INTERVALO_S` (2) y `MEJORAR_RETENIDA_S`.

**Pruebas:** `p18_mejorar` cubre los casos 1 a 20, 13b y D4; `backend/tests/test_mejorar_calculo.py`, el cálculo. Batería completa en verde: pytest y p1–p18.
