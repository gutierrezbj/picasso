# Maqueta PIC-05 · Director de Studio: hoja de personaje

Versión navegable: https://claude.ai/artifact/SLbhDsi6bGatVStBdHkpku (privada; la abre Juan). Fuente: `hoja-de-personaje.html`, un único archivo autocontenido que se abre también en local.

Datos simulados: nada se genera ni se cobra. El precio que enseña es el de Nano Banana Pro en fal del catálogo (0,15 $, verificado el 14-11-2026). El presupuesto de 5,00 $ es de ejemplo. Paleta oscura aprobada en PIC-01 (D11).

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
