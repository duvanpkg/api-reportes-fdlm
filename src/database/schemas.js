/*===========================================================================================================

Aquí se crean los esquemas de cada tabla en la base de datos, para evitar quemar las querys en codigo, ademas
que si en un futuro le cambian el nombre a una columna, solo debera cambiarlo en este documento

===========================================================================================================*/
export const AUDITORIA_REPORTES = Object.freeze({
  TABLA: "AUDITORIA_REPORTES", // Representa el nombre de la tabla AUDITORIA
  NRO_SOLICITUD: "NRO_SOLICITUD", // Representa el numero de la solicitud
  NRO_REPORTE: "NRO_REPORTE", // Representa el numero del reporte a generar
  ESTADO: "ESTADO", // Representa el esta en el que se encuentra la generacion del reporte
  INTENTOS_GENERAR: "INTENTOS_GENERAR", // Tiene solo 3 intentos para generarse y subir a carpeta, esto lleva el control
  USANDOSE: "USANDOSE", // 1 para usandose y 0 para no. Esto es para evitar que los cronjobs tomen la misma solicitud que apenas se esta generando y evitar que los procesos se repitan
  INFORMADO_EMAIL: "INFORMADO_EMAIL", // Si ya se envio un email sobre la falla de ciertos reportes se marca 1, sino es 0
  TIEMPO_GENERACION: "TIEMPO_GENERACION", // Tiempo que toma todo el proceso de generacion (en ms)
  NOMBRE_PDF: "NOMBRE_PDF", // Se almacena el nombre con el que queda el archivo del reporte
  FECHA_INGRESO: "FECHA_INGRESO", // Fecha en la que el reporte a generar entra por primera vez al API
  FECHA_PROCESADO: "FECHA_PROCESADO", // Fecha en la que el reporte es generado en .pdf
  FECHA_EN_CARPETA: "FECHA_EN_CARPETA", // Fecha en la que es subido a carpeta digital
  API_BODY: "API_BODY", // Se almacena el JSON para reutilizarlo en los reportes que fallan en el proceso mediante los cronjobs
  FECHA_ELIMINADO_SERVIDOR: "FECHA_ELIMINADO_SERVIDOR", // fecha en la cual la cronjob borra los documentos del servidor
});

export const VARIABLES_APIREPORTES = Object.freeze({
  TABLA: "VARIABLES_APIREPORTES", // Representa el nombre de la tabla VARIABLES
  VARIABLE_ENTORNO: "VARIABLE_ENTORNO",
  DESCRIPCION: "DESCRIPCION",
  VALOR: "VALOR",
});
