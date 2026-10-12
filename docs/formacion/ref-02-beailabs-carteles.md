# REF 02 · beailabs, guía de estilos y generación de carteles

Fuente: PDF de 23 páginas de beailabs, guía rápida de su vídeo «Deja de hacer imágenes genéricas con ChatGPT». Probado con ChatGPT Images 2.5 (septiembre de 2026). Leído el 12-10-2026. Solo se roba método y técnica: no se copian sus descripciones de estilos (los nombres del catálogo vienen a su vez del de John Hartnup).

## El método, en reglas

1. **Sin dirección, el modelo va al promedio.** Hace lo más típico que ha visto para esa cosa: banderines en las ferias, bustos de mármol en las exposiciones. Palabras como «bonito», «moderno» o «profesional» no describen nada visible.
2. **Quitar un tópico sin poner nada en su lugar trae otro tópico.** Hay que nombrar lo que se quiere (un estilo con nombre propio, una paleta, una tipografía) y quitar por su nombre lo que sobra.
3. **Preguntarle al modelo cómo se llama lo que ha hecho.** Si no sabes el nombre de un adorno, él sí lo sabe, porque lo ha puesto. Lo que tiene nombre se puede quitar o volver a pedir.
4. **Patrón fijo de siete líneas, siempre en el mismo orden:** formato · qué es y para qué · tema (datos) · estilo · texto exacto «y ningún otro texto» · tipografía y paleta (de 2 a 3 colores) · evita.
5. **«Evita» tiene dos partes.** Delante, los tópicos del evento concreto; para descubrirlos se genera primero el cartel genérico y se mira qué repite. Detrás, una parte fija que quita la cara de IA: textura desgastada, pinceladas secas, líneas de velocidad, rayos decorativos y subrayados de pincel.
6. **El estilo son tres capas:**
   - *movimiento de diseño*: la maquetación, dónde va el texto y la tipografía;
   - *movimiento artístico*: la imagen, cómo se dibujan las formas y el color;
   - *técnica*: el acabado, es decir, el grano, las tintas y el papel.

   Se puede mezclar una de cada en la misma línea, y las mezclas que chocan dan lo más interesante. Hay estilos que traen su rotulación o su textura propias, y entonces no se les impone otra.
7. **Un chat nuevo para cada estilo:** en el mismo chat se arrastran textos, colores y adornos. Para comparar estilos se repite el patrón y solo cambia la línea de estilo.
8. **Texto exacto entre comillas, más la coletilla «y ningún otro texto»,** para que no se invente frases.
9. **Retocar por zonas:** si solo falla una parte, se edita esa zona. Hay que repetir lo que no se debe tocar, porque la selección no es exacta.

## Qué provoca en Picasso

**Validación.** Al hilo de la 18.18, el patrón de siete líneas es una plantilla de prompt fija y por secciones, que es lo que hace Picasso. La regla 7 Picasso la cumple de serie: cada operación sale limpia desde su plantilla, sin conversación que arrastre nada. «Evita» es *Qué evitar* del proyecto más los negativos del plano y los negativos por defecto (18.8 y 18.10). La regla 1 es la tesis del producto: el director da dirección.

| Regla | Ya lo tiene | Mejora (§18) |
|---|---|---|
| 1, 4, 7 | Plantilla fija por secciones; cada operación sale limpia | — |
| 2, 3 | Diagnóstico aprobado (18.3 y 18.3b) | **18.24** Nombrar lo que salió |
| 5 | Qué evitar + negativos del plano + negativos por defecto (18.10) | **18.24** (tópicos con nombre a un clic) y la parte fija anti cara de IA para piezas gráficas, que se suma a los negativos por defecto de la 18.10 |
| 6 | Catálogo de estilos (18.21, aplazado al curso 2) | **Ajuste a la 18.21**: estilos en tres capas (maquetación, imagen y acabado), una de cada combinable, con marca de «rotulación propia» o «textura propia» |
| 6–7 | Explorar encuadres (cambia la cámara) | **18.25** Explorar estilos |
| 4, 8 | Ley de Picasso: nunca se pide texto al modelo | **18.26** Texto exacto en piezas gráficas (decisión de Juan) |
| 4 (paleta) | — | Paleta de 2 a 3 colores como campo de dirección; se diseña con la F7b (marca del estudio) |
| 9 | `editar_imagen`, correcciones (§7.7d) y 18.13 | — |
