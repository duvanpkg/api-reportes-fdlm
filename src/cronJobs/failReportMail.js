/*==========================================================================================================
Esta es una funcion programada, esto quiere decir que se ejecutara cada cierto tiempo, el cual se le indique
en el schedule. 
En este caso se informa una sola vez vía email, los reportes que hayan fallado y superaron los 3 intentos

Ejemplo del funcionamiento de node-cron:
 # ┌────────────── second (optional)
 # │ ┌──────────── minute
 # │ │ ┌────────── hour
 # │ │ │ ┌──────── day of month
 # │ │ │ │ ┌────── month
 # │ │ │ │ │ ┌──── day of week
 # │ │ │ │ │ │
 # │ │ │ │ │ │
 # * * * * * *
Mas información en: https://www.npmjs.com/package/node-cron
==========================================================================================================*/
import { schedule } from "node-cron";
import { sendEmail } from "../helpers/mailer.js";
import { dbConnections } from "../database/config.js";
import { AUDITORIA_REPORTES } from "../database/schemas.js";
import { responseMessage } from "../helpers/responseMessages.js";
import { variablesEntornoBD } from "../middlewares/variablesEntornoBD.js";

let contenido;

export const reportesSinIntentos = schedule("*/60 * * * *", async () => {
  console.log("=========================================================================================");
  console.log("Cronjob 3 verificará reportes que deben ser notificados vía email");
  console.log("=========================================================================================");

  try {
    // Se consume variable de entorno desde la base de datos
    const variablesBD = await variablesEntornoBD();

    const reportesConProblemas = await dbConnections.Api_ReporteDb.query(
      `SELECT * FROM ${AUDITORIA_REPORTES.TABLA} WHERE (${AUDITORIA_REPORTES.ESTADO} = 2 
	    OR ${AUDITORIA_REPORTES.ESTADO} = 0 OR ${AUDITORIA_REPORTES.ESTADO} = 1) 
	    AND ${AUDITORIA_REPORTES.INTENTOS_GENERAR} > ${variablesBD.INTENTOS_GENERAR} 
      AND ${AUDITORIA_REPORTES.INFORMADO_EMAIL} = 0`
    );

    const cantidadReportesIncorrectos = reportesConProblemas.recordset.length;

    if (cantidadReportesIncorrectos == 0)
      return console.log("Cronjob 3: ", responseMessage("No hay reportes por notificar vía email", 200));

    // Formatear la cadena de texto
    contenido = `SERVIDOR ${process.env.NODE_ENV} => Se han detectado ${cantidadReportesIncorrectos} reportes con estado fuera del adecuado, por favor revíselos:<br>`;

    let solicitudesQuery = "";
    let numeroReporte = "";

    for (const reporte of reportesConProblemas.recordset) {
      // Se crea un enumerador por los posibles errores que estan sucediendo con el reporte
      const errores = {
        1: "Reporte generado en PDF pero no se ha podido subir a carpeta",
        2: "Error inesperado al generar el reporte, verifique si se generó un PDF desde la base de datos",
        0: "No se generó el reporte en PDF",
      };

      let error = errores[reporte.ESTADO] || "Estado de reporte desconocido";

      contenido += `<b>- (Numero de reporte: ${reporte.NRO_REPORTE}, Reporte con ID numero: ${reporte.REPORTE_ID}, 
	Numero de solicitud: ${reporte.NRO_SOLICITUD} y Error: ${error})</b><br>`;

      // Aqui se van listando los reportes para hacerles update en la bd y marcarlos como correo enviado
      solicitudesQuery += `'${reporte.NRO_SOLICITUD}'` + ",";
      numeroReporte += `'${reporte.NRO_REPORTE}'` + ",";
    }

    // Eliminamos la última coma de las cadenas
    solicitudesQuery = solicitudesQuery.slice(0, -1);
    numeroReporte = numeroReporte.slice(0, -1);

    console.log("Cronjob 3: ", contenido);

    // Cambiamos el estado de reportado via email para que no se siga spameando el mismo reporte
    await dbConnections.Api_ReporteDb.query(
      `UPDATE ${AUDITORIA_REPORTES.TABLA} SET ${AUDITORIA_REPORTES.INFORMADO_EMAIL} = 1
 	WHERE ${AUDITORIA_REPORTES.NRO_SOLICITUD} IN (${solicitudesQuery}) AND
	${AUDITORIA_REPORTES.NRO_REPORTE} IN (${numeroReporte})`
    );

    // Enviar el correo electrónico
    await sendEmail(
      "desarrollo@fundaciondelamujer.com",
      `API REPORTES ${process.env.NODE_ENV}: Reportes Incorrectos`,
      contenido
    );
  } catch (error) {
    console.error(error);
  }
  console.log("=========================================================================================");
  console.log("Cronjob 3 verifico reportes que debian ser notificados vía email");
  console.log("=========================================================================================");
});
