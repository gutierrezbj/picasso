# Maquetas PIC-01 · La Mesa

La versión navegable está en https://claude.ai/artifact/9sKRMtyLSwpq171yPR6mfG, fila «PIC-01 · La Mesa», tableros 10–15. Aquí se guardan sus fuentes (`.dc.html`) como referencia; fuera del lienzo de maquetas no se renderizan.

| Tablero | Qué enseña |
|---|---|
| 10 · Crear con referencias | Tres pasos con @Juan · identidad, precio en el botón, botón desactivado al pulsar, tarjeta «Generando…» con lo reservado |
| 11 · V1 → cambio → V2 | V1 seleccionada, «Cambiar algo: ponle un sombrero», aviso de que el modelo puede alterar detalles y V2 generándose unida por una flecha |
| 12 · Comparar origen y cambio | V1 y V2 lado a lado; panel de V2 con lo enviado y lo heredado del linaje separados, y «Cómo se hizo» con lo escrito y lo enviado |
| 13 · Favoritas y ramas | ★ en V1 y V2, rama V3 desde V1 (descartada, atenuada) y V4 desde V2 |
| 14 · Estados | Generando, Falló (con «Reintentar…» que vuelve a pedir el precio), Sin confirmar (con «Comprobar» y «Marcar como fallida») y gasto desglosado |
| 15 · Volver a abrir | Estudio → JRGB → Taller → última carpeta, o `?carpeta=`; qué se recupera de la base de datos |

## Revisión 3 (14-11-2026): `Studio16.dc.html`, navegable

Tablero «16 · Studio (navegable) · rev. 3», con el botón Play. Paleta oscura con los valores de la revisión 3 (fondo `#141414`, Mesa `#191919`, paneles `#222222`, ámbar `#F5A623`). La Mesa ocupa toda la pantalla y la creación va en la barra inferior: alcance siempre visible (Nueva imagen o Editar Vn), referencias, texto, «Dirección ▾» con controles según el alcance, y el botón con el precio. El lateral sirve para inspeccionar (★, Descartar, lo enviado frente a lo del linaje, «Cómo se hizo», nota y Comparar). El **Director de Studio** se abre a demanda, con los modos Fotografía, Publicidad y Cine; es un ejemplo ilustrativo y no está implementado. «Preparar» rellena la dirección o el texto sin generar ni gastar.

Una franja de prototipo permite simular un fallo, un «sin confirmar» y cerrar y volver a abrir la carpeta. Nada se genera de verdad.

La lógica del componente se probó fuera del lienzo con Node: crear, editar, comparar, rama con error, preparar del Director y reabrir. La imagen renderizada no la he revisado.

## Revisión 4 (14-11-2026): `Studio17.dc.html`, validación visual antes de PIC-03

Tablero «17 · Studio (navegable) · rev. 4 · lateral único», con el botón Play. Parte del 16 y cambia solo esto:
- **Un único lateral** con dos pestañas, «Imagen · Vn» y «Director de Studio». Cambiar de pestaña no toca la selección ni el alcance; el Director dice sobre qué trabaja («Editar V1» o «Nueva imagen»).
- Con el Director abierto, pulsar otra versión cambia su contexto sin cerrarlo. ✕ cierra el lateral y conserva la selección; «Nueva imagen» en la barra la quita.
- Se corrigen cuatro controles que tenían fondo blanco cálido con texto blanco (pestaña activa, botones de la franja de prototipo y «Entendido»): pasan a `#2B2B2B`, y la pestaña activa lleva un filete ámbar.

Probado: la lógica con Node (13 comprobaciones de pestañas, selección, Preparar, cierre y reapertura) y el recorrido renderizado en el lienzo publicado (V1, pestaña Director, Preparar abre Dirección con «Preparado por el Director»).

Grabación del recorrido (14-11-2026): `Studio17-recorrido.gif`, 26 fotogramas sobre el lienzo publicado. Genera V1, la selecciona (Imagen · V1, alcance «Editar V1»), pasa al Director (la selección se conserva), Preparar abre Dirección «Preparado por el Director», aplica el cambio (V2), con el Director abierto selecciona V1 (cambia el contexto sin cerrarse), vuelve a Imagen y cierra con ✕ conservando el alcance «Editar V1».
