export function buscarSolicitud(json) {
  let nroSolicitud;
  for (let i = 0; i < json.parametros.length; i++) {
    if (json.parametros[i].includes("Solicitud=")) {
      nroSolicitud = json.parametros[i].split("=")[1];
      break;
    }
  }
  return nroSolicitud.toString();
}

// Aquí puede crear mas recorridos de JSON si los necesita
