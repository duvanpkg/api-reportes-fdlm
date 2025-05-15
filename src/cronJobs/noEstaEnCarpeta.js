/*==========================================================================================================
Esta es una funcion programada, esto quiere decir que se ejecutara cada cierto tiempo, el cual se le indique
en el schedule. 
En este caso se ejecutan los reportes que no se han podido subir a carpeta, se hacen 3 intentos de subirlo a 
carpeta digital cada 10 minutos

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

import { AUDITORIA_REPORTES } from "../database/schemas.js";
import { subirReporte } from "../controllers/carpetaDigital/actualizarCarpeta.js";
import { responseMessage } from "../helpers/responseMessages.js";
import { cambiarEstadoReporte } from "../database/mainQuerys.js";
import { dbConnections } from "../database/config.js";
import { variablesEntornoBD } from "../middlewares/variablesEntornoBD.js";

export const verificadorCarpetaDigital = schedule("*/10 * * * *", async () => {
  try {
    console.log("=========================================================================================");
    console.log("Cronjob 2 verificará reportes sin subir a carpeta");
    console.log("=========================================================================================");
    // Se consume variable de entorno desde la base de datos
    const variablesBD = await variablesEntornoBD();

    const reportesProcesadosSinEnviar = await dbConnections.Api_ReporteDb.query(
      `SELECT COUNT(*) as longitud FROM ${AUDITORIA_REPORTES.TABLA} WHERE ${AUDITORIA_REPORTES.ESTADO} = 1 
    AND ${AUDITORIA_REPORTES.INTENTOS_GENERAR} <= ${variablesBD.INTENTOS_GENERAR} 
    AND ${AUDITORIA_REPORTES.NOMBRE_PDF} IS NOT NULL AND ${AUDITORIA_REPORTES.USANDOSE} = 0`
    );

    const reportesSinSubirCantidad = reportesProcesadosSinEnviar.recordset[0].longitud;

    const resultados = reportesProcesadosSinEnviar.recordset;

    console.log(`Cronjob 2: Se deben enviar a carpeta digital ${reportesSinSubirCantidad} reportes`);

    let subidos = 0;

    for (let i = 0; i < reportesSinSubirCantidad; i++) {
      const reportes = await dbConnections.Api_ReporteDb.query(
        `WITH CTE AS (SELECT *, ROW_NUMBER() OVER (ORDER BY NEWID()) AS RowNum FROM ${AUDITORIA_REPORTES.TABLA} 
        WHERE ${AUDITORIA_REPORTES.ESTADO} = 1 
        AND ${AUDITORIA_REPORTES.INTENTOS_GENERAR}  <= ${variablesBD.INTENTOS_GENERAR}  
        AND ${AUDITORIA_REPORTES.NOMBRE_PDF} IS NOT NULL AND ${AUDITORIA_REPORTES.USANDOSE} = 0)
        SELECT * FROM CTE WHERE RowNum = 1;`
      );

      if (reportes.recordset[0]) {
        const body = JSON.parse(reportes.recordset[0].API_BODY);

        // Se enciende el indicador de que se esta usando
        await cambiarEstadoReporte(
          reportes.recordset[0].NRO_SOLICITUD,
          reportes.recordset[0].NRO_REPORTE,
          "1",
          null,
          "1"
        );

        const carpetaDigitalRta = await subirReporte(
          body.idTipoDoc,
          reportes.recordset[0].NOMBRE_PDF,
          reportes.recordset[0].NRO_SOLICITUD,
          reportes.recordset[0].NRO_REPORTE
        );

        if (carpetaDigitalRta) {
          await cambiarEstadoReporte(
            reportes.recordset[0].NRO_SOLICITUD,
            reportes.recordset[0].NRO_REPORTE,
            "3",
            "1",
            "0"
          );
          subidos++;
        } else {
          await cambiarEstadoReporte(
            reportes.recordset[0].NRO_SOLICITUD,
            reportes.recordset[0].NRO_REPORTE,
            "1",
            "1",
            "0"
          );
        }
      }
    }
    console.log(responseMessage(`Cronjob 2: Se han subido a carpeta ${subidos}/${resultados.length} reportes`, 200));
  } catch (error) {
    console.error(error);
  }
  console.log("=========================================================================================");
  console.log("Cronjob 2 termino de verificar reportes sin subir a carpeta");
  console.log("=========================================================================================");
});
