/*============================================================================================================
Subir reporte se encarga de tomar el reporte generado en PDF para convertirlo a base64, tambien se encarga de
extraer el token de carpeta digital mediante un metodo y para finalizar se arma la peticion POST hacia carpeta
para proceder a enviarle el archivo a la carpeta y categoria indicada
============================================================================================================*/
import axios from "axios";
import https from "https";
import os from "os";

import { dbConnections } from "../../database/config.js";
import { getToken } from "./conexion.js";
import { convertToBase64 } from "../../helpers/base64Converter.js";
import { cambiarEstadoReporte } from "../../database/mainQuerys.js";
import { responseMessage } from "../../helpers/responseMessages.js";
import { AUDITORIA_REPORTES } from "../../database/schemas.js";
import { calculateHash } from "../../helpers/descifrar.js";

const agent = new https.Agent({ rejectUnauthorized: false }); // Ignora la validación del certificado

export async function subirReporte(idTipoDoc, nombreReporte, nroSolicitud, nroReporte) {
  try {
    const reportPath = process.env.JASPER_OUTPUT + nombreReporte + ".pdf";
    // Query para hallar el resto de info del cliente
    const titular = await dbConnections.FDLM.query(
      `SELECT C5033 as NombreCompleto, C5082 as NroDoc, C5081 as TipoDoc, NroPagare FROM SL_SolicitudCreditoPersona CP
      INNER JOIN SL_SolicitudCredito SC ON CP.C5080= SC.C5000
      WHERE SC.C5000 = '${nroSolicitud}' AND CP.C5084= 'T'`
    );
    /*Se hace un INNER JOIN para hallar el numero de documento y nombre completo del titular
  a partir de nro de solicitud*/

    // Ahora se halla el TipoDocumento de carpeta digital
    const tipoDocumento = await dbConnections.FDLM.query(
      `SELECT NOMBRE FROM PD_Documentos WHERE IDDOCUMENTO = ${idTipoDoc}`
    );

    // Se llaman las variables de entorno de infopoint desde la base de datos
    const infoPointAPI = await dbConnections.FDLM.query(
      `SELECT valor, CODIGO FROM PD_Parametros
      WHERE CODIGO IN ('APIUsuario', 'UrlAPIInfopoint', 'UrlAPIAutenticacion', 'UrlAPIActualizar')`
    );

    // Se convierte en un objeto para manipular la informacion mas facilmente
    const infoPointObject = infoPointAPI.recordset.reduce((acc, item) => {
      acc[item.CODIGO] = item.valor;
      return acc;
    }, {});

    // Se obtiene el token de acceso
    const accessToken = await getToken(infoPointObject.UrlAPIInfopoint + infoPointObject.UrlAPIAutenticacion);

    // Convertir el archivo a base64
    const FileBase64 = await convertToBase64(reportPath); // Se le pasa la ruta del archivo
    if (!FileBase64) {
      responseMessage(`No se genero el archivo en base64`);
      return false;
    }

    // Datos del informe a enviar
    const reportData = {
      NumDocCli: titular.recordset[0].NroDoc,
      NombreCli: titular.recordset[0].NombreCompleto,
      NumSolicitud: nroSolicitud,
      Usuario: infoPointObject.APIUsuario,
      lstMetadata: [],
      lstSoporte: [
        {
          TipoDocumento: tipoDocumento.recordset[0].NOMBRE,
          NombreArchivo: nombreReporte + ".pdf",
          UrlArchivo: null,
          FileBase64: FileBase64,
          FechaDocumento: null,
          GrupoDoc: null,
        },
      ],
    };

    // URL del endpoint para subir el informe
    const apiUrl = infoPointObject.UrlAPIInfopoint + infoPointObject.UrlAPIActualizar;

    // Encabezados de la solicitud, incluyendo el token de acceso
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
    // Realiza la solicitud POST para subir el informe
    const response = await axios.post(apiUrl, reportData, {
      headers,
      httpsAgent: agent,
    });

    if (response.data.Estado == 1) {
      // Carpeta responde con un codigo de status 1 cuando carpeta es actualizada
      await cambiarEstadoReporte(nroSolicitud, nroReporte, "3", null, "0");
      console.log(`Informe solicitud ${nroSolicitud} y reporte ${nroReporte} subido exitosamente`, response.data);

      // Se guarda en la base de datos la fecha en la que fue actualizada la carpeta
      await dbConnections.Api_ReporteDb.query(`UPDATE ${AUDITORIA_REPORTES.TABLA} 
      SET ${AUDITORIA_REPORTES.FECHA_EN_CARPETA} = CURRENT_TIMESTAMP 
      WHERE ${AUDITORIA_REPORTES.NRO_SOLICITUD} = '${nroSolicitud}'`);

      // Se genera el hash del archivo
      const hashCode = calculateHash(reportPath);

      // Se halla el nombre del servidor
      const hostname = os.hostname();

      // Los siguientes querys solo se ejecutan si el documento es Acta de resumen de comite (20)
      /* Si va a agregar mas validaciones de documentos, se recomienda crear un metodo en la carpeta helpers, el
         cual solo debe llamar en este archivo
         Todo esto para las buenas practicas y no llenar de muchas lineas de codigo este archivo
      */
      if (idTipoDoc == 20) {
        // Se guarda el registro en PD_Procesos con id de proceso 13 para el documento 20
        await dbConnections.FDLM.query(
          `INSERT INTO PD_PROCESOS (NROPAGARE, NROSOLICITUD, TIPODOCUMENTO, NRODOCUMENTO, IDTIPOPROCESO, ESTADO, 
        IDDOCUMENTO, IPSERVER, FECHAPROCESO, HORAPROCESO, OBSERVACION, NRODECEVAL, IDAPLICACION, REGISTRO, CODIGOHASH) 
        VALUES ('${titular.recordset[0].NroPagare}', '${nroSolicitud}', '${titular.recordset[0].TipoDoc}', 
        '${titular.recordset[0].NroDoc}', 13, 2, 20, '${hostname}', CAST(GETDATE() AS DATE), 
        CURRENT_TIMESTAMP,'${reportPath}', 0, 1, ' ', ' ')`
        );
        // Se guarda el registro en PD_Procesos con id de proceso 14 para el documento 20
        await dbConnections.FDLM.query(
          `INSERT INTO PD_PROCESOS (NROPAGARE, NROSOLICITUD, TIPODOCUMENTO, NRODOCUMENTO, IDTIPOPROCESO, ESTADO, 
        IDDOCUMENTO, CODIGOHASH, IPSERVER, FECHAPROCESO, HORAPROCESO, OBSERVACION, NRODECEVAL, IDAPLICACION, REGISTRO) 
        VALUES ('${titular.recordset[0].NroPagare}', '${nroSolicitud}', ' ', ' ', 14, 2, 20, '${hashCode}', 
        '${hostname}', CAST(GETDATE() AS DATE), CURRENT_TIMESTAMP,'${reportPath}', 0, 1, ' ')`
        );
      }
      return true;
    } else {
      console.log(
        `Error en la solicitud ${nroSolicitud} y reporte ${nroReporte} 
      al tratar de subir reporte a API de InfoPoint:`,
        response.data
      );

      return false;
    }
  } catch (error) {
    console.error(
      `Error en la solicitud ${nroSolicitud} y reporte ${nroReporte} 
    al tratar de subir reporte a API de InfoPoint:`,
      error
    );
    return false;
  }
}
