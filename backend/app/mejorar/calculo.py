from __future__ import annotations

import hashlib
import json
from datetime import date
from decimal import ROUND_CEILING, ROUND_HALF_UP, Decimal
from typing import Any, Optional

MODELO = "gpt-6.1-sol"

TARIFA: dict[str, Any] = {
    "modelo": MODELO,
    "moneda": "USD",
    "unidad": "por millón de tokens",
    "entrada": "2.00",
    "cache_lectura": "0.10",
    "escritura_30m": "2.50",
    "escritura_12h": "5.00",
    "salida": "10.00",
    "nivel": "estándar (contexto ≤ 272K)",
    "verificada_en": "2026-11-18",
    "fuente": "https://developers.openai.com/api/docs/pricing",
}

CONFIGURACION: dict[str, Any] = {
    "modelo": MODELO,
    "max_output_tokens": 2000,
    "reasoning": {"effort": "low"},
    "prompt_cache_options": {"mode": "explicit", "ttl": "30m"},
    "background": True,
    "store": True,
}

LIMITE_TEXTO = 2000
LIMITE_REFERENCIAS = 6
LIMITE_NOMBRE = 80
LIMITE_RASGOS = 400
MARGEN_TOKENS = 256
SALIDA_TIPICA = 800
DIAS_TARIFA = 30
MILLON = Decimal(1_000_000)

INSTRUCCIONES = """Eres el director de fotografía de Picasso, un estudio de dirección creativa.
Reescribe el prompt de imagen del usuario para que el modelo de imagen lo clave. Reglas:
1. Conserva su intención y todo lo que pidió. No cambies el sujeto ni la escena.
2. No inventes rasgos de personas: si hay rasgos de ficha, úsalos tal cual y no añadas otros (ni pelo, ni edad, ni ropa que no estén).
3. Completa las seis partes: sujeto, entorno, cámara (tamaño de plano, ángulo, óptica), luz descrita por su fuente (qué la da, desde dónde, cómo es), tono en una o dos palabras, y estilo realista concreto (por ejemplo «foto realista de 35 mm, piel con textura natural»).
4. Nada de palabras de pulido que dan cara de IA: obra maestra, hiperdetallado, 8k, iluminación perfecta, ultrarrealista, premiado.
5. Lo imprescindible primero. Frases cortas. Máximo 110 palabras.
6. No menciones las imágenes de referencia ni el texto «Sin: …»: Picasso añade esas líneas.
7. Escribe en el mismo idioma que el usuario.
Devuelve SOLO un JSON: {"texto": "...", "cambios": [{"parte": "...", "motivo": "..."}]} con 2 a 6 cambios explicados en una frase cada uno."""

AVISO_MOTIVO = {
    "max_output_tokens": "Propuesta incompleta: el modelo llegó al límite de salida ({n} tokens)",
    "content_filter": "Propuesta incompleta: el filtro de contenido de OpenAI cortó la respuesta",
    "max_messages": "Propuesta incompleta: OpenAI alcanzó su límite de mensajes",
    "steered": "Propuesta incompleta por un motivo no esperado (steered)",
}
MOTIVOS_A_REVISAR = ("max_messages", "steered")


class EntradaInvalida(ValueError):
    pass


def recortar(texto: str, limite: int) -> str:
    texto = texto.strip()
    return texto if len(texto) <= limite else texto[: limite - 1] + "…"


def construir_entrada(texto: str, formato: str, referencias: list[dict[str, Any]], max_referencias: int) -> dict[str, Any]:
    texto = (texto or "").strip()
    if not texto:
        raise EntradaInvalida("Escribe primero qué quieres.")
    if len(texto) > LIMITE_TEXTO:
        raise EntradaInvalida(
            f"Mejorar admite {LIMITE_TEXTO} caracteres y el texto tiene {len(texto)}: acórtalo para ver su precio."
        )
    tope = min(LIMITE_REFERENCIAS, max_referencias) if max_referencias else LIMITE_REFERENCIAS
    if len(referencias) > tope:
        raise EntradaInvalida(f"Mejorar admite {tope} referencias con este modelo: quita {len(referencias) - tope}.")
    lineas = [f"Prompt del usuario: {texto}", f"Formato: {formato}"]
    vistas = []
    for r in referencias:
        nombre = recortar(str(r.get("nombre") or "referencia"), LIMITE_NOMBRE)
        rasgos_crudos = "; ".join(str(x) for x in r.get("rasgos_fijos") or [] if str(x).strip())
        rasgos = recortar(rasgos_crudos, LIMITE_RASGOS) if rasgos_crudos else "sin rasgos escritos"
        tipo = r.get("clase") or "referencia de estilo"
        real = " (persona real)" if r.get("persona_real") else ""
        lineas.append(f"@{nombre} = {tipo}{real}. Rasgos de su ficha: {rasgos}")
        vistas.append(
            {
                "medio_id": r.get("medio_id"),
                "nombre": nombre,
                "rasgos": rasgos,
                "recortado": nombre != str(r.get("nombre") or "referencia").strip() or rasgos != (rasgos_crudos or "sin rasgos escritos"),
                "persona_real": bool(r.get("persona_real")),
            }
        )
    mensaje = "\n".join(lineas)
    return {
        "instrucciones": INSTRUCCIONES,
        "mensaje": mensaje,
        "texto": texto,
        "formato": formato,
        "referencias": vistas,
        "bytes": len(INSTRUCCIONES.encode("utf-8")) + len(mensaje.encode("utf-8")),
    }


