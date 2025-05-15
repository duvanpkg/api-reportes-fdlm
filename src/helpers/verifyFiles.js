import { promises as fs } from "fs";

export async function verifyJrxml(numeroReporte) {
  try {
    await fs.access(process.env.JASPER_REPORT_PATH + numeroReporte + ".jrxml");
    return (numeroReporte = process.env.JASPER_REPORT_PATH + numeroReporte + ".jrxml");
  } catch (error) {
    console.log(error)
    return false;
  }
}

export async function verifyFileAfter(reportPdfName) {
  // Esta función es para validar si el archivo si se genero por parte del comando
  try {
    await fs.access(process.env.JASPER_OUTPUT + reportPdfName + ".pdf");
    return true;
  } catch (error) {
    return false;
  }
}
