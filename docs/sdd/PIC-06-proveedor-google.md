# PIC-06 · Proveedor Google directo para imagen (Nano Banana 2.1)

**Estado:** **aprobado por Juan el 21-11-2026** («apruebo PIC-06»). Con esa aprobación se toman como decididas las recomendaciones de D1–D7 (§8); si alguna no le vale, se cambia antes de construir. El encargo de construcción está en §10. Todavía sin código, gasto, fusión ni despliegue: la construcción empieza cuando Juan cumpla la condición de §10. La instalación de Juan no se toca.

**Origen:**
- §9.7 del maestro: imagen en KIE o en Google directo, lo más barato en preproducción y la calidad después. Es propuesta y no está construida.
- Juan, 21-11-2026: «no es por el coste: en ChatGPT, Nano Banana o Flow cuesta centavitos, ¿cómo vamos a pagar 0,15 por una foto de un rostro?». Hoy Picasso solo genera imagen con Nano Banana Pro en fal, a 0,15 $.
- Prioridad: va **antes** de construir PIC-05, porque cambia el coste de todo lo que viene.

**Identificador:** PIC-06. Libre en `main` (`ddf8637`), en todas las ramas y en `docs/`.

| Paso | Dónde | Estado |
|---|---|---|
| SDD-01 Problema | §1 | Escrito |
| SDD-02 Alcance | §2 | Escrito |
| SDD-03 Arquitectura | §3 (qué existe), §4 (diseño) | Escrito |
| SDD-04 Decisiones | §8, D1–D7 | Tomadas con la aprobación del 21-11-2026 (recomendaciones) |
| SDD-05 Historias y criterios | §5 | Escrito |
| SDD-06 Reglas | §6 | Escrito |
| SDD-07 Pruebas | §7 | Escrito |
| SDD-08 Despliegue | §9 y §10 (encargo) | Encargo preparado; fusión y despliegue, pendientes de autorizar |

---

## 1. Problema

- Hoy cada imagen de Picasso cuesta **0,15 $** (fal · Nano Banana Pro, 2K). El mismo trabajo en las apps con suscripción de Juan (ChatGPT, Gemini o Flow, Higgsfield, Midjourney) le cuesta casi nada por foto, mientras no se pase de la cuota.
- La regla de Juan (§9.7) dice que en preproducción va lo más barato. Picasso no tiene nada más barato que elegir.
- Las pruebas de PIC-05 y de los cursos se encarecen sin necesidad: una prueba de cinco imágenes sale a 0,75 $.

## 2. Alcance

**Dentro:**
1. Proveedor nuevo `google`, sobre el contrato del §9.1, con la API de Gemini (Google AI Studio).
2. Catálogo con **Nano Banana 2.1** (`gemini-nano-banana-2.1`) como modelo de **exploración** por defecto para imagen nueva e imagen con referencias.
3. Opcional, según D3: Nano Banana Pro por Google directo como alternativa de calidad final, si su precio queda verificado palabra por palabra.
4. Elección del modelo con su uso visible: «exploración» o «final» (18.1).

**Fuera:**
- KIE (queda en §9.7 como segunda vía);
- el modo batch de Google, que cuesta la mitad pero es diferido (D5);
- vídeo;
- cualquier forma de usar las suscripciones desde Picasso (§4.6);
- quitar fal del catálogo: sigue disponible.

## 3. Qué existe (comprobado en `main`, `ddf8637`)

| Pieza | Dónde | Para PIC-06 |
|---|---|---|
| Contrato de proveedor: `modelos`, `estimar`, `enviar`, `consultar`, `descargar` | `backend/app/motor/contrato.py:49` | Se cumple igual |
| Proveedor síncrono que guarda el resultado en disco y lo entrega por `consultar` | `motor/proveedores/elevenlabs.py` (`enviar` 59, `consultar` 105, `descargar` 114) | **Patrón a seguir.** La llamada de Google devuelve la imagen en la respuesta |
| Proveedor con cola y «nunca reenviar sin respuesta» | `motor/proveedores/fal.py` (`enviar` 140, `SinRespuesta`) | Misma regla |
| Catálogo con coste verificado y fecha | `backend/data/catalogo_modelos.yaml` (`fal-nano-banana-pro`, línea 96) | Entradas nuevas |
| Referencias con qué conservar (18.22) y persona real (18.20) | `dominio/prompt.py:30, 46` | Sin cambios |
| Taller y Mesa: modelo elegible, `limite_lote`, máximo de referencias | `api/taller.py`; `catalogo.py` | Sin cambios; el modelo nuevo aparece en el selector |
| Claves | `.env`: hoy `OPENAI_API_KEY` y `FAL_KEY`. No hay clave de Google | Hace falta `GEMINI_API_KEY` (D1) |

