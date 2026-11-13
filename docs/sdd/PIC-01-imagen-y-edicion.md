# PIC-01 · Módulo 1: imagen y edición desde resultados

Estado: **especificación para revisar; sin código**. Parte de `7006686`. Escrita el 13-11-2026.

Decisiones consolidadas en el maestro (§1.0 y §21):
1. Construcción por módulos; el primero es imagen y edición desde resultados.
2. El Director es una ayuda opcional a demanda; su nueva interfaz queda aplazada.
3. Las aprobaciones anteriores se conservan; lo que queda fuera del módulo se aplaza, no se desaprueba.
4. Una tabla única separa aprobación, implementación, pruebas técnicas y validación por Juan.

Lo que esta especificación propone y Juan no ha decidido todavía va marcado como **[recomendación]** y se resuelve en el apartado 8.

---

## 1. Recorrido exacto

La superficie es la **Mesa**: un lienzo de resultados dentro del **Taller** que ya existe. Es la galería del Taller convertida en lienzo, donde cada imagen es una tarjeta y cada edición se dibuja con una flecha desde su imagen de origen. No hay que pasar por proyecto, idea, elementos ni guion [recomendación, D1].

1. **Abrir Picasso.** Estudio → espacio (por ejemplo, JRGB) → **Taller**, que ya es el primer botón del espacio. Se abre la última carpeta usada, o «General».
2. **Crear con referencias.** En los tres pasos de la izquierda, que ya existen:
   - «+ Añadir» una referencia de una ficha validada o de la biblioteca;
   - describir la imagen;
   - elegir formato y cantidad;
   - pulsar **«Generar 1 imagen · 0,15 $»**. Pulsar ese botón es la autorización.
   En la Mesa aparece una tarjeta «Generando…» y, al terminar, la imagen **V1**.
3. **Seleccionar.** Un clic en V1 la marca y abre a la derecha su **panel de imagen** (el visor 5b, convertido en panel lateral). El panel tiene:
   - «Me la quedo» y «Descartar»;
   - **«Cambiar algo»**, que hoy está como «próximamente»;
   - «Cómo se hizo»;
   - la nota.
4. **Pedir el cambio.** En «Cambiar algo» se escribe «ponle un sombrero» y se pulsa **«Aplicar cambio · 0,15 $»**. Pulsar es autorizar. Sale una tarjeta «Generando…» unida a V1 por una flecha, y al terminar aparece **V2**, con el texto «ponle un sombrero» sobre la flecha. V1 no cambia.
5. **Comparar.** Con V2 seleccionada, **«Comparar con el origen»** abre las dos imágenes lado a lado, reutilizando el `ComparadorTomas` del lienzo. También se pueden marcar dos tarjetas cualesquiera y pulsar «Comparar».
6. **Elegir y continuar.** «Me la quedo» pone la ★ en V1, en V2 o en las dos; no borra ni sustituye nada. «Cambiar algo» funciona desde cualquier tarjeta:
   - desde V1 se crea una rama hermana (V3);
   - desde V2 se crea V2 → V4.
7. **Cerrar y volver.** Al reabrir el Taller y su carpeta, la Mesa reconstruye el árbol con las imágenes, las flechas, las instrucciones, las referencias, las ★ y las notas, todo leído de la base de datos. Lo que estaba en marcha al cerrar sigue en marcha o queda «incierta», con «Comprobar» (§9.4).

## 2. Qué se reutiliza y qué falta

| Pieza | Hoy | Para PIC-01 |
|---|---|---|
| Motor (`ops.crear_operacion`, `autorizar`, worker, idempotencia, Registro) | Funciona | **Sin cambios.** Una sola vía de generación |
| Generar en el Taller (`POST /espacios/{e}/taller/generar`) | Crea y autoriza; destino `taller`/carpeta | Sin cambios |
| Ajustar del lienzo (`POST /tomas/{id}/ajustar` → `editar_imagen`, `toma_origen_id`) | Solo funciona con tomas de un plano (usa `toma.plano_id`); prepara y se autoriza aparte en Producir | **Generalizar**: el destino de la edición es el de la toma de origen (plano o carpeta). En el Taller, preparar y autorizar en un solo paso, como «Generar». **No se crea un endpoint de edición nuevo** |
| Proveedor fal Nano Banana Pro `/edit` | Envía la imagen de origen y la instrucción | Añadir la cláusula fija de conservar (D3). Las referencias del origen no se reenvían [recomendación, D2] |
| Procedencia (`Toma.operacion_id` → `Operacion.toma_origen_id`) | Existe | Exponerla en `GET /carpetas/{c}/tomas`: `origen_toma_id`, `instruccion`, `accion` |
| Galería y visor del Taller (`Taller.tsx`) | Rejilla + visor modal | La rejilla pasa a **Mesa** con React Flow, como el lienzo actual, con colocación automática en árbol. El visor pasa a panel lateral. Los tres pasos de la izquierda se quedan igual |
| `ComparadorTomas` (lienzo) | Compara dos tomas de un plano | Se reutiliza tal cual con tomas de la carpeta |
| «Me la quedo» / Descartar / nota (`PATCH /tomas/{id}`) | Existe | Sin cambios; nunca borra |
| Avisos de «en marcha», «incierta» y «fallida» del Taller | Existen por carpeta | Cada aviso se pinta en la tarjeta de su linaje |

