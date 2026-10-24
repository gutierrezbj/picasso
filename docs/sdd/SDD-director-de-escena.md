# SDD · Director de escena (entrevista, prompt verificado y tarjeta real)

Estado: **borrador para aprobar**. Sin código hasta que Juan apruebe. Entrada: `docs/insumos/insumo-picasso-generador-prompts.md` (Higgsfield L02, SuperComputer, 24-10-2026). Encaja con el maestro: §6.1 Idea, §8 Dirección de un plano, §9.4 ciclo de una operación, §10 Asistente, 18.15, 18.30, 18.38, 18.43, 18.48. Se roba el método, no la piel (feedback «Roba como un maestro»).

Los puntos **[DECIDIR]** se cierran con Juan uno a uno. Cada uno lleva la recomendación entre paréntesis.

---

## SDD-01 · Definición del problema

1. **Una idea mal cerrada arrastra el error hasta el final.** Juan: «si no estás claro DESDE el principio, la cagada la arrastras hasta el final». Con Tania pasó: veinte pasos, ingredientes malos y un resultado que no se podía publicar.
2. **Una frase suelta deja todas las decisiones al modelo.** Salen planos sueltos sin causa ni final (L01, vídeo 1). Un prompt estructurado da progresión (L01, vídeo 2).
3. **Rellenar plantillas a mano agota.** Hoy la dirección del plano (§8) tiene más de doce campos. El usuario quiere que la herramienta pregunte y él elija.
4. **El agente externo mintió en cuatro sitios** (insumo §7):
   - generó sin permiso;
   - declaró unos parámetros y envió otros;
   - dejó al protagonista de espaldas;
   - inventó elementos;
   - y rellenó decisiones sin decirlo.

   Picasso tiene que impedirlo por diseño, no por buena voluntad del modelo de texto.

**Objetivo verificable.** Con el caso del centro de datos (insumo §8), el módulo hace cuatro cosas:
- pregunta cinco cosas cerradas;
- enseña qué decidió Juan y qué Picasso;
- produce un prompt con las restricciones contadas;
- y lo para antes de gastar si falta la cara, si hay un elemento no pedido o si lo declarado no coincide con el job.

La tarjeta muestra los parámetros reales de la `EntradaOperacion`, la primera toma sale en borrador y todo queda guardado junto.

## SDD-02 · Alcance y límites

**Entra (dos momentos, un mismo motor de entrevista):**

| Momento | Dónde | Qué decide | Qué produce |
|---|---|---|---|
| **A · Alcance** | Idea del proyecto (§6.1) y Taller | Destino y formato, duración, para quién, qué pasa (quién, dónde, qué pasa y cómo acaba), tono, qué evitar | Propuestas a los campos del Desarrollo, con la marca «decidido por ti» o «por Picasso». La idea queda en tres frases antes de seguir |
| **B · Escena** | Plano de vídeo en el lienzo y vídeo del Taller | Formato y duración, interpretación, cámara y cara, sonido, final | Propuesta a los campos de dirección del plano (§8). Luego prompt en siete bloques, revisión, tarjeta, borrador, revisión de toma y final |

Flujo B, completo, de los pasos 3 a 12 del insumo:
1. Entrevista.
2. Resumen.
3. Prompt.
4. Revisión.
5. Reescritura gratis (los pasos 4 y 5 se repiten).
6. Tarjeta de aprobación.
7. Borrador a resolución baja.
8. Revisión de la toma con una nota.
9. Final con la misma configuración.
10. Guardado.

**Requisitos duros (insumo §7), como reglas R1–R5:**
- **R1. Aprobación explícita por job.** Cada operación de pago se autoriza en su tarjeta, con la cifra. No existe «permitir siempre» [DECIDIR D2].
- **R2. Lo que se muestra sale del job.** La tarjeta se pinta desde la `EntradaOperacion` y el modelo del catálogo, nunca desde el texto del asistente. Si el prompt declara algo distinto (formato, duración, resolución, número de cortes), la tarjeta lo marca y no deja autorizar hasta resolverlo.
- **R3. Cara del protagonista.** Si el plano tiene un protagonista con foto o hoja, y el prompt no lo muestra de frente o de tres cuartos en ningún tramo, sale un aviso importante que hay que confirmar o corregir.
- **R4. Elementos añadidos por el sistema.** Todo objeto, personaje, luz o suceso del prompt que no sale de la idea, de las respuestas ni de las fichas se lista como «añadido por Picasso». Cada uno se acepta o se quita.
- **R5. Dos columnas de decisiones.** El resumen separa «lo decidiste tú» de «lo decidió Picasso (porque omitiste)», en cada paso y en el guardado.

