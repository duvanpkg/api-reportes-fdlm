/*====================================================================================================

En este archivo se crean querys las cuales pueden ser genericas o las que mas se usan dentro de la API

====================================================================================================*/
import { AUDITORIA_REPORTES } from "../database/schemas.js";
import { dbConnections } from "./config.js";

export async function insertarSolicitud(nroSolicitud, numeroReporte, estado, jsonBody) {
  try {
    await dbConnections.Api_ReporteDb.query(
      `INSERT INTO ${AUDITORIA_REPORTES.TABLA} (${AUDITORIA_REPORTES.NRO_SOLICITUD}, 
        ${AUDITORIA_REPORTES.NRO_REPORTE}, ${AUDITORIA_REPORTES.ESTADO}, ${AUDITORIA_REPORTES.API_BODY}) 
        VALUES ('${nroSolicitud}', '${numeroReporte}', '${estado}', '${jsonBody}')`
    );
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function cambiarEstadoReporte(nroSolicitud, nroReporte, estado, intentos, usandose) {
  try {
    let query = `UPDATE ${AUDITORIA_REPORTES.TABLA} 
  SET ${AUDITORIA_REPORTES.ESTADO} = '${estado}'`;

    if (intentos) {
      query += `, ${AUDITORIA_REPORTES.INTENTOS_GENERAR} = 
    ${AUDITORIA_REPORTES.INTENTOS_GENERAR} + ${parseInt(intentos)}`;
    }

    if (usandose) {
      query += `, ${AUDITORIA_REPORTES.USANDOSE} = '${usandose}'`;
    }

    query += ` WHERE ${AUDITORIA_REPORTES.NRO_SOLICITUD} = '${nroSolicitud}' 
    AND ${AUDITORIA_REPORTES.NRO_REPORTE} = '${nroReporte}'`;

    await dbConnections.Api_ReporteDb.query(query);
  } catch (error) {
    console.error(error);
  }
}
