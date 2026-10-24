# Insumo para Picasso · Generador de prompts de vídeo (Director de escena)

**Origen:** ejercicio real de la Lección 2 · Segundo cerebro (Higgsfield Academy), 24-10-2026. Escena "Juan en el centro de datos", desarrollada con SuperComputer (Higgsfield) y revisada con Claude.
**Estado:** insumo. No es diseño. El agente de Picasso lo convierte en SDD dentro de la arquitectura existente.
**Regla:** todo lo de aquí está observado en el ejercicio. Lo que no se observó va marcado como **[DECIDIR]**.

---

## 1. Qué hace (una frase)

Convierte una idea corta (tres frases) y una foto semilla en un prompt de vídeo estructurado y verificado. Para ello entrevista al usuario con preguntas cerradas, revisa el prompt contra sus decisiones y pide aprobación explícita antes de gastar créditos.

## 2. Por qué existe

- Una frase suelta deja todas las decisiones al modelo, y el resultado son planos sueltos sin causa ni final (L01, vídeo 1).
- Un prompt estructurado da progresión: causa, consecuencia y final (L01, vídeo 2).
- El usuario no quiere rellenar plantillas a mano. La herramienta pregunta y él elige.
- Un agente externo (SuperComputer) falló de cuatro formas que Picasso debe evitar (ver §7).

## 3. Flujo observado (de punta a punta)

| Paso | Qué ocurre | Quién |
|------|-----------|-------|
| 1. Idea | 3 frases: QUIÉN, DÓNDE, QUÉ PASA. Una persona, una localización, un final claro | Usuario |
| 2. Semilla | Foto de referencia del personaje (ver §5) | Usuario |
| 3. Entrevista | 5 preguntas, una a una, con 4 opciones cerradas + "Otra cosa" (texto libre) + "Omitir" | Sistema |
| 4. Resumen | Muestra las decisiones tomadas y las que el sistema rellenó solo (marcadas) | Sistema |
| 5. Prompt | Genera el prompt con la estructura fija de §4 | Sistema |
| 6. Revisión | Usuario (o checker automático) compara prompt con idea y respuestas. Notas de corrección en lenguaje normal | Usuario + sistema |
| 7. Reescritura | Solo el texto. Sin generar. Se repite 6–7 las veces que haga falta (es gratis) | Sistema |
| 8. Tarjeta de aprobación | Referencia adjunta, modelo, formato, duración, resolución, calidad, **coste en créditos**. Botones: Aprobar · Detener · ~~Permitir siempre~~ (ver §7) | Sistema |
| 9. Borrador | Primera toma siempre a resolución baja (480p) | Sistema |
| 10. Revisión de toma | Checklist (§6). Una sola nota por toma: problema · cambio · qué se mantiene | Usuario |
| 11. Final | Toma aprobada → misma configuración a resolución final | Sistema |
| 12. Guardado | Idea + respuestas + prompt exacto + parámetros reales del job + vídeo + notas, juntos | Sistema |

## 4. Estructura del prompt (plantilla observada)

Salida de SuperComputer para Seedance 2.5, que funcionó. Orden fijo:

1. **LOGLINE**: una frase con el arco completo ("A tired man walks… until the lights die… and he keeps walking into the dark").
2. **PLATE**: localización con materiales, luz, objetos y paleta. Termina declarando qué se mueve en el plano y qué no.
3. **CHARACTERS**: cada personaje "exactly as @ImageN", con rasgos visibles (piel, pelo, gafas, ropa) y el estado físico expresado en el cuerpo (hombros, pisada, mirada).
4. **TIMELINE**: tramos con tiempo (0.0–15.0 s), tamaño de plano (WS/MWS/MCU), altura de cámara, montura (gimbal/dolly/crane), posición en el encuadre, primer fotograma, acciones en orden con causa y efecto, y "Outgoing state" (último fotograma).
5. **CAMERA LAW**: óptica (mm), montura, velocidad, altura, obturador, qué no hace nunca la cámara.
6. **GRADE AND AUDIO**: paleta, contraste, luz motivada (fuente y dirección), halation. Lista de sonidos diegéticos. "No music, no score, no bgm" si aplica.
7. **CONSTRAINTS**: **todo contado**: nº de cortes, nº de planos, nº de personas, nº de frases habladas, nº de elementos móviles ajenos, nº de fuentes de luz al final, nº de subtítulos/logos/marcas de agua.

Las restricciones contadas son lo que más reduce la aleatoriedad. Es la clave de la plantilla.

## 5. Foto semilla (requisitos aprendidos)

