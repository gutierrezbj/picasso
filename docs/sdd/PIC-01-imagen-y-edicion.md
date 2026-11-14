# PIC-01 · Módulo 1: imagen y edición desde resultados

**Estado:** especificación revisada (revisión 3), sin código.
- Revisión 1: `ef5e1d3`. Revisión 2: `0a0fd09`. Revisión 3: 14-11-2026, con las decisiones de Juan sobre la interfaz.
- Maqueta navegable: https://claude.ai/artifact/9sKRMtyLSwpq171yPR6mfG, tablero **«16 · Studio (navegable)»**, con el botón Play. Fuentes en `docs/maquetas/pic-01/`. Los tableros 10–15 (revisión 2) quedan como historia.

Decisiones consolidadas en el maestro (§1.00 y §21): construcción por módulos; el Director como ayuda opcional; aplazado no es desaprobado; tabla de estado única.

## Decisiones de Juan incorporadas en la revisión 3 (14-11-2026)
1. **Paleta oscura** (grafito, blanco cálido y ámbar), con valores propuestos para pasar a código el 14-11-2026. No se extrajeron de la imagen de referencia. No hay fondos blancos ni crema: el blanco cálido es solo para el texto.

   | Uso | HEX |
   |---|---|
   | Fondo general | `#141414` |
   | Lienzo / Mesa | `#191919` |
   | Paneles y barra inferior | `#222222` |
   | Campos y tarjetas | `#2B2B2B` |
   | Bordes discretos | `#3D3D3D` |
   | Texto principal (blanco cálido) | `#F5F0E8` |
   | Texto secundario | `#B8B2A9` |
   | Ámbar: acción y selección | `#F5A623` |
   | Ámbar al pasar el cursor | `#FFB740` |
   | Texto sobre botón ámbar | `#191919` |
   | Error | `#E57373` |
   | Éxito | `#81B88B` |

   En código vivirán como tokens de tema. Hoy el maestro (§0.9) dice «modo claro por defecto»; la decisión de Juan del 14-11-2026 lo sustituye para Picasso Studio y queda anotada en D11.
2. **La Mesa es la superficie principal.** La creación entra por una **barra inferior**, que sustituye a los tres pasos de la izquierda.
3. **Dirección desplegable** junto a la entrada, con controles según el trabajo: para una imagen nueva, encuadre, ángulo, luz, óptica, formato y cantidad; para una edición, la zona del cambio, con el formato del origen y una sola imagen.
4. **El alcance siempre visible** en la barra: «Nueva imagen» o «Editar V2». Seleccionar una versión cambia el alcance; «Nueva imagen» lo devuelve.
5. **Lateral** para inspeccionar la versión: imagen, ★, Descartar, referencias enviadas y del linaje, «Cómo se hizo», nota y «Comparar con el origen».
6. **El asistente se llama «Director de Studio».** Se abre a demanda desde la barra superior y orienta según el trabajo: fotografía, publicidad o cine.
7. **Las sugerencias preparan cambios revisables** en la dirección o en el texto. Aplicar una sugerencia no genera ni gasta. Generar exige pulsar el botón con el coste visible.

**Alcance de la revisión 3:** el Director de Studio aparece en la maqueta como **ejemplo ilustrativo**. No se implementa en PIC-03: tendrá su propia especificación, y sus sugerencias llegarán como propuestas aceptables una a una (§10 del maestro). El módulo no se amplía a vídeo ni a montaje.

## Cambios de la revisión 2
1. La cláusula de conservación respeta lo que el usuario pide cambiar y no promete fidelidad perfecta (§3.3).
2. Se separan las referencias **heredadas** del linaje de las referencias **enviadas** en cada operación (§3.2).
3. El coste se define en tres capas: estimación, reserva e importe informado por el proveedor. `coste_real` deja de rellenarse con la tarifa y los costes antiguos no se presentan como ciertos (§5).
4. La protección de medios (R1) va antes de la edición; se elimina la contradicción y se enumeran las dependencias que protege (§6).
5. Se especifican el doble clic, la reconexión, el reintento y el estado incierto (§5.3).
6. Se separan las pruebas del motor, las de interfaz y la validación visual de Juan. El presupuesto de la prueba real sale de las generaciones por la tarifa verificada ese día (§7).

---

## 1. Recorrido (tablero 16, navegable)

