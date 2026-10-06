# AVB 03 · AI Creator Workflow

Fuente: AI Video Bootcamp (Promptwise), AI Creator Foundations → *AI Creator Workflow*. Material: transcripción y guía en PDF. Leído el 07-10-2026.

## Lo que enseña, en reglas

1. **Seis pasos, siempre en el mismo orden:** idea → chat → imagen → refinar → vídeo → editar y publicar. Generar es el paso 3 de 6. Sirve igual para una imagen, un anuncio UGC o un corto: cambia la escala, no el proceso. Si sigues el orden, sabes en qué paso se rompe algo.
2. **Cinco preguntas antes de generar:** qué hago, dónde va, para quién, qué debe hacer sentir y qué salida necesito (imagen, vídeo, anuncio, miniatura, encargo). "Si no puedes responderlas, no estás listo para generar."
3. **Primero imagen, no vídeo:** es más barata, más rápida y más controlable. Fija composición, personaje, escenario y luz antes de pasar a lo caro. Arreglar todo dentro del modelo de vídeo es la forma cara de crear.
4. **Control de calidad de la imagen antes de avanzar:**
   - ¿Es coherente con las demás escenas?
   - ¿La luz encaja con el tono?
   - ¿La persona o el producto resultan creíbles?
   - ¿La relación de aspecto es la correcta?
   - ¿Tiene el brillo plástico típico de la IA?

   Si alguna respuesta es "no", no se avanza.
5. **Refinar al 90 %:** editar fondo, luz, manos, vestuario, etiqueta del producto o una cara demasiado lisa, y **escalar antes de animar**, porque más píxeles dan mejor vídeo.
6. **Lo que está mal de raíz no se pule:** si fallan la composición, el personaje, el concepto o el ángulo, se vuelve al prompt y se regenera. Una cara falsa en la imagen saldrá peor en movimiento.
7. **El prompt de vídeo no vuelve a describir la imagen** (el modelo ya la ve): solo describe el movimiento, que es de cuatro tipos:
   - cámara: dolly, zoom, tilt, paneo, acercamiento;
   - sujeto: gira la cabeza, camina, coge un objeto;
   - entorno: viento, lluvia, olas;
   - luz: el sol se desplaza, las sombras se mueven.
8. **Lo que es imagen fija termina en refinar:** no todo tiene que ser vídeo.
9. **Montaje para redes:**
   - el primer segundo, fuerte;
   - subtítulos si ayudan a seguir la idea;
   - diseño de sonido y ambiente: pasos, lluvia, gente, roce de ropa;
   - ritmo, transiciones y música acordes con la energía.

## Qué provoca en Picasso

**Validación:** Picasso es este flujo convertido en máquina. Lo hace con más estructura (guion por escenas, fichas con versión y continuidad) y con cada paso guardado y auditable, en lugar de copiar y pegar entre herramientas.

| Regla | Ya lo tiene | Mejora (maestro §18) |
|---|---|---|
| 1–2 | Recorrido idea → desarrollo → elementos → guion → lienzo → montaje. El lienzo no se abre sin guion aprobado. Desarrollo pregunta objetivo, público y canal | Comprobar que Desarrollo cubre las cinco preguntas; la salida ya la dan el tipo y el formato |
| 3, 6 | Primer fotograma; lámina de encuadres | Refuerza la 18.2 (imagen antes que vídeo) |
| 4 | Pestaña Continuidad; elegir toma | **18.12** Control de calidad del fotograma de inicio antes de animar |
| 5–6 | `editar_imagen` en correcciones | **18.13** Acción `escalar` en el motor, y el diagnóstico decide entre editar o volver a dirigir |
| 7 | La plantilla de vídeo repite la descripción completa | **Ajuste a la 18.10:** con fotograma de inicio, el prompt de vídeo solo describe movimiento |
| 8 | Tipo `imagen` sin vídeo | Nada que cambiar |
| 9 | Música, ambiente y voces; efectos en 18.4 | **18.14** Subtítulos `.srt` en el paquete, generados de los diálogos y sus tiempos |