**No entra:**
- montaje y acabado (Motion Pro y DaVinci);
- chat libre que escriba en el proyecto (se mantiene §10: tareas cerradas);
- integración con Higgsfield o Flow [DECIDIR D4];
- imagen fija (ya la cubren el Taller, 18.15 y 18.30; el momento A sí sirve para imagen);
- generar sin plano o sin Taller detrás.

## SDD-03 · Arquitectura técnica

Nada nuevo fuera de la arquitectura actual (FastAPI, Mongo, React). Piezas:

1. **Datos: `Entrevista`** (colección `entrevistas`).
   - Destino: `proyecto`, `plano` o `taller`.
   - Momento: `alcance` o `escena`.
   - Preguntas servidas: id, texto y opciones, sacadas de `backend/data/entrevistas.yaml`.
   - Respuestas: opción, texto libre u omitida, y `decidido_por` (usuario o sistema).
   - Estado: `abierta`, `resumida` o `cerrada`.

   Las preguntas son datos, no código (§0.1), como los recorridos.
2. **Opciones cerradas, pero contextuales.** El fichero fija las cinco preguntas y su intención. El asistente propone las cuatro opciones a partir de la idea y las fichas (tarea nueva `opciones_entrevista`). Siempre se añaden «Otra cosa» y «Omitir». Si omites, Picasso elige y lo marca (R5).
3. **De las respuestas a la dirección.** Al cerrar, las respuestas se convierten en propuestas sobre campos que ya existen en el plano (encuadre de inicio y final, ángulos, movimiento, óptica, luz, acción y negativos). Campos nuevos del plano: `interpretacion`, `sonido`, `estado_final` y `restricciones`. Se aceptan una a una (§10). **La dirección del plano sigue siendo la fuente de verdad, no la conversación.**
4. **Prompt en siete bloques** (LOGLINE, PLATE, CHARACTERS, TIMELINE, CAMERA LAW, GRADE AND AUDIO, CONSTRAINTS).
   - La plantilla de vídeo de `plantillas_prompt.yaml` pasa a tener esos siete bloques.
   - El esqueleto y **CONSTRAINTS los escribe Picasso por reglas**, desde datos contados: cortes, planos, personas del reparto del plano, frases del diálogo, fuentes de luz y «cero rótulos, logos y marcas de agua» (§8, letras jamás al modelo).
   - El asistente solo redacta la prosa de PLATE, CHARACTERS y TIMELINE. Devuelve, por cada bloque, la lista de lo que añadió.
   - CHARACTERS toma los rasgos fijos de la ficha y «exactly as Image N» de 18.22.
5. **Revisión** (amplía la 18.48). Dos capas:
   - **Por reglas, gratis y siempre.** Lo que el modelo no admite según el catálogo. CONSTRAINTS igual que la dirección, también tras cada reescritura («one cut» frente a «zero cuts»). Lo declarado en el texto frente a la `EntradaOperacion` (R2). Cara del protagonista según los encuadres y ángulos de cada tramo (R3). Borrador en la primera toma.
   - **Con el asistente, con su céntimo a la vista.** Elementos no pedidos (R4) y coherencia entre tono, luz y óptica.

   El resultado lleva severidad: bloqueante, importante o mejorable.
6. **Reescritura por nota.** El usuario escribe la corrección en lenguaje normal. Se reescribe solo el texto (tarea `reescribir_prompt`) y la revisión vuelve a pasar entera. No se genera nada.
7. **Tarjeta de aprobación** = la pestaña Producir actual, ampliada.
   - Referencias adjuntas en miniatura, modelo, formato, duración, resolución, número de variantes y coste.
   - Todo leído de la operación preparada.
   - Botón «Producir borrador por X $».