**No se toca:** el lienzo de proyectos, el guion, las voces, el vídeo, el montaje ni el Director.

## 3. Qué se conserva y dónde

| Dato | Dónde vive | Garantía |
|---|---|---|
| Imagen de origen | `Medio` de la toma V1; la operación de V2 lo guarda en `entradas.imagen_entrada` (con su `medio_id`) | La entrada de la operación es inmutable (su huella es la clave de idempotencia). V1 no se reescribe nunca |
| Referencias | En la operación de V1: `entradas.referencias` y `taller.referencias` | V2 las **hereda para mostrarlas**: el panel de V2 enseña las referencias de su linaje, aunque no se reenvíen al editar (D2) |
| Instrucción | `entradas.instruccion` de la operación de V2, más el texto tal cual en `taller.texto` | Se ve sobre la flecha y en «Cómo se hizo» |
| Prompt enviado de verdad | `operacion.prompt_visible` (instrucción más la cláusula de D3) | En «Cómo se hizo» se enseña lo que se envió, no lo que se escribió |
| Versiones | Cada edición es una `Toma` nueva en la misma carpeta, con su `operacion_id`. El árbol se reconstruye desde `toma_origen_id` | Nada se sobrescribe; descartar solo atenúa |
| Elegida | `Toma.valoracion = "buena"` (★), varias permitidas | Elegir no toca las demás (D4) |

## 4. Elegir sin sobrescribir

- Todas las acciones crean, ninguna sustituye: «Aplicar cambio» siempre añade una toma.
- **★ «Me la quedo»** es una marca por toma: puede haber varias y se quita igual que se pone.
- **Descartar** atenúa la tarjeta, y «Recuperar» la devuelve. Ni ★ ni Descartar borran.
- En PIC-01 no se borran imágenes del Taller. Borrar queda para después, con la reparación R1.

## 5. Coste, autorización, progreso y errores

| Qué | Dónde se ve |
|---|---|
| **Coste antes** | En el propio botón: «Generar 1 imagen · 0,15 $» y «Aplicar cambio · 0,15 $». Sale de la tarifa del catálogo verificado. Si no está verificada: «sin precio» y el botón se desactiva |
| **Autorización** | El clic en ese botón. Si supera el presupuesto, pide confirmación con la cifra, como hace hoy `confirmado_por_encima_del_presupuesto`. No existe «permitir siempre» |
| **Progreso** | Una tarjeta «Generando…» en la Mesa, unida a su origen, con el tiempo que lleva |
| **Errores** | La tarjeta pasa a roja con el mensaje y «Entendido». Si queda «incierta», «Comprobar». «Reintentar» abre de nuevo el precio y pide autorizar otra vez; nunca se reenvía solo |
| **Gasto** | «Gasto del Taller» arriba (existe) y el Registro (existe), con la etiqueta de origen del coste (R2) |

## 6. Reparaciones antes de ampliar (solo las que este recorrido necesita)

- **R1 · Proteger los medios enlazados (ORD-24, confirmado leyendo el código).** `DELETE /medios/{id}` solo comprueba las fichas y las pistas de audio. Se puede borrar el medio de una toma o el de una entrada de operación, por ejemplo la V1 de la que sale V2, y el historial se rompe. *Arreglo:* devolver 409 si el medio es una toma o aparece en `entradas.imagen_entrada`, `entradas.referencias` o `primer_fotograma` de alguna operación, con un mensaje que diga dónde se usa.
- **R2 · Distinguir el coste estimado del cobrado (ORD-24).** `coste_real` se rellena con la tarifa × número de imágenes cuando el proveedor no informa (`worker.completar`). Parece un cobro real y no lo es, y la vista del Taller mezcla `coste_real` con `coste_estimado`. *Arreglo:* un campo `coste_fuente` (`proveedor`, `tarifa` o `sin_dato`) y, en la interfaz, «estimado», «según tarifa» o «cobrado», sin mezclarlos.
- **R3 · La edición necesita un plano.** `ajustar_toma` toma su destino de `toma.plano_id`, que en el Taller vale `None`. Se cubre al generalizar Ajustar (apartado 2).

