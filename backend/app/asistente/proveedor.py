"""Asistente (§10): ProveedorTexto con implementación simulada y Anthropic (Claude)
vía Universal Key. Devuelve una Propuesta con partes aceptables una a una.
Nunca escribe en el proyecto: solo propone."""
from __future__ import annotations

import json
import os
import uuid

TAREAS = {
    "hacer_preguntas",
    "proponer_campo",
    "ordenar_notas",
    "detectar_elementos",
    "proponer_escenas",
    "reescribir_escena",
}

CLASES_ELEMENTO = {"personaje", "producto", "objeto", "escenario"}

# Campos del Desarrollo que una propuesta puede rellenar.
CAMPOS_VALIDOS = {"intencion", "publico", "mensaje", "tono", "premisa", "mundo", "arco_general", "notas"}


CAMPOS_ESCENA_VALIDOS = {"titulo", "que_ocurre", "que_se_ve", "intencion", "sonido_previsto"}


def _parte(
    destino,
    texto,
    modo="reemplazar",
    tipo="campo",
    pregunta=None,
    clase=None,
    nombre=None,
    escena_id=None,
):
    return {
        "id": uuid.uuid4().hex,
        "tipo": tipo,  # campo | pregunta | elemento | escena | escena_campo
        "pregunta": pregunta,
        "destino_campo": destino,
        "texto": texto,
        "modo": modo,
        "clase": clase,
        "nombre": nombre,
        "escena_id": escena_id,
        "estado": "pendiente",
    }


_PALABRAS_IGNORADAS = {
    "El", "La", "Los", "Las", "Un", "Una", "Unos", "Unas", "Y", "O", "Pero", "Que",
    "Qué", "Cuando", "Cuándo", "Donde", "Dónde", "Como", "Cómo", "Si", "No", "En",
    "De", "Del", "Al", "A", "Con", "Por", "Para", "Se", "Su", "Sus", "Es", "Son",
    "Este", "Esta", "Esto", "Ese", "Esa", "Aquel", "Todo", "Toda", "Hay", "Ya",
}


def _candidatos_nombre(texto: str, existentes: set[str]) -> list[str]:
    """Nombres propios que aparecen en el desarrollo y no están en el proyecto.
    Extracción literal: no inventa nada que el usuario no haya escrito."""
    import re

    vistos: list[str] = []
    bajas = {n.lower() for n in existentes}
    for palabra in re.findall(r"\b[A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ'’-]{2,}\b", texto or ""):
        if palabra in _PALABRAS_IGNORADAS:
            continue
        if palabra.lower() in bajas or palabra in vistos:
            continue
        vistos.append(palabra)
    return vistos[:5]


def estado_asistente() -> dict:
    modelo = os.environ.get("MODELO_ASISTENTE", "claude-sonnet-5")
    return {"modelo": modelo}