1. **Entrar.** Estudio → espacio → **Taller**. Arriba están las pestañas de carpetas, y se abre la **última carpeta usada**.
2. **Crear.** En la **barra inferior**:
   - el alcance dice **«Nueva imagen»**;
   - las referencias van en fichas (@Juan · identidad, «+ referencia»);
   - el texto se escribe en el campo;
   - **«Dirección ▾»** despliega los controles de imagen nueva;
   - **«Generar · 0,15 $»** genera. Pulsarlo es la autorización.

   En la Mesa aparece la tarjeta «Generando…» y, al terminar, **V1**.
3. **Seleccionar.** Un clic en V1 abre el **lateral** y cambia el alcance a **«Editar V1»**. Dirección muestra entonces los controles de edición.
4. **Cambiar.** Se escribe «ponle un sombrero» y se pulsa **«Aplicar cambio · 0,15 $»**. Sale V2, unida a V1 con la instrucción. V1 no cambia.
5. **Comparar.** Desde el lateral de V2, «Comparar con el origen».
6. **Favoritas y ramas.** La ★ se pone en las que quieras. Al seleccionar V1 y cambiar, sale una rama hermana; al seleccionar V2 y cambiar, una hija. «Nueva imagen» en la barra vuelve a crear desde cero.
7. **Director de Studio (opcional).** Se abre arriba a la derecha y se elige el trabajo: fotografía, publicidad o cine. Sus sugerencias tienen el botón **«Preparar»**, que rellena la dirección o el texto y lo marca como preparado por el Director, para revisarlo. No genera nada ni gasta: lo hace el botón de la barra, con su precio.
8. **Estados.** Generando, falló (con «Reintentar…», que vuelve a enseñar el precio y pide autorizar) y sin confirmar («Comprobar» nunca reenvía; «Marcar como fallida» avisa de un posible cargo).
9. **Volver a abrir.** Estudio → espacio → Taller → la pestaña de la carpeta, o la dirección `?carpeta=`. La Mesa reconstruye el árbol desde la base de datos.

## 2. Reutilización (sin motores ni recorridos nuevos)

| Pieza | Hoy | Cambio en PIC-01 |
|---|---|---|
| Motor: `crear_operacion`, `autorizar`, worker, `clave_idempotencia`, Registro | Funciona | Ninguno en el ciclo. Se añaden el identificador de petición (§5.3) y los campos de coste (§5) |
| Generar del Taller (`POST /espacios/{e}/taller/generar`) | Crea y autoriza en una llamada | Acepta `id_peticion` (§5.3) |
| Ajustar (`POST /tomas/{id}/ajustar` → `editar_imagen`, `toma_origen_id`) | Solo sirve para tomas de un plano (`toma.plano_id`); autoriza aparte | El destino lo hereda de la toma de origen (plano o carpeta). En el Taller, preparar y autorizar en una sola llamada con `id_peticion`. Es el mismo endpoint, no uno nuevo |
| fal Nano Banana Pro `/edit` | Envía la imagen de origen y la instrucción | Recibe la instrucción con la cláusula del §3.3 |
| Procedencia (`Toma.operacion_id` → `Operacion.toma_origen_id`) | Existe | `GET /carpetas/{c}/tomas` la expone: `origen_toma_id`, `instruccion`, `accion` y lo enviado |
| Galería, visor y tres pasos del Taller | Rejilla, visor en ventana y columna izquierda | La Mesa es la superficie principal; la creación pasa a la barra inferior con alcance, referencias, texto, dirección desplegable y botón con el precio; el visor pasa a lateral. La lógica de los tres pasos (referencias, Mejorar, ingredientes, formato, cantidad) se conserva y se recoloca |
| `ComparadorTomas` | Lienzo de plano | Se reutiliza tal cual |
| ★, Descartar y nota (`PATCH /tomas/{id}`) | Existe | Ninguno |

## 3. Qué se conserva

### 3.1 Imagen de origen, instrucción y versiones
- **La imagen de origen** es el `Medio` de V1. La operación de V2 la guarda en `entradas.imagen_entrada`. La entrada de una operación no se puede modificar, porque su huella es la clave de idempotencia. V1 no se reescribe nunca.
- **La instrucción** se guarda tal cual la escribió el usuario (`taller.texto`). Lo enviado de verdad, con la cláusula, queda en `entradas.instruccion` y `prompt_visible`.
- **Versiones:** cada cambio crea una `Toma` nueva en la carpeta. El árbol se reconstruye a partir de `toma_origen_id`. No se sobrescribe nada.

