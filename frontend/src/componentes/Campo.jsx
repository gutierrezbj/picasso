import React from "react";

export function Campo({ etiqueta, ayuda, children, htmlFor }) {
  return (
    <div className="flex flex-col gap-2">
      {etiqueta && (
        <label htmlFor={htmlFor} className="text-[14px] leading-[20px] font-medium text-tinta">
          {etiqueta}
        </label>
      )}
      {children}
      {ayuda && <span className="text-[13px] leading-[18px] text-tinta2">{ayuda}</span>}
    </div>
  );
}

export function Entrada({ className = "", ...props }) {
  return (
    <input
      className={
        "min-h-[44px] w-full rounded-control border border-linea bg-superficie px-4 " +
        "text-[16px] leading-[24px] text-tinta placeholder:text-tinta3 " +
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento " +
        className
      }
      {...props}
    />
  );
}

export function AreaTexto({ className = "", ...props }) {
  return (
    <textarea
      className={
        "w-full rounded-control border border-linea bg-superficie px-4 py-3 " +
        "text-[16px] leading-[24px] text-tinta placeholder:text-tinta3 min-h-[96px] " +
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento " +
        className
      }
      {...props}
    />
  );
}