## 4. Diseño

### 4.1 Datos verificados el 21-11-2026 en la documentación oficial

Las páginas `ai.google.dev/gemini-api/docs/{pricing,image-generation,models}` redirigen a `aistudio.google.com/docs/...`.

| Dato | Valor | Cómo se leyó |
|---|---|---|
| Nano Banana 2.1, `gemini-nano-banana-2.1` | Salida de imagen: 30,00 $ por millón de tokens. «Equivalent to **$0.0336 per 1K image, $0.0504 per 2K image, and $0.113 per 4K image**» | Literal |
| | Entrada (texto e imagen): 1,50 $ por millón de tokens | Literal |
| | Lote (batch): la mitad (0,0168 / 0,0252 / 0,0567 $) | Literal |
| | Sin capa gratuita para la salida de imagen | Literal |
| | Tokens por imagen: 1K = 1 120, 2K = 1 680, 4K = 3 780 | Literal |
| Nano Banana 2 Lite, `gemini-3.1-flash-lite-image` | 0,0336 $ por imagen de 1K; no publica otras resoluciones | Literal |
| Nano Banana Pro, `gemini-3-pro-image` | 0,134 $ (1K y 2K) y 0,24 $ (4K) | **A través de un resumen, no literal: sin verificar** |
| Referencias | Nano Banana 2.1: «Up to 4 images of characters», «Up to 10 images of objects». Se pueden mezclar hasta 14 | Literal |
| Resolución y formato | `response_format`: `aspect_ratio` e `image_size` («2K»). El 2.1 no admite 512 px | Literal el ejemplo; la lista completa de valores, a través de un resumen |
| Llamada | `POST https://generativelanguage.googleapis.com/v1beta/interactions`, cabecera `x-goog-api-key`, referencias en base64 dentro de `input` | Literal en los ejemplos. **Se vuelve a comprobar el día que se construya** |
| Marca de agua | «All generated images include a SynthID watermark» | Literal |
| Estado | 2.1: «New», sin fecha de cierre. `gemini-2.5-flash-image` se cierra el 15-03-2027 | Literal |
| Consumo informado en la respuesta | No encontrado | Hay que comprobarlo al construir (D4) |

### 4.2 Comparativa a 2K, la resolución de Picasso

| Modelo y proveedor | Por imagen | 5 imágenes |
|---|---|---|
| fal · Nano Banana Pro (hoy) | 0,15 $ | 0,75 $ |
| Google · Nano Banana Pro | ~0,134 $ (sin verificar) | ~0,67 $ |
| **Google · Nano Banana 2.1** | **0,0504 $** | **0,25 $** |
| Google · Nano Banana 2.1 a 1K | 0,0336 $ | 0,17 $ |

El precio de las imágenes de entrada (las referencias) se cobra aparte, por tokens, a 1,50 $ por millón. El número de tokens por imagen de entrada del 2.1 no se ha encontrado. Se medirá en la primera llamada real; con el Pro, el resumen indica unos 0,001 $ por imagen.

### 4.3 Proveedor `google`

- **Patrón síncrono, como ElevenLabs:**
  - `enviar` guarda el envío en la base antes de llamar;
  - llama a `interactions`;
  - guarda la imagen devuelta en disco, con la clave de la operación;
  - devuelve un `id_remoto` local.

  Después, `consultar` responde «completado» con la ruta, y `descargar` lee el archivo.
- **Sin respuesta, nunca se reenvía.** Si la llamada se corta (tiempo agotado o conexión perdida), la operación queda incierta (`SinRespuesta`) y conserva su reserva como posible cargo, igual que hoy. Google no documenta idempotencia en esta llamada.
- **Referencias:** en base64, en el orden en que viajan, con las líneas de qué conservar de cada una (18.22). Límite del 2.1 en Picasso: **4 referencias** (las de personaje que admite). Por encima, se avisa y no se recorta en silencio, como en PIC-05.
- **Formato:** `aspect_ratio` sale de la relación del Taller (9:16, 16:9, 1:1, 4:5). `image_size` es «2K» por defecto y «1K» si se elige «borrador» (D2).
- **Coste:** se estima con la tarifa del catálogo. El importe informado solo se rellena si la respuesta trae el consumo (D4). Si no, queda «estimado, según tarifa», como con fal.
- **Errores:**
  - 4xx con mensaje de Google → fallida, con la reserva liberada;
  - 429 o 5xx → incierta. Sin una respuesta clara de rechazo no se libera nada (regla de PIC-02 y PIC-04).
