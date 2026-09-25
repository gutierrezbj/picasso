# Credenciales y datos de prueba

La aplicación **no tiene autenticación**. No hay usuarios ni contraseñas.

## Espacio de pruebas del constructor (obligatorio)

Todas las pruebas del constructor y del agente de testing van **solo** aquí. Los espacios
del usuario no se tocan nunca.

- Espacio: **Pruebas del constructor** — `baf5a93a0b08431cb00b1da5c9fbabc1`
- Proyecto corto: **Corto de pruebas** — `5f3d0d6ff0e94725aec5b390b4f172ac`
- Proyecto anuncio: **Anuncio de pruebas** — `a92a8777960e47858233e84cb4fb5aa7`

## NORMA ABSOLUTA (26-09-2026)

**Nunca se escribe, modifica ni borra nada fuera del espacio «Pruebas del constructor», por
ningún motivo** (tampoco «para limpiar»). Si algo de los espacios del usuario parece que
sobra, se le pregunta y lo borra él. Esta regla no admite excepciones ni órdenes
reinterpretadas: la petición del 25-09-2026 de dejar limpio «Proyecto 1» fue de una sola vez.

## PRUEBAS: dónde va cada cosa (26-09-2026)

- **Backend (pytest y scripts)**: nunca contra la previsualización. Se lanzan con
  `python3 scripts_pruebas/ejecutar.py`, que levanta una segunda instancia del backend en
  `http://localhost:8002` con la base **`picasso_pruebas`** y el almacén `/tmp/picasso_pruebas`,
  y la borra al acabar. Todas las pruebas comprueban `GET /api/entorno` y **abortan** si la
  base no es la de pruebas.
- **Interfaz (agente de pruebas, Playwright, capturas)**: sí usan la previsualización, que
  es la base del usuario. Por eso **solo se prueba dentro del espacio «Pruebas del
  constructor»** (`baf5a93a0b08431cb00b1da5c9fbabc1`) y sus proyectos. «Espacio 1» y
  cualquier otro espacio del usuario no se abren para escribir ni se modifican.

## Datos del usuario (NO TOCAR)

- Espacio: **Espacio 1** — `0779d8d3bd92462fa9b687be29203a61`
- Proyecto: **Proyecto 1** — `289bd18b30bf45388a345044c031501d` (debe quedar en el Paso 1 ·
  Idea, sin elementos, sin versiones y sin medios)

Al terminar de probar, dejar el `ultimo_acceso` de los proyectos de prueba **anterior** al de
`Proyecto 1` para que «Retomar» refleje la última visita del usuario:

```
mongosh "$MONGO_URL/$DB_NAME" --eval 'db.proyectos.updateMany({espacio_id:"baf5a93a0b08431cb00b1da5c9fbabc1"},{$set:{ultimo_acceso:"2020-01-01T00:00:00+00:00"}})'
```