### 3.2 Referencias heredadas y referencias enviadas
- **Enviadas:** lo que viajó de verdad al proveedor en *esa* operación. Sale de `entradas.imagen_entrada` y `entradas.referencias`, que son inmutables. En V1, las referencias elegidas; en V2, **solo la imagen V1**.
- **Heredadas:** las referencias del linaje (las de V1 para V2, V4…). No se guardan dos veces: se calculan recorriendo `toma_origen_id` hasta la primera operación con referencias. Son informativas.
- **En el panel de imagen se muestran separadas:**
  - «Enviadas en este cambio: imagen V1»;
  - «Del linaje (no enviadas en este cambio): @Juan · identidad, @Taller · lugar».
- Las referencias no se reenvían al editar (D2). Si una edición llega a necesitar referencias, se registrarán como enviadas en esa operación; en PIC-01 no se ofrece.

### 3.3 Cláusula de conservación
- Picasso añade al final de la instrucción del usuario: *«Aplica exactamente el cambio pedido, incluido lo que afecte a la persona, la ropa, el fondo o la luz si se pide. En lo que no se pida cambiar, intenta mantener la imagen como está.»*
- La cláusula no enumera garantías ni contradice al usuario. Si escribe «ponle un sombrero y cambia el fondo a una playa», las dos cosas son cambios explícitos y la cláusula no las frena.
- La interfaz **no promete fidelidad**. Junto a «Aplicar cambio» dice: «El modelo puede alterar otros detalles: compara antes de quedártela». «Comparar con el origen» está siempre a un clic.
- En «Cómo se hizo» se enseñan la instrucción original y el texto enviado.

## 4. Elegir sin sobrescribir
- Todas las acciones crean una imagen nueva; ninguna sustituye a otra.
- La **★** es una marca por imagen: puede haber varias y se quita igual que se pone.
- **Descartar** atenúa la tarjeta y **Recuperar** la devuelve. Ninguna de las dos borra.
- **PIC-01 no añade ninguna forma de borrar.** Eso no basta para proteger el historial, porque hoy existen otros caminos de borrado de medios (§6). Por eso R1 va antes (PIC-02).

## 5. Coste, autorización, progreso y errores

### 5.1 Tres capas de coste
| Capa | Qué es | Cuándo se fija | Campo |
|---|---|---|---|
| **Estimación** | Tarifa del catálogo × unidades, con la fecha en que se verificó la tarifa | Al preparar, antes de autorizar | `coste_estimado` y `tarifa_verificada_en` (ya existe `coste_verificado`) |
| **Reserva** | La estimación cuenta como gasto comprometido desde que se autoriza hasta que la operación cierra | De `autorizada` a `completada` o `fallida` | Derivada del estado; `ops.gasto()` ya la calcula como `reservado` |
| **Importe informado** | Lo que el proveedor dice que cobró, si lo dice | Al completar, solo con dato del proveedor | `coste_informado` y `coste_informado_fuente` |

**Reglas:**
- **No se rellena el importe con la tarifa.** Si el proveedor no informa (fal y ElevenLabs no lo hacen hoy), el importe queda vacío y la interfaz muestra la estimación como «estimado, sin importe del proveedor».
- **Gasto:** las operaciones completadas con importe informado cuentan por ese importe. Las completadas sin él cuentan por la estimación, con la etiqueta «estimado». A eso se suma lo reservado. La interfaz desglosa las tres cantidades.
- **Una operación «incierta» que se marca fallida no libera su reserva sin aviso.** Queda como «posible cargo sin confirmar» hasta que Juan la revise. Hoy `marcar_fallida` la libera; se cambia en PIC-02.
- **Costes antiguos:** las operaciones anteriores a PIC-02 tienen `coste_real` calculado por tarifa en el worker (fal) o vacío. No se reescriben. La interfaz las muestra como «según tarifa (histórico, sin confirmar)». Sin una factura del proveedor, no se presentan como importe cobrado.
- El detalle y la migración (añadir campos, sin borrar nada) son **PIC-02**.

### 5.2 Dónde se ve cada cosa
- **Antes de gastar:** el precio en el botón («Aplicar cambio · 0,15 $»). Si la tarifa no está verificada, pone «sin precio» y el botón no se puede pulsar.
- **Autorización:** el clic. Si se supera el presupuesto, pide confirmar con la cifra. No existe «permitir siempre».
- **Progreso:** la tarjeta «Generando…» con el tiempo, unida a su origen.
- **Gasto:** arriba, «Gasto del Taller», desglosado en informado, estimado y reservado. El Registro usa las mismas etiquetas.

