# HOT 01 · Editor Studio (Director de Edición)

**Fuente:** Hotmart, producto 8770529, autor PrompteandoVideos.
**Contenido:** 11 clases (unos 74 minutos) más un paquete que lo es todo:
- la skill de Claude Code `director-edicion`;
- una página configuradora ("Director de Edición");
- Remotion 4.0.533 con React 19;
- 61 estilos y 11 scripts.

Lo revisé el 26-10-2026: clases con subtítulos y el paquete completo. Solo extraigo el método. El código es del autor (UNLICENSED) y no entra en Picasso. El despiece detallado está en el proyecto Hotmart de Juan (`editor-studio/despiece-editor-studio.md`).

## Qué es

Es una edición automática de reels en cinco pasos:
1. La página configuradora genera un `pedido.json`.
2. Claude Code lee el pedido y escribe un mapa editorial.
3. Unos scripts deterministas hacen el resto: transcribir con Whisper, sincronizar la voz, revisar y entregar.
4. Remotion renderiza.
5. Sale el MP4.

## El método, en reglas

1. **La interfaz no edita, firma un contrato.** El configurador solo produce un JSON que se puede validar. El agente pone el criterio y los scripts la mecánica.
2. **Un estilo es un tema de tokens:** paleta, fuentes, zonas y variantes de título, subtítulo, recurso y llamada a la acción. Un tema por marca.
3. **Todo se ancla a la palabra dicha, no al segundo.** Elementos, recursos, B-roll y zooms se enganchan a una palabra del guion, con coincidencia aproximada.
4. **Prueba de 5–8 s en el tramo más difícil antes del render completo.** El autor calcula que una prueba se lleva un 3 % del plan Pro y un vídeo de 1 minuto, un 20 %.
5. **Memoria de correcciones (`reglas-de-edicion.md`).** Cada corrección del cliente se vuelve una regla que se repasa antes de cada render. Ejemplos:
   - "título o subtítulo, nunca los dos";
   - "máximo 2 líneas";
   - "Whisper llega 100–200 ms tarde".
6. **Fidelidad.** Ningún texto, cifra, precio ni testimonio que no se haya dicho.
7. **Calidad de entrega:**
   - los fps del original, siempre: pasar de 30 a 24 desplazó la boca 67 ms;
   - CRF 12;
   - −14 LUFS en dos pasadas;
   - medir la sincronía labial.
8. **Extraer referencias.** Un vídeo de referencia se convierte en informe, escenas, receta y prompt, separando lo observado, lo inferido y lo que no se puede verificar.

## Qué provoca en Picasso

Picasso no es un editor (§1.0). El montaje fino se queda en DaVinci, así que el motor de Remotion no entra. Del curso se toman tres cosas:

| Regla | Ya lo tiene | Mejora |
|---|---|---|
| 1 | `EntradaOperacion` inmutable y `direccion.json` por plano (SDD del Director) | Validación: es el mismo patrón |
| 4 | Borrador obligatorio a la resolución más baja (18.52) | Validación |
| 5 | Nota estructurada de revisión de la toma (SDD, punto 9) | **18.65** Reglas aprendidas por espacio |
| 3, 7 | Subtítulos en el paquete (18.14) | Concreta la 18.14: los tiempos salen de la voz elegida, se corrigen con la envolvente del audio y se entregan a los fps del proyecto |
| 8 | Analizar una referencia (18.49) | Amplía la 18.49 a vídeo: escenas, observado/inferido/no verificable |
