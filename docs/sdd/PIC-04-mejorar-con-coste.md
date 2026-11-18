# PIC-04 · «Mejorar mi descripción» con su coste delante

**Estado:** borrador para revisión (18-11-2026). Sin código. Los puntos **[DECIDIR]** se cierran con Juan y llevan la recomendación entre paréntesis.

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

**No verificado todavía, y necesario antes de construir:**
- si consultar una respuesta en segundo plano (`GET /v1/responses/{id}`) devuelve `usage`;
- si contar tokens (`POST /v1/responses/input_tokens`) se cobra. La página no lo dice, y este diseño no depende de ello.

## 3. Estimación y máximo antes del clic

El botón deja de ser un icono mudo y enseña la cifra: **«Mejorar · ≈ 0,01 $ (máx. 0,03 $)»**.

**Máximo:** lo calcula Picasso antes de enviar.
- **Salida:** `max_output_tokens` × tarifa de salida. Este límite lo hace cumplir OpenAI.
- **Entrada:** el tamaño en bytes UTF-8 de instrucciones más contexto, más un margen fijo de formato, × tarifa de entrada. Un token de texto no ocupa menos de un byte, así que es una cota por exceso. Es un cálculo de Picasso, no una garantía escrita de OpenAI.
- El texto del usuario tiene un tope de longitud para que el máximo no se dispare.

**Estimación:** es una cifra típica, no una garantía. Sale del tamaño de la entrada y de una salida típica.
- Al principio se usa una salida típica fija.
- Después se ajusta con la media de lo informado en las últimas llamadas del estudio.

**En pantalla se distinguen las dos:**
- **«≈ X $»** es la estimación;
- **«máx. Y $»** es el máximo.

Al pasar el cursor: «La estimación puede quedarse corta. El máximo lo pone el límite de salida que Picasso envía a OpenAI. Tarifa verificada el DD-MM-AAAA».

**Cifras orientativas**, con las instrucciones actuales, 2 000 caracteres de texto como máximo y `max_output_tokens` = 2 000:
- **Entrada:** ≤ 4 500 tokens → ≤ 0,009 $.
- **Salida:** ≤ 2 000 tokens → ≤ 0,020 $.
- **Máximo:** ≈ 0,03 $ por llamada.

**[DECIDIR] D1. Límite de salida.**
- **Recomendación:** `max_output_tokens` = 2 000 y `reasoning.effort` = `low`.
- **Motivo:** la respuesta visible son unas 110 palabras más 2 a 6 cambios en JSON. Con razonamiento `medium`, el razonamiento puede comerse el límite y dejar `incomplete` sin texto.

**[DECIDIR] D2. Longitud máxima del texto que se envía a mejorar.**
- **Recomendación:** 2 000 caracteres. Si el texto es más largo, el botón explica por qué no se puede.

## 4. Gasto en las capas de PIC-02, sin piezas nuevas de contabilidad

Mejorar pasa a ser **una operación del motor**: acción nueva `mejorar_texto` y proveedor nuevo `openai_texto`. Hereda sin cambios:
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

| Momento | Qué queda | Capa en PIC-02 |
|---|---|---|
| Al pulsar | Operación `autorizada`, con `coste_estimado` = **el máximo** y `tarifa_verificada_en` | reservado |
| Enviada | `enviada` / `en_curso` | reservado |
| Completa | `usage` de OpenAI (entrada, entrada en caché y salida, razonamiento incluido) × tarifa verificada → `coste_informado`, con fuente `proveedor` | informado |
| Completa con `incomplete` (`max_output_tokens`) | Igual: hay cargo. El intento guarda el motivo y lo que llegó | informado |
| Rechazada por OpenAI (4xx o 5xx con respuesta) | `fallida`, sin importe | nada |
| Tiempo agotado o conexión cortada tras enviar | `incierta`. Al marcarla fallida, **posible cargo = el máximo** | posible cargo |
| Doble clic o recarga | Mismo `id_peticion` → la misma operación (PIC-03) | — |

**Por qué la reserva es el máximo y no la estimación:** el objetivo es que el gasto ya comprometido nunca se quede corto.

**«Informado»:** el importe sale de los tokens que cuenta OpenAI multiplicados por la tarifa verificada. La fuente se rotula «tokens del proveedor × tarifa del DD-MM-AAAA», para no confundirlo con un importe facturado.

**Cómo se habla con OpenAI** **[DECIDIR] D3:**
- **Recomendación:** modo en segundo plano (`background: true`).
  - `enviar` devuelve el id de la respuesta.
  - `consultar` hace `GET /v1/responses/{id}`.
  - Es el mismo contrato que fal, y el worker no cambia.
- **Alternativa:** la llamada directa de hoy, con un tiempo de espera largo. Es más simple, pero un corte deja la operación `incierta` sin ningún id que consultar.
- Depende de lo pendiente en §2: que la respuesta consultada traiga `usage`.

## 5. La propuesta: revisar, aceptar o descartar

- **El texto original no se toca hasta que se acepta.** Queda guardado en la entrada de la operación, que es inmutable.
- **El lateral enseña la propuesta junto al original**, con:
  - los cambios resaltados;
  - la lista «qué cambió y por qué» de 2 a 6 puntos;
  - su coste: informado o, si aún no hay importe, estimado.