### 5.3 Doble clic, reconexión, reintento y estado incierto
- **Doble clic.**
  1. Al pulsar, la interfaz genera un `id_peticion` (UUID) y desactiva el botón.
  2. El servidor guarda `id_peticion` en la operación, con un índice único por `(espacio_id, id_peticion)`. Un segundo POST con el mismo identificador **devuelve la operación ya creada (200), no crea otra**.
  3. Además, `autorizar` ya rechaza una segunda autorización de la misma operación (`estados.exigir`).

  Hoy el Taller crea una operación nueva en cada POST; esto se corrige con el `id_peticion`.
- **Reconexión** (recargar, perder la red o dormir el portátil). El estado siempre sale del servidor: la vista de carpeta con las tomas y lo que está en marcha, más los eventos de `/api/eventos`. Una petición que se cortó sin respuesta se repite **con el mismo `id_peticion`**, así que no duplica nada. Nunca se reenvía con un identificador nuevo sin que el usuario pulse otra vez.
- **El worker se reinicia.** Las operaciones `enviada` o `en_curso` se retoman por su `id_remoto` (lo cubre `p9_reinicio`). No se vuelven a enviar.
- **Reintento.** Solo desde `fallida`. Crea un intento nuevo con una clave de idempotencia nueva (`ops.reintentar`). La interfaz vuelve a enseñar el precio y **exige otro clic de autorización**.
- **Estado incierto.** Pasa cuando se agota el tiempo o se pierde la respuesta. La tarjeta dice «Sin confirmar» y ofrece:
  - **«Comprobar»:** consulta por `id_remoto` y nunca reenvía;
  - **«Marcar como fallida»:** avisa de que el proveedor pudo cobrar, y la reserva pasa a «posible cargo sin confirmar».

  Solo después de marcarla fallida se puede reintentar, y con autorización nueva.

## 6. Protección de medios (R1, PIC-02, antes de la edición)
**Por qué va antes:** la edición crea dependencias entre imágenes. Hoy `DELETE /medios/{id}` solo comprueba las fichas y las pistas de audio, y se puede borrar desde fuera del Taller (biblioteca, fichas) un medio del que depende una versión.

**Dependencias que R1 protege.** Un medio no se borra (409, con un mensaje que diga dónde se usa) si:
1. es el `medio_id` de alguna `Toma` (cualquier versión, de plano, de ficha o del Taller);
2. aparece en la entrada de alguna operación: `imagen_entrada`, `referencias[*]`, `primer_fotograma`, `ultimo_fotograma`, `video_entrada`, `audio_entrada` o `retrato`;
3. aparece en `taller.referencias` de alguna operación;
4. está en las referencias de una ficha (ya se comprueba) o en una pista de audio (ya se comprueba).

Borrar un proyecto no borra tomas, operaciones ni medios; esto no cambia. Las reglas de borrado de medios con historial (archivar en vez de borrar) quedan fuera del alcance.

## 7. Pruebas y validación

### 7.1 Motor y API, automáticas, en simulado (`p16_mesa`, pytest)
- Procedencia: V2 → V1 y V4 → V2; V3 sale de V1.
- V1 intacta: mismo `medio_id` y misma huella del fichero.
- Referencias enviadas y heredadas, cada una por su sitio.
- La cláusula de conservación va en `prompt_visible`, junto con el texto original.
- Doble POST con el mismo `id_peticion` → una operación. Autorizar dos veces → la segunda se rechaza.
- `sim-inestable` → `fallida` sin segundo envío; reintento con clave nueva y autorización nueva.
- Reinicio del backend a mitad: sin reenvío (como `p9`).
- Costes: estimación con fecha; importe vacío si el proveedor no informa; reserva liberada solo al completar o fallar sin «incierta».
- R1: 409 en cada una de las dependencias del §6 (esto va en PIC-02).

### 7.2 Interfaz, automáticas con navegador, en simulado
Se ejecutan en el espacio «Pruebas del constructor», con el modelo simulado.
- Se pinta el árbol con sus flechas y sus instrucciones.
- El alcance de la barra cambia al seleccionar una versión y vuelve a «Nueva imagen».
- La dirección desplegable enseña los controles de imagen nueva o de edición según el alcance.
- El doble clic en «Aplicar cambio» crea una sola tarjeta.
- Una tarjeta de error muestra su mensaje y ofrece Reintentar, que pide autorizar.
- El panel enseña las referencias enviadas y las del linaje por separado.
- Al recargar la página y reabrir la carpeta, el árbol es el mismo.

