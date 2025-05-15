import { dbConnections } from "../database/config.js";
import { VARIABLES_APIREPORTES } from "../database/schemas.js";

export const variablesEntornoBD = async () => {
  // Declarar variables de entorno de la bd como globales
  const variables = await dbConnections.Api_ReporteDb.query(`SELECT * FROM ${VARIABLES_APIREPORTES.TABLA}`);

  // Se convierte en un objeto para manipular la informacion mas facilmente
  const variablesObject = variables.recordset.reduce((acc, item) => {
    acc[item.VARIABLE_ENTORNO] = item.VALOR;
    return acc;
  }, {});

  return variablesObject;
};
