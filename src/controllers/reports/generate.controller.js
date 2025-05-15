/*==================================================================================

Este controlador tiene como objetivo generar reportes Jasper mediante la herramienta JasperStarter, la cual 
nos permite generar reportes mediante lineas de comandos (Documentacion: http://jasperstarter.cenote.de/)

Tambien permite tener control de status en cuanto al reporte a nivel de base de datos, esto con el objetivo de 
reintentar la generacion de los reportes con estatus no adecuados

TIPOS DE STATUS:
0: Sin procesar el reporte
1: Reporte procesado por jasper (Ya se genero el PDF)
2: Algo fallo en el proceso (A nivel de base de datos o no se genero el PDF)
3: Reporte subido a Carpeta Digital

Este controlador luego de generar el reporte en .pdf se encarga de hacer la peticion al API de InfoPoint para
subir el reporte a la carpeta correspondiente.

====================================================================================*/
import { dbConnections } from "../../database/config.js";
import { verifyFileAfter, verifyJrxml } from "../../helpers/verifyFiles.js";
import { generateReport } from "../../helpers/jasperCommandLine.js";
import { AUDITORIA_REPORTES } from "../../database/schemas.js";
import { cambiarEstadoReporte, insertarSolicitud } from "../../database/mainQuerys.js";
import { buscarSolicitud } from "../../helpers/recorrerJson.js";
import { responseMessage } from "../../helpers/responseMessages.js";
import { subirReporte } from "../carpetaDigital/actualizarCarpeta.js";

