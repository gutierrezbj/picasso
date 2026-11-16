# PIC-02 · Protección de medios y corrección de costes

**Estado:** validado por el revisor el 16-11-2026 en una instancia aislada, con las correcciones de `425f366` (§7). Las correcciones siguen en la rama `pic-02/correcciones-validacion`, sin fusionar en `main` ni desplegar en la instalación de Juan. Parte de PIC-01 revisión 3 (`457235f`), apartados 5.1 y 6.

**Fuera de alcance:**
- `id_peticion` contra duplicados y la Mesa, que son PIC-03.
- Borrar un espacio entero: es un borrado total y deliberado, y no cambia.
- Archivar medios en vez de borrarlos.

## 1. Protección de medios (R1)

`DELETE /api/medios/{id}` responde **409** con un mensaje que dice dónde se usa el medio si:

1. es el `medio_id` de alguna `Toma`, sea de plano, de ficha, de diálogo o del Taller;
2. aparece en la entrada de alguna operación: `imagen_entrada`, `referencias[*]`, `primer_fotograma`, `ultimo_fotograma`, `video_entrada`, `audio_entrada` o `retrato`;
3. aparece en `taller.referencias` de alguna operación;
4. está en las referencias de una ficha o es una pista de audio (esto ya se comprobaba).

La comprobación vive en una función propia (`almacen_usos.usos_de_medio`) para que cualquier borrado futuro la reutilice.

## 2. Costes en tres capas, por intento (revisión 2, 14-11-2026)

Corrección pedida antes de cerrar PIC-02. En la versión 1, el posible cargo vivía en la operación y un reintento podía ocultarlo. **Ahora cada cargo pertenece al intento que lo produjo.**

### 2.1 Dónde vive cada dato
| Dato | Dónde | Notas |
|---|---|---|
| Estimación de la operación | `operacion.coste_estimado` y `tarifa_verificada_en` | Al preparar |
| Estimación del intento | `intento.coste_estimado` | Es una foto de la estimación al enviar ese intento. No cambia aunque la operación cambie después |
| Reserva | Se deriva del estado de la operación (`autorizada`, `enviada`, `en_curso` o `incierta`) | Es siempre la del intento en curso |
| Importe del intento que completa | `intento.coste_informado` y `coste_informado_fuente` (`proveedor` o `simulado`) | Solo con un dato del proveedor. Se copia a `operacion.coste_informado` como importe de la operación |
| Posible cargo | `intento.posible_cargo` | Se marca cuando una operación «incierta» se marca fallida: va en el **último intento**. Si no hay intento registrado, se crea uno que lo diga |
| Resolución | `intento.cargo_resuelto` (`sin_cargo` o `cobrado`), `cargo_resuelto_en` y, si se cobró, `intento.coste_informado` con fuente `manual` | `POST /api/intentos/{id}/cargo`. **Nunca toca la operación ni otros intentos** |

### 2.2 Reglas
- **Un reintento no oculta ni sobrescribe nada.**
  - El intento anterior conserva su posible cargo.
  - La operación vuelve a reservar con su estimación (la reserva es nueva).
  - El intento nuevo lleva su propia estimación y su propio importe.
- **Resolver el cargo de un intento** cambia solo ese intento. El importe del intento que completó, y por tanto el de la operación, no se toca.
- **Intentos inciertos seguidos:** cada uno, al marcarse fallido, añade su posible cargo. No se agrupan ni se sustituyen.
- **El worker nunca rellena importes con la tarifa** (sin cambios respecto a la versión 1).
- **Lo antiguo** (`coste_real` sin `coste_informado`) se clasifica al leerlo como en la versión 1. No se migra nada.

### 2.3 Cálculo único
`operaciones.coste_de(op, intentos)` devuelve:
- **El estado actual de la operación:** `categoria` (`informado`, `estimado`, `historico_tarifa`, `reservado` o `nada`), `contado` y `etiqueta`, igual que en la versión 1 salvo que ya no hay posible cargo a nivel de operación.
- **`cargos`:** la lista de intentos con un posible cargo, pendiente o resuelto, con su `intento_id`, `numero`, `estado` (`pendiente`, `sin_cargo` o `cobrado`), su estimación y su importe.
- **`posible_cargo`:** la suma de las estimaciones de los cargos pendientes.
- **`informado_cargos`:** la suma de los importes de los cargos resueltos como cobrados.

