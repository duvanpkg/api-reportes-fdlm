// Este archivo esta dedicado para programar las estructuras de las respuestas de las solicitudes

export function responseMessage(message, status, res) {
  if (res) return res.status(status).send({ message: message, status: status });
  return { message: message, status: status };
}

// PERSONALIZACION DE CONSOLE.LOG Y CONSOLE.ERROR

// Guarda las referencias a las funciones originales
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Sobrescribe console.log con una nueva implementación
console.log = function () {
  const timestampedArguments = [`[${new Date().toLocaleString()}] - INFO:`].concat(Array.from(arguments));
  originalConsoleLog.apply(console, timestampedArguments);
};

// Sobrescribe console.error con una nueva implementación
console.error = function () {
  const timestampedArguments = [`[${new Date().toLocaleString()}] - ERROR:`].concat(Array.from(arguments));
  originalConsoleError.apply(console, timestampedArguments);
};
