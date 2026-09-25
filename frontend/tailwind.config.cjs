module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fondo: "var(--color-fondo)",
        superficie: "var(--color-superficie)",
        superficie2: "var(--color-superficie-2)",
        tinta: "var(--color-tinta)",
        tinta2: "var(--color-tinta-2)",
        tinta3: "var(--color-tinta-3)",
        linea: "var(--color-linea)",
        acento: "var(--color-acento)",
        acentoTinta: "var(--color-acento-tinta)",
        acentoSuave: "var(--color-acento-suave)",
        exito: "var(--color-exito)",
        aviso: "var(--color-aviso)",
        error: "var(--color-error)",
      },
      fontFamily: {
        ui: "var(--font-ui)",
        mono: "var(--font-technical)",
      },
      borderRadius: {
        control: "var(--radius-control)",
        card: "var(--radius-card)",
        panel: "var(--radius-panel)",
      },
      boxShadow: {
        card: "var(--elevation-card)",
        context: "var(--elevation-context)",
      },
      transitionTimingFunction: {
        suave: "cubic-bezier(0.2, 0, 0, 1)",
      },
    },
  },
  plugins: [],
};
