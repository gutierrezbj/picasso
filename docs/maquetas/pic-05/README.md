# Maqueta PIC-05 · Director de Studio: hoja de personaje

Versión navegable: https://claude.ai/artifact/SLbhDsi6bGatVStBdHkpku (privada; la abre Juan). Fuente: `hoja-de-personaje.html`, un único archivo autocontenido que se abre también en local.

Datos simulados: nada se genera ni se cobra. El precio que enseña es el de Nano Banana Pro en fal del catálogo (0,15 $, verificado el 14-11-2026). El presupuesto de 5,00 $ es de ejemplo. Paleta oscura aprobada en PIC-01 (D11).

## Revisión 5 (21-11-2026): corte ajustable, selección reversible y D13 provisional

- **Vista previa del recorte con líneas ajustables:**
  - un control deslizante por línea entre paneles;
  - un margen arriba y abajo;
  - la resolución de cada panel, que se actualiza al momento;
  - «Restablecer columnas iguales».

  Las líneas no se cruzan y ningún panel baja del 10 % del ancho. «Generar estas vistas por separado» queda como salida secundaria. Una hoja ya recortada se puede ajustar de nuevo con «Ajustar el recorte»; los recortes anteriores se conservan.
- **Selección reversible.** Aprobar otra imagen para la misma vista y expresión la deja seleccionada en el borrador. La anterior se conserva en la Mesa con su historial («No seleccionada · la sustituye Tn») y vuelve con «Seleccionar para el borrador». La vista independiente se puede revisar aunque el recorte esté aprobado.
- **D13:** la hoja aparece como «Recomendada · provisional hasta la prueba real».
- **Comprobado:**
  - 66 comprobaciones de lógica en Node (8 nuevas): líneas que se mueven, límites, margen, restablecer, cajas aplicadas al recorte, selección reversible en los dos sentidos y vista independiente revisable.
  - En Chrome, sobre la versión publicada: «Ajustar el recorte» y la vista previa. Al mover la línea 2 y el margen, la resolución pasó a 683 / 1 079 / 287 × 1 060 px.

## Revisión 4 (21-11-2026): recorte, hoja original y vista independiente

- **«Recortar en vistas»** abre una vista previa con las líneas de corte, la resolución de cada panel y dos botones:
  - «Recortar (sin coste)»;
  - «Los paneles no son iguales», que pasa a vistas sueltas.

  Recortar no crea operación ni lote y no cambia el gasto. Hacerlo dos veces no duplica.
- **La hoja se conserva.** Al aprobar el primer recorte, la hoja entra en el borrador con rol `hoja` («se conserva y no viaja»). Descartarla no borra nada.
- **En cada recorte:**
  - «Crear vista independiente · 0,15 $»: una imagen nueva con la referencia principal y sin el recorte, que puede salir distinta. Aprobada, sustituye al recorte en el borrador.
  - «Aumentar resolución · próximamente», desactivado, con su explicación.
- **La barra actúa sobre lo que está abierto:** retrato → elegir; hoja → recortar; imagen por revisar → aprobar o pasar a la siguiente; «Qué se envía» → preparar.
- **Comprobado:**
  - 58 comprobaciones de lógica en Node (las 46 de la revisión 3 más 12 nuevas):
    - vista previa del recorte;
    - sin coste ni lote;
    - sin duplicados;
    - hoja conservada y en el borrador con rol `hoja`;
    - vista independiente sin el recorte y su sustitución en el borrador;
    - la barra sobre lo abierto.
  - Recorrido en Chrome sobre la versión publicada, a 1 280 px: vista previa del recorte, recortes e inspector con las dos acciones.
  - Al recargar la página se recuperó el estado anterior: la ficha de Ramón v1 publicada.

## Recorrido (revisión 3)

**Cambios de la revisión 3:**
- La siguiente acción está siempre en la barra y en el panel.
- Los costes son discretos: el precio va en el botón, y la pastilla «Gasto» abre el «Detalle de costes».
- Etiqueta «Simulación · sin gasto»; las «Pruebas de la maqueta» van plegadas al pie.
- Se elige entre hoja compuesta y vistas sueltas.
- «Referencia principal»; aprobar para el borrador es distinto de publicar la ficha.
- Campos con ejemplos y nombre propio; el vestuario se conserva sin contradicciones.
- Panel al lado, superpuesto o a pantalla completa, según el ancho.

