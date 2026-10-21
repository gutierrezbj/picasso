# IDALL 01 · The Final Pass

Fuente: IDALL AI (Skool), curso «The Final Pass», 10 lecciones. Leído el 22-10-2026: el texto de las 10 lecciones y la transcripción completa de sus 9 vídeos de Loom (las lecciones 3 y 4 comparten vídeo). Solo método. En la página, la lección 2 repite el texto de la 1, y la 3 lleva el de interpretación.

## El método, en reglas

1. **Visión de director (L1).** El cine es arquitectura dramática: conflicto, estructura y lenguaje visual claro. Cada decisión refuerza conflicto, tema y emoción.
   - **Conflicto:** alguien quiere algo, algo se lo impide y fallar importa. Puede ser externo, interno o ideológico.
   - **Tema:** la historia pregunta qué pasa; el tema, qué significa. El tema decide encuadre, montaje, sonido y atmósfera.
   - **Estructura:** planteamiento, confrontación y desenlace. Cada escena hace avanzar la historia.
   - **Espacio:** cerrado da tensión y trampa; abierto, libertad o aislamiento. El estilo nace de la limitación.
   - **Papeles:** protagonista, antagonista, personaje espejo y catalizador.
   - **Deberes:** logline, conflicto, tema, estilo visual (oscuro o claro, calmo o dinámico, crudo o limpio) y 2–3 personajes.
2. **Interpretación (L3).** El movimiento no es interpretación; la emoción sí. Seis mecánicas:
   - motivación antes del movimiento (emoción + intención = movimiento);
   - microactuación (mirada, parpadeo, mandíbula, respiración, duda);
   - tiempo emocional (pausa + retardo = humano);
   - lenguaje corporal (postura = psicología);
   - los ojos (pensamiento interior);
   - ritmo (quietud, movimiento, quietud).

   Si el personaje siente algo, el público también.
3. **Personaje (L4).**
   - Lógica de vida: un superviviente no se mueve como un rey.
   - Contrastes que lo hacen humano: tranquilo pero peligroso, fuerte pero roto.
   - Primero la historia y después la estética.
   - Una vez encontrado, no se cambia: misma cara, misma energía.
   - La emoción cambia la postura y los ojos, pero la identidad se mantiene.
4. **Storyboard (L5).** Una película, no fotos sueltas.
   - La escena se parte en pulsos: planteamiento → acción → revelación → emoción → escalada → remate.
   - **Estructura de 9 planos:** establecimiento, movimiento del personaje, revelación, interacción, inserto, reacción emocional, escalada, momento de decisión y remate.
   - Alternar tamaños de plano (nunca medio, medio, medio).
   - Una idea por plano. Primero la emoción y luego el encuadre: miedo, más cerca; soledad, más lejos; poder, contrapicado.
   - Continuidad de personaje, vestuario, luz, entorno y tono.
   - Se arregla la secuencia, no se regenera todo.
5. **Cámara (L6).** Cinematográfico es dirección, no espectacularidad. Antes de cada plano: ¿qué debe sentir el público? Seis tipos de plano, con emoción y óptica:

   | Tipo | Para qué | Óptica |
   |---|---|---|
   | Establecimiento | Escala | 18–28 mm |
   | Acción en travelling | Inmersión | 28–35 mm |
   | Aislamiento cenital | Vulnerabilidad | 18–24 mm |
   | Amenaza baja | Peligro | 40–50 mm |
   | Inserto | Textura | 65–85 mm |
   | Emocional | Conexión | 50–65 mm |

   La emoción se gana con una progresión: escala → movimiento → vulnerabilidad → amenaza → detalle → emoción. El movimiento de cámara, sutil.
6. **Composición (L7).** Diez técnicas, cada una con su emoción:
   - regla de tercios: equilibrio;
   - líneas guía: foco;
   - simetría: control;
   - centro: importancia;
   - marco dentro del marco: aislamiento;
   - espacio negativo: soledad;
   - profundidad en tres capas: inmersión;
   - equilibrio visual: estabilidad;
   - diagonales: energía;
   - contraste: foco.

   El error grande es dejar que el modelo decida dónde va el sujeto.
