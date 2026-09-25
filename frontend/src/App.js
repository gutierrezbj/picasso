import React from "react";
import { Routes, Route } from "react-router-dom";
import Apertura from "./pantallas/Apertura";
import Espacio from "./pantallas/Espacio";
import Biblioteca from "./pantallas/Biblioteca";
import Ajustes from "./pantallas/Ajustes";
import PasoMinimo from "./pantallas/PasoMinimo";
import PasoElementos from "./pantallas/PasoElementos";
import Desarrollo from "./pantallas/Desarrollo";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Apertura />} />
      <Route path="/e/:espacioId" element={<Espacio />} />
      <Route path="/e/:espacioId/biblioteca" element={<Biblioteca />} />
      <Route path="/ajustes" element={<Ajustes />} />
      <Route path="/p/:proyectoId/idea" element={<Desarrollo />} />
      <Route path="/p/:proyectoId/paso/:clave" element={<PasoElementos />} />
      <Route path="/p/:proyectoId/guion" element={<PasoMinimo pantalla="guion" />} />
      <Route path="/p/:proyectoId/lienzo" element={<PasoMinimo pantalla="lienzo" />} />
      <Route path="/p/:proyectoId/montaje" element={<PasoMinimo pantalla="montaje" />} />
    </Routes>
  );
}