`ops.gasto()` y los totales del Registro suman por capas:
- **informado** = importes de las operaciones completadas + `informado_cargos`;
- **estimado** = completadas sin importe + históricas por tarifa;
- **reservado** = operaciones en curso;
- **posible_cargo** = cargos pendientes de todos los intentos.

## 3. Interfaz
- **Gasto** (cabecera del proyecto, Producir y Taller): «X informado · Y estimado · Z reservado», más «W posible cargo sin confirmar» si lo hay.
- **Registro:** las columnas pasan a ser Estimado e Importe. El Importe muestra la cifra informada con su fuente, o «sin importe del proveedor», o «según tarifa (histórico, sin confirmar)». **Debajo, una línea por cada intento con cargo:** «Intento 1: posible cargo sin confirmar · 0,15 $», con «No hubo cargo» y «Hubo cargo…», o ya resuelto («Intento 1: sin cargo» o «Intento 1: cobrado 0,15 $, apuntado a mano»).
- **Taller:** el desglose del gasto se ve en pantalla, no solo al pasar el cursor: «Gasto del Taller: total · informado · estimado · reservado · posible cargo».
- **El CSV** lleva `coste_estimado`, `tarifa_verificada_en`, `coste_informado`, `coste_informado_fuente`, `categoria`, `posible_cargo_pendiente` e `informado_cargos`.

## 4. Pruebas

**Revisión 2.** Las pruebas corren con **imágenes propias de pruebas** (`picasso-pruebas-backend` y `picasso-pruebas-frontend`). `en_docker.sh` deja de reconstruir las etiquetas de la instalación (`picasso-backend` y `picasso-frontend`).

Casos nuevos en `p16`:
1. Incierta → marcada fallida → reintento autorizado: el posible cargo del intento 1 sigue ahí y aparece una reserva nueva.
2. El intento 2 se completa con importe informado; en otra operación, sin importe.
3. Resolver el cargo del intento 1 (cobrado) no altera el importe del intento 2 ni el de la operación.
4. Tres intentos inciertos seguidos dan tres posibles cargos independientes, que se resuelven uno a uno.

- **`p16_medios_costes`** (API más base de pruebas):
  - 409 en cada dependencia;
  - el borrado funciona si el medio no se usa;
  - un proveedor real sin importe no rellena nada;
  - una operación histórica por tarifa sale como tal;
  - «incierta» marcada fallida da posible cargo, y `cargo` lo resuelve;
  - el gasto desglosado cuadra.
- **Se actualizan:** `p8_motor` (de `coste_real` y `gasto.real` a `coste_informado` y `gasto.informado`).
- **Toda la batería** debe pasar.

## 5. Resultado (14-11-2026)
- **Batería completa en simulado (`en_docker.sh`):** pasan pytest y p1–p16. Por el cambio de clave del gasto se ajustó `p8_motor`. Hubo un fallo propio, que se corrigió: el paquete (`p13`) sumaba el coste como número.
- **Interfaz comprobada en una instancia temporal aislada** (base `picasso_verif`, ya borrada):
  - el Registro enseña «0,04 $ informado · 0,30 $ estimado · 0,00 $ reservado · 0,15 $ posible cargo sin confirmar»;
  - el Importe sale por fila: «informado por el simulado», «según tarifa (histórico, sin confirmar)» y «sin importe del proveedor»;
  - «No hubo cargo» actualiza la fila y los totales;
  - borrar el medio de una toma da 409.
- **Arreglo de paso:** el Registro no refrescaba los totales tras una acción; ahora sí.
- **Pendiente conocido, sin tocar:** el Registro muestra «—» como proyecto de las operaciones del Taller (`taller:{espacio}`). Ya pasaba antes.
- **Para usarlo en la instalación de Juan:** `docker compose up -d --build`. No hace falta migrar datos: los campos nuevos son opcionales y lo antiguo se clasifica al leerlo.

