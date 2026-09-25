import React from "react";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  elevada?: boolean;
}

export default function Tarjeta({ children, className = "", elevada = false, ...props }: Props) {
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
