/*==========================================================================================================
Esta es una funcion programada, esto quiere decir que se ejecutara cada cierto tiempo, el cual se le indique
en el schedule. 
En este caso se eliminan los archivos que lleven 2 meses en el servidor y ademas tambien se depuran las filas
que lleven 6 meses en el servidor.

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
import * as fs from "fs";
import * as path from "path";
import * as rimraf from "rimraf";

import { dbConnections } from "../database/config.js";
import { AUDITORIA_REPORTES } from "../database/schemas.js";
import { variablesEntornoBD } from "../middlewares/variablesEntornoBD.js";

// cada domingo a las 11 pm "0 23 * * 7" va a revisar los archivos que superen 2 meses de estar en el servidor
export const deleteReports = schedule("0 23 * * 7", async () => {
  console.log("=========================================================================================");
  console.log("Cronjob 4 verificará archivos que deben ser eliminados del servidor");
  console.log("=========================================================================================");

  const directoryPath = process.env.JASPER_OUTPUT;
  let filesDeleted = 0;

  try {
    // Se consume variable de entorno desde la base de datos
    const variablesBD = await variablesEntornoBD();

    const currentDate = new Date();

    // Lee el directorio
    fs.readdir(directoryPath, async (err, files) => {
      if (err) {
        console.error("Error reading directory:", err.message);
        return;
      }

      // Itera cada archivo del directorio
      for (const file of files) {
        const filePath = path.join(directoryPath, file);

        try {
          // Obtiene los detalles del directorio
          const stats = fs.statSync(filePath);

          // Calcula la diferencia de meses
          const diffInMonths =
            (currentDate.getFullYear() - stats.mtime.getFullYear()) * 12 +
            (currentDate.getMonth() - stats.mtime.getMonth()) +
            (currentDate.getDate() - stats.mtime.getDate()) / 30; // Aproximación de días a meses

          // Verifica si el archivo supera los 2 meses
          if (diffInMonths >= variablesBD.MESES_DEPURACION_ARCHIVOS) {
            console.log(`Deleting file: ${filePath}`);

            // Elimina el archivo
            rimraf.sync(filePath);

            // Verifica si el archivo se elimino
            if (!fs.existsSync(filePath)) {
              console.log(`File ${filePath} deleted successfully.`);
              filesDeleted++;
              // Actualiza la base de datos
              await dbConnections.Api_ReporteDb.query(
                `UPDATE ${AUDITORIA_REPORTES.TABLA} 
              SET ${AUDITORIA_REPORTES.FECHA_ELIMINADO_SERVIDOR} = CURRENT_TIMESTAMP
              WHERE ${AUDITORIA_REPORTES.NRO_SOLICITUD} = '${reporte.NRO_SOLICITUD}'`
              );
            } else {
              console.log(`Error deleting file ${filePath}.`);
            }
          }
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error.message);
        }
      }
    });
    if (filesDeleted == 0) {
      console.log("CronJob 4: No se han encontrado archivos con 2 meses de antiguedad por borrar");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
  console.log("=========================================================================================");
  console.log("Cronjob 4 verificó archivos que debian ser eliminados del servidor");
  console.log("=========================================================================================");
});

// cada domingo a las 11 pm "0 23 * * 7" va a revisar los reportes que superen 6 meses de estar en la bd
export const purgeTable = schedule("0 23 * * 7", async () => {
  console.log("==============================================================================================");
  console.log("Cronjob 5 se verifirá filas en la BD que deben ser eliminadas de la tabla");
  console.log("==============================================================================================");
  try {
    // Se consume variable de entorno desde la base de datos
    const variablesBD = await variablesEntornoBD();

    // aqui se determina cuanto es el tiempo de eliminacion
    const result = await dbConnections.Api_ReporteDb.query(`
    SELECT * FROM ${AUDITORIA_REPORTES.TABLA} 
    WHERE DATEDIFF(MONTH, ${AUDITORIA_REPORTES.FECHA_EN_CARPETA}, GETDATE()) >= ${variablesBD.MESES_DEPURACION_BD} 
    AND ${AUDITORIA_REPORTES.FECHA_ELIMINADO_SERVIDOR} IS NOT NULL`);

    if (result.recordset.length > 0) {
      await dbConnections.Api_ReporteDb.query(`
      DELETE FROM ${AUDITORIA_REPORTES.TABLA} 
      WHERE DATEDIFF(MONTH, ${AUDITORIA_REPORTES.FECHA_EN_CARPETA}, GETDATE()) >= ${variablesBD.MESES_DEPURACION_BD} 
      AND ${AUDITORIA_REPORTES.FECHA_ELIMINADO_SERVIDOR} IS NOT NULL`);
    } else {
      console.log("Cronjob 5: No se han encontrado filas en la BD por borrar");
    }
  } catch (error) {
    console.error(error);
  }
  console.log("==============================================================================================");
  console.log("Cronjob 5 Se verificaron filas en la BD que debian ser eliminadas de la tabla");
  console.log("==============================================================================================");
});