def huella(entrada: dict[str, Any]) -> str:
    return hashlib.sha256(
        json.dumps({"instrucciones": entrada["instrucciones"], "mensaje": entrada["mensaje"]}, ensure_ascii=False, sort_keys=True).encode("utf-8")
    ).hexdigest()


def tarifa_entrada_reserva(tarifa: dict[str, Any], configuracion: dict[str, Any]) -> Decimal:
    ttl = (configuracion.get("prompt_cache_options") or {}).get("ttl") or "30m"
    return Decimal(tarifa["escritura_12h" if ttl == "12h" else "escritura_30m"])


def redondear_arriba(valor: Decimal) -> float:
    return float(valor.quantize(Decimal("0.0001"), rounding=ROUND_CEILING))


def redondear(valor: Decimal) -> float:
    return float(valor.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP))


def reserva_estimada(bytes_entrada: int, tarifa: dict[str, Any], configuracion: dict[str, Any]) -> float:
    entrada = Decimal(bytes_entrada + MARGEN_TOKENS) * tarifa_entrada_reserva(tarifa, configuracion) / MILLON
    salida = Decimal(int(configuracion["max_output_tokens"])) * Decimal(tarifa["salida"]) / MILLON
    return redondear_arriba(entrada + salida)


def estimacion(bytes_entrada: int, tarifa: dict[str, Any], previas: list[float]) -> float:
    if previas:
        return redondear(Decimal(str(sum(previas) / len(previas))))
    entrada = Decimal(bytes_entrada) * Decimal(tarifa["entrada"]) / MILLON
    salida = Decimal(SALIDA_TIPICA) * Decimal(tarifa["salida"]) / MILLON
    return redondear(entrada + salida)


def dias_tarifa(tarifa: dict[str, Any], hoy: Optional[date] = None) -> int:
    return ((hoy or date.today()) - date.fromisoformat(tarifa["verificada_en"])).days


def aviso_tarifa(tarifa: dict[str, Any], hoy: Optional[date] = None) -> Optional[str]:
    if dias_tarifa(tarifa, hoy) <= DIAS_TARIFA:
        return None
    return "Tarifa sin verificar desde " + "-".join(reversed(tarifa["verificada_en"].split("-")))



_ENTEROS = ("input_tokens", "output_tokens", "total_tokens")
_CONOCIDOS = {"input_tokens", "output_tokens", "total_tokens", "input_tokens_details", "output_tokens_details"}
_DETALLE_ENTRADA = {"cached_tokens", "cache_write_tokens", "cache_write_tokens_details"}


def _entero(v: Any) -> bool:
    return isinstance(v, int) and not isinstance(v, bool) and v >= 0


