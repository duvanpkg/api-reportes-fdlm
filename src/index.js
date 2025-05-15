import express from "express";
import dotenv from "dotenv";

import { databasesConnection } from "./database/config.js";
import reportes from "./routes/reports.routes.js";
import { verificadorIntentos } from "./cronJobs/noGeneroReporte.js";
import { verificadorCarpetaDigital } from "./cronJobs/noEstaEnCarpeta.js";
import { reportesSinIntentos } from "./cronJobs/failReportMail.js";
import { deleteReports, purgeTable } from "./cronJobs/depurarReportes.js";

// Dotenv
dotenv.config();

// Express configuraciones
const app = express();
const port = 3000;
app.use(express.json());

app.listen(port, () => {
  console.log(`La aplicación está en el puerto ${port}`);
});

// Establecer conexión con la base de datos
await databasesConnection();

// Rutas de la API
app.use("/", reportes);

// Llamar cronjobs
verificadorIntentos;
verificadorCarpetaDigital;
reportesSinIntentos;
deleteReports;
purgeTable;
