import React from "react";
import { Routes, Route } from "react-router-dom";
import Apertura from "./pantallas/Apertura";
import Espacio from "./pantallas/Espacio";
import BibliotecaMinima from "./pantallas/BibliotecaMinima";
import Ajustes from "./pantallas/Ajustes";
import PasoMinimo from "./pantallas/PasoMinimo";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Apertura />} />
      <Route path="/e/:espacioId" element={<Espacio />} />
      <Route path="/e/:espacioId/biblioteca" element={<BibliotecaMinima />} />
      <Route path="/ajustes" element={<Ajustes />} />
      <Route path="/p/:proyectoId/idea" element={<PasoMinimo pantalla="idea" />} />
      <Route path="/p/:proyectoId/paso/:clave" element={<PasoMinimo pantalla="elementos" />} />
      <Route path="/p/:proyectoId/guion" element={<PasoMinimo pantalla="guion" />} />
      <Route path="/p/:proyectoId/lienzo" element={<PasoMinimo pantalla="lienzo" />} />
      <Route path="/p/:proyectoId/montaje" element={<PasoMinimo pantalla="montaje" />} />
    </Routes>
  );
}