- **Marca de agua:** las imágenes llevan SynthID. Se anota en «Cómo se hizo».
- **Portátil:** solo `httpx` y PIL, que ya están en el backend. Funciona igual en el VPS.

### 4.4 Catálogo

```yaml
- id: google-nano-banana-2-1
  nombre_visible: "Nano Banana 2.1 (Google)"
  acciones: [generar_imagen, imagen_con_referencias]
  proveedores: [google]
  uso: exploracion
  admite: {referencias: 4}
  relaciones: ["9:16", "16:9", "1:1", "4:5"]
  coste: {unidad: imagen, valor: 0.0504, moneda: USD, verificado: true, verificado_en: "2026-11-21"}
  formato: {png_lado_largo: 2048}
  fuente: "aistudio.google.com/docs/pricing"
```

- **Editar (`editar_imagen`) con el 2.1:** D6.
- **`google-nano-banana-pro`:** entra solo si D3 lo aprueba, y sin `verificado: true` hasta leer el precio palabra por palabra.

### 4.5 Qué ve Juan

- En el selector de modelo del Taller aparece «Nano Banana 2.1 (Google) · exploración · 0,05 $», como **opción por defecto**. Nano Banana Pro (fal) queda como «final · 0,15 $».
- El botón dice «Generar · 0,05 $». Lo demás del Taller no cambia.
- Antes de que el 2.1 sea el modelo por defecto en las hojas de personaje (D12 de PIC-05), hace falta su prueba de calidad: §7, punto 4.

### 4.6 ¿Y las suscripciones (Higgsfield, Midjourney, Flow, ChatGPT)?

Lo que se sabe el 21-11-2026. Nada se ha verificado en la página oficial de cada servicio, salvo donde se indica:

| Servicio | ¿Picasso puede usar la suscripción por API? | Fuente |
|---|---|---|
| Midjourney | **No.** No hay API oficial. Los «Midjourney API» que se venden son envoltorios no oficiales, y según esas mismas fuentes sus condiciones prohíben el acceso automatizado | Blogs de terceros (aifreeapi, apiframe); sin confirmar en midjourney.com |
| Higgsfield | **No con los créditos del plan.** La API es otro producto, con saldo propio en dólares y precio por generación | Centro de ayuda y blog de Higgsfield, vistos en resultados de búsqueda; sin leer la página de precios de la API |
| ChatGPT, Gemini, Flow | No: la suscripción es para sus apps. Por API, cada uno cobra aparte (OpenAI por tokens; Google, la tabla de arriba) | — |

**Conclusión.** Las suscripciones se aprovechan generando en sus apps, no desde Picasso. Para que ese trabajo entre en la producción, propongo **«Traer una toma»** (D7): subir a la Mesa una imagen hecha en Midjourney, Flow o Higgsfield, con su herramienta, su prompt y su fecha. Queda como una toma más, con versiones, comparación, ★, aprobación para la ficha y Ajustar, con coste 0 en Picasso y la nota «hecha fuera». No es parte de este incremento; se propone aparte.

## 5. Historias y criterios de aceptación

| # | Historia | Criterio verificable |
|---|---|---|
| G1 | Elegir el modelo barato | El selector muestra «Nano Banana 2.1 (Google) · exploración · 0,05 $» por defecto. fal sigue disponible |
| G2 | Generar con referencias | Con 1–4 referencias de personaje, la operación viaja con las líneas de qué conservar. Con 5, la barra avisa y no deja generar |
| G3 | Precio delante | El botón y el detalle de costes usan 0,0504 $ por imagen a 2K y 0,0336 $ a 1K, con la fecha de verificación |
| G4 | Corte de conexión | Si la llamada no responde, la operación queda incierta con su reserva. Nunca se reenvía. «Comprobar» no vuelve a llamar |
| G5 | Rechazo de Google | Un 4xx con mensaje deja la operación fallida, con la reserva liberada y el mensaje a la vista |
| G6 | Sin clave | Sin `GEMINI_API_KEY`, el modelo aparece como «no configurado» y no se puede elegir |
| G7 | Portátil | El proveedor funciona igual en el Mac y en el VPS: solo `httpx` y PIL |