class Simulado:
    id = "simulado"

    def proponer(self, contexto: dict, tarea: str, campo: str | None = None) -> list[dict]:
        des = contexto.get("desarrollo", {})
        if tarea == "hacer_preguntas":
            # Preguntas: cada una con su campo de respuesta y su selector de destino.
            return [
                _parte(None, "", tipo="pregunta", pregunta="¿Qué es lo único que no puede faltar en esta pieza?"),
                _parte(None, "", tipo="pregunta", pregunta="¿A quién va dirigida y qué debe sentir?"),
                _parte(None, "", tipo="pregunta", pregunta="¿Qué NO quieres que aparezca?"),
            ]
        if tarea == "ordenar_notas":
            notas = (des.get("notas") or "").strip()
            if not notas:
                return []
            trozos = [t.strip() for t in notas.replace("\n", ".").split(".") if t.strip()]
            partes = []
            if trozos:
                partes.append(_parte("intencion", trozos[0]))
            if len(trozos) > 1:
                destino = "premisa" if "premisa" in contexto.get("campos", []) else "notas"
                partes.append(_parte(destino, trozos[1]))
            return partes
        if tarea == "proponer_campo" and campo in CAMPOS_VALIDOS:
            texto = (
                f"Propuesta simulada para «{campo}». Texto de relleno evidente; "
                "conecta un modelo real (ProveedorTexto, §10) para propuestas de verdad."
            )
            return [_parte(campo, texto)]
        if tarea == "detectar_elementos":
            clase = contexto.get("clase")
            if clase not in CLASES_ELEMENTO:
                return []
            fuente = " ".join(
                str(des.get(k) or "")
                for k in ("intencion", "premisa", "mundo", "mensaje", "arco_general", "notas")
            )
            fuente += " " + " ".join(str(v or "") for v in (des.get("respuestas_formato") or {}).values())
            existentes = set(contexto.get("nombres_en_proyecto") or [])
            nombres = _candidatos_nombre(fuente, existentes)
            return [
                _parte(
                    None,
                    f"Propuesta simulada: «{n}» aparece escrito en tu desarrollo. "
                    "La descripción la escribes tú; el proveedor simulado no inventa contenido.",
                    tipo="elemento",
                    clase=clase,
                    nombre=n,
                )
                for n in nombres
            ]
        if tarea == "proponer_escenas":
            numero = len(contexto.get("escenas") or [])
            return [
                _parte(
                    None,
                    "Escena simulada: el proveedor simulado no escribe guion. "
                    "Al aceptarla se crea una escena vacía con este título y la escribes tú.",
                    tipo="escena",
                    nombre=f"Escena {numero + i + 1} (propuesta simulada)",
                )
                for i in range(2)
            ]
        if tarea == "reescribir_escena":
            escena = contexto.get("escena") or {}
            destino = campo if campo in CAMPOS_ESCENA_VALIDOS else "que_ocurre"
            if not escena.get("id"):
                return []
            return [
                _parte(
                    destino,
                    f"Reescritura simulada de «{destino}». Texto de relleno evidente; "
                    "conecta un modelo real (ProveedorTexto, §10) para reescrituras de verdad.",
                    tipo="escena_campo",
                    escena_id=escena["id"],
                )
            ]
        return []


