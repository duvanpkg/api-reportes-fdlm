/*==========================================================================================================

Aquí se definen las diferentes bases de datos y se conectan, si va a agregar alguna debera agregar un objeto
dentro de la variable "databases"

Si va cambiar las credenciales de acceso deberá hacerlo desde las .env

==========================================================================================================*/
import sql from "mssql";

export const dbConnections = {} || "No hay bases de datos conectadas";

const databases = [
  {
    user: process.env.USER_DB_API,
    password: process.env.PASSWORD_DB_API,
    server: process.env.SERVER_DB_API,
    database: process.env.DATABASE_DB_API,
    port: parseInt(process.env.PORT_DB_API),
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  },
  {
    user: process.env.USER_MS_SQL,
    password: process.env.PASSWORD_MS_SQL,
    server: process.env.SERVER_MS_SQL,
    database: process.env.DATABASE_MS_SQL,
    port: parseInt(process.env.PORT_MS_SQL),
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  },
];

export async function databasesConnection() {
  for (const db of databases) {
    const pool = new sql.ConnectionPool(db);
    await pool.connect();

    dbConnections[db.database] = pool; // Nombre de la base de datos y la pool
    console.log("Conectado a la base de datos", db.database);
  }
}