def evaluar_consumo(usage: Any, tarifa: dict[str, Any], configuracion: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(usage, dict) or not all(k in usage for k in _ENTEROS) or any(usage[k] is None for k in _ENTEROS):
        return {"estado_consumo": "ausente", "consumo": usage if isinstance(usage, dict) else None, "coste_segun_tarifa": None, "marcas": []}
    marcas: list[str] = []
    if set(usage) - _CONOCIDOS or set((usage.get("input_tokens_details") or {})) - _DETALLE_ENTRADA or set((usage.get("output_tokens_details") or {})) - {"reasoning_tokens"}:
        marcas.append("consumo con campos desconocidos")
    det_e = usage.get("input_tokens_details") or {}
    det_s = usage.get("output_tokens_details") or {}
    escr_det = det_e.get("cache_write_tokens_details") or {}
    valores = {
        "entrada": usage["input_tokens"],
        "salida": usage["output_tokens"],
        "total": usage["total_tokens"],
        "cache_lectura": det_e.get("cached_tokens", 0),
        "cache_escritura": det_e.get("cache_write_tokens", 0),
        "cache_escritura_30m": escr_det.get("ttl_30m_tokens", 0),
        "cache_escritura_12h": escr_det.get("ttl_12h_tokens", 0),
        "razonamiento": det_s.get("reasoning_tokens", 0),
    }
    if not all(_entero(v) for v in valores.values()):
        return {"estado_consumo": "sin_cuadrar", "consumo": usage, "tokens": None, "coste_segun_tarifa": None, "marcas": marcas + ["valores no enteros o negativos"]}
    v = valores
    normal = v["entrada"] - v["cache_lectura"] - v["cache_escritura"]
    if v["total"] != v["entrada"] + v["salida"] or v["razonamiento"] > v["salida"] or normal < 0:
        return {"estado_consumo": "sin_cuadrar", "consumo": usage, "tokens": v, "coste_segun_tarifa": None, "marcas": marcas + ["consumo sin cuadrar"]}
    escritura_12h = v["cache_escritura_12h"]
    escritura_30m = v["cache_escritura"] - escritura_12h
    if v["cache_escritura_30m"] + v["cache_escritura_12h"] not in (0, v["cache_escritura"]):
        return {"estado_consumo": "sin_cuadrar", "consumo": usage, "tokens": v, "coste_segun_tarifa": None, "marcas": marcas + ["escrituras de caché sin cuadrar"]}
    coste = (
        Decimal(normal) * Decimal(tarifa["entrada"])
        + Decimal(v["cache_lectura"]) * Decimal(tarifa["cache_lectura"])
        + Decimal(escritura_30m) * Decimal(tarifa["escritura_30m"])
        + Decimal(escritura_12h) * Decimal(tarifa["escritura_12h"])
        + Decimal(v["salida"]) * Decimal(tarifa["salida"])
    ) / MILLON
    if v["cache_escritura"] > 0 and not _cache_esperada(configuracion):
        marcas.append("escritura en caché no esperada")
    return {
        "estado_consumo": "valido",
        "consumo": usage,
        "tokens": {**v, "entrada_normal": normal},
        "coste_segun_tarifa": redondear(coste),
        "marcas": marcas,
    }


def _cache_esperada(configuracion: dict[str, Any]) -> bool:
    return (configuracion.get("prompt_cache_options") or {}).get("mode") != "explicit"




def _json_de(crudo: str) -> Optional[dict[str, Any]]:
    try:
        inicio, fin = crudo.index("{"), crudo.rindex("}") + 1
        datos = json.loads(crudo[inicio:fin])
    except (ValueError, json.JSONDecodeError):
        return None
    return datos if isinstance(datos, dict) else None


def evaluar_propuesta(estado: str, texto_salida: Optional[str], motivo: Optional[str], max_output_tokens: int) -> dict[str, Any]:
    crudo = (texto_salida or "").strip()
    datos = _json_de(crudo) if crudo else None
    texto = str(datos["texto"]).strip() if datos and isinstance(datos.get("texto"), str) else None
    cambios = datos.get("cambios") if datos else None
    cambios_ok = isinstance(cambios, list) and all(isinstance(c, dict) for c in cambios)
    if estado == "completed":
        if texto and cambios_ok:
            return {"calidad": "completa", "texto": texto, "cambios": cambios, "parcial": None, "aviso": None, "a_revisar": False}
        return {"calidad": "ilegible", "texto": None, "cambios": [], "parcial": texto or crudo or None, "aviso": "La respuesta no trae una propuesta legible", "a_revisar": False}
    if estado == "incomplete":
        if motivo in AVISO_MOTIVO:
            aviso = AVISO_MOTIVO[motivo].format(n=max_output_tokens)
        else:
            aviso = f"Propuesta incompleta: motivo «{motivo or 'sin motivo'}» de OpenAI"
        return {
            "calidad": "incompleta",
            "texto": None,
            "cambios": cambios if cambios_ok else [],
            "parcial": texto or crudo or None,
            "aviso": aviso,
            "motivo": motivo,
            "a_revisar": motivo not in ("max_output_tokens", "content_filter"),
        }
    return {"calidad": "sin_propuesta", "texto": None, "cambios": [], "parcial": None, "aviso": None, "a_revisar": False}
