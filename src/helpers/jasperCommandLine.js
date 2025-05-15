import { exec } from "child_process";

export async function generateReport(jasperParametros, nombreReporte, numeroReporte) {
  /*
    La variable command hace referencia al comando que Jasper Starter Command Line necesita para generar el 
    pdf de un reporte.
  */

  const parametrosConcatenados = jasperParametros.map((parametro) => `-P "${parametro}"`).join(" ");

  const command =
    process.env.JASPERSTARTER +
    " pr " +
    " -t " +
    process.env.JASPER_DB_TYPE +
    " -u " +
    process.env.USER_MS_SQL +
    " -p " +
    process.env.PASSWORD_MS_SQL +
    " -H " +
    process.env.SERVER_MS_SQL +
    " --db-port " +
    process.env.PORT_MS_SQL +
    " -n " +
    process.env.DATABASE_MS_SQL +
    " -f " +
    process.env.JASPER_FILE_TYPE +
    " -o " +
    process.env.JASPER_OUTPUT +
    nombreReporte +
    " " +
    parametrosConcatenados +
    " --db-driver " +
    process.env.JDBC_DRIVER +
    " --db-url " +
    process.env.JDBC_URL +
    " " +
    numeroReporte;

  return new Promise((resolve) => {
    // Utilizando child_process.exec
    exec(command, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        return resolve(console.error(`Error al ejecutar el comando: ${error}`));
        // Continuar con la ejecución, no detener el servicio
        // O puedes registrar el error en un archivo de registro o en otro lugar.
      } else {
        return resolve(
          console.log(
            `JasperStarter ejecutado con parametros: ${jasperParametros} y nombre del archivo ${nombreReporte}`
          )
        );
      }
    });
  });
}
