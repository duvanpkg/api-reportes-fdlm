import fs from "fs";
import path from "path";

import { subirReporte } from "../carpetaDigital/actualizarCarpeta.js";
import { AUDITORIA_REPORTES } from "../../database/schemas.js";
import { responseMessage } from "../../helpers/responseMessages.js";
import { dbConnections } from "../../database/config.js";
import { generate } from "./generate.controller.js";
import { generateReport } from "../../helpers/jasperCommandLine.js";
import { verifyJrxml } from "../../helpers/verifyFiles.js";
/*=============================================================================================================
  Cuando un reporte falla en su generacion como .pdf debe forzarse mediante este controlador el cual consume 
  el endpoint "/force-report-generation". Este controlador fuerza la generacion del reporte haciendo el proceso
  completo, desde generar el .pdf hasta subirlo a carpeta
=============================================================================================================*/
export const forceGenerateReport = async (req, res) => {
  const { nroSolicitud, numeroReporte } = req.body;

  const reporteConProblemas = (
    await dbConnections.Api_ReporteDb.query(
      `SELECT * FROM ${AUDITORIA_REPORTES.TABLA} WHERE ${AUDITORIA_REPORTES.NRO_SOLICITUD} = '${nroSolicitud}'
      AND ${AUDITORIA_REPORTES.NRO_REPORTE} = '${numeroReporte}'`
    )
  ).recordset;

  console.log(
    `ENDPOINT: Forzar generación del reporte para solicitud ${reporteConProblemas[0].NRO_SOLICITUD} y reporte ${reporteConProblemas[0].NRO_REPORTE}`
  );

  if (!reporteConProblemas[0]) return responseMessage("El reporte no ha sido encontrado", 404, res);

  const body = JSON.parse(reporteConProblemas[0].API_BODY);

  const generarReporte = await generate(body);
  return res.send(generarReporte);
};

/*===========================================================================================================
  Cuando revisan a nivel de base de datos los reportes que se generaron en .pdf pero no se subieron a carpeta
  deben usar este endpoint "/upload-report-carpeta" para forzar la subida a carpeta, lo unico que deberan 
  mandar como parametro es el nombre del archivo, el cual lo podran encontrar en una columna de la tabla
  AUDITORIA_REPORTES en la base de datos Api_ReporteDb
===========================================================================================================*/
export const uploadReportCarpeta = async (req, res) => {
  try {
    const { nombreArchivo } = req.body;

    const resultado = (
      await dbConnections.Api_ReporteDb.query(
        `SELECT ${AUDITORIA_REPORTES.NRO_SOLICITUD}, ${AUDITORIA_REPORTES.NOMBRE_PDF}, 
        ${AUDITORIA_REPORTES.API_BODY}, ${AUDITORIA_REPORTES.NRO_REPORTE} FROM ${AUDITORIA_REPORTES.TABLA} 
        WHERE ${AUDITORIA_REPORTES.NOMBRE_PDF} = '${nombreArchivo}'`
      )
    ).recordset;

    console.log(
      `ENDPOINT: Subir reporte manual a carpeta para solicitud ${resultado[0].NRO_SOLICITUD} y reporte ${resultado[0].NRO_REPORTE}`
    );

    const idTipoDoc = JSON.parse(resultado[0].API_BODY).idTipoDoc;

    const carpetaResponse = subirReporte(
      idTipoDoc,
      resultado[0].NOMBRE_PDF,
      resultado[0].NRO_SOLICITUD,
      resultado[0].NRO_REPORTE
    );

    if (carpetaResponse) return responseMessage("Reporte subido exitosamente", 200, res);

    return responseMessage("No se ha subido el reporte a Carpeta Digital", 400, res);
  } catch (error) {
    console.error(error);
    return responseMessage("El servidor ha fallado para subir el reporte", 500, res);
  }
};

/*============================================================================================================
Si se quiere generar un reporte en modo consulta debera usar el endpoint "/download-report", este le retornara
un .pdf al navegador para su visualizacion
============================================================================================================*/
export const generateReportInPdf = async (req, res) => {
  const { parametros, numeroReporte } = req.body;

  console.log(`ENDPOINT generateReportInPdf: Generar reporte con parametros ${parametros} y reporte ${numeroReporte}`);

  const reportName = `Reporte_${numeroReporte}_` + Date.now();

  // Revisamos si el reporte jasper existe en producción
  const reportPath = await verifyJrxml(numeroReporte);
  if (!reportPath) {
    return responseMessage("No se encontro el numero de reporte", 404, res);
  }

  await generateReport(parametros, reportName, reportPath);

  const filePath = path.join(process.env.JASPER_OUTPUT, reportName + ".pdf");
  fs.readFile(filePath, function (err, data) {
    res.contentType("application/pdf");
    res.send(data);
  });
};