- **Botones:**
  - **Aceptar:** el texto propuesto pasa a la barra. «Deshacer» vuelve al original hasta que se genera.
  - **Descartar:** la barra queda como estaba. El gasto sigue contado.
  - **Editar antes de aceptar:** la propuesta se abre en el campo de texto.
- **Si la respuesta es `incomplete` o no trae JSON válido:**
  - si trae texto, se enseña con el aviso «propuesta incompleta»;
  - si no trae texto, aparece «no hubo propuesta; se cobró X $».
- **La propuesta sobrevive a una recarga:** se recupera desde la operación por su `id_peticion`, igual que una imagen.

## 6. Tarifa cambiada o importe mayor de lo mostrado

**Nada se repite solo.** Ni el worker ni la interfaz relanzan una mejora. Cada nueva llamada es un clic nuevo con su cifra delante.

**Si el importe informado supera el máximo mostrado:**
- la operación se marca «superó el máximo mostrado (X $ > Y $)» en la Mesa y en el Registro;
- Mejorar queda desactivado con ese motivo hasta que Juan lo revise. Se reactiva con un clic explícito: «Entendido, seguir».

**Si el importe supera solo la estimación**, sin pasar del máximo: se anota en la fila y no se bloquea nada.

**Cambio de tarifa:** Picasso no puede detectarlo solo, porque la tarifa está escrita en el código.

**[DECIDIR] D4.**
- **Recomendación:** si la tarifa tiene más de 30 días, el botón dice «tarifa sin verificar desde DD-MM-AAAA». Mejorar sigue disponible, pero la confirmación lo repite.
- Al volver a verificarla, se cambian la tarifa y la fecha en el código, con su fuente en el commit.

**Modelo retirado o rechazado** (4xx de modelo): la operación queda fallida sin importe, Mejorar se desactiva con el mensaje del proveedor y no se cambia de modelo en silencio (§9.4 del maestro).

## 7. Pruebas

**En aislado, sin gasto:** la imagen `picasso-pruebas-backend`, la base `picasso_pruebas` o una instancia propia, la clave vacía y el dominio de OpenAI bloqueado. El proveedor simulado gana el caso `mejorar_texto`, con los resultados `normal`, `incompleta`, `rechazada`, `incierta` y `supera_maximo`.

Casos nuevos en `p18_mejorar`:
1. El botón enseña estimación y máximo. Con más de 2 000 caracteres, el botón queda desactivado y explica por qué.
2. Doble clic y recarga → una operación y una propuesta, que se recupera.
3. `normal` → informado, la propuesta al lado y el original intacto. Aceptar, Descartar y Deshacer.
4. `incompleta` → informado, con aviso, sin propuesta o con propuesta parcial.
5. `rechazada` → fallida, sin importe.
6. `incierta` → al marcarla fallida, posible cargo = máximo. «No hubo cargo» y «Hubo cargo…» lo resuelven.
7. `supera_maximo` → marca, bloqueo y reactivación explícita.
8. Registro, totales de la Mesa y CSV coinciden. Ninguna llamada se repite sola.

Además, toda la batería: pytest, p1–p17 y las pruebas del frontend.

**Validación real con presupuesto aparte** **[DECIDIR] D5:**
- **Recomendación:** tope de 0,20 $ en la instalación de Juan, en el espacio «Pruebas del constructor», con tu autorización viendo la cifra.
  - Hasta seis mejoras de un máximo de 0,03 $ cada una.
  - Se usan para comprobar la estimación frente a lo informado, el `usage` real de OpenAI y una propuesta aceptada y otra descartada.
- No se fuerza ningún caso de error con dinero real: esos casos se validan en aislado.

## 8. Contraste con el maestro: qué queda de verdad del Módulo 1

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
| 18.29 Taller guiado y 19.29 «no lo entiendo» | Sí (15 y 22-10) | La Mesa lo sustituyó (PIC-01 §2: «la Mesa es la superficie principal») | La Mesa sí | **Probablemente superada por la Mesa.** Proponer cerrarla si Juan lo confirma |
| 18.30 Control de ingredientes | Decidida (14-10) | Parcial (reglas simples; la Mesa lo consulta) | No consta | **Abierta** «en lo que hay», sin ampliar |
| 19.20 Recortar referencias al subir | Detectada | No | — | Toca al Taller; **sin aprobar** como trabajo del Módulo 1 |
| 19.19, 19.21–19.25 | Detectadas | No | — | No son del Taller (Idea, vídeo, voz, personaje que habla). **Fuera del Módulo 1** |
| §20 E1 | Aprobado (23-10) | No | — | El maestro dice «encaja en el 1», pero no está construido ni pedido. **Lo decide Juan** |

**Lectura para cerrar el Módulo 1:**
- PIC-04;
- un recorrido corto de lo abierto: 18.20, 18.22, 18.23 y 18.30, más Ajustar desde el lienzo de un plano;
- confirmar si 18.29 y 19.29 quedan superadas por la Mesa, y si E1 y 19.20 entran o se aplazan.

**[DECIDIR] D6:** confirmar esta lectura antes de cerrar el Módulo 1. Hasta entonces, la tabla §21 del maestro no se toca.
