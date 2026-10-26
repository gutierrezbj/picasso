# HOT 02 · Vídeos con IA: Prompteando Videos

Fuente: Hotmart, producto 8768392, del mismo autor que HOT 01. Son 33 clases publicadas (unas 3 h) en 6 módulos, más los bonos:
- tres guías en PDF: movimientos de cámara (34 págs.), ángulos (76 págs.) e iluminación y atmósfera (27 págs.);
- tres skills de Claude: `reference-image-decoder`, `prompt-director` y `veo-ugc-avatar-prompter`;
- la biblioteca de prompts, que tiene ficha propia en [REF 04](ref-04-biblioteca-prompts.md).

Revisado el 26-10-2026. Hay transcripción completa de 29 de las 33 clases y los bonos están leídos enteros. Aquí queda solo el método. El despiece completo está en el proyecto Hotmart de Juan (`prompteando-videos/despiece-prompteando-videos.md`).

## Qué es

Un curso de imagen a vídeo para UGC y anuncios, de nivel inicial. El flujo es: copiar un prompt, pegarlo en ChatGPT o en Google Flow, generar y montar en CapCut. **Las clases valen poco. Lo que vale son los bonos.**

## El método, en reglas

1. **Cinco preguntas antes de gastar créditos:** qué es, para qué plataforma, para qué público, qué emoción y qué formato.
2. **Consistencia en dos pasos:**
   - foto real como semilla;
   - el decoder la describe;
   - imagen base;
   - hoja de personaje;
   - y desde ahí todo se genera con base + referencia.
   Los cambios de ropa o pose se hacen sobre la imagen base, nunca desde cero.
3. **Describir lo que se mide, no adjetivos.** El decoder trabaja en 11 ejes: «softbox a 45° a la izquierda, proporción 1:2», no «luz suave». Separa la descripción forense, en español, del prompt para cada motor, en inglés.
4. **Realismo de avatar = menos producción.**
   - Exposición imperfecta.
   - Profundidad de campo amplia, sin bokeh.
   - Piel sin retocar, con sus defectos nombrados.
   - Sin etalonaje.
   - Un punto de vista de cámara coherente: selfie, espejo o tercera persona.
5. **El prompt de vídeo va en capas fijas:** cámara → acción → guion → voz y edad → bloque de acento.
6. **Una sola acción por clip.** Los clips de producto se generan por partes: abrir, aplicar, mostrar.
7. **Bloque de acento.** Se le dice al modelo el acento exacto (por defecto, castellano de Madrid) y lo que no debe hacer, porque si no mezcla variantes.
8. **Texto legible en el producto.** Antes de generar se pasa toda la etiqueta al prompt.
9. **Editar en porcentajes:** «reduce los pendientes un 20 %».
10. **Varias referencias etiquetadas** (`@imagen1`, `@imagen2`) para dualcast y animados. Es el mismo patrón que Scene context / References / Shots de Seedance.
11. **Agregadores con API** (KIE.ai, APIMart) para producir más barato que yendo directo a cada plataforma. Precios del vídeo, sin verificar.
12. **Guías de cámara.** Cada movimiento, ángulo o luz trae cuándo usarlo, plano y lente, una plantilla y una línea corta para añadir al prompt. Son 30 movimientos (F1–F30) en 5 bloques, unos 50 ángulos y 19 entradas de luz y etalonaje.

## Lo que NO se toma

- **Nivel de las clases.** Se resuelve probando hasta que salga, sin criterio de aceptación.
- **Las skills de terceros.** El decoder y el prompter de Veo vienen escritos para otro creador («Lamin») y se redistribuyen sin adaptar. Solo se aprovecha el método.
- **Copiar tendencias virales cambiando el personaje.** Plantea problemas de derechos sobre la coreografía, el audio y el vídeo original.
- **Nombres de directores y de películas** en los looks de las guías. La 18.21 los descarta.

## Qué provoca en Picasso

| Regla | Ya lo tiene | Mejora |
|---|---|---|
| 1 | Entrevista de cinco preguntas (18.52) | Validación |
| 2 | 18.27, 18.28, 18.41 y 19.6 | Validación del orden: base → hoja → base + referencia |
| 3 | Analizar una referencia (18.49) | Amplía la 18.49: devuelve valores medibles (ángulo de la luz, proporción, temperatura) y nunca adjetivos |
| 4 | Pistas de realismo (18.16b) y look de cámara (18.47) | **18.16c** Preajuste «Realismo de móvil» |
| 5, 7 | Ficha de voz (18.44) y ruta A (18.45) | **18.57** Voz, locución y acento como bloques |
| 6 | — | Regla nueva de la revisión (18.48): un plano con dos acciones principales es «importante» y se propone partirlo |
| 8 | Texto exacto (18.26) | **18.61** Anatomía y etiqueta del producto |
| 10 | Para qué sirve cada referencia (18.22) | **18.60** Referencias por parte del cuerpo |
| 11 | Catálogo de proveedores (§9.3) | APIMart como proveedor candidato: precio y API sin verificar |
| 12 | `opciones_direccion.yaml` con 8 movimientos genéricos | **18.54** Catálogo de cámara con parámetros y fallo típico |