## 6. Reglas

- CLAUDE.md del proyecto y §0 del maestro.
- La clave va solo en `.env`, nunca en el repositorio.
- Pruebas con el proveedor `simulado`, más un **simulador de la respuesta de Google**: un JSON grabado con la forma real, sin red.
- Antes de construir se vuelve a leer el precio y la llamada en la documentación, con su fecha.

## 7. Plan de pruebas

1. **pytest, sin red:**
   - cuerpo de la llamada (modelo, referencias en orden, `aspect_ratio`, `image_size`);
   - lectura de la respuesta grabada;
   - errores 4xx, 429, 5xx y tiempo agotado;
   - estimación de coste.
2. **Batería simulada:** `scripts_pruebas/en_docker.sh` en verde, más un `p20_proveedor_google` con las historias G1–G6 usando el simulador.
3. **Recorrido de Juan** en una instancia aislada, con `simulado`: el selector, el precio y los estados.
4. **Prueba real, aparte y autorizada viendo la cifra.** Dos imágenes de Florencia con la semilla como referencia y el prompt de la skill Modelo de Bugonia: una con Nano Banana 2.1 (0,05 $) y otra con el Pro de fal (0,15 $).
   - Presupuesto: **unos 0,20 $** más las referencias de entrada.
   - Mide los tokens reales de las referencias y si el 2.1 aguanta la identidad, con la lista de la ficha de Bugonia (pecas, ojos, línea del pelo).
   - Con eso se decide D2 y se responde a la D12 de PIC-05.

## 8. Decisiones pendientes, con recomendación

| # | Decisión | Recomendación |
|---|---|---|
| D1 | ¿Clave de Google AI Studio con facturación? | **Sí:** Juan crea la clave en su cuenta, con un límite de gasto en Google, y la pone en `.env` como `GEMINI_API_KEY`. Code no la ve ni la escribe |
| D2 | ¿Resolución por defecto en exploración? | **2K (0,05 $).** 1K (0,034 $) queda como «borrador» a un clic. Se revisa tras la prueba del §7 |
| D3 | ¿Nano Banana Pro por Google directo además de fal? | **Todavía no:** primero se verifica su precio palabra por palabra. Si confirma 0,134 $, sustituye a fal como modelo «final» |
| D4 | ¿Importe informado? | **Solo si la respuesta trae el consumo.** Si no, «estimado, según tarifa», como hoy con fal |
| D5 | ¿Modo batch (la mitad de precio, diferido)? | **No en PIC-06.** Más adelante, para lotes que no corren prisa (hojas de PIC-05) |
| D6 | ¿Editar (Ajustar) con el 2.1? | **Sí si la documentación confirma la edición con imagen de entrada** el día que se construya. Si no, Ajustar sigue en fal |
| D7 | ¿«Traer una toma» hecha en una suscripción? | **Sí, como incremento aparte y pequeño (PIC-07),** justo después. Es la forma honrada de aprovechar Midjourney, Flow y Higgsfield sin pelearse con sus condiciones |

## 9. Despliegue

- Rama `pic-06/sdd-proveedor-google`: solo documentación. Sin fusionar.
- Construcción, cuando Juan la autorice: rama `pic-06/proveedor-google`, desde esta, en una instancia aislada (`picasso_pic06`). Los puertos los asigna Juan. Proveedor `simulado` más el simulador de Google, sin clave.
- La prueba real (§7, punto 4) y la fusión y el despliegue van cada uno con su autorización. El despliegue lleva respaldo, etiqueta `antes-pic06` y vuelta atrás, como en PIC-04.
- Orden propuesto: **PIC-06 → (PIC-07, traer una toma) → PIC-05.** La prueba real de PIC-05 bajaría de ~0,75 $ a ~0,25 $.


## 10. Encargo de construcción

**Condición para empezar.** La construcción empieza con estas dos cosas:
1. **La clave (D1).** Juan crea en Google AI Studio una clave con facturación y un límite de gasto, y la escribe él en el `.env` de la instancia aislada como `GEMINI_API_KEY`. Code no la ve, no la copia y no la escribe en ningún archivo del repositorio. Sin la clave se construye igual, con el simulador; la clave solo hace falta para la prueba real.
2. **Los puertos** de la instancia aislada, que asigna Juan. En PIC-04 se usaron 3013 y 8013.

