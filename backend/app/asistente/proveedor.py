"""Asistente (§10): ProveedorTexto con implementación simulada y Anthropic (Claude)
vía Universal Key. Devuelve una Propuesta con partes aceptables una a una.
Nunca escribe en el proyecto: solo propone."""
from __future__ import annotations

import json
import os
import uuid

TAREAS = {"hacer_preguntas", "proponer_campo", "ordenar_notas"}

# Campos del Desarrollo que una propuesta puede rellenar.
CAMPOS_VALIDOS = {"intencion", "publico", "mensaje", "tono", "premisa", "mundo", "arco_general", "notas"}


def _parte(destino, texto, modo="reemplazar", tipo="campo", pregunta=None):
    return {
        "id": uuid.uuid4().hex,
        "tipo": tipo,  # campo | pregunta
        "pregunta": pregunta,
        "destino_campo": destino,
        "texto": texto,
        "modo": modo,
        "estado": "pendiente",
    }


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
            "Para proponer_campo y ordenar_notas, cada parte propone texto para un campo: "
            '{"tipo":"campo","destino_campo":"<campo>","texto":"<texto>","modo":"reemplazar|anadir"}. '
            f"Campos válidos: {sorted(CAMPOS_VALIDOS)}. "
            "No inventes escenas, planos ni datos de otros proyectos."
        )
        tarea_txt = {
            "hacer_preguntas": "Haz 3 preguntas breves para aclarar la idea.",
            "ordenar_notas": "Reparte las notas libres del usuario en los campos que correspondan.",
            "proponer_campo": f"Propón un texto para el campo «{campo}».",
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
        return self._parsear(texto, campo)

    def _parsear(self, texto: str, campo: str | None) -> list[dict]:
        try:
            ini = texto.index("{")
            fin = texto.rindex("}") + 1
            datos = json.loads(texto[ini:fin])
            partes = []
            for p in datos.get("partes", []):
                if p.get("tipo") == "pregunta" and p.get("pregunta"):
                    partes.append(_parte(None, "", tipo="pregunta", pregunta=str(p["pregunta"]).strip()))
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