## 6. Resultado de la revisión 2 (14-11-2026)
- **Batería completa en simulado** con la imagen `picasso-pruebas-backend`: pasan pytest y p1–p16. `p16` añade los cuatro casos de reintento:
  1. incierta → fallida → reintento autorizado: 0,15 reservado + 0,15 posible cargo;
  2. el intento 2 completa con importe (0,12) y, en otra operación, sin importe (estimado);
  3. cobrar el intento 1 (0,15) no cambia el 0,12 del intento 2 ni el de la operación;
  4. tres inciertas seguidas dan tres cargos, y resolver el segundo no toca el primero ni el tercero.

  El gasto total cuadra en 0,87.
- **Interfaz** comprobada con `picasso-pruebas-backend` y `picasso-pruebas-frontend` (base `picasso_verif`, ya borrada):
  - el Registro enseña «Intento 1: posible cargo sin confirmar · 0,15 $», con sus botones, e «Intento 2: sin cargo» bajo el importe del intento que completó;
  - el Taller enseña en pantalla «Gasto del Taller: 0,31 $ (0,16 $ informado · 0,00 $ estimado · 0,00 $ reservado · 0,15 $ posible cargo sin confirmar)».
- **Las etiquetas de la instalación no se han reconstruido:** `picasso-backend` y `picasso-frontend` apuntan a las mismas imágenes que tienen en marcha los contenedores de Juan. Una reconstrucción anterior de `picasso-backend:latest` se devolvió a la imagen original (`6b1a7eb3`).
- **Cambio de API respecto a la versión 1:** el cargo se resuelve con `POST /api/intentos/{id}/cargo`. Desaparece `/api/operaciones/{id}/cargo` (nunca llegó a `main`).

## 7. Validación parcial y correcciones (16-11-2026)

**Validado por el revisor en la interfaz**, sobre una instancia aislada y en la instalación de Juan sin modificarla:
- los medios enlazados no se borran y uno libre sí;
- reintentar conserva el posible cargo anterior;
- «Comprobar» completa el segundo intento con su propio importe;
- «No hubo cargo» cambia solo el intento elegido;
- Taller, Registro y CSV coinciden;
- V1–V4 siguen en 0,60 $ estimados, sin reservas ni cargos pendientes.

**Pendiente:** «Hubo cargo…». Usaba `window.prompt`, que el navegador integrado no muestra. En Chrome sí apareció, pero bloqueó el control del navegador y el importe no se guardó.

**Correcciones pedidas por el revisor:**
1. **«Hubo cargo…» abre un diálogo de Picasso** (`Dialogo`), no uno del navegador.
   - Título: «Hubo cargo en el intento N».
   - Un campo de importe en la moneda del estudio, relleno con la estimación del intento. Acepta coma o punto. No admite números negativos ni texto.
   - Botones «Apuntar cargo» y «Cancelar».
   - Mientras se guarda, el botón queda desactivado. Si el servidor rechaza el apunte, el error se ve dentro del diálogo y no se cierra.
   - Al guardar se cierra, y la fila y los totales se refrescan como con «No hubo cargo».
2. **«Sin usar» en la Biblioteca dice lo mismo que el borrado.** «Usado en» sale de `almacen_usos.usos_de_medio`, la misma comprobación que el 409 de `DELETE /api/medios/{id}`: fichas, pistas de audio, tomas y entradas del historial. Un medio que el borrado protege nunca aparece como «Sin usar». Los usos se separan con «;».

**Fuera de alcance:** archivar medios y cambiar la API de cargos.

**Resultado de la validación (16-11-2026), en la instancia aislada con `425f366`:**
- La Biblioteca enseña dónde se usa cada medio, igual que el borrado. Las salidas de toma ya no aparecen como «Sin usar».
- El diálogo «Hubo cargo…» rechaza un importe negativo y guarda 0,04 $ en el intento 2. El intento 1 sigue sin cargo y el 3 sigue pendiente.
- Registro, Taller y CSV coinciden: 0,50 $ = 0,12 informado + 0,30 estimado + 0,08 posible cargo, sin reservas.
- Pruebas técnicas: pytest, p1–p17 y las pruebas del frontend. `p16` comprueba además que la Biblioteca y el borrado dicen lo mismo en los nueve casos.
- No se llamó a proveedores reales: claves vacías y sus dominios bloqueados en el contenedor. No hubo gasto. La instalación de Juan no se modificó. La instancia aislada se retiró al terminar.
