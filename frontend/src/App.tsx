import React from "react";
import { Routes, Route } from "react-router-dom";
import Apertura from "./pantallas/Apertura";
import Espacio from "./pantallas/Espacio";
import Biblioteca from "./pantallas/Biblioteca";
import Ajustes from "./pantallas/Ajustes";
import PasoMinimo from "./pantallas/PasoMinimo";
import PasoElementos from "./pantallas/PasoElementos";
import Desarrollo from "./pantallas/Desarrollo";
import Guion from "./pantallas/Guion";
import Lienzo from "./pantallas/Lienzo";
import Montaje from "./pantallas/Montaje";
import Registro from "./pantallas/Registro";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Apertura />} />
      <Route path="/e/:espacioId" element={<Espacio />} />
      <Route path="/e/:espacioId/biblioteca" element={<Biblioteca />} />
      <Route path="/ajustes" element={<Ajustes />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/p/:proyectoId/idea" element={<Desarrollo />} />
      <Route path="/p/:proyectoId/paso/:clave" element={<PasoElementos />} />
      <Route path="/p/:proyectoId/guion" element={<Guion />} />
      <Route path="/p/:proyectoId/guion/:piezaId" element={<Guion />} />
      <Route path="/p/:proyectoId/lienzo" element={<Lienzo />} />
      <Route path="/p/:proyectoId/lienzo/:piezaId" element={<Lienzo />} />
      <Route path="/p/:proyectoId/montaje" element={<Montaje />} />
      <Route path="/p/:proyectoId/montaje/:piezaId" element={<Montaje />} />
    </Routes>
  );
}