8. **Borrador y final.**
   - La operación lleva `calidad: borrador | final`.
   - La primera toma de un plano de vídeo es borrador, a la resolución más baja que el catálogo declare para ese modelo.
   - «Hacer el final» copia la `EntradaOperacion` de la toma aprobada y solo cambia la resolución. Es otra operación, con su tarjeta y su precio.
9. **Revisión de la toma.**
   - Lista de seis comprobaciones (insumo §6): persona, lugar, acción, final, cámara y sonido, y «¿cambió algo que estaba bien?».
   - Una sola nota estructurada: problema, cambio y qué se mantiene.
   - Esa nota alimenta la siguiente reescritura.
10. **Guardado.** La toma enlaza su entrevista, el prompt exacto, la `EntradaOperacion` (ya inmutable), las notas y el veredicto. Va en el paquete de edición (§11.3) como `direccion.json` por plano.

API nueva, con prefijo `/api`:
- `POST /entrevistas` (destino y momento);
- `POST /entrevistas/{id}/responder`;
- `POST /entrevistas/{id}/cerrar` (devuelve propuestas);
- `POST /planos/{id}/prompt/revisar`;
- `POST /planos/{id}/prompt/reescribir`;
- `POST /tomas/{id}/revision` (lista de comprobaciones y nota);
- `POST /tomas/{id}/final` (prepara la operación final).

## SDD-04 · Decisiones técnicas (ADR)

- **ADR-1. La conversación no es la fuente de verdad.** Las respuestas acaban en campos de dirección versionados. Así R2 y R5 son comprobables y el lienzo no depende de un chat. Lo que hace SuperComputer, todo dentro del chat, es justo lo que falló.
- **ADR-2. Lo contado lo escribe el código.** CONSTRAINTS y los parámetros de la tarjeta nunca los redacta el modelo de texto. El insumo lo señala como la clave de la plantilla. Si lo escribe el LLM, vuelve el «three cuts» frente a 2 cortes.
- **ADR-3. Amplía la §10 sin romperla.** El asistente puede **proponer** dirección de plano y prompt, siempre como propuesta aceptable. Sigue sin lanzar operaciones. Cambia la línea «no define planos, encuadres…» del maestro, que queda «no los fija sin aceptar».
- **ADR-4. Un solo motor de entrevista para alcance y escena.** Solo cambia el fichero de preguntas. Evita dos asistentes que digan cosas distintas.
- **ADR-5. Borrador obligatorio en vídeo.** El borrador cuesta una fracción del final. Con Tania se gastaron 2,14 $ en una prueba a resolución final [DECIDIR D6].
- **ADR-6. Proveedor de texto: el que ya está configurado.** El Mejorar del Taller usa OpenAI `gpt-6.1-sol` (verificado el 15-10-2026). No se añade un tercero.

## SDD-05 · Backlog (historias con criterios de aceptación)

**Fase DE-1 · Alcance en la Idea** (solo texto, coste casi cero):
- HU1. Como director, al abrir la Idea, Picasso me pregunta una cosa cada vez, con cuatro opciones, «Otra cosa» y «Omitir». *Acepta:* cinco preguntas como máximo y nunca dos a la vez.
- HU2. Al terminar veo el resumen en dos columnas (R5) y acepto parte a parte lo que va al Desarrollo. *Acepta:* nada se escribe sin aceptar, y lo omitido sale como «decidido por Picasso».
- HU3. La idea queda en tres frases (quién, dónde, qué pasa y cómo acaba). La Idea no se da por lista sin esas tres. *Acepta:* el botón «Listo» explica cuál falta.

**Fase DE-2 · Escena en el plano de vídeo:**
- HU4. Entrevista de escena desde la ficha del plano. Sus propuestas van a los campos de dirección. *Acepta:* cada propuesta se puede editar y descartar.
- HU5. Prompt en siete bloques, con CONSTRAINTS generado por reglas. *Acepta:* cambiar la dirección regenera CONSTRAINTS, y el prompt editado a mano sigue con la marca de §8.
- HU6. Revisión con severidad (R2, R3 y R4 incluidas). *Acepta:* con el caso del centro de datos v1, sale el aviso de la cara de espaldas y el del papel volando.
- HU7. Reescritura por nota, gratis, con la revisión pasada otra vez. *Acepta:* se ven las diferencias con la versión anterior y la revisión ha vuelto a pasar.

