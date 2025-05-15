/*==========================================================================================================
Esta es una funcion programada, esto quiere decir que se ejecutara cada cierto tiempo, el cual se le indique
en el schedule. 
En este caso se ejecutan los reportes que no se han podido generar por parte de jasper, y por tanto no se 
encuentran en .pdf para ser subidos a carpeta | Cabe resaltar que solo hay 3 intentos para resubirlo, si eso
no sucede, dejara de intentarlo

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
import { generate } from "../controllers/reports/generate.controller.js";
import { dbConnections } from "../database/config.js";
import { variablesEntornoBD } from "../middlewares/variablesEntornoBD.js";

export const verificadorIntentos = schedule("*/10 * * * *", async () => {
  try {
    console.log("=========================================================================================");
    console.log("Cronjob 1 verificará reportes sin generar PDF");
    console.log("=========================================================================================");

    // Se consume variable de entorno desde la base de datos
    const variablesBD = await variablesEntornoBD();

    // Se cambian status que quizás hayan quedado mal para evitar repetir procedimientos
    const reportesYaGenerados = await dbConnections.Api_ReporteDb.query(
      `SELECT * FROM ${AUDITORIA_REPORTES.TABLA} 
      WHERE ((${AUDITORIA_REPORTES.ESTADO} = 2 OR ${AUDITORIA_REPORTES.ESTADO} = 0)
      AND ${AUDITORIA_REPORTES.INTENTOS_GENERAR} <= ${variablesBD.INTENTOS_GENERAR} 
      AND ${AUDITORIA_REPORTES.USANDOSE} = 0
      AND ${AUDITORIA_REPORTES.NOMBRE_PDF} IS NOT NULL)`
    );

    if (reportesYaGenerados.recordset.length > 0) {
      for (const registro of reportesYaGenerados.recordset) {
        await dbConnections.Api_ReporteDb.query(`UPDATE ${AUDITORIA_REPORTES.TABLA} SET ESTADO=1
        WHERE ${AUDITORIA_REPORTES.NRO_SOLICITUD} = '${registro.NRO_SOLICITUD}'`);
      }
    }

    // Esta consulta actualiza la columna USANDOSE a 0 para las filas donde el tiempo transcurrido
    // desde la fecha de ingreso (FECHA_INGRESO) hasta la fecha y hora actuales (GETDATE()) es mayor a 10 minutos,
    // y al mismo tiempo, la columna USANDOSE tiene el valor 1.
    // Esto permite reiniciar la disponibilidad de los reportes que han sido utilizados continuamente durante más de 10 minutos.
    await dbConnections.Api_ReporteDb.query(
      `UPDATE ${AUDITORIA_REPORTES.TABLA} SET ${AUDITORIA_REPORTES.USANDOSE} = 0 
      WHERE (DATEDIFF(MINUTE, ${AUDITORIA_REPORTES.FECHA_INGRESO}, GETDATE()) > 10) 
      AND ${AUDITORIA_REPORTES.USANDOSE} = 1`
    );

    // Reenviar las solicitudes con 3 o menos intentos a que se repitan
    const reportesConProblemas = await dbConnections.Api_ReporteDb.query(
      `SELECT COUNT(*) as longitud FROM ${AUDITORIA_REPORTES.TABLA} 
      WHERE (${AUDITORIA_REPORTES.ESTADO} = 2 OR ${AUDITORIA_REPORTES.ESTADO} = 0 
      OR ${AUDITORIA_REPORTES.ESTADO} = 1)
      AND ${AUDITORIA_REPORTES.INTENTOS_GENERAR} <= ${variablesBD.INTENTOS_GENERAR} AND ${AUDITORIA_REPORTES.USANDOSE} = 0
      AND ${AUDITORIA_REPORTES.NOMBRE_PDF} IS NULL`
    );

    const reportesSinGenerarCantidad = reportesConProblemas.recordset[0].longitud;

    console.log(`CronJob 1: Se deben procesar de nuevo ${reportesSinGenerarCantidad} reportes a PDF`);
    // Con este ciclo nos aseguramos que vamos a trabajar con la ultima informacion de la base de datos
    for (let i = 0; i < reportesSinGenerarCantidad; i++) {
      const reportes = await dbConnections.Api_ReporteDb.query(
        `WITH NORPT AS (SELECT *, ROW_NUMBER() OVER (ORDER BY NEWID()) AS RowNum FROM ${AUDITORIA_REPORTES.TABLA} 
        WHERE (${AUDITORIA_REPORTES.ESTADO} = 2 OR ${AUDITORIA_REPORTES.ESTADO} = 0 
          OR ${AUDITORIA_REPORTES.ESTADO} = 1)
          AND ${AUDITORIA_REPORTES.INTENTOS_GENERAR} <= ${variablesBD.INTENTOS_GENERAR}  
          AND ${AUDITORIA_REPORTES.USANDOSE} = 0 AND ${AUDITORIA_REPORTES.NOMBRE_PDF} IS NULL
        SELECT * FROM NORPT WHERE RowNum = 1;`
      );
      if (reportes.recordset[0]) {
        const body = JSON.parse(reportes.recordset[0].API_BODY);
        console.log(`Cronjob 1: Se va a generar el reporte ${body.numeroReporte} con parametros ${body.parametros}`);

        const generarReporte = await generate(body);
        console.log("Cronjob 1: ", generarReporte);
      }
    }
  } catch (error) {
    console.error(error);
  }
  console.log("=========================================================================================");
  console.log("Cronjob 1 termino de verificar reportes sin generar PDF");
  console.log("=========================================================================================");
});