class Anthropic:
    id = "anthropic"

    def __init__(self, modelo: str, api_key: str):
        self.modelo = modelo
        self.api_key = api_key

    def proponer(self, contexto: dict, tarea: str, campo: str | None = None) -> list[dict]:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        import asyncio

        sistema = (
            "Eres un asistente de desarrollo creativo. NO decides por el usuario: solo propones. "
            "Responde SIEMPRE en español y SOLO con un JSON válido con la forma "
            '{"partes":[...]}. '
            "Para la tarea hacer_preguntas, cada parte es una pregunta: "
            '{"tipo":"pregunta","pregunta":"<texto de la pregunta>"} (no rellenes respuesta). '
            'Para proponer_campo y ordenar_notas, cada parte propone texto para un campo: '
            '{"tipo":"campo","destino_campo":"<campo>","texto":"<texto>","modo":"reemplazar|anadir"}. '
            'Para detectar_elementos, cada parte es un elemento que el desarrollo menciona: '
            '{"tipo":"elemento","nombre":"<nombre>","texto":"<por qué lo propones>"}. '
            'Para proponer_escenas, cada parte es una escena nueva: '
            '{"tipo":"escena","nombre":"<título>","texto":"<qué ocurre>"}. '
            'Para reescribir_escena, cada parte reescribe un campo de la escena: '
            '{"tipo":"escena_campo","destino_campo":"<campo de escena>","texto":"<texto>"}. '
            f"Campos válidos del desarrollo: {sorted(CAMPOS_VALIDOS)}. "
            f"Campos válidos de una escena: {sorted(CAMPOS_ESCENA_VALIDOS)}. "
            "No inventes escenas, planos ni datos de otros proyectos."
        )
        tarea_txt = {
            "hacer_preguntas": "Haz 3 preguntas breves para aclarar la idea.",
            "ordenar_notas": "Reparte las notas libres del usuario en los campos que correspondan.",
            "proponer_campo": f"Propón un texto para el campo «{campo}».",
            "detectar_elementos": (
                f"Propón los elementos de clase «{contexto.get('clase')}» que el desarrollo menciona "
                f"y que no están ya en el proyecto. Ya están: {contexto.get('nombres_en_proyecto')}."
            ),
            "proponer_escenas": (
                "Propón como máximo 3 escenas nuevas coherentes con el desarrollo y con las escenas "
                f"que ya hay: {[e.get('titulo') for e in (contexto.get('escenas') or [])]}. "
                "No inventes elementos que no estén en el reparto."
            ),
            "reescribir_escena": (
                f"Reescribe el campo «{campo}» de esta escena sin cambiar lo que cuenta: "
                f"{contexto.get('escena')}."
            ),
        }[tarea]
        prompt = f"{tarea_txt}\n\nContexto del proyecto (JSON):\n{json.dumps(contexto, ensure_ascii=False)}"

        chat = LlmChat(api_key=self.api_key, session_id=f"asistente-{uuid.uuid4().hex}", system_message=sistema).with_model("anthropic", self.modelo)

        async def _run():
            return await chat.send_message(UserMessage(text=prompt))

        try:
            texto = asyncio.get_event_loop().run_until_complete(_run()) if False else asyncio.run(_run())
        except RuntimeError:
            # ya hay loop corriendo: usar uno nuevo en hilo
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as ex:
                texto = ex.submit(lambda: asyncio.run(_run())).result()
        return self._parsear(
            texto, campo, contexto.get("clase"), (contexto.get("escena") or {}).get("id")
        )

    def _parsear(
        self, texto: str, campo: str | None, clase: str | None = None, contexto_escena_id: str | None = None
    ) -> list[dict]:
        try:
            ini = texto.index("{")
            fin = texto.rindex("}") + 1
            datos = json.loads(texto[ini:fin])
            partes = []
            for p in datos.get("partes", []):
                if p.get("tipo") == "pregunta" and p.get("pregunta"):
                    partes.append(_parte(None, "", tipo="pregunta", pregunta=str(p["pregunta"]).strip()))
                    continue
                if p.get("tipo") == "escena" and p.get("nombre"):
                    partes.append(
                        _parte(
                            None,
                            str(p.get("texto") or "").strip(),
                            tipo="escena",
                            nombre=str(p["nombre"]).strip(),
                        )
                    )
                    continue
                if p.get("tipo") == "escena_campo" and p.get("texto"):
                    destino = p.get("destino_campo")
                    if destino in CAMPOS_ESCENA_VALIDOS:
                        partes.append(
                            _parte(
                                destino,
                                str(p["texto"]).strip(),
                                tipo="escena_campo",
                                escena_id=(contexto_escena_id or None),
                            )
                        )
                    continue
                if p.get("tipo") == "elemento" and p.get("nombre"):
                    partes.append(
                        _parte(
                            None,
                            str(p.get("texto") or "").strip(),
                            tipo="elemento",
                            clase=clase,
                            nombre=str(p["nombre"]).strip(),
                        )
                    )
                    continue
                destino = p.get("destino_campo")
                if destino in CAMPOS_VALIDOS and p.get("texto"):
                    partes.append(_parte(destino, str(p["texto"]).strip(), p.get("modo", "reemplazar")))
            return partes
        except Exception:
            return [_parte(campo or "notas", texto.strip(), "anadir")] if texto and texto.strip() else []


def proveedor_actual(modelo: str):
    """Devuelve (proveedor, motivo_desactivado). Si no hay clave para Claude, desactivado."""
    if modelo == "simulado":
        return Simulado(), None
    clave = os.environ.get("EMERGENT_LLM_KEY")
    if not clave:
        return None, "No hay clave del asistente configurada (EMERGENT_LLM_KEY)."
    return Anthropic(modelo, clave), None