7. **Luz (L8).** Diez técnicas, cada una con su emoción:
   - luz motivada, con fuente visible: realismo;
   - Rembrandt a 45°: volumen;
   - lateral: drama;
   - contraluz o recorte: separación;
   - clave alta: seguridad;
   - clave baja: tensión;
   - dura o suave: textura;
   - relleno negativo: contraste;
   - temperatura de color, cálida frente a fría: emoción;
   - volumétrica (niebla, polvo): atmósfera.

   El error grande es luz sin intención emocional.
8. **Narrativa visual (L9).** Un fotograma cinematográfico junta emoción, composición, tensión y movimiento contenido.
   - Los objetos revelan psicología.
   - La tensión llega antes que la acción.
   - El espacio comunica poder.
   - No se trata de enseñarlo todo, sino de hacer sentir.
9. **Prompt de una escena con diálogo (L10, vídeo; hasta el minuto 2).** Vídeo en Seedance con referencias llamadas con `@` y diciendo qué hacer con cada una:
   - **Referencia partida:** `@image_1` es la cara del personaje (el anclaje de identidad) y `@image_2` es una hoja de sus emociones. Con un solo retrato, el modelo congela esa expresión («máscara de plástico»); con las dos, cambia de expresión sin perder la identidad.
   - **Reglas de continuidad contra fallos:** «sin reinicio visual», «sin movimientos repetidos», «el movimiento empieza una vez y sigue a través de los cortes de cámara».
   - No sale perfecto a la primera: se generan varias, se eligen los mejores trozos y se montan en el editor.

## Lo que añaden los vídeos

10. **Escena con diálogo, la fórmula completa (L10).** Prompt perfecto = **base × restricciones avanzadas**.
    - **Base:** lugar, referencias, estilo, personajes y tiempos.
    - **Restricciones avanzadas:**
      - *Sin reinicio:* el movimiento empieza una vez y sigue a través de los cortes.
      - *Eje de 180°:* A siempre a la izquierda de pantalla y B a la derecha, nunca se cruza el eje. Así no se intercambian ni se gira el decorado, y que B «invada» el lado de A ya cuenta el dominio.
      - *Voz fijada:* nada de «voz grave», sino un registro de 85–105 Hz y 60–64 dB, para que la voz no cambie entre bloques.
      - *Interpretación por músculos, no por emociones:* «ligera tensión de mandíbula, pequeños cambios de respiración, mirada controlada» en vez de «traicionado», que da una mueca de teatro.
      - *Cámara motivada y limitada:* «arco sutil de unos 10°, nada vistoso», que se mueve porque se mueve el personaje, y acercamiento lento en la frase clave.
      - *El silencio se pide en positivo:* «agua lejana, zumbido industrial suave», nunca «sin música», más una pausa de 1 s.
    - Se trabaja en bloques de 15 s, al menos tres generaciones, y se montan los mejores cortes de 3 s.
11. **La regla de los 8 canales (L2).** Una escena comunica por palabras, tono, pausa, expresión, gesto, mirada, ritmo y comportamiento en el espacio. El diálogo es corto e indirecto (subtexto: «ahora el precio son dos barriles» significa «aquí mando yo»). Cada escena tiene cuatro piezas: **objetivo, obstáculo, cambio emocional y cambio de conducta** (llega quieto y se va sin mirar atrás). Una escena que solo funciona por el diálogo todavía no es cine.
12. **Moodboard antes de generar (L3–4).**
    - Secciones: mundo, personajes, vestuario, luz, sensación de cámara, objetos, emoción y paleta. De 3 a 5 referencias por sección.
    - Se busca por emoción («desierto postapocalíptico realista», no «postapocalipsis guapo»).
    - Si falta una referencia, se genera una provisional.
    - Paleta de 3 a 5 colores sacada de la imagen que mejor dice «esta es mi película».
    - Un moodboard maestro y otros por escena: el personaje se mantiene y el mundo evoluciona.
13. **Storyboard (vídeo de L5).**
    - Primero la lógica de planos y después las imágenes.
    - Encuadrar un 20 % más abierto, con el horizonte algo bajo y en capas (frente, sujeto, fondo).
    - Revelar poco a poco: sombra, reacción, revelación parcial, revelación completa.
    - Cada corte, motivado. Primeros planos solo si cambia la emoción.
    - «Arregla la secuencia, no la imagen.»
