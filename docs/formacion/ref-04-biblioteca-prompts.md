# REF 04 · Biblioteca de prompts de Prompteando Videos

**Fuente:** bibliotecadeprompts1.base44.app, la biblioteca que acompaña a HOT 02. Es una app de Base44 con acceso por cuenta de compra.
**Revisión:** exportada y leída entera el 26-10-2026. Son 470 prompts en español y en inglés, en 12 categorías, más 22 herramientas enlazadas.
**Naturaleza:** es referencia, no curso. Aquí no se copia ningún prompt. El export original está en la carpeta de formación de Juan (`Hotmart/curso-2/biblioteca/`). Los catálogos propuestos en `datos/` están redactados por nosotros: solo conservan los nombres de las técnicas y los valores numéricos.

## Qué es

| Categoría | Nº | Contenido |
|---|---|---|
| Imágenes | 237 | Ángulos del avatar (48), avatar desde cero, hojas de personaje, producto, cambiar aspecto, vestuario y fondo, app y software. Además, unos 170 ejemplos de un solo uso: Luxury, poses, UGC de influencer y nichos |
| Vídeos | 117 | **Movimientos de cámara (58)**, tonos visuales (10), formatos (podcast, dualcast, B-roll), micro-acciones, moda y skincare, UGC, anuncios de producto (10) y escenas (5) |
| Emociones | 50 | 25 para imagen y 25 para vídeo |
| Audio | 30 | 8 voces, 16 estilos de locución y 6 acentos |
| Paso a paso | 16 | Storyboard 3×3, recrear un panel, contact sheet, hoja de emociones, esquema JSON |
| Otras | 20 | MVP en Base44, landings, estrategia comercial, guion de 4 clips |

Unos 350 de los 470 son ejemplos de un solo uso. Están cargados de marcas reales (cosmética, perfumería, moda, coches) y de personajes ajenos (superhéroes, anime), y algunos están sexualizados. **Se descartan.** Lo aprovechable son unos 120 bloques combinables.

## El método, en reglas

1. **La biblioteca funciona por bloques que se combinan.** Un prompt de vídeo es [movimiento] + [acción o emoción] + [lugar y luz] + [plano] + "guion" + [voz] + [acento] + [look] + el cierre «toma única, sin cortes». La biblioteca es, en la práctica, un menú de piezas sueltas.
2. **Cada movimiento de cámara se escribe con números y negaciones.**
   - Números: radio, altura, grados de campo de visión, duración del golpe de zoom.
   - Negaciones explícitas de lo que no debe pasar: «sin pan, sin zoom, sin deriva».
   - **El fallo típico del modelo**, apuntado en cada uno: en el arco gira el sujeto como en un plato giratorio; el dolly hacia atrás acaba siendo un dron; el zoom se convierte en dolly; el plano fijo se queda con deriva; el contrapicado bajo acaba levantándose.
3. **El movimiento se reparte en tiempos.** Quieto, golpe y quieto. Si no se marcan, el modelo reparte el movimiento por todo el plano.
4. **La emoción se describe en el cuerpo y no se nombra.** «Cejas asimétricas, la mirada escudriña, la cabeza se inclina de golpe, la boca queda entreabierta.» Así se escriben 25 emociones de vídeo. En imagen, el set y la luz se fijan para que la emoción sea lo único que cambia.
5. **La hoja de personaje admite referencias por partes del cuerpo**: cara, cuerpo, ropa, accesorio, calzado y pelo. Cada una solo manda en lo suyo. No se fusionan ni se promedian caras. Si falta una referencia, esa parte se deja neutra y no se inventa.
6. **La ficha de localización** lleva tipo, época, escala, arquitectura, materiales, atmósfera, hora por defecto, clima por defecto y función en la historia. Su hoja tiene 6 paneles: vistas, horas del día, detalles, atrezo, clima y paleta en hex.
7. **El esquema JSON de la escena** tiene estas secciones:
   - `scene_overview`: género, mood, estilo visual;
   - `camera_setup`: formato, plano, ángulo, focal, tipo de lente, profundidad de campo, punto de foco, composición, movimiento;
   - `subject_details`: sujeto, acción, emoción;
   - `environment`: lugar, hora, clima, detalles;
   - `lighting_and_color`;
   - `render_constraints`.

   Exige que los valores sean coherentes entre sí: no puede haber noche con luz de mediodía.
8. **Storyboard 3×3 numerado y luego «recrear el panel N».** Un panel se convierte en imagen de arranque. Ese panel se trata como fuente de verdad absoluta y se elimina la cuadrícula.
9. **Jerarquía de referencias:** imagen del personaje > imagen del entorno > descripción > estructura de planos. La descripción nunca anula la imagen.
10. **Anuncio de producto de 10 s.**
    - La referencia es la verdad dimensional (en 3D, no solo de estilo).
    - Anatomía de componentes: qué partes tiene y qué **no** tiene.
    - Proporción numérica.
    - Etiqueta transcrita. Si sale pequeña, se conserva la forma en vez de inventar texto.
    - Orden de prioridad: identidad > logo > silueta > material > visibilidad > luz > cámara.
    - Momentos en los que el logo se ve.
    - De 6 a 10 tramos de 1 a 1,5 s.
    - Solo efectos de sonido.
    - Unos segundos finales estáticos para poner la marca en postproducción.