Fallo real: un selfie desde arriba, con gran angular y sonrisa abierta dio un personaje que no se parecía (preset "Paseo en delfín").

- Kit mínimo: **frente neutro** (boca cerrada), **tres cuartos**, **perfil**, **cuerpo entero**. Misma ropa, misma luz, mismo día.
- Retrato con la cámara a la altura de los ojos, a 1–1,5 m, sin zoom digital. Cuerpo entero con la cámara a la altura del pecho, a unos 3 m.
- Luz de ventana de frente, fondo liso claro, sin filtros ni desenfoque artificial.
- Gafas: sin reflejos que tapen los ojos. Decidir si el personaje las lleva y mantenerlo siempre.
- **Cada ángulo en un archivo separado.** Un collage puede leerse como varias personas.
- **[DECIDIR]** Si Picasso valida la semilla automáticamente (cara visible, ángulo, reflejos, expresión) antes de aceptarla.

## 6. Checklist de revisión (del PDF de la lección + ejercicio)

**Del prompt, antes de pagar:**
- ¿Respeta cada respuesta de la entrevista (formato, duración, tono, sonido, final)?
- ¿Se ve la cara del protagonista cuando la escena lo pide?
- ¿Hay elementos inventados que el usuario no pidió?
- ¿Las restricciones contadas siguen igual tras cada reescritura (ej. "one cut" frente a "zero cuts")?
- ¿Resolución de borrador en la primera toma?

**De la toma, después de generar:**
- Persona: ¿se reconoce? ¿la interpretación encaja con el tono?
- Lugar: ¿coincide con lo descrito?
- Acción: ¿ocurre en el orden pedido?
- Final: ¿el momento clave ocurre cuando se quería? (No basta con mirar el primer y el último fotograma.)
- Cámara y sonido: ¿coherentes, sin saltos ni ruidos raros?
- ¿Cambió algo que estaba bien?

## 7. Fallos del agente externo que Picasso debe impedir por diseño

| Fallo observado | Regla para Picasso |
|-----------------|--------------------|
| Generó sin pedir aprobación aunque el modo "preguntar antes de generar" estaba marcado | El gasto de créditos exige aprobación explícita por job. Sin opción "permitir siempre", o con ella desactivada por defecto **[DECIDIR]** |
| El chat dijo "widescreen 1080p, three cuts" y el job real era 1:1, 720p, 2 cortes | Lo que se muestra al usuario sale de los **parámetros reales del job**, nunca del texto del LLM. Comparar declarado frente a real y avisar si no coinciden |
| Dejó al protagonista de espaldas los 15 s ("camera never swings to his front") aunque había foto de referencia | Si hay foto del protagonista, el checker avisa cuando el prompt no muestra la cara en ningún momento |
| Inventó un elemento (papel volando; en la lección, cortinas) | El checker lista elementos del prompt que no salen de la idea ni de las respuestas, y los marca como "añadidos por el sistema" |
| Rellenó preguntas sin respuesta sin avisar claramente | El resumen separa "decidido por el usuario" de "decidido por el sistema" |

## 8. Ejemplo completo (caso de prueba)

- **Idea:** Juan entra en un centro de datos muy iluminado después de un día largo, se para en el pasillo, las luces se apagan fila a fila y solo queda el neón azul de los servidores.
- **Semilla:** hoja con frente, tres cuartos y perfil (sudadera gris, gafas al aire).
- **Respuestas:** 16:9, 15 s · "Exhausted but calm; when the lights go out, a quiet moment of awe at the blue glow" · (pregunta 3: respondida por el usuario, sin registrar aquí) · solo sonido de ambiente · "He pauses, looks at the blue glow, then keeps walking until he disappears into the darkness. Camera holds."
- **Correcciones de texto (1 ronda):** cámara delante en tres cuartos para que se vea la cara, contraplano de la cara iluminada en azul, paneo final de 180° a su espalda · quitar el papel · borrador a 480p.
- **Tarjeta:** Seedance 2.5 · 16:9 · 15 s · 480p · calidad "Alta" · 45 créditos.
- Prompts completos (versión 1 y revisada): conversación del 24-10 con SuperComputer, chat de la escena del centro de datos.

## 9. Fuera de alcance de este insumo

- Elección de stack, módulos o persistencia: los decide el agente de Picasso dentro de su arquitectura y su SDD.
- Integración concreta con proveedores (Higgsfield, Flow, otros) **[DECIDIR]**. En el ejercicio se usó Higgsfield (Seedance 2.5).
- Montaje y edición final: van al agente Motion Pro, no a este módulo.