export const generate = async (req, res) => {
  let parametros = null;
  let numeroReporte = null;
  let nroSolicitud = null;
  let idTipoDoc = null;
  let body = null;

  // Contabilizar cuanto tiempo toma en hacer el proceso completo
  const startTime = Date.now();

  // Esto se hace con el objetivo de tener tanto peticiones http o internas de la API
  if (req.body) {
    // Para peticiones http
    numeroReporte = req.body.numeroReporte;
    parametros = req.body.parametros;
    nroSolicitud = buscarSolicitud(req.body);
    idTipoDoc = req.body.idTipoDoc;
    body = req.body;
  } else {
    // Para peticiones como funcion dentro de la API
    numeroReporte = req.numeroReporte;
    parametros = req.parametros;
    nroSolicitud = buscarSolicitud(req);
    idTipoDoc = req.idTipoDoc;
    body = req;
  }

  console.log("=========================================================================================");
  console.log("Se va a generar reporte numero: ", numeroReporte, " con solicitud numero: ", nroSolicitud);
  console.log("=========================================================================================");

  try {
    // Verificamos si el numero de solicitud ya esta en la tabla de auditoria para saber si insertar uno nuevo o no
    const verificarReportesRepetidos = await dbConnections.Api_ReporteDb.query(
      `SELECT * FROM ${AUDITORIA_REPORTES.TABLA} 
      WHERE ${AUDITORIA_REPORTES.NRO_SOLICITUD} = '${nroSolicitud}'
      AND ${AUDITORIA_REPORTES.NRO_REPORTE} = '${numeroReporte}'`
    );

    // Guardamos en la base de datos la auditoria del reporte solicitado
    if (!verificarReportesRepetidos.recordset[0]) {
      await insertarSolicitud(nroSolicitud, numeroReporte, "0", JSON.stringify(body));
    }

    // Aquí se van incrementando los intentos que se hacen para realizar el informe
    await cambiarEstadoReporte(nroSolicitud, numeroReporte, "0", "1", "1");

    // Verificar si la solicitud existe en los registros de FDLM
    const verificarSolicitud = await dbConnections.FDLM.query(
      `SELECT C5000 FROM SL_SolicitudCredito
      WHERE C5000 = '${nroSolicitud}'`
    );

    if (verificarSolicitud.recordset.length === 0) {
      await cambiarEstadoReporte(nroSolicitud, numeroReporte, "2", null, "0");
      return responseMessage(`La solicitud número ${nroSolicitud} no existe`, 404, res);
    }

    // Revisamos si el reporte jasper existe en producción
    const reportPath = await verifyJrxml(numeroReporte);
    if (!reportPath) {
      await cambiarEstadoReporte(nroSolicitud, numeroReporte, "0", null, "0");
      return responseMessage("No se encontro el numero de reporte", 404, res);
    }

    // Se actualiza el JSON por si hubieron correcciones en el mismo
    await dbConnections.Api_ReporteDb.query(`UPDATE ${AUDITORIA_REPORTES.TABLA} 
    SET ${AUDITORIA_REPORTES.API_BODY} = '${JSON.stringify(body)}'
    WHERE ${AUDITORIA_REPORTES.NRO_SOLICITUD} = '${nroSolicitud}'
    AND ${AUDITORIA_REPORTES.NRO_REPORTE} = '${numeroReporte}'`);

    /*==============================================================================
      El nombre del archivo se compone de:
      Numero de solicitud, tipo de documento en carpeta y código unico de generación
    ================================================================================*/
    const reportName = `Sol_${nroSolicitud}_${idTipoDoc}_` + Date.now();

    // Se procede a generar el reporte con la función generateReport que genera el reporte en la ruta especificada
    const reportGenerator = await generateReport(parametros, reportName, reportPath);

    // Verificar si el archivo llegó
    const verifyPdf = await verifyFileAfter(reportName);

    if (verifyPdf) {
      // Se cambia el estado a 1 para marcarlo como procesado
      await cambiarEstadoReporte(nroSolicitud, numeroReporte, "1");

      // Se agrega la información a la tabla en la base de datos
      await dbConnections.Api_ReporteDb.query(`UPDATE ${AUDITORIA_REPORTES.TABLA} 
      SET ${AUDITORIA_REPORTES.NOMBRE_PDF} = '${reportName}', 
      ${AUDITORIA_REPORTES.FECHA_PROCESADO} = CURRENT_TIMESTAMP
      WHERE ${AUDITORIA_REPORTES.NRO_SOLICITUD} = '${nroSolicitud}'
      AND ${AUDITORIA_REPORTES.NRO_REPORTE} = '${numeroReporte}'`);
    } else if (!verifyPdf) {
      // Si el reporte no se generó, se procede a marcar el estado como "fallo el proceso" el cual es el 2
      await cambiarEstadoReporte(nroSolicitud, numeroReporte, "2", null, "0");

      return responseMessage(`Reporte con nombre ${reportName}.pdf no fue generado.`, 400, res);
    }

    const reporteCarpeta = await subirReporte(idTipoDoc, reportName, nroSolicitud, numeroReporte);

    // Calculos del tiempo que tomo en procesarse y subirse a carpeta
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    // Se guarda en la base de datos en milisegundos
    await dbConnections.Api_ReporteDb.query(`UPDATE ${AUDITORIA_REPORTES.TABLA} 
      SET ${AUDITORIA_REPORTES.TIEMPO_GENERACION} = ${elapsedTime} 
      WHERE ${AUDITORIA_REPORTES.NRO_SOLICITUD} = '${nroSolicitud}'
      AND ${AUDITORIA_REPORTES.NRO_REPORTE} = '${numeroReporte}'`);

    if (reporteCarpeta) {
      await cambiarEstadoReporte(nroSolicitud, numeroReporte, "3", null, "0");

      return responseMessage(`Reporte con nombre ${reportName}.pdf subido a carpeta correctamente`, 200, res);
    } else {
      await cambiarEstadoReporte(nroSolicitud, numeroReporte, "1", null, "0");
      return responseMessage(`No se puedo subir a carpeta el reporte`, 400, res);
    }
  } catch (error) {
    console.error(error);
    await cambiarEstadoReporte(nroSolicitud, numeroReporte, "2", null, "0");
    return responseMessage("El reporte no se ha podido crear", 500, res);
  }
};