**Dónde.**
- Rama `pic-06/proveedor-google`, creada desde `pic-06/sdd-proveedor-google`. No hace falta fusionar nada en `main` para empezar.
- Instancia aislada, como en PIC-04:
  - proyecto de compose propio;
  - base `picasso_pic06`, con `DB_NAME_PRUEBAS=picasso_pic06`;
  - imágenes y volumen de medios propios.
- La instalación de Juan no se toca.

**Fases.** Cada una se cierra con sus pruebas en verde antes de pasar a la siguiente.

| Fase | Qué | Lo que la cierra |
|---|---|---|
| B0 · Comprobar la documentación (sin coste) | Volver a leer en `aistudio.google.com/docs`, anotando la fecha: el precio del 2.1, la llamada (`interactions`, cuerpo y respuesta), `response_format` (`aspect_ratio`, `image_size`), el límite de referencias, si devuelve el consumo (D4) y si admite editar con imagen de entrada (D6). Si algo ha cambiado respecto al §4.1, **se para y se avisa a Juan** antes de seguir | Nota fechada en el §4.1 con lo confirmado y lo que cambió |
| B1 · Catálogo | Entrada `google-nano-banana-2-1` (§4.4), con `uso: exploracion`, 0,0504 $ a 2K y la opción de borrador a 1K (0,0336 $), con `fuente` y `verificado_en`. Nano Banana Pro en fal pasa a `uso: final`. Sin clave, el modelo aparece como «no configurado» (G6) | pytest del catálogo; G1 y G6 |
| B2 · Proveedor | `motor/proveedores/google.py`, con el patrón de ElevenLabs (§4.3): guardar antes de llamar, llamada síncrona, imagen a disco, `consultar` y `descargar` locales, errores (4xx fallida; 429, 5xx y tiempo agotado incierta), nunca reenviar. Referencias en base64, en orden, con su línea de qué conservar | pytest con un **simulador de la respuesta de Google**: JSON grabado con la forma real, sin red. G2, G4, G5 y G7 |
| B3 · Taller | El selector enseña el uso y el precio («exploración · 0,05 $»), con el 2.1 por defecto. Botón «Generar · 0,05 $». Interruptor de borrador a 1K (D2). Aviso cuando se pasa de 4 referencias, sin recortar en silencio | `node --test` del selector y del aviso; G1, G2 y G3 |
| B4 · Batería | `scripts_pruebas/p20_proveedor_google.py` (G1–G6 con el simulador) y `scripts_pruebas/en_docker.sh` completo en verde. p15, p16, p17 y p18 sin cambios | Batería completa en verde |
| B5 · Recorrido de Juan | En la instancia aislada, con `simulado` y el simulador: elegir modelo, ver el precio, generar, y ver el fallo y el estado incierto | Validación de Juan en la interfaz |

**Entrega de la construcción:**
- commits de la rama;
- batería en verde (`en_docker.sh`, pytest y `node --test`);
- la nota de B0;
- evidencias en `~/dev/picasso-evidencias/pic06-…`;
- la lista de lo que queda sin validar.

Sin fusión ni despliegue.

**Fuera de la construcción:**
- Nano Banana Pro por Google (D3, hasta verificar su precio palabra por palabra);
- el modo batch (D5);
- KIE;
- OpenAI imagen;
- «Traer una toma» (D7, que es PIC-07);
- cualquier cambio en PIC-05.

**Prueba real (aparte, cuando B5 esté cerrado y la clave puesta).**
- Florencia, con su semilla como referencia de personaje y el prompt de la skill Modelo de Bugonia.
- Una imagen con Nano Banana 2.1 a 2K (0,0504 $) y otra con Nano Banana Pro en fal (0,15 $). Total: **unos 0,20 $**, más los tokens de la referencia.
- Antes de cada envío se enseña el precio, y lo autoriza Juan.
- Se mide:
  - los tokens reales de la referencia y el coste real frente al estimado;
  - si el 2.1 conserva la identidad: pecas, ojos avellana con el anillo ámbar, la línea del pelo con la raya descentrada y la edad.
- Con el resultado se confirma D2 y se responde a la D12 de PIC-05.

**Después.** La fusión en `main` y el despliegue en la instalación de Juan, cada uno con su autorización, con respaldo de base y medios, etiquetas `antes-pic06` y vuelta atrás, como en PIC-04.
