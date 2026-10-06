# AVB 05 · Prompting 2

Fuente: AI Video Bootcamp (Promptwise), AI Creator Foundations → *Prompting 2*. Material: transcripción. Leído el 07-10-2026.

## Lo que enseña, en reglas

1. **Escalera del prompt:** se parte de la semilla ("una mujer tomando café") y se añade una capa cada vez: sujeto concreto, entorno ("cocina pequeña, mañana de lluvia"), cámara ("al otro lado de la mesa"), luz ("luz gris y suave de la ventana, detrás"), tono ("tranquilo y reflexivo") y estilo ("foto de iPhone realista, piel con textura natural, ligero desenfoque de movimiento"). No hace falta escribirlo perfecto de una vez.
2. **Opciones a un clic:** cuesta recordar todo lo que mejora un prompt, así que tener las opciones a la vista ayuda.
3. **Las referencias cuentan:** el mejorador de prompts tiene en cuenta las imágenes de referencia.
4. **Diagnosticar por la parte del marco que falló:**

   | Problema | Arreglo |
   |---|---|
   | Genérico | Sujeto, entorno y detalle de historia más concretos |
   | Falso o plástico | Menos palabras de pulido y más imperfecciones de cámara |
   | La luz no convence | Describir la fuente real y su dirección |
   | Composición aburrida | Ángulo, tamaño de plano y encuadre |
   | Ignoró algo importante | **Mover lo importante al principio del prompt** |
   | Demasiado cargado | Quitar detalles y simplificar |

5. **Pistas de realismo:** textura natural de la piel, encuadre imperfecto, foto espontánea de móvil, luz irregular, desenfoque de movimiento y compresión realista.
6. **Prompt en JSON:** secciones con etiqueta en lugar de un párrafo, como un brief creativo. Deja ver qué falta (si el campo de cámara está vacío, el modelo adivinará el encuadre) y permite editar una sola parte. No siempre da mejores resultados, pero obliga a ser claro.
7. **Biblioteca de prompts:** se guarda el prompt, el resultado y una nota de qué funcionó. Los profesionales no empiezan de cero.

## Qué provoca en Picasso

**Validación:** la dirección de un plano en Picasso *ya es* un prompt en JSON: secciones con etiqueta, editables una a una, y la vista previa muestra lo que falta. La escalera es rellenar la ficha del plano, y las opciones a un clic son `opciones_direccion.yaml`.

| Regla | Ya lo tiene | Mejora (§18) |
|---|---|---|
| 1–2 | Ficha del plano por campos, con opciones a un clic | Con la 18.15 se ve cuántas de las seis partes están completas |
| 3 | Las referencias de las fichas viajan a la operación | — |
| 4 | Diagnóstico aprobado (18.3) | **18.3b** El diagnóstico señala la parte del marco y **el campo concreto del plano** que hay que tocar |
| 4 (orden) | La plantilla empieza por «qué se muestra» | **18.18** Lo imprescindible, primero |
| 5 | Estilo opcional con sugerencias (18.16) | **18.16b** Pistas de realismo a un clic dentro de Estilo |
| 6 | Dirección estructurada | **18.18** Formato del prompt por modelo: texto o JSON |
| 7 | — | Refuerza la **18.5** (Recetas): prompt, resultado y nota de qué funcionó |
