import axios from "axios";
import https from "https";
import { dbConnections } from "../../database/config.js";
import { descifrarMensaje } from "../../helpers/descifrar.js";

export async function getToken(urlLogin) {
  try {
    const CARPETA_USERNAME = await dbConnections.FDLM.query(
      `SELECT VALOR FROM PD_Parametros WHERE CODIGO = 'APIUserName'`
    );
    let CARPETA_PASSWORD = await dbConnections.FDLM.query(
      `SELECT VALOR FROM PD_Parametros WHERE CODIGO = 'APIPassword'`
    );

    CARPETA_PASSWORD = descifrarMensaje(CARPETA_PASSWORD.recordset[0].VALOR);

    const requestData = {
      username: CARPETA_USERNAME.recordset[0].VALOR,
      password: CARPETA_PASSWORD,
    };

    const apiUrl = urlLogin;

    const agent = new https.Agent({ rejectUnauthorized: false }); // Ignora la validación del certificado

    const response = await axios.post(apiUrl, requestData, { httpsAgent: agent });

    if (response.status === 200) {
      return response.data.oAutheticationRS.access_token;
    } else {
      console.error("Error en la solicitud:", response.status);
    }
  } catch (error) {
    console.error("Error en la solicitud:", error.message);
  }
}