11. **Ediciones de imagen con cláusula fija:** misma persona, mismo outfit, mismo escenario, «cambia SOLO X». Con dos imágenes, se asigna a cada una su papel: «la persona es la imagen 1, la ropa es la imagen 2; NO copies el rostro de la imagen 2».
12. **Realismo** (un solo prompt, el mejor). Pide:
    - profundidad de campo amplia, toda la imagen nítida;
    - gradación desaturada sin HDR;
    - imperfecciones concretas: poros, lunares, capilares, mechones;
    - materiales gastados;
    - luz de ventana direccional.

    Casi todos los demás ejemplos de UGC hacen lo contrario y usan bokeh.

## Lo que NO se toma

- **Los ejemplos.** Luxury, poses, UGC de influencer, nichos y escenas de acción con personajes ajenos.
- **Los prompts de anuncio de 11.000 a 19.000 caracteres.** Repiten la misma regla tres o cuatro veces. En Picasso, la fidelidad vive en la ficha y en la imagen de arranque, no en párrafos repetidos. Además hay que verificar el límite de prompt de cada modelo antes de usar algo largo.
- **Nombres de directores, películas y marcas en los looks** (18.21).
- **Errores técnicos:**
  - «picado (low angle)»: low angle es contrapicado;
  - «MCU = macro primer plano»: es plano medio corto;
  - la hoja «Seedance 2.5» que no menciona Seedance;
  - contradicciones como «sin logos añadidos» seguido de un logo final.

## Cómo se adapta su menú a Picasso

La biblioteca es un **menú de navegación**: 12 categorías con subcategorías, buscador, favoritos y botón de copiar. En Picasso eso **no se replica**. Picasso «no es un mercado de plantillas» (§1.0), y un catálogo de 470 entradas para ojear es justo lo que hace lento el trabajo. Los bloques se reparten así:

1. **Datos, no pantalla.** Cada familia de bloques es un fichero en `backend/data/`, editable sin tocar código (§0.1). Las semillas de la propuesta están en `docs/formacion/datos/`.
2. **Cada bloque aparece donde se decide.** Hay seis superficies:
   - *Dirección del plano:* cámara, ángulo, movimiento, look, emoción e interpretación salen como selectores con su texto y su aviso de fallo.
   - *Director:* las opciones de las cinco preguntas (18.52) salen del catálogo y no se inventan.
   - *Ficha del elemento:* voz, acento y locución en la ficha de voz; roles de referencia y paneles en la hoja; campos de localización.
   - *Ficha de la imagen en el Taller:* cambiar ángulo y encuadre, cambiar vestuario o fondo, «cambia solo X». Son acciones con su cláusula, no prompts para copiar.
   - *Tipo de pieza:* el anuncio de producto y el UGC son recorridos con su plantilla, no prompts sueltos.
   - *El 3D de cámara (18.55)* sustituye la lista de ángulos.
3. **Una paleta «/» en lugar del menú (18.64).** En el prompt del Taller y en las notas del Director, «/» abre los bloques por familia (cámara, emoción, acción, look, voz, acento, formato), con buscador. Insertar un bloque **no pega texto suelto**: rellena el campo de dirección correspondiente, y el prompt se reconstruye desde la dirección. Es el gemelo de «@» (18.6), que sirve para elementos y referencias.
4. **La biblioteca propia son las recetas (18.5).** Lo que de verdad hay que guardar no son prompts ajenos, sino las tomas que funcionaron: la dirección, el prompt, el modelo y el coste. Las recetas se consultan con la misma paleta «/».

## Qué provoca en Picasso

| Regla | Ya lo tiene | Mejora |
|---|---|---|
| 2, 3 | 8 movimientos genéricos en `opciones_direccion.yaml` | **18.54** Catálogo de cámara con parámetros y fallo típico |
| 2 | Encuadre y ángulo de inicio y final (§8) | **18.55** Cámara 3D con dos estados |
| 4 | Interpretación en el plano (18.32) | **18.56** Emociones como secuencia física |
| — | Ficha de voz (18.44) | **18.57** Voz, locución y acento como bloques |
| — | Look de cámara (18.47) y estilos (18.21) | **18.58** Looks de rodaje: cámara, película, temperatura y paleta, sin nombres |
| 6 | Entorno explícito (18.17) y moodboard (18.40) | **18.59** Ficha de localización con hoja de 6 paneles |
| 5, 9 | Para qué cada referencia (18.22) y hoja de una sola cara (18.41) | **18.60** Referencias por parte del cuerpo y jerarquía |
| 10 | Texto exacto (18.26) | **18.61** Anatomía y etiqueta del producto, plantilla de anuncio |
| 8 | Planos con la estructura de 9 (18.33) | **18.62** Storyboard 3×3 y recrear un panel |
| 7 | Formato json por modelo (18.18) | **18.63** Coherencia entre campos de la dirección |
| 1 | `@` para elementos (18.6) | **18.64** Paleta «/» de bloques |
| 12 | Pistas de realismo (18.16b) | **18.16c** Preajuste «Realismo de móvil» |
| 11 | Taller: variaciones y cambiar ángulo (18.29) | Validación; las cláusulas se redactan en `plantillas_prompt.yaml` |