### 7.3 Validación visual de Juan, con el modelo real
Pruebas operadas por Juan en la interfaz:
- **Recorrido:** V1 con una referencia de ficha, V2 «ponle un sombrero», V3 (rama desde V1) y V4 (desde V2). Son **4 generaciones**.
- **Presupuesto:** 4 × la tarifa de Nano Banana Pro verificada **el mismo día de la prueba**. Hoy, en el catálogo (verificada el 12-10-2026), son 0,15 $ por imagen, lo que da **0,60 $**. Antes de la prueba se vuelve a verificar la tarifa y se enseña la cifra.
- No se gasta nada sin que Juan lo autorice.

**Juan juzga:**
- si el sombrero aparece;
- cuánto cambió el resto y si eso es aceptable;
- si entiende el árbol y las ramas;
- si echa de menos la rejilla.

## 8. Criterios de aceptación (caso del sombrero)
1. Desde el estudio se llega al Taller y se genera sin crear proyecto, idea ni guion.
2. Antes de cada gasto se ve el precio. Sin el clic no hay envío, y el doble clic no duplica.
3. V1 se genera con al menos una referencia; su panel muestra las referencias enviadas.
4. «Ponle un sombrero» crea V2, unida a V1 con la instrucción; V1 queda intacta.
5. El panel de V2 separa las referencias enviadas (V1) de las del linaje.
6. «Cómo se hizo» enseña la instrucción original y el texto enviado con la cláusula.
7. «Comparar con el origen» muestra V1 y V2.
8. Se pueden poner varias ★ sin perder ni cambiar ninguna imagen.
9. Se puede seguir desde V1 (V3) y desde V2 (V4).
10. Al reabrir la carpeta, el árbol, las referencias, las instrucciones, las ★ y las notas son los mismos.
11. Error, «sin confirmar» y reintento se comportan como en el §5.3.
12. El gasto distingue estimado, reservado e informado; ningún coste por tarifa aparece como cobrado.
13. Ningún medio del que dependa una versión se puede borrar (requiere PIC-02).

## 9. Orden de trabajo propuesto
1. **Validar la experiencia** con la maqueta, incluida la sustitución de la rejilla.
2. **PIC-02:** protección de medios (R1) y corrección de costes (§5.1), con su migración aditiva.
3. **PIC-03:** la Mesa, Ajustar generalizado e `id_peticion`, más las pruebas 7.1 y 7.2.
4. Validación de Juan (7.3).

## 10. Decisiones

| # | Decisión | Estado |
|---|---|---|
| D1 | La Mesa dentro del Taller, por carpeta | Propuesta recomendada que se mantiene |
| D2 | Al editar, solo se envía la imagen de origen | Recomendación |
| D3 | La cláusula de conservación del §3.3 | Recomendación revisada |
| D4 | Varias favoritas | Propuesta recomendada que se mantiene |
| D5 | Árbol automático | Propuesta recomendada que se mantiene |
| D6 | La Mesa sustituye a la rejilla | Decidido por Juan (14-11-2026): la Mesa es la superficie principal |
| D7 | Nano Banana Pro `/edit` en fal | Recomendación; tarifa verificada de nuevo el día de la prueba |
| D8 | Una imagen por edición | Propuesta recomendada que se mantiene |
| D9 | Una «incierta» marcada fallida queda como «posible cargo sin confirmar» | Recomendación nueva |
| D10 | La URL de la carpeta (`?carpeta=`) para reabrir directamente | Recomendación nueva |
| D11 | Paleta oscura (tabla de la revisión 3), barra inferior, dirección desplegable, alcance visible y lateral | Decidido por Juan (14-11-2026). Sustituye al «modo claro por defecto» del §0.9 del maestro para Picasso Studio |
| D12 | Director de Studio a demanda, por tipo de trabajo; las sugerencias preparan sin gastar | Decidido por Juan (14-11-2026); en la maqueta solo como ejemplo, sin implementar |
| D13 | ¿Dónde vive «Mejorar mi descripción»? | Recomendación: dentro del Director de Studio, como una sugerencia más. Hasta que exista, se queda como botón en la barra con su coste de texto visible |