**Fase DE-3 · Tarjeta, borrador y final:**
- HU8. Tarjeta desde la operación real. *Acepta:* si el texto dice 16:9 y la operación 1:1, la tarjeta lo marca y no autoriza.
- HU9. La primera toma de vídeo es borrador. «Hacer el final» repite la misma entrada a la resolución final. *Acepta:* las dos entradas solo difieren en la resolución.
- HU10. Revisión de toma con las seis comprobaciones y una nota. *Acepta:* la nota aparece en la siguiente reescritura.
- HU11. Todo guardado junto y exportado en el paquete. *Acepta:* `direccion.json` por plano en el paquete.

## SDD-06 · Reglas de desarrollo

Las del maestro §0. Además:
- Vocabulario en español en la interfaz: entrevista, borrador, final, tarjeta. Nada de «job» ni «shot».
- Preguntas y opciones base en YAML.
- Ninguna llamada de pago se dispara al abrir la entrevista. Las de texto muestran su coste.
- Sin comentarios en el código.
- Cambios mínimos sobre `prompt.py`, `plantillas_prompt.yaml`, `PanelProducir.tsx` y `FichaPlano.tsx`.
- La clave de idempotencia no cambia.
- El diseño de pantallas pasa primero por una maqueta que aprueba Juan (como con el Taller).

## SDD-07 · Plan de pruebas

- `p16_director` en la base de pruebas, con proveedores simulados:
  - entrevista con omisiones, que dé dos columnas;
  - CONSTRAINTS igual que la dirección;
  - lo declarado frente a lo real bloquea;
  - aviso de cara;
  - añadidos listados (el simulado de texto devuelve uno a propósito);
  - borrador antes que final;
  - el final copia la entrada y solo cambia la resolución.
- pytest para las reglas de la revisión, en funciones puras: contar cortes en el texto, mapear encuadre y ángulo a «cara visible» y comparar parámetros.
- Caso de control: el centro de datos del insumo §8, guardado como dato de prueba.
- **Validación operada por Juan** en la interfaz (no se cierra con scripts): una escena real del calentamiento §20, la E3 o la E4.

## SDD-08 · Despliegue

- Sin servicios nuevos. Sigue en `docker compose` (:3000 y :8001). Funciona igual en el VPS Linux: sin dependencias solo-Mac.
- Migración: los planos existentes no tienen entrevista y siguen funcionando igual. Los campos nuevos de dirección nacen vacíos.
- Claves: ninguna nueva si D4 se queda en fal. Siempre en `.env`.
- Se activa por fases DE-1, DE-2 y DE-3. Cada una se cierra cuando Juan la recorre en la interfaz.

---

## Puntos [DECIDIR]

| # | Pregunta | Recomendación |
|---|---|---|
| D1 | ¿Por dónde se empieza: alcance en la Idea (DE-1) o escena en el plano (DE-2)? | DE-1 primero: es lo que pide Juan, es barato y evita el error de raíz |
| D2 | ¿«Permitir siempre» existe? | No existe. Cada operación de pago, su tarjeta |
| D3 | ¿Picasso valida la semilla solo? | Sí, por reglas y sin IA (18.30): resolución, tamaño, captura con interfaz, forma, kit de ángulos en archivos separados. Lo que exige ver la cara (boca cerrada, reflejos de gafas) va como lista de comprobación que Juan marca |
| D4 | ¿Qué proveedor de vídeo? | fal con Seedance (18.37 aprobada). Antes de construir, verificar si fal ya sirve Seedance 2.5 y a qué precio. Higgsfield no, mientras no tenga una API documentada que podamos verificar |
| D5 | ¿Las cinco preguntas de escena? | 1 formato y duración · 2 interpretación (cómo está el personaje) · 3 cámara y cara (cuándo se le ve de frente) · 4 sonido · 5 final (qué pasa en el último segundo y dónde queda la cámara) |
| D6 | ¿El borrador es obligatorio en la primera toma de vídeo? | Sí, sin saltárselo en la v1 |
| D7 | ¿Idioma del prompt? | Prompt al modelo en inglés (es lo que funcionó en Seedance), con el resumen y la revisión en español al lado |
