import fs from "fs";
import { promisify } from "util";

const readFileAsync = promisify(fs.readFile);

export async function convertToBase64(filePath) {
  try {
    // Leer el archivo de manera asincrónica
    const fileData = await readFileAsync(filePath);

    // Convertir los datos a base64
    const base64Data = fileData.toString("base64");

    return base64Data;
  } catch (error) {
    console.error("Error al convertir el archivo a base64:", error);
    return false;
  }
}
