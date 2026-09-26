"""Transiciones permitidas del ciclo de una operación (§9.4).

preparada → presupuestada → autorizada → enviada → en_curso → completada
                                            │           │
                                            └→ incierta ←┘ (timeout o respuesta perdida)
                                                        └→ fallida

Cualquier otra transición se rechaza con 409 diciendo en qué estado está.
"""
from __future__ import annotations

from app.dominio.modelos import EstadoOperacion as E

TRANSICIONES: dict[E, set[E]] = {
    E.preparada: {E.preparada, E.presupuestada, E.autorizada, E.descartada},
    E.presupuestada: {E.preparada, E.presupuestada, E.autorizada, E.descartada},
    E.autorizada: {E.enviada, E.incierta, E.fallida},
    E.enviada: {E.en_curso, E.completada, E.incierta, E.fallida},
    E.en_curso: {E.en_curso, E.completada, E.incierta, E.fallida},
    E.incierta: {E.en_curso, E.completada, E.fallida, E.presupuestada},
    E.fallida: {E.presupuestada},
    E.completada: set(),
    E.descartada: set(),
}


class TransicionNoPermitida(Exception):
    def __init__(self, actual: str, siguiente: str):
        self.actual = actual
        self.siguiente = siguiente
        super().__init__(
            f"La operación está «{actual}»: desde ahí no se puede pasar a «{siguiente}»."
        )


def exigir(actual: str, siguiente: str) -> None:
    permitidos = TRANSICIONES[E(actual)]
    if E(siguiente) not in permitidos:
        raise TransicionNoPermitida(actual, siguiente)
