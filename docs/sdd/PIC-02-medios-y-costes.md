# PIC-02 · Protección de medios y corrección de costes

**Estado:** implementado y probado en simulado el 14-11-2026, en la rama `pic-02/medios-y-costes`. Sin fusionar ni desplegar; falta la validación de Juan. Parte de PIC-01 revisión 3 (`457235f`), apartados 5.1 y 6.

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

## 2. Costes en tres capas

| Capa | Campo | Quién lo escribe |
|---|---|---|
| Estimación | `coste_estimado` y `tarifa_verificada_en` (nuevo, tomado de `coste.verificado_en` del catálogo) | Al preparar la operación |
| Reserva | Se deriva del estado: `autorizada`, `enviada`, `en_curso` o `incierta` | — |
| Importe informado | `coste_informado` y `coste_informado_fuente` (`proveedor`, `simulado` o `manual`), ambos nuevos | Solo con un dato del proveedor, o con el que Juan apunte al revisar un posible cargo |

**Reglas:**
- **El worker ya no rellena ningún importe con la tarifa.** Si el proveedor no informa, `coste_informado` queda vacío. `coste_real` deja de escribirse; se conserva en las operaciones antiguas y solo se lee.
- **Cómo se clasifica cada operación.** Una sola función, `operaciones.coste_de(op)`, devuelve `{estimado, informado, fuente, categoria, contado, etiqueta}`. La `categoria` es una de estas: `informado`, `estimado` (completada sin importe), `historico_tarifa`, `reservado`, `posible_cargo` o `nada`. La usan el gasto, el Registro, el CSV, el Taller, el paquete y la interfaz.
- **Operaciones antiguas.** Las que tienen `coste_real` y ningún `coste_informado`:
  - con proveedor `simulado`: importe informado por el simulado;
  - con cualquier otro proveedor: `historico_tarifa`, con la etiqueta «según tarifa (histórico, sin confirmar)».

  No se reescribe ningún documento.
- **«Incierta» marcada como fallida.** Queda con `posible_cargo: true`, que cuenta en el gasto como «posible cargo sin confirmar» y no libera la reserva sin avisar. Para cerrarlo, `POST /api/operaciones/{id}/cargo`:
  - con `{cobrado: false}` se quita el posible cargo;
  - con `{cobrado: true, importe}` el importe queda como informado `manual`.
- **El gasto** (`ops.gasto`) devuelve `informado`, `estimado` (completadas sin importe más las históricas por tarifa), `reservado`, `posible_cargo`, `total` y `sin_verificar`. La clave `real` desaparece: la interfaz decía «cobrado» y no lo era.

## 3. Interfaz
- **Gasto** (cabecera del proyecto, Producir y Taller): «X informado · Y estimado · Z reservado», más «W posible cargo sin confirmar» si lo hay.
- **Registro:** las columnas pasan a ser Estimado e Importe. El Importe muestra la cifra informada con su fuente, o «sin importe del proveedor», o «según tarifa (histórico, sin confirmar)». Si hay un posible cargo, salen los botones «No hubo cargo» y «Hubo cargo…».
- **El CSV** lleva `coste_estimado`, `tarifa_verificada_en`, `coste_informado`, `coste_informado_fuente`, `categoria` y `posible_cargo`.

## 4. Pruebas
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
