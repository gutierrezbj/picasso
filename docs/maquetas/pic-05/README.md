# Maqueta PIC-05 · Director de Studio: hoja de personaje

Versión navegable: https://claude.ai/artifact/SLbhDsi6bGatVStBdHkpku (privada; la abre Juan). Fuente: `hoja-de-personaje.html`, un único archivo autocontenido que se abre también en local.

Datos simulados: nada se genera ni se cobra. El precio que enseña es el de Nano Banana Pro en fal del catálogo (0,15 $, verificado el 14-11-2026). El presupuesto de 5,00 $ es de ejemplo. Paleta oscura aprobada en PIC-01 (D11).

## Recorrido (revisión 2)

1. Pestaña «Director de Studio» → «Hoja de personaje».
   - Lleva la marca «Receta guiada · sin agente».
   - «Hablar con el Director», el agente, aparece como «Próximamente».
2. Origen:
   - «De referencias existentes»: Marta, ficha v2 con ancla.
   - «Describir un personaje nuevo»: primero el retrato ancla.
3. Identidad:
   - columnas «Se conserva» y «Puede variar»;
   - resumen «Rasgos y referencias que se deben conservar», editable, que nombra las referencias que viajan;
   - aviso de que la continuidad se comprueba en los resultados.
4. Lo que falta: dos preguntas cada vez, con «Omitir».
5. Uso y vistas: una vista por imagen; las expresiones (de 1 a 3) van aparte, con vista frontal.
6. Dirección:
   - «Dirección de la hoja» guardada: fondo, luz, acabado y encuadre por vista;
   - por vista: encuadre, ángulo, objetivo y una excepción de luz y fondo que no toca la hoja.
7. Qué se enviará: texto exacto con vista y expresión por separado, imágenes numeradas, modelo («calidad para hojas de personaje: sin validar»), precio por vista y total, y el aviso de cómo se reserva. «Preparar» no gasta.
8. Barra: «Generar N vistas · X $». Cada vista reserva su precio al autorizarse.
   - Una que falla libera su reserva, y la barra ofrece «Generar las que faltan».
   - Una que queda sin confirmar mantiene la reserva y se resuelve con «Comprobar».
   - Si se recarga entre fases, las vistas quedan «preparadas, sin autorizar» y se autorizan desde la barra, viendo el precio.
9. Toma:
   - ★ (no vincula);
   - «Comparar con el ancla»;
   - «Aprobar para la ficha» (borrador vN+1, con vista y expresión);
   - «No mantiene la identidad», con tres opciones que no se ejecutan solas.
10. «Ficha de Marta»: referencias con su vista y su expresión, dirección de la hoja y «Aprobar ficha vN», que guarda la dirección en la versión.
11. Franja de prototipo para el próximo lote: una pierde la identidad, una falla, una queda sin confirmar, se recarga entre fases. Además: cerrar y volver a abrir, empezar de cero.

## Comprobado

- Revisión 1 (`0467afb`): 28 comprobaciones de lógica en Node.
- Revisión 2 (21-11-2026): 29 comprobaciones de lógica en Node sobre el script:
  - receta y agente separados, sin la palabra «bloqueo» y sin prometer identidad;
  - la dirección de la hoja se guarda y una excepción no la toca;
  - 3 vistas y 1 expresión dan 4 tarjetas, con vista y expresión por separado;
  - preparar no gasta y el doble clic no duplica;
  - una fallida libera su reserva (0,60 → 0,45 estimado y 0 reservado) y se ofrece «las que faltan»;
  - una incierta mantiene su reserva y no se reofrece;
  - recarga entre fases: 1 autorizada y 2 preparadas que no se autorizan solas;
  - `direccion_hoja` queda guardada al aprobar la v3.
- Recorrido visual de la versión publicada en Chrome (revisión 2): receta, origen, identidad, uso, dirección de la hoja, qué se enviará, preparar y un lote de 3 con una fallida («Generar las que faltan · 0,15 $»). Se ve bien a 1295 px; el ancho de móvil no lo he mirado.
- Esto **no** sustituye el recorrido de Juan ni la revisión del SDD. La maqueta **no** valida la continuidad del personaje: los retratos son dibujos simulados.
