# Maqueta PIC-05 · Director de Studio: hoja de personaje

Versión navegable: https://claude.ai/artifact/SLbhDsi6bGatVStBdHkpku (privada; la abre Juan). Fuente: `hoja-de-personaje.html`, un único archivo autocontenido que se abre también en local.

Datos simulados: nada se genera ni se cobra. El precio que enseña es el de Nano Banana Pro en fal del catálogo (0,15 $, verificado el 14-11-2026). El presupuesto de 5,00 $ es de ejemplo. Paleta oscura aprobada en PIC-01 (D11).

## Recorrido

1. Pestaña «Director de Studio» del lateral → «Hoja de personaje».
2. Origen: «De referencias existentes» (Marta, ficha v2 con ancla) o «Describir un personaje nuevo» (la primera vista es el retrato ancla, y las demás esperan a que se apruebe).
3. Identidad: «Se conserva» y «Puede variar», con flechas para mover los rasgos; el bloqueo de identidad se rehace solo y es editable.
4. Lo que falta: dos preguntas por vez, con opciones y «Omitir».
5. Uso y vistas: el uso propone vistas, que se marcan o desmarcan; las expresiones van de 1 a 3.
6. Dirección por vista: encuadre, ángulo, objetivo, luz y fondo, cada uno con su por qué, más «Aplicar "más íntimo"» y «Restablecer».
7. Qué se enviará: el texto exacto, las imágenes numeradas con su para qué, el modelo, el precio por vista y el total. «Preparar» no genera ni gasta.
8. Barra: «Generar N vistas · X $» (simulado). Después hay que seleccionar una toma y elegir entre:
   - ★, que no vincula;
   - «Comparar con el ancla», con la lista de revisión;
   - «Aprobar para la ficha», que la añade al borrador vN+1;
   - «No mantiene la identidad», que la descarta y ofrece corregir editando, revisar la dirección o volver a generar, sin ejecutar nada.
9. «Ficha de Marta» (arriba): referencias por versión y «Aprobar ficha vN».
10. Franja de prototipo: «la próxima pierde la identidad», «cerrar y volver a abrir» (recupera el paso, las vistas y las tomas en curso) y «empezar de cero».

## Comprobado

- Lógica (21-11-2026): 28 comprobaciones en Node sobre el script de la maqueta.
  - Sin operaciones al abrir ni al preparar.
  - Tres operaciones con `id_peticion` distinto; el doble clic no duplica.
  - La ★ no vincula; aprobar va al borrador v3 sin tocar la v2.
  - Identidad perdida con sus tres opciones.
  - Corregir no gasta al preparar.
  - Aprobar la ficha.
  - Reabrir.
  - Ruta sin ancla: solo el retrato, y después las demás.
- **La vista renderizada no la he revisado**: el navegador de la sesión no tiene la sesión de claude.ai abierta.
- La maqueta **no** valida la continuidad del personaje: los retratos son dibujos simulados.
