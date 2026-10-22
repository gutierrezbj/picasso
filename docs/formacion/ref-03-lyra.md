# REF 03 · Lyra (Corvere Solutions)

Fuente: `lyra.zip`, un plugin de Claude Code/Cowork, v2.1.0 de mayo de 2026, hecho por Corvere Solutions para la comunidad de Protocolo EVA. Contiene 4 agentes, 6 skills y 4 comandos, todo en Markdown, sin código ejecutable. Revisado el 23-10-2026. Es referencia, no curso: no se instala ni se copia texto; se extraen ideas.

## Qué es

Una asistente que genera prompts de imagen y vídeo:
- `lyra-engineer` diseña el prompt (JSON universal y texto para la plataforma);
- `platform-router` elige el modelo con un árbol de decisión;
- `reference-image-analyzer` saca una base estructurada de una imagen;
- `visual-prompt-auditor` revisa antes de generar, con severidad.

Las skills son: esquema JSON v2.0, chuleta de plataformas, negativos por tipo de pieza, composición en capas (primer término, término medio, fondo), texto en imagen por modelo y audio por plataforma.

## Lo que NO se toma (criterio propio)

- **Catálogo y precios.** Es una foto de mayo de 2026 con datos sin verificar: Nano Banana Pro a 0,24 $ en 4K (en fal, 0,30 $) y «negativos nativos» que la API de fal no tiene. Le faltan Seedance 2.5, Wan 3.0 y Eleven v4. En Picasso, los modelos y precios se verifican en el proveedor (§9).
- **Negativos genéricos por defecto** («blurry, low quality, amateur»). Son palabras vacías, y prohibir «motion blur» choca con las pistas de realismo (18.16b).
- **Nombres de artistas** como referencia de estilo (18.21 los descarta).
- **JSON para todo.** Picasso ya guarda la dirección estructurada y la traduce al formato de cada modelo (18.18).

## Lo que sí se toma

1. **Auditoría antes de generar, con severidad.** Bloqueante: capacidad del modelo (duración, formato, número de referencias, si admite negativos o audio). Importante: instrucciones que chocan, palabras vacías, luz sin dirección, falta de negativos. Mejorable: coherencia entre tono, luz y óptica.
2. **Analizar una referencia.** Una base estructurada:
   - composición;
   - luz (dirección, proporción de relleno, temperatura);
   - paleta en hex aproximado;
   - óptica y profundidad deducidas;
   - estilo;
   - y un apartado **«no visible o ambiguo»** para no inventar.
3. **Sonido del vídeo en cuatro capas:** diálogo, efectos con su segundo, ambiente y música, descritas por separado.
4. **Negativos por tipo de pieza** (personas, producto, comida, arquitectura, texto en imagen, vídeo con diálogo, vehículos, animales, paisaje, interfaces), y dónde van según el modelo: parámetro o «Evita…» dentro del texto.
5. **Texto en imagen con su sintaxis por modelo** (texto literal entre comillas, tipografía, tamaño, color y posición), para la 18.26.
6. **Elegir el modelo por lo que hace la pieza** (duración, referencias, audio, texto), algo que ya pide la 18.1.

## Qué provoca en Picasso

Juan: «según la profe Tania, es para generar prompts». Ese es justo el papel del botón **Mejorar** del Taller (§6.5) y del prompt de cada plano. El método de Lyra (base estructurada → texto para el modelo → auditoría) es el esqueleto que debe seguir nuestro asistente, alimentado con **nuestro** catálogo verificado y las reglas de los cursos.

| Idea | Ya lo tiene | Propuesta (§18) |
|---|---|---|
| 1 | 18.15 (seis partes), 18.30 (ingredientes), 19.17 (choques) | **18.48** Auditoría única antes de gastar, con severidad y comprobación de capacidad contra el catálogo |
| 2 | 18.27 (rasgos de la foto), 18.40 (moodboard) | **18.49** Analizar referencia: base estructurada con apartado «no visible» |
| 3 | Sonido previsto en la escena, silencio en positivo (18.38) | **18.50** Sonido en cuatro capas en el prompt de vídeo |
| 4–5 | 18.10 (negativos por modalidad), 18.26 (texto exacto) | **18.51** Negativos por tipo de pieza, curados, y su colocación según el modelo; sintaxis de texto en imagen por modelo |
| Método | Mejorar del Taller (§6.5) | Mejorar sigue el esqueleto base → texto del modelo → auditoría |
