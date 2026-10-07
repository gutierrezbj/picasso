# AVB 06 · Bases de la imagen con IA

Fuente: AI Video Bootcamp (Promptwise), Fase 3 *AI Images* → *AI Image Overview* y su guía de apoyo *AI Image Creation Basics in Studio*. Material: transcripción y guía de 12 páginas. Leído el 07-10-2026.

## Lo que enseña, en reglas

1. **Cuatro piezas:** prompt (qué crear), modelo (cómo lo crea; es el motor), ajustes (formato y calidad) y referencias (lo que debe seguir). Casi todo flujo empieza en una imagen.
2. **Cambiar de modelo es un arreglo válido:** cada modelo es mejor en algo (realismo, edición, rapidez, calidad final, referencias). Con el mismo prompt, otro modelo puede dar otro resultado.
3. **Un formato por proyecto:** 16:9 para YouTube, cabeceras y cine; 9:16 para Reels, TikTok y Shorts; 1:1 para perfil, producto y anuncio estático. Se elige antes de generar. Cambiar a mitad es error de principiante.
4. **Calidad según la fase:** barato y rápido para explorar; alta calidad cuando la idea funciona. Modelo avanzado, resolución alta y varias salidas cuestan más.
5. **Varias salidas del mismo prompt:** una sola imagen no decide si la idea vale. Se generan unas cuantas, se elige la mejor y se mejora a partir de ella.
6. **Referencias:** una imagen enseña lo que las palabras no. Sirven para la constancia del personaje y del producto, y también para vestuario, pose, lugar, color, encuadre o estilo.
7. **Decir qué conservar de cada referencia.** Es el error típico: se sube la imagen y no se dice para qué es, así que el modelo copia la pose cuando solo se quería la cara, o el fondo cuando solo se quería el vestuario.
   - *Identidad:* conservar cara, pelo, tono de piel y complexión.
   - *Vestuario:* conservar la ropa y cambiar el lugar.
   - *Producto:* conservar envase, logo, forma, color y material.
   - *Pose:* usarla como referencia de pose, no de identidad.
8. **Los mejoradores de prompt añaden cosas que no pediste.** Hay que revisar el prompt mejorado antes de generar.
9. **`@` para personajes y productos guardados:** se mencionan sin volver a subir las referencias.
10. **Generar, revisar, ajustar y repetir.** Si la cara está bien y el vestuario mal, se cambia solo la parte del vestuario. Si parece falso, más lenguaje real de cámara y luz. Si la composición falla, el encuadre. Si el producto cambia demasiado, se refuerza la instrucción de la referencia.

## Qué provoca en Picasso

**Validación:** la regla 3 ya está construida y probada por Juan hoy. El formato sale del destino (§6.1), es uno por proyecto y no se puede cambiar si hay tomas (409). Las reglas 1, 8 y 9 también están cubiertas: las cuatro piezas son la ficha del plano (dirección = prompt), Producir (modelo y ajustes) y las fichas de elemento (referencias). El asistente propone y el director revisa (§9.7). `@` es la 18.6.

**El hallazgo:** Picasso manda las referencias a la operación, cada una con su rol (frontal, perfil, detalle…), pero **el prompt nunca le dice al modelo para qué es cada una**. Las del encargo viajan como «otra». Es justo el error de principiante de la regla 7.

| Regla | Ya lo tiene | Mejora (§18) |
|---|---|---|
| 1, 8 | Ficha del plano, Producir y fichas; el asistente propone y el director revisa | — |
| 2, 4 | — | Refuerza la **18.1** (catálogo con `bueno_para` y `uso: exploracion \| final`) |
| 3 | Formato por destino, uno por proyecto, bloqueado si hay tomas | — (validada) |
| 5 | «Explorar encuadres» (varía encuadre y ángulo) | **18.23** Varias tomas del mismo prompt |
| 6–7 | Referencias con rol en la ficha y en el encargo | **18.22** Qué conservar de cada referencia |
| 9 | — | **18.6** (`@` con miniaturas) |
| 10 | Correcciones (§7.7d) y diagnóstico aprobado (18.3, 18.3b) | — |