**Recorrido desde cero:**
1. «Director de Studio» → «Hoja de personaje» → «Crear un personaje nuevo».
2. Nombre y campos, con ejemplos a un clic.
   - Cada campo tiene «Se conserva».
   - Solo se pregunta lo obligatorio que falte; los opcionales se pueden omitir.
3. Uso y vistas, y la forma de generarlas: hoja con todas (recomendada, pendiente de prueba) o una imagen por vista.
4. Dirección de la hoja (fondo, luz, acabado) y, en un desplegable, los ajustes de una vista.
5. Qué se envía: resumen por generación, y el texto completo en un desplegable. «Preparar» → «Listo» con «Generar retrato · 0,15 $» y «Editar preparación».
6. Retrato → «Revisa y elige la referencia principal» → «Elegir como referencia principal» (sin comparar).
7. «Continuar con las vistas pendientes» → «Generar hoja · 0,15 $» → «Revisa la hoja y recórtala en vistas» → «Recortar en vistas».
8. Revisar cada recorte:
   - aprobar para el borrador, ★, comparar con la principal o «No mantiene la identidad»;
   - «Ampliar esta vista · 0,15 $» la genera como imagen suelta.
9. «Revisar y publicar la ficha v1» → «Publicar» → «En la ficha v1» y «Preparar otra vista».

En el pie, «Pruebas de la maqueta» simula:
- que una generación pierda la identidad, falle o quede sin confirmar;
- una recarga entre fases;
- una hoja irregular;
- un cambio de precio;
- un presupuesto de 0,20 $;
- cerrar y volver a abrir.

## Comprobado (revisión 3, 21-11-2026)

- **Lógica:** 46 comprobaciones en Node sobre el script de la maqueta.
  - Etiqueta de simulación, y ningún texto que diga dónde está el panel.
  - Ningún «Preparado por el Director» sobre un campo vacío.
  - Con 65 años y la procedencia rellenas, no las vuelve a preguntar; el nombre se ve en todas partes.
  - Primero el retrato, sin «No queda ninguna vista». Preparar no gasta.
  - Elegir la referencia principal la deja en el borrador v1 sin publicar, con la cabecera coherente. Después, «Continuar con las vistas pendientes».
  - **Pescador:** con el vestuario conservado, la hoja y la vista suelta nombran «jersey verde oscuro y camisa de cuadros» y no dicen «no copies la ropa». Marta, con el vestuario variable, sí lo dice.
  - La hoja da 3 recortes de unos 683 × 1 152 px.
  - Aprobar no marca ★, y la ★ no aprueba.
  - Ampliar sustituye el recorte.
  - Publicar pasa de «Aprobada · borrador v1» a «En la ficha v1».
  - Gasto: 0,45 $ (retrato, hoja y ampliación), en una pastilla discreta, con su detalle.
  - Fallo, generación sin confirmar, recarga entre fases, cambio de precio, presupuesto superado y hoja irregular.
  - Al reabrir, dice cuál es la siguiente acción.
- **Recorrido visual en Chrome sobre la versión publicada:**
  - A 1 280 px, completo desde cero, hasta «Ficha de Ramón v1 publicada» y «Preparar otra vista».
  - A 900 px, el panel se superpone, con «Volver a la Mesa».
  - A 390 px, el panel ocupa la pantalla completa y la barra queda visible.
  - El recorrido encontró dos fallos, ya corregidos: el panel volvía arriba al pulsar un ejemplo, y la barra no se actualizaba al elegir la receta.
- **Sin validar:** el recorrido de Juan; la recuperación al cerrar y volver a abrir hecha por Juan; la publicación de la ficha hecha por Juan; la continuidad con imágenes reales; el valor de la hoja compuesta frente a las vistas sueltas (D13). Los retratos son dibujos simulados.