14. **Contar con imágenes (vídeo de L6, escenas de 5 s en Kling).** Contar es cambiar la emoción. Se progresa por planteamiento, conflicto, escalada, emoción y desenlace. Una acción fuerte por escena. Prompt de intención, no de estética («quién, qué hace, qué cambió, cómo se mueve la cámara»). Se prueba sin sonido.
15. **Emociones en capas (vídeo de L9).**
    - Nada de «rey malvado»: «amenaza contenida, confianza depredadora, quietud intimidante, diversión maliciosa sutil». Se dirige la contradicción y la psicología, no el aspecto.
    - Movimiento con psicología: paso con peso, reacción retardada, respiración contenida.
    - Vocabulario de cámara: acercamiento lento, encuadre por el entorno, cámara en mano contenida, poca profundidad de campo, compresión de óptica, paralaje atmosférico, primer término que tapa.
    - En Seedance, contención: el poder vive en la quietud.

## Qué provoca en Picasso

**Validación.** Es el mismo esqueleto de Picasso, casi paso por paso:

| Curso | Picasso |
|---|---|
| Visión, conflicto, tema y estilo | Idea (Desarrollo) |
| Personajes coherentes | Elementos con ficha validada |
| Guion visual y pulsos | Guion por escenas |
| Storyboard, cámara, composición y luz | Lienzo: planos y su dirección |
| «Generar varias y montar los mejores trozos» | Tomas y Montaje con paquete para DaVinci |

Picasso es compatible y está hecho para esto. Este curso pone el criterio que le falta a cada campo.

**Lo que explica el fracaso del corto de Tania.**
- La interpretación (regla 2): no hubo emoción, intención, pausa ni ojos.
- Un solo retrato congela la cara (regla 9). Es la «boca chiclosa con máscara».
- El método: Seedance genera vídeo con diálogo partiendo de referencias, y no anima una foto con audio pegado encima. Es la hipótesis de la 19.28.

| Regla | Ya lo tiene | Propuesta (§18) |
|---|---|---|
| 1 | Premisa, intención, tono | **18.31** Conflicto y tema en el Desarrollo, más el estilo visual en tres ejes |
| 2 | Dirección de cámara y luz, sin interpretación | **18.32** Interpretación en el plano: emoción, intención, microgesto, pausa y mirada; entra en el prompt de vídeo y en el de personaje que habla |
| 4 | Ficha con rasgos fijos y variables | Refuerza 19.6 y 18.28 |
| 5 | Guion gráfico, planos por escena | **18.33** Proponer planos de una escena con la estructura de 9, más aviso de «tres planos medios seguidos» |
| 5–6 | Encuadre, ángulo, óptica | **18.34** «¿Qué debe sentir el público?» en el plano, que sugiere tamaño, ángulo y óptica en mm según la tabla de L6 |
| 7 | Campo libre «Composición» | **18.35** Composición como lista cerrada de las 10 técnicas (en `opciones_direccion.yaml`), con su emoción |
| 8 | 18.16 y 18.19 (fuente de luz y vocabulario) | Amplía 18.19 con Rembrandt, recorte, clave alta y baja, relleno negativo y volumétrica |
| 9 | Una referencia por rol | **18.36** Referencia de emociones (rol nuevo «emociones», una hoja de expresiones) distinta de la de identidad, más reglas de continuidad por defecto en el vídeo de varios planos |
| 9 | Ruta B (foto + audio) | **18.37** Probar Seedance (vídeo con diálogo desde referencias) en la prueba de control de la 19.28 |
| 10 | Diálogo en el guion, voz en la ficha | **18.38** Escena con diálogo como bloque: quién está a la izquierda o a la derecha (eje), voz fijada en la ficha (registro y volumen), cámara motivada con grados, silencio en positivo, bloques de 15 s |
| 11 | Escena con qué ocurre, qué se ve e intención | **18.39** Escena con objetivo, obstáculo, cambio emocional y cambio de conducta; el asistente señala los diálogos sin subtexto |
| 12 | Paso «Mundo y escenarios» | **18.40** Moodboard del proyecto: secciones con 3–5 referencias, paleta de 3–5 colores sacada de una imagen; maestro y por escena; alimenta los prompts |
| 2, 15 | — | Ajuste a la 18.32: la interpretación se escribe en músculos y en emociones en capas, nunca con una sola palabra emocional |
