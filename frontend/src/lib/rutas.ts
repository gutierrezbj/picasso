export function rutaPaso(pid, paso) {
  switch (paso.pantalla) {
    case "idea":
      return `/p/${pid}/idea`;
    case "elementos":
      return `/p/${pid}/paso/${paso.clave}`;
    case "guion":
      return `/p/${pid}/guion`;
    case "lienzo":
      return `/p/${pid}/lienzo`;
    case "montaje":
      return `/p/${pid}/montaje`;
    default:
      return `/p/${pid}/paso/${paso.clave}`;
  }
}
