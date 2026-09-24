import React from "react";

export default function Tarjeta({ children, className = "", elevada = false, ...props }) {
  return (
    <div
      className={
        "rounded-card bg-superficie " +
        (elevada ? "shadow-card " : "border border-linea ") +
        className
      }
      {...props}
    >
      {children}
    </div>
  );
}