**Mejoras del §18 que entran, y por qué:**
- **18.29 (el Taller):** es la superficie.
- **18.22 (uso de cada referencia):** ya construida; la generación con referencias la usa.
- **18.20 (persona real):** ya construida; la V1 de una persona real la lleva.

**No entran:** 18.10, 18.13, 18.15–18.19b, 18.23 en el lienzo, 18.26–18.28, 18.30 ampliada, 18.36–18.38, 18.52 y 18.53. Ninguna hace falta para el caso del sombrero, y siguen aprobadas y aplazadas (§21).

## 7. Criterios de aceptación: el caso del sombrero

Se automatizan en simulado (`p16_mesa`) y luego los valida Juan operando con el modelo real, con un gasto de unos 0,30 $ autorizado expresamente.

1. Desde el estudio, se llega al Taller del espacio y se genera sin crear un proyecto, una idea ni un guion.
2. Antes de cada gasto se ve el precio en dólares en el botón. Sin el clic no hay envío; el Registro no tiene operaciones sin autorizar.
3. V1 se genera con al menos una referencia de ficha validada. Su «Cómo se hizo» muestra el modelo, el formato, el coste con su etiqueta, la fecha, las referencias y el prompt enviado.
4. Con V1 seleccionada, «ponle un sombrero; conserva lo demás» crea V2 en la misma carpeta, unida a V1 por una flecha con la instrucción.
5. V1 queda intacta: mismo `medio_id`, misma huella del fichero y misma valoración.
6. V2 muestra su origen (V1), la instrucción, las referencias heredadas del linaje, el modelo, el coste y la fecha.
7. «Comparar con el origen» enseña V1 y V2 lado a lado.
8. Se puede poner ★ en V1, en V2 o en las dos sin que se pierda ni se cambie ninguna.
9. Se puede seguir desde V1 (sale una V3 hermana) y desde V2 (sale una V4 hija); el árbol lo refleja.
10. Tras cerrar el navegador y reiniciar los contenedores, la Mesa muestra el mismo árbol con las mismas instrucciones, referencias, ★ y notas.
11. Un fallo provocado (`sim-inestable`) deja la tarjeta en rojo con su mensaje, sin un segundo envío. «Reintentar» pide autorizar otra vez.
12. Borrar el medio de V1 mientras V2 depende de él responde 409 (R1).
13. El Registro distingue el coste estimado y el coste según tarifa de cada operación (R2).

## 8. Decisiones pendientes y recomendación

| # | Decisión | Recomendación |
|---|---|---|
| D1 | ¿Dónde vive la superficie? | **La Mesa dentro del Taller, por carpeta.** No exige un proyecto, reutiliza la generación sin guion y deja intacto el lienzo de proyectos. «Llevar a un plano» se deja para un módulo posterior |
| D2 | ¿Al editar se reenvían las referencias del origen? | **No, en PIC-01.** Solo la imagen de origen y la instrucción, como hace hoy Nano Banana `/edit`. Las referencias se guardan y se muestran. Añadir una referencia a una edición (por ejemplo, «este sombrero») queda para después |
| D3 | ¿La instrucción va tal cual o con una cláusula de conservar? | **Picasso añade una cláusula fija** («Cambia solo lo que se pide; conserva igual la persona, la cara, la ropa, la pose, el fondo, la luz y el encuadre»), visible en «Cómo se hizo». Lo que el usuario escribe no se toca |
| D4 | ¿Una elegida o varias? | **Varias ★**, una marca por imagen. Nada se sustituye |
| D5 | ¿Colocación automática o arrastrar y guardar posiciones? | **Automática en árbol** en PIC-01: cero estado de diseño que guardar. Arrastrar se puede añadir después |
| D6 | ¿La Mesa sustituye a la rejilla del Taller o se añade un selector? | **La sustituye**, para que haya una sola superficie. Antes de construirla, Juan aprueba una maqueta |
| D7 | ¿Con qué modelo se edita? | **Nano Banana Pro `/edit` en fal** (0,15 $ por imagen, verificado el 12-10-2026), el único de edición verificado hoy |
| D8 | ¿Cuántas imágenes por cambio? | **Una.** Más imágenes multiplican el gasto y complican la comparación |
